// =============================================================================
// useHostDashboard -- packages/game-ui/src/hooks/useHostDashboard.ts
//
// v3.3 changes:
//   - Added ActiveTable interface (per-table data for multi-table cash games)
//   - Added tables?: ActiveTable[] to ActiveRoom interface
//   - safeActiveRoom() helper maps raw API response to typed ActiveRoom
//
// Bridge methods used:
//   bridge.getHostDashboard()  -> GET /api/v1/host/dashboard
//   bridge.getHostProfile()    -> GET /api/v1/host/profile
//   bridge.getHostEarnings()   -> GET /api/v1/host/earnings
//   bridge.getHostBadges()     -> GET /api/v1/host/badges
//   bridge.getActiveRooms()    -> GET /api/v1/host/rooms/active
//   bridge.getEsportsTier()    -> GET /api/v1/host/tier/esports
//   bridge.getSocialTier()     -> GET /api/v1/host/tier/social
//   bridge.getLevelInfo()       -> GET /api/v1/host/level
//   bridge.verifyAge()         -> POST /api/v1/host/verify-age
//   bridge.checkAgeVerified()  -> GET /api/v1/host/age-verified
//   bridge.requestHostWithdrawal() -> POST /api/v1/host/withdraw
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

// =============================================================================
// TYPES
// =============================================================================

export type HostTier = 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM' | 'DIAMOND' | 'ELITE'

export interface HostProfile {
  id: string
  odid: string
  username: string
  avatarUrl: string | null
  hostLevel: number
  hostTitle: string
  totalPlayersHosted: number
  totalRoomsCompleted: number
  totalEarnings: number
  monthlyEarnings: number
  monthlyRake: number
  currentEsportsTier: HostTier
  currentSocialTier: HostTier
  streakDays: number
  streakBonus: number
  volumeBonus: number
  permanentBonus: number
  activeRoomCount: number
  maxConcurrentRooms: number
  isVerified: boolean
  freeEventsHosted: number
  freePlayersHosted: number
  monthlyFreeEvents: number
  monthlyFreePlayers: number
  joinedAt: string
  lastActiveAt: string
}

export interface TierInfo {
  tier: HostTier
  icon: string
  minThreshold: number
  maxThreshold: number | null
  hostShare: number
  platformShare: number
  developerShare: number
  currentValue: number
  progressPercent: number
  nextTier: HostTier | null
  valueToNextTier: number | null
}

export interface LevelInfo {
  level: number
  title: string
  playersHosted: number
  totalEarnings: number
  currentPlayers: number
  currentEarnings: number
  progressPercent: number
  nextLevel: number | null
  benefits: string[]
}

export interface EarningsSummary {
  totalAllTime: number
  totalThisMonth: number
  totalThisWeek: number
  totalToday: number
  pendingSettlement: number
  availableWithdrawal: number
  esportsEarnings: number
  socialEarnings: number
  bonusEarnings: number
}

export interface HostBadge {
  id: string
  badgeId: string
  name: string
  description: string
  icon: string
  category: 'ACHIEVEMENT' | 'PERFORMANCE' | 'EXCLUSIVE'
  isMonthly: boolean
  awardedAt: string
  expiresAt: string | null
  progress?: number
  maxProgress?: number
}

export interface ActiveRoomPlayer {
  odid: string
  username: string
  avatarUrl: string | null
  isReady: boolean
  currentBalance?: number
}

// =============================================================================
// ACTIVE TABLE (v3.3 -- per-table data for multi-table cash games)
// Returned inside ActiveRoom.tables[] when numberOfTables > 1.
// =============================================================================

export interface ActiveTablePlayer {
  userId: string
  username: string
  avatarUrl: string | null
  seatNumber: number
  currentBalance?: number
  status: string
}

export interface ActiveTable {
  /** RoundTable.id */
  tableId: string
  /** Display number (1, 2, 3...) */
  tableNumber: number
  /** Seats in this table */
  seats: number
  /** Players currently seated */
  filledSeats: number
  /** Table status: WAITING | FILLING | READY | LIVE | COMPLETED | CANCELLED */
  status: string
  /** Rake accumulated at this table (subset of room total) */
  accumulatedRake: number
  /** Players at this table */
  players: ActiveTablePlayer[]
}

export interface ActiveRoom {
  id: string
  roomCode: string
  name: string
  gameId: string
  gameName: string
  gameIcon: string | null
  gameCategory: 'ESPORTS' | 'SOCIAL'
  gameType?: string
  currentPlayers: number
  maxPlayers: number
  status: string
  entryFee: number
  entryCurrency: string
  pointValueUsd?: number
  accumulatedRake?: number
  totalRounds?: number
  createdAt: string
  players: ActiveRoomPlayer[]
  /** Multi-table cash game tables (v3.3). Present when numberOfTables > 1. */
  tables?: ActiveTable[]
  /** Total number of tables configured for this room (v3.3) */
  numberOfTables?: number
}

export interface SettlementRecord {
  id: string
  sessionId: string
  roomId: string
  roomName: string
  gameType: string
  trigger: string
  totalRake: number
  hostShare: number
  platformShare: number
  developerShare: number
  roundsSettled: number
  settledAt: string
}

// =============================================================================
// SAFE NUMBER HELPER
// =============================================================================

const toNum = (v: unknown): number => {
  if (typeof v === 'number' && !Number.isNaN(v)) return v
  const n = Number(v)
  return Number.isNaN(n) ? 0 : n
}

// =============================================================================
// TIER DISPLAY HELPERS
// =============================================================================

export interface TierDisplayInfo {
  name: string
  icon: string
  color: string
  bgColor: string
  borderColor: string
}

const TIER_DISPLAY: Record<HostTier, TierDisplayInfo> = {
  BRONZE:   { name: 'Bronze',   icon: '🥉', color: 'text-amber-600',   bgColor: 'bg-amber-900/20',   borderColor: 'border-amber-700' },
  SILVER:   { name: 'Silver',   icon: '🥈', color: 'text-gray-300',    bgColor: 'bg-gray-700/20',    borderColor: 'border-gray-500' },
  GOLD:     { name: 'Gold',     icon: '🥇', color: 'text-yellow-400',  bgColor: 'bg-yellow-900/20',  borderColor: 'border-yellow-600' },
  PLATINUM: { name: 'Platinum', icon: '💎', color: 'text-cyan-400',    bgColor: 'bg-cyan-900/20',    borderColor: 'border-cyan-600' },
  DIAMOND:  { name: 'Diamond',  icon: '💠', color: 'text-purple-400',  bgColor: 'bg-purple-900/20',  borderColor: 'border-purple-600' },
  ELITE:    { name: 'Elite',    icon: '👑', color: 'text-rose-400',    bgColor: 'bg-rose-900/20',    borderColor: 'border-rose-600' },
}

export function getTierDisplay(tier: HostTier): TierDisplayInfo {
  return TIER_DISPLAY[tier] ?? TIER_DISPLAY.BRONZE
}

// =============================================================================
// SAFE ACTIVE ROOM MAPPER (v3.3)
// Maps raw API response to typed ActiveRoom including tables[]
// =============================================================================

function safeActiveRoom(raw: any): ActiveRoom {
  const tables: ActiveTable[] = Array.isArray(raw.tables)
    ? raw.tables.map((t: any): ActiveTable => ({
        tableId:         t.tableId ?? t.id ?? '',
        tableNumber:     t.tableNumber ?? 0,
        seats:           t.seats ?? t.maxPlayers ?? 4,
        filledSeats:     t.filledSeats ?? t.currentPlayers ?? 0,
        status:          t.status ?? 'WAITING',
        accumulatedRake: toNum(t.accumulatedRake ?? t.rake ?? 0),
        players: Array.isArray(t.players)
          ? t.players.map((p: any): ActiveTablePlayer => ({
              userId:         p.userId ?? p.odid ?? '',
              username:       p.username ?? 'Player',
              avatarUrl:      p.avatarUrl ?? null,
              seatNumber:     p.seatNumber ?? 0,
              currentBalance: p.currentBalance != null ? toNum(p.currentBalance) : undefined,
              status:         p.status ?? 'SEATED',
            }))
          : [],
      }))
    : []

  return {
    id:             raw.id ?? '',
    roomCode:       raw.roomCode ?? '',
    name:           raw.name ?? '',
    gameId:         raw.gameId ?? '',
    gameName:       raw.gameName ?? '',
    gameIcon:       raw.gameIcon ?? null,
    gameCategory:   raw.gameCategory ?? 'SOCIAL',
    gameType:       raw.gameType ?? undefined,
    currentPlayers: raw.currentPlayers ?? 0,
    maxPlayers:     raw.maxPlayers ?? 0,
    status:         raw.status ?? '',
    entryFee:       toNum(raw.entryFee),
    entryCurrency:  raw.entryCurrency ?? '',
    pointValueUsd:  raw.pointValueUsd != null ? toNum(raw.pointValueUsd) : undefined,
    accumulatedRake:raw.accumulatedRake != null ? toNum(raw.accumulatedRake) : undefined,
    totalRounds:    raw.totalRounds ?? undefined,
    createdAt:      raw.createdAt ?? new Date().toISOString(),
    players:        Array.isArray(raw.players) ? raw.players : [],
    tables:         tables.length > 0 ? tables : undefined,
    numberOfTables: raw.numberOfTables ?? (tables.length > 0 ? tables.length : undefined),
  }
}

// =============================================================================
// HOOK OPTIONS & RESULT
// =============================================================================

export interface UseHostDashboardOptions {
  enabled?: boolean
  pollIntervalMs?: number
}

export interface HostDashboardState {
  profile: HostProfile | null
  esportsTier: TierInfo | null
  socialTier: TierInfo | null
  levelInfo: LevelInfo | null
  earnings: EarningsSummary | null
  badges: HostBadge[]
  activeRooms: ActiveRoom[]
  recentSettlements: SettlementRecord[]
  isAgeVerified: boolean
  isLoading: boolean
  error: string | null
}

export interface UseHostDashboardResult extends HostDashboardState {
  refresh: () => Promise<void>
  verifyAge: () => Promise<boolean>
  requestWithdrawal: (amount: number, currency: string, walletAddress: string) => Promise<boolean>
  activeTier: TierInfo | null
  activeTierDisplay: TierDisplayInfo
  totalEarnings: number
  monthlyEarnings: number
  pendingSettlement: number
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
// SAFE DEFAULTS
// =============================================================================

function safeProfile(raw: any): HostProfile | null {
  if (!raw) return null
  return {
    id:                  raw.id ?? '',
    odid:                raw.odid ?? '',
    username:            raw.username ?? 'Host',
    avatarUrl:           raw.avatarUrl ?? null,
    hostLevel:           raw.hostLevel ?? 1,
    hostTitle:           raw.hostTitle ?? 'Newcomer',
    totalPlayersHosted:  raw.totalPlayersHosted ?? 0,
    totalRoomsCompleted: raw.totalRoomsCompleted ?? 0,
    totalEarnings:       toNum(raw.totalEarnings),
    monthlyEarnings:     toNum(raw.monthlyEarnings),
    monthlyRake:         toNum(raw.monthlyRake),
    currentEsportsTier:  raw.currentEsportsTier ?? 'BRONZE',
    currentSocialTier:   raw.currentSocialTier ?? 'BRONZE',
    streakDays:          raw.streakDays ?? 0,
    streakBonus:         toNum(raw.streakBonus),
    volumeBonus:         toNum(raw.volumeBonus),
    permanentBonus:      toNum(raw.permanentBonus),
    activeRoomCount:     raw.activeRoomCount ?? 0,
    maxConcurrentRooms:  raw.maxConcurrentRooms ?? 3,
    isVerified:          raw.isVerified ?? false,
    freeEventsHosted:    raw.freeEventsHosted ?? 0,
    freePlayersHosted:   raw.freePlayersHosted ?? 0,
    monthlyFreeEvents:   raw.monthlyFreeEvents ?? 0,
    monthlyFreePlayers:  raw.monthlyFreePlayers ?? 0,
    joinedAt:            raw.joinedAt ?? new Date().toISOString(),
    lastActiveAt:        raw.lastActiveAt ?? new Date().toISOString(),
  }
}

function safeTier(raw: any): TierInfo | null {
  if (!raw) return null
  return {
    tier:            raw.tier ?? 'BRONZE',
    icon:            raw.icon ?? '🥉',
    minThreshold:    toNum(raw.minThreshold),
    maxThreshold:    raw.maxThreshold != null ? toNum(raw.maxThreshold) : null,
    hostShare:       toNum(raw.hostShare),
    platformShare:   toNum(raw.platformShare),
    developerShare:  toNum(raw.developerShare),
    currentValue:    toNum(raw.currentValue),
    progressPercent: toNum(raw.progressPercent),
    nextTier:        raw.nextTier ?? null,
    valueToNextTier: raw.valueToNextTier != null ? toNum(raw.valueToNextTier) : null,
  }
}

function safeEarnings(raw: any): EarningsSummary | null {
  if (!raw) return null
  return {
    totalAllTime:        toNum(raw.totalAllTime ?? raw.total),
    totalThisMonth:      toNum(raw.totalThisMonth ?? raw.monthly),
    totalThisWeek:       toNum(raw.totalThisWeek),
    totalToday:          toNum(raw.totalToday),
    pendingSettlement:   toNum(raw.pendingSettlement ?? raw.pending),
    availableWithdrawal: toNum(raw.availableWithdrawal),
    esportsEarnings:     toNum(raw.esportsEarnings),
    socialEarnings:      toNum(raw.socialEarnings),
    bonusEarnings:       toNum(raw.bonusEarnings),
  }
}

// =============================================================================
// useHostDashboard HOOK
// =============================================================================

export function useHostDashboard(
  options: UseHostDashboardOptions = {},
): UseHostDashboardResult {
  const { enabled = true, pollIntervalMs = 60_000 } = options
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [state, setState] = useState<HostDashboardState>({
    profile: null,
    esportsTier: null,
    socialTier: null,
    levelInfo: null,
    earnings: null,
    badges: [],
    activeRooms: [],
    recentSettlements: [],
    isAgeVerified: false,
    isLoading: false,
    error: null,
  })

  const fetchDashboard = useCallback(async () => {
    if (!enabled) return
    const bridge = getBridge()
    if (!bridge) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const data = await bridge.getHostDashboard()

      const profile = safeProfile(data.profile ?? data)
      const esportsTier = safeTier(data.esportsTierInfo ?? null)
      const socialTier = safeTier(data.socialTierInfo ?? null)
      const earnings = safeEarnings(data.earnings ?? null)

      // Map activeRooms using safeActiveRoom to pick up tables[]
      const activeRooms = Array.isArray(data.activeRooms)
        ? data.activeRooms.map(safeActiveRoom)
        : []

      setState({
        profile,
        esportsTier,
        socialTier,
        levelInfo: data.levelInfo ?? null,
        earnings,
        badges: Array.isArray(data.badges) ? data.badges : [],
        activeRooms,
        recentSettlements: Array.isArray(data.recentSettlements) ? data.recentSettlements : [],
        isAgeVerified: profile?.isVerified ?? false,
        isLoading: false,
        error: null,
      })
    } catch (dashErr: any) {
      try {
        const [profileRes, earningsRes, badgesRes, roomsRes] = await Promise.allSettled([
          bridge.getHostProfile?.(),
          bridge.getHostEarnings?.(),
          bridge.getHostBadges?.(),
          bridge.getActiveRooms?.(),
        ])

        const profile = safeProfile(
          profileRes.status === 'fulfilled' ? profileRes.value : null
        )
        const earnings = safeEarnings(
          earningsRes.status === 'fulfilled' ? earningsRes.value : null
        )
        const badges = badgesRes.status === 'fulfilled' && Array.isArray(badgesRes.value)
          ? badgesRes.value : []
        const activeRooms = roomsRes.status === 'fulfilled' && Array.isArray(roomsRes.value)
          ? (roomsRes.value as any[]).map(safeActiveRoom) : []

        setState({
          profile,
          esportsTier: null,
          socialTier: null,
          levelInfo: null,
          earnings,
          badges,
          activeRooms,
          recentSettlements: [],
          isAgeVerified: profile?.isVerified ?? false,
          isLoading: false,
          error: null,
        })
      } catch (fallbackErr: any) {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: fallbackErr?.message ?? dashErr?.message ?? 'Failed to load host dashboard',
        }))
      }
    }
  }, [enabled])

  useEffect(() => {
    if (!enabled) return
    fetchDashboard()
    if (pollIntervalMs > 0) {
      pollRef.current = setInterval(fetchDashboard, pollIntervalMs)
    }
    return () => {
      if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null }
    }
  }, [enabled, fetchDashboard, pollIntervalMs])

  const verifyAge = useCallback(async (): Promise<boolean> => {
    const bridge = getBridge()
    if (!bridge) { toast.error('Bridge not initialized'); return false }
    try {
      await bridge.verifyAge()
      setState(prev => ({ ...prev, isAgeVerified: true }))
      toast.success('Age verified. You can now host rooms.')
      return true
    } catch (err: any) {
      toast.error(err?.message ?? 'Age verification failed')
      return false
    }
  }, [])

  const requestWithdrawal = useCallback(async (
    amount: number,
    currency: string,
    walletAddress: string,
  ): Promise<boolean> => {
    const bridge = getBridge()
    if (!bridge) { toast.error('Bridge not initialized'); return false }
    try {
      await bridge.requestHostWithdrawal({ amount, currency, walletAddress })
      toast.success(`Withdrawal of $${amount.toFixed(2)} requested.`)
      fetchDashboard()
      return true
    } catch (err: any) {
      toast.error(err?.message ?? 'Withdrawal failed')
      return false
    }
  }, [fetchDashboard])

  const { profile, esportsTier, socialTier, earnings } = state

  const activeTier = socialTier ?? esportsTier ?? null
  const activeTierName: HostTier = activeTier?.tier
    ?? profile?.currentSocialTier
    ?? profile?.currentEsportsTier
    ?? 'BRONZE'
  const activeTierDisplay = getTierDisplay(activeTierName)

  const totalEarnings = toNum(earnings?.totalAllTime ?? profile?.totalEarnings ?? 0)
  const monthlyEarnings = toNum(earnings?.totalThisMonth ?? profile?.monthlyEarnings ?? 0)
  const pendingSettlement = toNum(earnings?.pendingSettlement ?? 0)

  return {
    ...state,
    refresh: fetchDashboard,
    verifyAge,
    requestWithdrawal,
    activeTier,
    activeTierDisplay,
    totalEarnings,
    monthlyEarnings,
    pendingSettlement,
  }
}