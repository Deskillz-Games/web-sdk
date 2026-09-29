// =============================================================================
// useQuickPlayQueue -- packages/game-ui/src/hooks/useQuickPlayQueue.ts
//
// Drives QuickPlayCard state for both ESPORTS and SOCIAL game types.
//
// ESPORTS flow:
//   Player selects entry fee + player mode + currency (all from admin config)
//   -> "Play Now" -> joins matchmaking queue -> table fills -> match
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
//   - Added joinGame(queueKey) for social -- join an existing open game
//   - Added createGame() for social -- create a new game (same bridge API)
//   - Added 'waiting' status -- social player created a game, waiting for others
//   - Default selections always use first item from config arrays (not hardcoded)
//
// [Q-W 3.7.5] (N540 Q-B2 / N604):
//   - quickPlayFound / quickPlayStarting carry the real Match id, the caller's
//     own launch token, deepLink, endsAt and the ticket rules: matchData is
//     everything a game needs to launch (launchQuickPlayMatch only re-issues
//     the token on a reconnect).
//   - quickPlaySocialRoomCreated -> 'found' with matchData built from the
//     table payload (+ socialRoom with the full payload).
//   - quickPlayMatchFailed -> 'error' with the server reason (entry refunded).
//   - quickPlayQueueRoster -> roster + startsAt (who is waiting, when the NPC
//     fill starts); quickPlayNpcFilling -> 'filling'.
//   - joinGame(queueKey) sends the queue's own gameId / point value / seats /
//     currency (the join route has no queueKey field; the old body was a 400).
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
  | 'filling'    // Table filling
  | 'found'      // Match ready -- auto-navigate
  | 'error'      // Error with retry

/** One open game on the social lobby board (from quick-play:lobby-update) */
export interface AvailableGame {
  queueKey: string         // Key to pass to joinGame()
  pointValue: number       // USD per point e.g. 0.50
  currency: string         // e.g. 'USDT_BSC'
  currentPlayers: number   // Seats filled
  maxPlayers: number       // Total seats e.g. 4
  secondsRemaining: number // Seconds until the table fills
  mode: string             // 'single' | '100pts' etc
}

/** [Q-W 3.7.5] One entry of quick-play:queue-roster (ids are hashed by the server) */
export interface QueueRosterEntry {
  id: string
  username: string
  avatarUrl: string | null
  joinedAt: string | number
}

/** [Q-W 3.7.5] The table payload of quick-play:social-room-created */
export interface QuickPlaySocialRoom {
  roomId: string
  matchId: string
  kind: 'social'
  roomCode: string
  gameId: string
  socialGameType: string
  pointValueUsd: number
  currency: string
  rakePercent: number
  rakeCapPerRound: number
  minBuyIn: number
  defaultBuyIn: number
  players: Array<{ id: string; username: string; avatarUrl: string | null; buyInAmount: number; pointBalance: number }>
  token: string
  deepLink: string
  rules: unknown
}

export interface QuickPlayQueueState {
  // Config loaded from bridge (set by admin/developer -- read-only for player)
  config: QuickPlayConfig | null
  configLoading: boolean

  // Player selections -- initialised from first item in each config array
  selectedFee: number        // Esport: entry fee | Social: point value
  selectedMode: number       // Esport: player count (2 = 1v1, 4 = FFA-4)
  selectedCurrency: string   // e.g. 'USDT_BSC'
  selectedTarget: number     // Social: win condition target (point/round count)

  // Setters called by dropdowns/chips in the UI
  setSelectedFee: (fee: number) => void
  setSelectedMode: (mode: number) => void
  setSelectedCurrency: (currency: string) => void
  setSelectedTarget: (target: number) => void

  // State machine
  status: QuickPlayStatus
  searchTimer: number        // Elapsed seconds in current status
  playersInQueue: number     // Players in the current match/game
  totalRequired: number      // Players needed to start
  matchData: QuickPlayLaunchData | null
  error: string | null

  // Social only: live board of open games from socket
  availableGames: AvailableGame[]

  // [Q-W 3.7.5] who is waiting with me, and when the NPC fill starts (ISO, null = not yet)
  roster: QueueRosterEntry[]
  startsAt: string | null
  // [Q-W 3.7.5] the created social table (matchData carries its token / deepLink too)
  socialRoom: QuickPlaySocialRoom | null

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

/**
 * [Q-W 3.7.5] A queue key is qp:<gameId>:<entryFee>:<playerCount>:<currency>
 * (quick-play-queue.service). The join route takes those four fields, not the key.
 */
export function parseQueueKey(queueKey: string): { gameId: string; entryFee: number; playerCount: number; currency: string } | null {
  const parts = String(queueKey ?? '').split(':')
  if (parts.length !== 5 || parts[0] !== 'qp') return null
  const entryFee = Number(parts[2])
  const playerCount = Number(parts[3])
  if (!parts[1] || !parts[4] || !Number.isFinite(entryFee) || !Number.isInteger(playerCount)) return null
  return { gameId: parts[1], entryFee, playerCount, currency: parts[4] }
}

/** [Q-W 3.7.5] matchData for a social table: the same launch shape the games already read */
function socialRoomToLaunchData(room: QuickPlaySocialRoom): QuickPlayLaunchData {
  return {
    matchId: room.matchId ?? room.roomId,
    matchSessionId: room.roomId,
    gameId: room.gameId,
    deepLink: room.deepLink,
    token: room.token,
    entryFee: room.defaultBuyIn,
    currency: room.currency,
    prizePool: 0,
    players: (room.players ?? []).map((p) => ({ id: p.id, username: p.username })),
    matchDurationSecs: null,
    targetScore: null,
    endsAt: null,
    rules: null,
  }
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
  const [selectedTarget, setSelectedTarget]     = useState(0)
  const [status, setStatus]                     = useState<QuickPlayStatus>('idle')
  const [searchTimer, setSearchTimer]           = useState(0)
  const [playersInQueue, setPlayersInQueue]     = useState(0)
  const [totalRequired, setTotalRequired]       = useState(2)
  const [matchData, setMatchData]               = useState<QuickPlayLaunchData | null>(null)
  const [error, setError]                       = useState<string | null>(null)
  const [availableGames, setAvailableGames]     = useState<AvailableGame[]>([])
  const [roster, setRoster]                     = useState<QueueRosterEntry[]>([])
  const [startsAt, setStartsAt]                 = useState<string | null>(null)
  const [socialRoom, setSocialRoom]             = useState<QuickPlaySocialRoom | null>(null)
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

        // Default to first item in each config array -- never hardcoded values
        setSelectedFee(fees[0] ?? (isEsport ? 1 : 0.25))
        setSelectedMode(isEsport ? (modes[0] ?? 2) : (cfg.socialMinPlayers ?? 4))
        setSelectedCurrency(currs[0] ?? 'USDT_BSC')

        // Social: set default win condition target from config
        if (!isEsport && cfg.socialWinCondition && cfg.socialWinCondition !== 'OPEN_ENDED') {
          const targets = cfg.socialWinCondition === 'FIRST_TO_POINTS'
            ? safeArray<number>(cfg.socialPointTargets, [100])
            : safeArray<number>(cfg.socialRoundTargets, [4])
          const defaultIdx = cfg.socialDefaultTarget ?? 0
          setSelectedTarget(defaultIdx > 0 && defaultIdx < targets.length ? targets[defaultIdx] : targets[0] ?? 0)
        }

        setConfigLoading(false)
      })
      .catch(() => setConfigLoading(false))
  }, [gameId])

  // ---------------------------------------------------------------------------
  // Elapsed timer -- runs during searching / waiting / filling
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
  // [Q-W 3.7.5] the bridge relays every quick-play:* frame for the whole
  // realtime session (N604), so these fire for a match found by the NPC fill.
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

    // Social: board updated -- any game created, joined, or expired
    const onLobbyUpdate = (games: any) => {
      if (!Array.isArray(games)) return
      setAvailableGames(games as AvailableGame[])
    }

    // Table filling (SDK 3.7.0 P2: quickPlayFilling; 3.7.5: quickPlayNpcFilling too)
    const onFilling = (d: any) => {
      if (d?.gameId !== gameId) return
      setStatus('filling')
      setPlayersInQueue(d.totalPlayers ?? 0)
      setTotalRequired(d.requiredPlayers ?? 2)
    }

    // [Q-W 3.7.5] who is waiting, and when the NPC fill starts
    const onRoster = (d: any) => {
      if (!d || !Array.isArray(d.roster)) return
      const parsed = parseQueueKey(d.queueKey)
      if (parsed && parsed.gameId !== gameId) return
      setRoster(d.roster as QueueRosterEntry[])
      setStartsAt(typeof d.startsAt === 'string' ? d.startsAt : null)
      setPlayersInQueue(d.roster.length)
      if (typeof d.requiredPlayers === 'number') setTotalRequired(d.requiredPlayers)
    }

    // Match ready (human-filled) -- 3.7.5: carries matchId, token, deepLink, endsAt, rules
    const onFound = (d: any) => {
      if (d?.gameId !== gameId) return
      setMatchData(d as QuickPlayLaunchData)
      setStatus('found')
    }

    // Match starting
    const onStarting = (d: any) => {
      if (d?.gameId !== gameId) return
      setMatchData(d as QuickPlayLaunchData)
      setStatus('found')
    }

    // [Q-W 3.7.5] social: the server created the table when the queue filled
    const onSocialRoomCreated = (d: any) => {
      if (d?.gameId !== gameId) return
      const room = d as QuickPlaySocialRoom
      setSocialRoom(room)
      setMatchData(socialRoomToLaunchData(room))
      setStatus('found')
    }

    // [Q-W 3.7.5] the match could not start; the entry is already refunded
    const onMatchFailed = (d: any) => {
      if (d?.gameId && d.gameId !== gameId) return
      const msg = d?.reason || 'The match could not start. Your entry was refunded.'
      setError(msg); setStatus('error'); toast.error(msg)
      setMatchData(null); setSocialRoom(null); setRoster([]); setStartsAt(null)
    }

    // Left queue
    const onLeft = () => {
      setStatus('idle')
      setSearchTimer(0)
      setPlayersInQueue(0)
      setRoster([])
      setStartsAt(null)
    }

    bridge.on('quickPlaySearching',         onSearching)
    bridge.on('quickPlayLobbyUpdate',       onLobbyUpdate)
    bridge.on('quickPlayFilling',           onFilling)
    bridge.on('quickPlayNpcFilling',        onFilling)
    bridge.on('quickPlayQueueRoster',       onRoster)
    bridge.on('quickPlayFound',             onFound)
    bridge.on('quickPlayStarting',          onStarting)
    bridge.on('quickPlaySocialRoomCreated', onSocialRoomCreated)
    bridge.on('quickPlayMatchFailed',       onMatchFailed)
    bridge.on('quickPlayLeft',              onLeft)

    return () => {
      bridge.off?.('quickPlaySearching',         onSearching)
      bridge.off?.('quickPlayLobbyUpdate',       onLobbyUpdate)
      bridge.off?.('quickPlayFilling',           onFilling)
      bridge.off?.('quickPlayNpcFilling',        onFilling)
      bridge.off?.('quickPlayQueueRoster',       onRoster)
      bridge.off?.('quickPlayFound',             onFound)
      bridge.off?.('quickPlayStarting',          onStarting)
      bridge.off?.('quickPlaySocialRoomCreated', onSocialRoomCreated)
      bridge.off?.('quickPlayMatchFailed',       onMatchFailed)
      bridge.off?.('quickPlayLeft',              onLeft)
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
  // First player creates -- backend broadcasts via quick-play:lobby-update
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
  // [Q-W 3.7.5] the join route takes the queue's four fields (parsed from the key)
  // ---------------------------------------------------------------------------
  const joinGame = useCallback(async (queueKey: string) => {
    setError(null)
    try {
      const bridge = getBridge()
      if (!bridge) throw new Error('Bridge not initialized')
      const parsed = parseQueueKey(queueKey)
      if (!parsed) throw new Error('That game is no longer open')
      const result = await bridge.joinQuickPlay(parsed)
      if (result.success) {
        setStatus('waiting')
        setSearchTimer(0)
        setPlayersInQueue(result.playersInQueue ?? 1)
        setTotalRequired(result.playerCount ?? parsed.playerCount)
        if (result.matchId) setStatus('found')
      }
    } catch (err: any) {
      const msg = err?.message || 'Failed to join game'
      setError(msg); setStatus('error'); toast.error(msg)
    }
  }, [])

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
      setSocialRoom(null)
      setRoster([])
      setStartsAt(null)
    }
  }, [])

  const resetError = useCallback(() => {
    setError(null); setStatus('idle'); setSearchTimer(0)
  }, [])

  return {
    config, configLoading,
    selectedFee, selectedMode, selectedCurrency, selectedTarget,
    setSelectedFee, setSelectedMode, setSelectedCurrency, setSelectedTarget,
    status, searchTimer, playersInQueue, totalRequired, matchData, error,
    availableGames,
    roster, startsAt, socialRoom,
    joinQueue, createGame, joinGame, leaveQueue, resetError,
  }
}
