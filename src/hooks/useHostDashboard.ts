// =============================================================================
// useHostDashboard -- packages/game-ui/src/hooks/useHostDashboard.ts
//
// Drives the Host Dashboard screen in standalone game apps.
// Uses DeskillzBridge for all API calls -- no direct HTTP imports.
// Follows same getBridge() pattern as useEnrollmentStatus and useQuickPlayQueue.
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
// TYPES (inline -- no import from host-types to keep game-ui dependency-free)
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
// Backend returns Prisma Decimal fields as strings.
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
// HOOK OPTIONS & RESULT
// =============================================================================

export interface UseHostDashboardOptions {
  /** Whether to fetch data on mount (default: true) */
  enabled?: boolean
  /** Auto-refresh interval in ms (default: 60000; 0 = disabled) */
  pollIntervalMs?: number
}

export interface HostDashboardState {
  // Profile
  profile: HostProfile | null
  // Tiers
  esportsTier: TierInfo | null
  socialTier: TierInfo | null
  // Level
  levelInfo: LevelInfo | null
  // Earnings
  earnings: EarningsSummary | null
  // Badges
  badges: HostBadge[]
  // Rooms
  activeRooms: ActiveRoom[]
  // Settlements
  recentSettlements: SettlementRecord[]
  // Age verification
  isAgeVerified: boolean
  // Loading / Error
  isLoading: boolean
  error: string | null
}

export interface UseHostDashboardResult extends HostDashboardState {
  /** Re-fetch all dashboard data */
  refresh: () => Promise<void>
  /** Request age verification (must be 21+) */
  verifyAge: () => Promise<boolean>
  /** Request earnings withdrawal */
  requestWithdrawal: (amount: number, currency: string, walletAddress: string) => Promise<boolean>
  /** Computed: active tier for the current game's category */
  activeTier: TierInfo | null
  /** Computed: tier display info */
  activeTierDisplay: TierDisplayInfo
  /** Computed: total earnings (safe number) */
  totalEarnings: number
  /** Computed: monthly earnings (safe number) */
  monthlyEarnings: number
  /** Computed: pending settlement (safe number) */
  pendingSettlement: number
}

// =============================================================================
// getBridge() -- same pattern as useEnrollmentStatus
// =============================================================================

function getBridge(): any {
  try {
    return (window as any).DeskillzBridge?.getInstance?.() ?? null
  } catch {
    return null
  }
}

// =============================================================================
// SAFE DEFAULTS -- merges partial API response to avoid undefined access
// Replicates: DESKILLZ_STANDALONE_GAME_UI_BUILD_HANDOFF_v2.9.md Section 13
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
    totalAllTime:       toNum(raw.totalAllTime ?? raw.total),
    totalThisMonth:     toNum(raw.totalThisMonth ?? raw.monthly),
    totalThisWeek:      toNum(raw.totalThisWeek),
    totalToday:         toNum(raw.totalToday),
    pendingSettlement:  toNum(raw.pendingSettlement ?? raw.pending),
    availableWithdrawal:toNum(raw.availableWithdrawal),
    esportsEarnings:    toNum(raw.esportsEarnings),
    socialEarnings:     toNum(raw.socialEarnings),
    bonusEarnings:      toNum(raw.bonusEarnings),
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

  // --------------------------------------------------------------------------
  // Fetch full dashboard (single-request aggregate endpoint)
  // Falls back to individual endpoints if aggregate fails
  // --------------------------------------------------------------------------
  const fetchDashboard = useCallback(async () => {
    if (!enabled) return
    const bridge = getBridge()
    if (!bridge) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      // Primary: single aggregate endpoint GET /api/v1/host/dashboard
      const data = await bridge.getHostDashboard()

      // Apply safe defaults per handoff doc Section 13
      // The endpoint returns: { profile, esportsTierInfo, socialTierInfo,
      //   levelInfo, earnings, badges, activeRooms, recentSettlements }
      // But any field can be null or partial.
      const profile = safeProfile(data.profile ?? data)
      const esportsTier = safeTier(data.esportsTierInfo ?? null)
      const socialTier = safeTier(data.socialTierInfo ?? null)
      const earnings = safeEarnings(data.earnings ?? null)

      setState({
        profile,
        esportsTier,
        socialTier,
        levelInfo: data.levelInfo ?? null,
        earnings,
        badges: Array.isArray(data.badges) ? data.badges : [],
        activeRooms: Array.isArray(data.activeRooms) ? data.activeRooms : [],
        recentSettlements: Array.isArray(data.recentSettlements) ? data.recentSettlements : [],
        isAgeVerified: profile?.isVerified ?? false,
        isLoading: false,
        error: null,
      })
    } catch (dashErr: any) {
      // Fallback: try individual endpoints
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
          ? roomsRes.value : []

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

  // --------------------------------------------------------------------------
  // Polling
  // --------------------------------------------------------------------------
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

  // --------------------------------------------------------------------------
  // Actions
  // --------------------------------------------------------------------------
  const verifyAge = useCallback(async (): Promise<boolean> => {
    const bridge = getBridge()
    if (!bridge) { toast.error('Bridge not initialized'); return false }
    try {
      await bridge.verifyAge()
      setState(prev => ({ ...prev, isAgeVerified: true }))
      toast.success('Age verified. You can now host rooms.')
      return true
    } catch (err: any) {
      const msg = err?.message ?? 'Age verification failed'
      toast.error(msg)
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
      // Refresh earnings after withdrawal
      fetchDashboard()
      return true
    } catch (err: any) {
      const msg = err?.message ?? 'Withdrawal failed'
      toast.error(msg)
      return false
    }
  }, [fetchDashboard])

  // --------------------------------------------------------------------------
  // Computed values
  // --------------------------------------------------------------------------
  const { profile, esportsTier, socialTier, earnings } = state

  // Determine active tier based on game category
  // Social games use socialTier; esport games use esportsTier
  // Default to social (most host dashboard users are social game hosts)
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