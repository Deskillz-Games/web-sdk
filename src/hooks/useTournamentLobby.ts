// =============================================================================
// useTournamentLobby -- Tournament post-check-in lifecycle hook
// Path: src/hooks/useTournamentLobby.ts
//
// Manages the full tournament lifecycle AFTER check-in:
//   WAITING_FOR_START -> TABLE_ASSIGNED -> MATCH_READY -> PLAYING ->
//   BETWEEN_ROUNDS -> (loop or) ELIMINATED / CHAMPION
//
// Consumes:
//   - GET /api/v1/tournaments/:id/my-status (player status + table assignment)
//   - GET /api/v1/tournaments/:id/schedule (bracket overview)
//   - Socket: tournament:starting, room:table-assigned, room:table-closed
//
// Exports:
//   - useTournamentLobby(tournamentId) -> TournamentLobbyState
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TournamentLobbyStatus =
  | 'LOADING'
  | 'NOT_CHECKED_IN'       // Player registered but hasn't checked in yet
  | 'WAITING_FOR_START'    // Checked in, waiting for tournament to begin
  | 'TABLE_ASSIGNED'       // Table assigned, waiting for all seats to fill
  | 'MATCH_READY'          // Table full, match about to start
  | 'PLAYING'              // Currently playing at table
  | 'BETWEEN_ROUNDS'       // Round complete, waiting for next round
  | 'ELIMINATED'           // Eliminated from tournament
  | 'CHAMPION'             // Won the tournament
  | 'ERROR'

export interface TablePlayer {
  userId: string
  username: string
  avatarUrl?: string
  seatNumber: number
  isNPC: boolean
  status: string
}

export interface CurrentTableInfo {
  tableId: string
  tableNumber: number
  seatNumber: number
  status: string
  seats: number
  filledSeats: number
  players: TablePlayer[]
}

export interface BracketRound {
  roundNumber: number
  totalTables: number
  playersRemaining: number
  status: string
  startsAt: string | null
}

export interface TournamentLobbyState {
  status: TournamentLobbyStatus
  tournamentName: string
  currentRound: number
  totalRounds: number
  seatsPerTable: number
  scheduledStart: string | null
  secondsUntilStart: number
  currentTable: CurrentTableInfo | null
  bracketRounds: BracketRound[]
  eliminatedInRound: number | null
  error: string | null
  loading: boolean
  refresh: () => Promise<void>
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTournamentLobby(
  tournamentId: string | null,
  options?: { pollIntervalMs?: number; enabled?: boolean },
): TournamentLobbyState {
  const pollInterval = options?.pollIntervalMs ?? 5000
  const enabled = options?.enabled ?? true

  const [status, setStatus] = useState<TournamentLobbyStatus>('LOADING')
  const [tournamentName, setTournamentName] = useState('')
  const [currentRound, setCurrentRound] = useState(0)
  const [totalRounds, setTotalRounds] = useState(0)
  const [seatsPerTable, setSeatsPerTable] = useState(4)
  const [scheduledStart, setScheduledStart] = useState<string | null>(null)
  const [secondsUntilStart, setSecondsUntilStart] = useState(0)
  const [currentTable, setCurrentTable] = useState<CurrentTableInfo | null>(null)
  const [bracketRounds, setBracketRounds] = useState<BracketRound[]>([])
  const [eliminatedInRound, setEliminatedInRound] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---------------------------------------------------------------------------
  // Countdown timer
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (status !== 'WAITING_FOR_START' || !scheduledStart) {
      if (timerRef.current) clearInterval(timerRef.current)
      return
    }

    const tick = () => {
      const diff = Math.max(0, Math.floor(
        (new Date(scheduledStart).getTime() - Date.now()) / 1000,
      ))
      setSecondsUntilStart(diff)
    }

    tick()
    timerRef.current = setInterval(tick, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [status, scheduledStart])

  // ---------------------------------------------------------------------------
  // Fetch player status + schedule
  // ---------------------------------------------------------------------------

  const fetchStatus = useCallback(async () => {
    if (!tournamentId || !enabled) return

    const bridge = (window as any).DeskillzBridge?.getInstance?.()
    if (!bridge) {
      setError('Bridge not initialized')
      setStatus('ERROR')
      setLoading(false)
      return
    }

    try {
      // Fetch player status (table assignment, booking status)
      const playerStatus = await bridge.getEnrollmentStatus(tournamentId)

      // The enrollment status endpoint returns different shapes depending on context.
      // For the scheduling controller's my-status, it includes bookingStatus + currentTable.
      const ps = playerStatus as any

      setTournamentName(ps.tournamentName || '')
      setCurrentRound(ps.currentRound || 0)
      setTotalRounds(ps.totalRounds || 0)

      if (ps.schedule?.scheduledStart) {
        setScheduledStart(ps.schedule.scheduledStart)
      }

      if (ps.eliminatedInRound != null) {
        setEliminatedInRound(ps.eliminatedInRound)
      }

      // Map bookingStatus -> lobby status
      const booking = ps.bookingStatus || ps.status || 'NOT_REGISTERED'

      if (booking === 'NOT_REGISTERED' || booking === 'REGISTERED') {
        setStatus('NOT_CHECKED_IN')
        setCurrentTable(null)
      } else if (booking === 'CHECKED_IN') {
        setStatus('WAITING_FOR_START')
        setCurrentTable(null)
      } else if (booking === 'SEATED') {
        if (ps.currentTable) {
          const t = ps.currentTable
          const info: CurrentTableInfo = {
            tableId: t.tableId,
            tableNumber: t.tableNumber,
            seatNumber: t.seatNumber,
            status: t.status,
            seats: t.players?.length || seatsPerTable,
            filledSeats: t.players?.filter((p: any) => p.status !== 'EMPTY').length || 0,
            players: (t.players || []).map((p: any) => ({
              userId: p.userId,
              username: p.username,
              avatarUrl: p.avatarUrl,
              seatNumber: p.seatNumber,
              isNPC: p.isNPC,
              status: p.status,
            })),
          }
          setCurrentTable(info)

          // If all seats filled, match is ready
          if (info.filledSeats >= info.seats || t.status === 'PLAYING') {
            setStatus('MATCH_READY')
          } else {
            setStatus('TABLE_ASSIGNED')
          }
        } else {
          setStatus('TABLE_ASSIGNED')
        }
      } else if (booking === 'PLAYING') {
        if (ps.currentTable) {
          const t = ps.currentTable
          setCurrentTable({
            tableId: t.tableId,
            tableNumber: t.tableNumber,
            seatNumber: t.seatNumber,
            status: t.status,
            seats: t.players?.length || seatsPerTable,
            filledSeats: t.players?.filter((p: any) => p.status !== 'EMPTY').length || 0,
            players: (t.players || []).map((p: any) => ({
              userId: p.userId,
              username: p.username,
              avatarUrl: p.avatarUrl,
              seatNumber: p.seatNumber,
              isNPC: p.isNPC,
              status: p.status,
            })),
          })
        }
        setStatus('PLAYING')
      } else if (booking === 'ELIMINATED') {
        setStatus('ELIMINATED')
        setCurrentTable(null)
      } else if (booking === 'CHAMPION' || booking === 'WINNER' || booking === 'WON') {
        setStatus('CHAMPION')
        setCurrentTable(null)
      } else if (booking === 'ADVANCING' || booking === 'WAITING_NEXT_ROUND') {
        setStatus('BETWEEN_ROUNDS')
        setCurrentTable(null)
      } else {
        // Fallback: if checked in and tournament started but no table yet
        setStatus('WAITING_FOR_START')
      }

      // Fetch bracket overview (lighter poll -- only when waiting or between rounds)
      if (['WAITING_FOR_START', 'BETWEEN_ROUNDS', 'TABLE_ASSIGNED'].includes(status)) {
        try {
          const schedule = await bridge.getTournamentSchedule(tournamentId)
          if (schedule) {
            setSeatsPerTable(schedule.seatsPerTable || 4)
            setTotalRounds(schedule.totalRounds || 0)
            setCurrentRound(schedule.currentRound || 0)
            setBracketRounds(
              (schedule.rounds || []).map((r: any) => ({
                roundNumber: r.roundNumber,
                totalTables: r.totalTables,
                playersRemaining: r.playersRemaining,
                status: r.status,
                startsAt: r.startsAt,
              })),
            )
          }
        } catch {
          // Schedule fetch is optional -- don't block on failure
        }
      }

      setError(null)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to load tournament status'
      setError(msg)
      setStatus('ERROR')
    } finally {
      setLoading(false)
    }
  }, [tournamentId, enabled, status, seatsPerTable])

  // ---------------------------------------------------------------------------
  // Initial fetch
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (tournamentId && enabled) {
      fetchStatus()
    }
  }, [tournamentId, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Polling
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!tournamentId || !enabled) return
    if (status === 'ELIMINATED' || status === 'CHAMPION' || status === 'ERROR') return

    const interval = setInterval(fetchStatus, pollInterval)
    return () => clearInterval(interval)
  }, [tournamentId, enabled, status, pollInterval, fetchStatus])

  // ---------------------------------------------------------------------------
  // Socket event listeners
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!tournamentId || !enabled) return

    const bridge = (window as any).DeskillzBridge?.getInstance?.()
    if (!bridge) return

    const cleanups: Array<() => void> = []

    // Tournament starting -- transition to TABLE_ASSIGNED or WAITING
    const c1 = bridge.onRealtimeEvent('tournament:starting', (data: any) => {
      if (data?.tournamentId === tournamentId) {
        fetchStatus()
      }
    })
    cleanups.push(c1)

    // Table assigned -- immediate update
    const c2 = bridge.onRealtimeEvent('room:table-assigned', (data: any) => {
      if (data?.tableId) {
        setCurrentTable((prev) => ({
          tableId: data.tableId,
          tableNumber: data.tableNumber ?? prev?.tableNumber ?? 0,
          seatNumber: data.seatNumber ?? prev?.seatNumber ?? 0,
          status: 'FILLING',
          seats: prev?.seats ?? seatsPerTable,
          filledSeats: prev?.filledSeats ?? 1,
          players: prev?.players ?? [],
        }))
        setStatus('TABLE_ASSIGNED')
        // Refetch to get full table player list
        setTimeout(fetchStatus, 500)
      }
    })
    cleanups.push(c2)

    // Table closed -- round ended, check status
    const c3 = bridge.onRealtimeEvent('room:table-closed', (data: any) => {
      if (data?.tournamentId === tournamentId) {
        fetchStatus()
      }
    })
    cleanups.push(c3)

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [tournamentId, enabled, seatsPerTable]) // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------------------
  // Return
  // ---------------------------------------------------------------------------

  return {
    status,
    tournamentName,
    currentRound,
    totalRounds,
    seatsPerTable,
    scheduledStart,
    secondsUntilStart,
    currentTable,
    bracketRounds,
    eliminatedInRound,
    error,
    loading,
    refresh: fetchStatus,
  }
}