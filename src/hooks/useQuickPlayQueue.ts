// =============================================================================
// useQuickPlayQueue — packages/game-ui/src/hooks/useQuickPlayQueue.ts
//
// Drives QuickPlayCard state for both ESPORTS and SOCIAL game types.
//
// ESPORTS flow:
//   Player selects entry fee + player mode + currency (all from admin config)
//   -> "Play Now" -> joins matchmaking queue -> NPC fills if needed -> match
//
// SOCIAL flow:
//   Player selects point value + currency (all from admin config)
//   -> Sees live board of open games (quick-play:lobby-update socket)
//   -> Either JOINs an existing open game or CREATEs a new one
//   -> Other players see the created game on their board and can join
//
// All options (tiers, currencies, player counts) come directly from
// QuickPlayConfig which is set by admin/developer. Nothing is hardcoded.
// Adding a new tier or currency in the admin panel populates automatically.
//
// v3.2.0:
//   - Added AvailableGame interface
//   - Added availableGames state + quick-play:lobby-update socket listener
//   - Added joinGame(queueKey) for social — join an existing open game
//   - Added createGame() for social — create a new game (same bridge API)
//   - Added 'waiting' status — social player created a game, waiting for others
//   - Default selections always use first item from config arrays (not hardcoded)
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'
import type { QuickPlayConfig, QuickPlayLaunchData } from '../bridge-types'

// =============================================================================
// TYPES
// =============================================================================

export type QuickPlayStatus =
  | 'idle'       // Config loaded, showing selectors
  | 'searching'  // Esport: in matchmaking queue
  | 'waiting'    // Social: created a game, waiting for others to join
  | 'filling'    // NPC fill in progress
  | 'found'      // Match ready — auto-navigate
  | 'error'      // Error with retry

/** One open game on the social lobby board (from quick-play:lobby-update) */
export interface AvailableGame {
  queueKey: string         // Key to pass to joinGame()
  pointValue: number       // USD per point e.g. 0.50
  currency: string         // e.g. 'USDT_BSC'
  currentPlayers: number   // Seats filled
  maxPlayers: number       // Total seats e.g. 4
  secondsRemaining: number // Seconds until NPC fill kicks in
  mode: string             // 'single' | '100pts' etc
}

export interface QuickPlayQueueState {
  // Config loaded from bridge (set by admin/developer — read-only for player)
  config: QuickPlayConfig | null
  configLoading: boolean

  // Player selections — initialised from first item in each config array
  selectedFee: number        // Esport: entry fee | Social: point value
  selectedMode: number       // Esport: player count (2 = 1v1, 4 = FFA-4)
  selectedCurrency: string   // e.g. 'USDT_BSC'

  // Setters called by dropdowns/chips in the UI
  setSelectedFee: (fee: number) => void
  setSelectedMode: (mode: number) => void
  setSelectedCurrency: (currency: string) => void

  // State machine
  status: QuickPlayStatus
  searchTimer: number        // Elapsed seconds in current status
  playersInQueue: number     // Players in the current match/game
  totalRequired: number      // Players needed to start
  matchData: QuickPlayLaunchData | null
  error: string | null

  // Social only: live board of open games from socket
  availableGames: AvailableGame[]

  // Actions
  joinQueue:  () => Promise<void>               // Esport: join matchmaking
  createGame: () => Promise<void>               // Social: create a new game
  joinGame:   (queueKey: string) => Promise<void> // Social: join open game
  leaveQueue: () => Promise<void>               // Cancel / leave
  resetError: () => void
}

// =============================================================================
// HELPERS
// =============================================================================

function safeArray<T>(val: T[] | string | null | undefined, fallback: T[] = []): T[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try {
      const p = JSON.parse(val)
      return Array.isArray(p) ? p : fallback
    } catch { return fallback }
  }
  return fallback
}

function getBridge(): any {
  try { return (window as any).DeskillzBridge?.getInstance?.() ?? null } catch { return null }
}

// =============================================================================
// HOOK
// =============================================================================

export function useQuickPlayQueue(gameId: string): QuickPlayQueueState {
  const [config, setConfig]                     = useState<QuickPlayConfig | null>(null)
  const [configLoading, setConfigLoading]       = useState(true)
  const [selectedFee, setSelectedFee]           = useState(0)
  const [selectedMode, setSelectedMode]         = useState(2)
  const [selectedCurrency, setSelectedCurrency] = useState('USDT_BSC')
  const [status, setStatus]                     = useState<QuickPlayStatus>('idle')
  const [searchTimer, setSearchTimer]           = useState(0)
  const [playersInQueue, setPlayersInQueue]     = useState(0)
  const [totalRequired, setTotalRequired]       = useState(2)
  const [matchData, setMatchData]               = useState<QuickPlayLaunchData | null>(null)
  const [error, setError]                       = useState<string | null>(null)
  const [availableGames, setAvailableGames]     = useState<AvailableGame[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // ---------------------------------------------------------------------------
  // Load QuickPlayConfig via bridge
  // All player-facing options (tiers, currencies, player counts) come from here.
  // The admin/developer sets these in the Deskillz admin panel.
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!gameId) return
    setConfigLoading(true)
    const bridge = getBridge()
    if (!bridge) { setConfigLoading(false); return }

    bridge.getQuickPlayConfig(gameId)
      .then((cfg: QuickPlayConfig | null) => {
        if (!cfg) { setConfigLoading(false); return }
        setConfig(cfg)

        const isEsport = cfg.gameCategory === 'ESPORTS'
        const fees  = safeArray<number>(isEsport ? cfg.esportEntryFeeTiers : cfg.socialPointValueTiers, [1])
        const modes = safeArray<number>(cfg.esportPlayerModes, [2])
        const currs = safeArray<string>((isEsport ? cfg.esportCurrencies : cfg.socialCurrencies) as any, ['USDT_BSC'])

        // Default to first item in each config array — never hardcoded values
        setSelectedFee(fees[0] ?? (isEsport ? 1 : 0.25))
        setSelectedMode(isEsport ? (modes[0] ?? 2) : (cfg.socialMinPlayers ?? 4))
        setSelectedCurrency(currs[0] ?? 'USDT_BSC')
        setConfigLoading(false)
      })
      .catch(() => setConfigLoading(false))
  }, [gameId])

  // ---------------------------------------------------------------------------
  // Elapsed timer — runs during searching / waiting / filling
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const active = status === 'searching' || status === 'waiting' || status === 'filling'
    if (active) {
      timerRef.current = setInterval(() => setSearchTimer(p => p + 1), 1000)
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (status === 'idle' || status === 'error') setSearchTimer(0)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [status])

  // ---------------------------------------------------------------------------
  // Bridge socket event subscriptions
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const bridge = getBridge()
    if (!bridge?.on) return

    // Esport: successfully joined queue
    const onSearching = (d: any) => {
      if (d?.gameId !== gameId) return
      setStatus('searching')
      setPlayersInQueue(d.playersInQueue ?? 0)
      setTotalRequired(d.playerCount ?? 2)
    }

    // Social: board updated — any game created, joined, or expired
    const onLobbyUpdate = (games: any) => {
      if (!Array.isArray(games)) return
      setAvailableGames(games as AvailableGame[])
    }

    // NPC fill started
    const onFilling = (d: any) => {
      if (d?.gameId !== gameId) return
      setStatus('filling')
      setPlayersInQueue(d.totalPlayers ?? 0)
      setTotalRequired(d.requiredPlayers ?? 2)
    }

    // Match ready (human-filled)
    const onFound = (d: any) => {
      if (d?.gameId !== gameId) return
      setMatchData(d)
      setStatus('found')
    }

    // Match ready (NPC-filled)
    const onStarting = (d: any) => {
      if (d?.gameId !== gameId) return
      setMatchData(d)
      setStatus('found')
    }

    // Left queue
    const onLeft = () => {
      setStatus('idle')
      setSearchTimer(0)
      setPlayersInQueue(0)
    }

    bridge.on('quickPlaySearching',   onSearching)
    bridge.on('quickPlayLobbyUpdate', onLobbyUpdate)
    bridge.on('quickPlayNPCFilling',  onFilling)
    bridge.on('quickPlayFound',       onFound)
    bridge.on('quickPlayStarting',    onStarting)
    bridge.on('quickPlayLeft',        onLeft)

    return () => {
      bridge.off?.('quickPlaySearching',   onSearching)
      bridge.off?.('quickPlayLobbyUpdate', onLobbyUpdate)
      bridge.off?.('quickPlayNPCFilling',  onFilling)
      bridge.off?.('quickPlayFound',       onFound)
      bridge.off?.('quickPlayStarting',    onStarting)
      bridge.off?.('quickPlayLeft',        onLeft)
    }
  }, [gameId])

  // ---------------------------------------------------------------------------
  // ESPORT: join matchmaking queue
  // ---------------------------------------------------------------------------
  const joinQueue = useCallback(async () => {
    if (!config) return
    setError(null)
    try {
      const bridge = getBridge()
      if (!bridge) throw new Error('Bridge not initialized')
      const result = await bridge.joinQuickPlay({
        gameId,
        entryFee:    selectedFee,
        playerCount: selectedMode,
        currency:    selectedCurrency,
      })
      if (result.success) {
        setStatus('searching')
        setSearchTimer(0)
        setPlayersInQueue(result.playersInQueue ?? 0)
        setTotalRequired(selectedMode)
        if (result.matchId) setStatus('found')
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to join queue'
      setError(msg); setStatus('error'); toast.error(msg)
    }
  }, [config, gameId, selectedFee, selectedMode, selectedCurrency])

  // ---------------------------------------------------------------------------
  // SOCIAL: create a new game
  // First player creates — backend broadcasts via quick-play:lobby-update
  // Others see it on their board and can join via joinGame()
  // ---------------------------------------------------------------------------
  const createGame = useCallback(async () => {
    if (!config) return
    setError(null)
    try {
      const bridge = getBridge()
      if (!bridge) throw new Error('Bridge not initialized')
      const playerCount = config.socialMinPlayers ?? 4
      const result = await bridge.joinQuickPlay({
        gameId,
        entryFee:    selectedFee,
        playerCount,
        currency:    selectedCurrency,
      })
      if (result.success) {
        setStatus('waiting')
        setSearchTimer(0)
        setPlayersInQueue(result.playersInQueue ?? 1)
        setTotalRequired(playerCount)
        if (result.matchId) setStatus('found')
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to create game'
      setError(msg); setStatus('error'); toast.error(msg)
    }
  }, [config, gameId, selectedFee, selectedCurrency])

  // ---------------------------------------------------------------------------
  // SOCIAL: join an existing open game from the live board
  // queueKey comes from AvailableGame.queueKey (backend provides it)
  // ---------------------------------------------------------------------------
  const joinGame = useCallback(async (queueKey: string) => {
    setError(null)
    try {
      const bridge = getBridge()
      if (!bridge) throw new Error('Bridge not initialized')
      const result = await bridge.joinQuickPlay({ queueKey } as any)
      if (result.success) {
        setStatus('waiting')
        setSearchTimer(0)
        setPlayersInQueue(result.playersInQueue ?? 1)
        setTotalRequired(result.playerCount ?? (config?.socialMinPlayers ?? 4))
        if (result.matchId) setStatus('found')
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to join game'
      setError(msg); setStatus('error'); toast.error(msg)
    }
  }, [config])

  // ---------------------------------------------------------------------------
  // Leave / cancel (works from any active state)
  // ---------------------------------------------------------------------------
  const leaveQueue = useCallback(async () => {
    try {
      const bridge = getBridge()
      await bridge?.leaveQuickPlay?.()
    } catch { /* best effort */ } finally {
      setStatus('idle')
      setSearchTimer(0)
      setPlayersInQueue(0)
      setMatchData(null)
    }
  }, [])

  const resetError = useCallback(() => {
    setError(null); setStatus('idle'); setSearchTimer(0)
  }, [])

  return {
    config, configLoading,
    selectedFee, selectedMode, selectedCurrency,
    setSelectedFee, setSelectedMode, setSelectedCurrency,
    status, searchTimer, playersInQueue, totalRequired, matchData, error,
    availableGames,
    joinQueue, createGame, joinGame, leaveQueue, resetError,
  }
}