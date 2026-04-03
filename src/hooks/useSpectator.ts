// =============================================================================
// useSpectator -- packages/game-ui/src/hooks/useSpectator.ts
//
// Shared spectator hook for all standalone social game apps.
// Allows the host (or any authenticated user) to watch a room or a specific
// table within a multi-table cash game room.
//
// v3.3.1 fixes:
//   - Added REST fallback if socket state not received within 3s
//   - Added spectator:roomClosed handler (clean disconnect when room closes)
//   - Fixed race condition in watch()/switchTable() using refs for current IDs
//
// Socket events used:
//   Emit:  spectator:subscribe     { roomId, tableId? }
//   Emit:  spectator:unsubscribe   { roomId, tableId? }
//   On:    spectator:state         -> SpectatorState (full initial snapshot)
//   On:    spectator:update        -> Partial<SpectatorState> (live delta)
//   On:    spectator:table-state   -> SpectatorTableState (table snapshot)
//   On:    spectator:table-update  -> Partial<SpectatorTableState>
//   On:    spectator:count-updated -> { roomId, count }
//   On:    spectator:roomClosed    -> room closed, stop spectating
//   On:    spectator:error         -> { message, code }
//
// NOTE: This hook provides the HOST FINANCIAL VIEW (balances, rake, pot size).
// For game-specific tile/card state (Mahjong hands, card hands etc.),
// each game maintains its own in-game spectator view via separate socket events.
// =============================================================================

import { useState, useCallback, useRef, useEffect } from 'react'

// =============================================================================
// TYPES
// =============================================================================

export interface SpectatorPlayer {
  odid: string
  username: string
  avatarUrl: string | null
  pointBalance: number
  isActive: boolean
  isTurn: boolean
  roundsWon: number
  lastAction?: string
  lastActionAt?: string
  seatNumber?: number
}

export interface SpectatorTableState {
  tableId: string
  tableNumber: number
  seats: number
  filledSeats: number
  status: string
  players: SpectatorPlayer[]
  totalPot: number
  accumulatedRake: number
  currentRound: number
  isPaused: boolean
  currentTurnUsername: string | null
  turnEndsAt: string | null
}

export interface SpectatorState {
  roomId: string
  roomCode: string
  roomName: string
  gameCategory: string
  game: {
    id: string
    name: string
    iconUrl: string | null
    type: string | null
  }
  host: {
    username: string
    avatarUrl: string | null
  }
  pointValueUsd: number
  rakePercentage: number
  turnTimerSeconds: number
  phase: string
  currentRound: number
  currentTurnUsername: string | null
  turnEndsAt: string | null
  isPaused: boolean
  players: SpectatorPlayer[]
  totalPot: number
  totalRakeCollected: number
  spectatorCount: number
  startedAt: string | null
  duration: number
  // Multi-table (v3.3)
  tables?: SpectatorTableState[]
  activeTableId?: string | null
}

export type SpectatorStatus =
  | 'idle'        // Not watching anything
  | 'connecting'  // Sent subscribe, waiting for state
  | 'watching'    // Receiving state updates
  | 'error'       // Subscribe failed or room closed

export interface UseSpectatorResult {
  /** Current spectator state (null when not watching) */
  state: SpectatorState | null
  /** Active table state when watching a specific table */
  tableState: SpectatorTableState | null
  /** Current status */
  status: SpectatorStatus
  /** Error message if status === 'error' */
  error: string | null
  /** Number of spectators in current room */
  spectatorCount: number
  /** Currently watched roomId */
  watchingRoomId: string | null
  /** Currently watched tableId (null = watching room overview) */
  watchingTableId: string | null
  /** Start watching a room. Pass tableId to watch a specific table. */
  watch: (roomId: string, tableId?: string) => void
  /** Stop watching */
  unwatch: () => void
  /** Switch to a different table within the same room */
  switchTable: (tableId: string) => void
}

// =============================================================================
// getBridge
// =============================================================================

function getBridge(): any {
  try {
    return (window as any).DeskillzBridge?.getInstance?.() ?? null
  } catch {
    return null
  }
}

// =============================================================================
// useSpectator HOOK
// =============================================================================

export function useSpectator(): UseSpectatorResult {
  const [state, setState] = useState<SpectatorState | null>(null)
  const [tableState, setTableState] = useState<SpectatorTableState | null>(null)
  const [status, setStatus] = useState<SpectatorStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [spectatorCount, setSpectatorCount] = useState(0)
  const [watchingRoomId, setWatchingRoomId] = useState<string | null>(null)
  const [watchingTableId, setWatchingTableId] = useState<string | null>(null)

  // Refs track current IDs synchronously -- avoids stale closure race condition
  const currentRoomRef = useRef<string | null>(null)
  const currentTableRef = useRef<string | null>(null)
  const statusRef = useRef<SpectatorStatus>('idle')

  // Registered event cleanup functions
  const cleanupRef = useRef<Array<() => void>>([])

  // REST fallback timer
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Keep statusRef in sync with status state
  useEffect(() => {
    statusRef.current = status
  }, [status])

  // --------------------------------------------------------------------------
  // clearFallbackTimer
  // --------------------------------------------------------------------------
  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearTimeout(fallbackTimerRef.current)
      fallbackTimerRef.current = null
    }
  }, [])

  // --------------------------------------------------------------------------
  // cleanupListeners
  // --------------------------------------------------------------------------
  const cleanupListeners = useCallback(() => {
    cleanupRef.current.forEach((fn) => fn())
    cleanupRef.current = []
    clearFallbackTimer()
  }, [clearFallbackTimer])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupListeners()
      const bridge = getBridge()
      if (bridge && currentRoomRef.current) {
        bridge.sendRealtimeMessage?.('spectator:unsubscribe', {
          roomId: currentRoomRef.current,
          ...(currentTableRef.current ? { tableId: currentTableRef.current } : {}),
        })
      }
    }
  }, [cleanupListeners])

  // --------------------------------------------------------------------------
  // resetState -- shared helper to clear all watching state
  // --------------------------------------------------------------------------
  const resetState = useCallback((errorMsg?: string) => {
    currentRoomRef.current = null
    currentTableRef.current = null
    setState(null)
    setTableState(null)
    setSpectatorCount(0)
    setWatchingRoomId(null)
    setWatchingTableId(null)
    if (errorMsg) {
      setError(errorMsg)
      setStatus('error')
    } else {
      setError(null)
      setStatus('idle')
    }
  }, [])

  // --------------------------------------------------------------------------
  // watch
  // --------------------------------------------------------------------------
  const watch = useCallback((roomId: string, tableId?: string) => {
    const bridge = getBridge()
    if (!bridge) {
      setError('Bridge not initialized')
      setStatus('error')
      return
    }

    // Unsubscribe from current room/table using REFS (not state) to avoid
    // stale closure race condition when switching tables rapidly
    if (currentRoomRef.current) {
      bridge.sendRealtimeMessage?.('spectator:unsubscribe', {
        roomId: currentRoomRef.current,
        ...(currentTableRef.current ? { tableId: currentTableRef.current } : {}),
      })
      cleanupListeners()
    }

    // Update refs synchronously before any async operations
    currentRoomRef.current = roomId
    currentTableRef.current = tableId ?? null

    // Update UI state
    setWatchingRoomId(roomId)
    setWatchingTableId(tableId ?? null)
    setStatus('connecting')
    setError(null)
    setState(null)
    setTableState(null)

    // Register listeners BEFORE emitting subscribe
    const onState = bridge.onRealtimeEvent?.('spectator:state', (data: any) => {
      clearFallbackTimer()
      setState(data as SpectatorState)
      setSpectatorCount(data?.spectatorCount ?? 0)
      setStatus('watching')
    })

    const onUpdate = bridge.onRealtimeEvent?.('spectator:update', (data: any) => {
      setState((prev) => prev ? { ...prev, ...data } : data)
      if (data?.spectatorCount !== undefined) {
        setSpectatorCount(data.spectatorCount)
      }
    })

    const onTableState = bridge.onRealtimeEvent?.('spectator:table-state', (data: any) => {
      clearFallbackTimer()
      setTableState(data as SpectatorTableState)
      setStatus('watching')
    })

    const onTableUpdate = bridge.onRealtimeEvent?.('spectator:table-update', (data: any) => {
      setTableState((prev) => prev ? { ...prev, ...data } : data)
    })

    const onCount = bridge.onRealtimeEvent?.('spectator:count-updated', (data: any) => {
      if (data?.roomId === roomId) {
        setSpectatorCount(data.count ?? 0)
      }
    })

    // Room closed (v3.3.1) -- host ended session or room expired
    const onRoomClosed = bridge.onRealtimeEvent?.('spectator:roomClosed', () => {
      cleanupListeners()
      resetState('Room has closed')
    })

    const onError = bridge.onRealtimeEvent?.('spectator:error', (data: any) => {
      clearFallbackTimer()
      cleanupListeners()
      resetState(data?.message ?? 'Failed to spectate')
    })

    cleanupRef.current = [
      onState, onUpdate, onTableState, onTableUpdate,
      onCount, onRoomClosed, onError,
    ].filter(Boolean) as Array<() => void>

    // Send subscribe
    bridge.sendRealtimeMessage?.('spectator:subscribe', {
      roomId,
      ...(tableId ? { tableId } : {}),
    })

    // REST fallback (v3.3.1) -- if no socket state within 3s, try REST endpoint
    fallbackTimerRef.current = setTimeout(async () => {
      // Only run if we're still connecting to the same room
      if (currentRoomRef.current !== roomId) return
      if (statusRef.current === 'watching') return

      try {
        const res = await bridge.http?.get?.(
          `/api/v1/spectator/rooms/${roomId}`
        )
        if (res && currentRoomRef.current === roomId) {
          setState(res as SpectatorState)
          setSpectatorCount(res?.spectatorCount ?? 0)
          setStatus('watching')
        }
      } catch {
        // REST also failed -- stay in connecting, socket may still arrive
      }
    }, 3000)
  }, [clearFallbackTimer, cleanupListeners, resetState])

  // --------------------------------------------------------------------------
  // unwatch
  // --------------------------------------------------------------------------
  const unwatch = useCallback(() => {
    const bridge = getBridge()
    if (bridge && currentRoomRef.current) {
      bridge.sendRealtimeMessage?.('spectator:unsubscribe', {
        roomId: currentRoomRef.current,
        ...(currentTableRef.current ? { tableId: currentTableRef.current } : {}),
      })
    }
    cleanupListeners()
    resetState()
  }, [cleanupListeners, resetState])

  // --------------------------------------------------------------------------
  // switchTable -- uses ref for roomId to avoid stale closure
  // --------------------------------------------------------------------------
  const switchTable = useCallback((tableId: string) => {
    const roomId = currentRoomRef.current
    if (!roomId) return
    watch(roomId, tableId)
  }, [watch])

  return {
    state,
    tableState,
    status,
    error,
    spectatorCount,
    watchingRoomId,
    watchingTableId,
    watch,
    unwatch,
    switchTable,
  }
}