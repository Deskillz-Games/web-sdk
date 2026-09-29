// =============================================================================
// bridge-types.ts -- packages/game-ui/src/bridge-types.ts
//
// Type definitions that mirror DeskillzBridge exports.
// These are used by the game-ui package at build time.
// At runtime, the actual DeskillzBridge singleton from the game is used
// via window.DeskillzBridge -- no import needed.
// =============================================================================

export type TournamentEnrollmentStatus =
  | 'NOT_REGISTERED'
  | 'REGISTERED'
  | 'CHECKIN_OPEN'
  | 'CHECKED_IN'
  | 'STARTING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DQ_NO_SHOW'
  | 'STANDBY'
  | 'CANCELLED'

export interface TournamentEnrollmentState {
  status: TournamentEnrollmentStatus
  entryId?: string
  dqCountdownSeconds?: number
  checkinOpensAt?: string
  checkinClosesAt?: string
  seatNumber?: number
  tableId?: string
}

export interface TournamentRegistration {
  entryId: string
  tournamentId: string
  status: TournamentEnrollmentStatus
  registeredAt: string
  checkinOpensAt: string
  checkinClosesAt: string
  seatNumber?: number
  tableId?: string
}

// [Q-W 3.7.5] N540 Q-B2: the server-built tickets (lines = ASCII text to show as-is)
export interface QpEsportRules {
  version: 1
  kind: 'ESPORT'
  playerCount: number
  feePercent: number
  durationSecs: number
  graceSecs: number
  targetScore: number | null
  targetGraceSecs: number
  split: number[]
  tieBreak: 'EARLIER_SUBMISSION'
  lines: string[]
}

export interface QpSocialRules {
  version: 1
  kind: 'SOCIAL'
  winCondition: string
  target: number | null
  sessionMins: number | null
  pointValueUsd: number
  buyIn: number
  rakePercent: number
  rakeCapUsd: number
  idleMins: number
  lines: string[]
}

export interface QuickPlayConfig {
  gameId: string
  enabled: boolean
  gameCategory: 'ESPORTS' | 'SOCIAL'
  esportMinPlayers: number
  esportMaxPlayers: number
  esportPlayerModes: number[]
  esportEntryFeeTiers: number[]
  esportCurrencies: string[]
  esportPrizeType: 'WINNER_TAKES_ALL' | 'TOP_HEAVY' | 'EVEN_SPLIT'
  esportPlatformFee: number
  esportTargetScore: number | null // [Q-W 3.7.5] null = highest score at the clock
  esportRules: QpEsportRules[]     // [Q-W 3.7.5] one ticket per player mode
  socialMinPlayers: number
  socialMaxPlayers: number
  socialPointValueTiers: number[]
  socialCurrencies: string[]
  socialGameType: string | null
  socialDefaultBuyInMultiplier: number
  socialMinBuyInMultiplier: number
  socialRakePercent: number
  socialRakeCapUsd: number
  socialAutoCashout: boolean
  socialRules: QpSocialRules[]     // [Q-W 3.7.5] one ticket per point value tier
  socialWinCondition: SocialWinCondition
  socialPointTargets: number[]
  socialRoundTargets: number[]
  socialDefaultTarget: number
  socialAllowFreePlay: boolean
  matchmakingTimeoutSecs: number
  matchDurationSecs: number | null
  sessionDurationMins: number | null // SDK 3.7.0 P2
}

export interface QuickPlayLaunchData {
  matchId: string
  matchSessionId: string
  gameId: string
  deepLink: string
  token: string
  entryFee: number
  currency: string
  prizePool: number
  players: Array<{ id: string; username: string; avatarUrl?: string | null }>
  matchDurationSecs: number | null
  // [Q-W 3.7.5] N540: quick-play:found / starting carry this whole shape (own token + deepLink)
  targetScore: number | null
  endsAt: string | null
  rules: QpEsportRules | null
}

export interface Tournament {
  id: string
  name: string
  description?: string
  entryFee: number
  entryCurrency: string
  prizePool: number
  prizeCurrency: string
  currentPlayers: number
  maxPlayers: number
  minPlayers: number
  mode: string
  status: string
  scheduledStart: string
  scheduledEnd?: string
  gameId: string
  gameCategory?: 'ESPORTS' | 'SOCIAL'
  socialMode?: 'CASH_GAME' | 'TOURNAMENT'
  esportMatchMode?: 'ASYNC' | 'SYNC' | 'BLITZ_1V1' | 'DUEL_1V1'
  socialGameType?: string
  rakePercentage?: number
  rakeCapPerRound?: number
  minBuyIn?: number
  maxBuyIn?: number
  numberOfTables?: number
  minPlayersPerTable?: number
  prizePoolType?: 'DYNAMIC' | 'GUARANTEED'
  serviceFeePercent?: number
  createdAt: string
  // Registration window dates
  registrationOpenDate?: string
  registrationCloseDate?: string
  // Tournament creator (organizer) ID
  createdById?: string
}

// =============================================================================
// QUICKPLAY UI HELPERS
// =============================================================================

export const CryptoCurrency = {
  BNB: 'BNB',
  USDT_BSC: 'USDT_BSC',
  USDT_TRON: 'USDT_TRON',
  USDC_BSC: 'USDC_BSC',
  USDC_TRON: 'USDC_TRON',
} as const
export type CryptoCurrency = typeof CryptoCurrency[keyof typeof CryptoCurrency]

export type SocialGameType =
  | 'BIG_TWO' | 'MAHJONG' | 'CHINESE_POKER_13' | 'DOU_DIZHU'

export type SocialWinCondition =
  | 'FIRST_TO_POINTS' | 'FIXED_ROUNDS' | 'TIMED_SESSION' | 'SINGLE_GAME' | 'OPEN_ENDED'

export const WIN_CONDITION_LABELS: Record<string, string> = {
  FIRST_TO_POINTS: 'First to Points',
  FIXED_ROUNDS: 'Fixed Rounds',
  TIMED_SESSION: 'Timed Session',
  SINGLE_GAME: 'Single Game',
  OPEN_ENDED: 'Open-Ended',
}

export const CURRENCY_LABELS: Record<string, string> = {
  BNB: 'BNB',
  USDT_BSC: 'USDT (BSC)',
  USDT_TRON: 'USDT (TRON)',
  USDC_BSC: 'USDC (BSC)',
  USDC_TRON: 'USDC (TRON)',
}

export const SOCIAL_GAME_LABELS: Record<string, string> = {
  BIG_TWO: 'Big 2',
  MAHJONG: 'Mahjong',
  CHINESE_POKER_13: '13-Card Poker',
  DOU_DIZHU: 'Dou Dizhu',
}

export function formatPlayerMode(count: number): string {
  if (count === 2) return '1v1'
  return `FFA ${count}-Player`
}

// =============================================================================
// ENROLLMENT UI TYPE
// =============================================================================

export type UserEnrollmentStatus = TournamentEnrollmentStatus