// =============================================================================
// Deskillz Web SDK - Host Types
// Path: src/host/host-types.ts
// All interfaces and enums for the Host System (tiers, badges, earnings,
// settlements, rooms, leaderboard, notifications, withdrawal, age verification)
// Replicates: host.ts lines 13-218
// =============================================================================

// =============================================================================
// ENUMS (const objects for tree-shaking)
// =============================================================================

/**
 * Host tier levels (6 tiers: Bronze -> Elite).
 * Determines revenue-share percentages for esports and social games.
 * Replicates: host.ts line 14.
 */
export const HostTier = {
  BRONZE: 'BRONZE',
  SILVER: 'SILVER',
  GOLD: 'GOLD',
  PLATINUM: 'PLATINUM',
  DIAMOND: 'DIAMOND',
  ELITE: 'ELITE',
} as const;
export type HostTier = (typeof HostTier)[keyof typeof HostTier];

/**
 * Badge categories.
 * Replicates: host.ts line 15.
 */
export const BadgeCategory = {
  ACHIEVEMENT: 'ACHIEVEMENT',
  PERFORMANCE: 'PERFORMANCE',
  EXCLUSIVE: 'EXCLUSIVE',
} as const;
export type BadgeCategory = (typeof BadgeCategory)[keyof typeof BadgeCategory];

/**
 * Game category (esports vs social).
 * Replicates: host.ts line 16.
 */
export const HostGameCategory = {
  ESPORTS: 'ESPORTS',
  SOCIAL: 'SOCIAL',
} as const;
export type HostGameCategory = (typeof HostGameCategory)[keyof typeof HostGameCategory];

/**
 * Social game types.
 * Replicates: host.ts line 17.
 */
export const HostSocialGameType = {
  BIG_TWO: 'BIG_TWO',
  MAHJONG: 'MAHJONG',
  CHINESE_POKER_13: 'CHINESE_POKER_13',
} as const;
export type HostSocialGameType = (typeof HostSocialGameType)[keyof typeof HostSocialGameType];

/**
 * What triggered a rake settlement.
 * Replicates: host.ts line 18.
 */
export const SettlementTrigger = {
  THRESHOLD: 'THRESHOLD',
  ROUNDS: 'ROUNDS',
  TIME: 'TIME',
  PLAYER_LEFT: 'PLAYER_LEFT',
  MANUAL: 'MANUAL',
  SESSION_END: 'SESSION_END',
} as const;
export type SettlementTrigger = (typeof SettlementTrigger)[keyof typeof SettlementTrigger];

// =============================================================================
// HOST PROFILE
// =============================================================================

/**
 * Full host profile.
 * Replicates: host.ts lines 21-44.
 */
export interface HostProfile {
  id: string;
  odid: string;
  username: string;
  avatarUrl: string | null;
  hostLevel: number;
  hostTitle: string;
  totalPlayersHosted: number;
  totalRoomsCompleted: number;
  totalEarnings: number;
  monthlyEarnings: number;
  monthlyRake: number;
  currentEsportsTier: HostTier;
  currentSocialTier: HostTier;
  streakDays: number;
  streakBonus: number;
  volumeBonus: number;
  permanentBonus: number;
  activeRoomCount: number;
  maxConcurrentRooms: number;
  isVerified: boolean;
  joinedAt: string;
  lastActiveAt: string;
}

// =============================================================================
// BADGES
// =============================================================================

/**
 * An earned host badge.
 * Replicates: host.ts lines 47-59.
 */
export interface HostBadge {
  id: string;
  badgeId: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  isMonthly: boolean;
  awardedAt: string;
  expiresAt: string | null;
  progress?: number;
  maxProgress?: number;
}

/**
 * Badge definition (catalog entry with progress tracking).
 * Replicates: host.ts lines 62-72.
 */
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  requirement: string;
  threshold: number;
  unlockBonus: string | null;
  isMonthly: boolean;
}

/**
 * Badge progress entry (badge + current / max values).
 * Replicates: host.ts lines 297-300 (inline response type).
 */
export interface BadgeProgressEntry {
  badge: BadgeDefinition;
  progress: number;
  maxProgress: number;
}

// =============================================================================
// TIERS & LEVELS
// =============================================================================

/**
 * Tier info with progression data and revenue-share percentages.
 * Replicates: host.ts lines 75-87.
 */
export interface TierInfo {
  tier: HostTier;
  icon: string;
  minThreshold: number;
  maxThreshold: number | null;
  hostShare: number;
  platformShare: number;
  developerShare: number;
  currentValue: number;
  progressPercent: number;
  nextTier: HostTier | null;
  valueToNextTier: number | null;
}

/**
 * Level info with progression data and unlocked benefits.
 * 10 levels: Newcomer (1) -> Elite (10).
 * Replicates: host.ts lines 90-100.
 */
export interface LevelInfo {
  level: number;
  title: string;
  playersHosted: number;
  totalEarnings: number;
  currentPlayers: number;
  currentEarnings: number;
  progressPercent: number;
  nextLevel: number | null;
  benefits: string[];
}

// =============================================================================
// EARNINGS & SETTLEMENTS
// =============================================================================

/**
 * Earnings summary with time-period breakdowns.
 * Replicates: host.ts lines 103-113.
 */
export interface EarningsSummary {
  totalAllTime: number;
  totalThisMonth: number;
  totalThisWeek: number;
  totalToday: number;
  pendingSettlement: number;
  availableWithdrawal: number;
  esportsEarnings: number;
  socialEarnings: number;
  bonusEarnings: number;
}

/**
 * Single earnings history data point (for charts).
 * Replicates: host.ts lines 116-122.
 */
export interface EarningsHistoryItem {
  date: string;
  esports: number;
  social: number;
  bonus: number;
  total: number;
}

/**
 * Rake settlement record.
 * Replicates: host.ts lines 125-138.
 */
export interface SettlementRecord {
  id: string;
  sessionId: string;
  roomId: string;
  roomName: string;
  gameType: HostSocialGameType;
  trigger: SettlementTrigger;
  totalRake: number;
  hostShare: number;
  platformShare: number;
  developerShare: number;
  roundsSettled: number;
  settledAt: string;
}

// =============================================================================
// ROOMS
// =============================================================================

/**
 * Player within an active room (host view).
 */
export interface ActiveRoomPlayer {
  odid: string;
  username: string;
  avatarUrl: string | null;
  isReady: boolean;
  currentBalance?: number;
}

/**
 * Active room summary (host dashboard).
 * Replicates: host.ts lines 141-166.
 */
export interface ActiveRoom {
  id: string;
  roomCode: string;
  name: string;
  gameId: string;
  gameName: string;
  gameIcon: string | null;
  gameCategory: HostGameCategory;
  gameType?: HostSocialGameType;
  currentPlayers: number;
  maxPlayers: number;
  status: string;
  entryFee: number;
  entryCurrency: string;
  pointValueUsd?: number;
  accumulatedRake?: number;
  totalRounds?: number;
  createdAt: string;
  players: ActiveRoomPlayer[];
}

/**
 * Room history item (completed rooms).
 * Replicates: host.ts lines 169-180.
 */
export interface RoomHistoryItem {
  id: string;
  roomCode: string;
  name: string;
  gameName: string;
  gameCategory: HostGameCategory;
  playerCount: number;
  totalRake: number;
  hostEarnings: number;
  status: string;
  completedAt: string;
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

/**
 * Host notification preferences.
 * Replicates: host.ts lines 183-193.
 */
export interface HostNotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  inAppEnabled: boolean;
  soundEnabled: boolean;
  settlementNotifications: boolean;
  playerJoinNotifications: boolean;
  tierUpgradeNotifications: boolean;
  badgeAwardNotifications: boolean;
  lowBalanceWarnings: boolean;
}

// =============================================================================
// DASHBOARD (aggregate response)
// =============================================================================

/**
 * Full host dashboard stats (single-request aggregate).
 * Replicates: host.ts lines 196-205.
 */
export interface HostDashboardStats {
  profile: HostProfile;
  esportsTierInfo: TierInfo;
  socialTierInfo: TierInfo;
  levelInfo: LevelInfo;
  earnings: EarningsSummary;
  badges: HostBadge[];
  activeRooms: ActiveRoom[];
  recentSettlements: SettlementRecord[];
}

// =============================================================================
// LEADERBOARD
// =============================================================================

/**
 * Host leaderboard entry.
 * Replicates: host.ts lines 208-218.
 */
export interface HostLeaderboardEntry {
  rank: number;
  odid: string;
  username: string;
  avatarUrl: string | null;
  tier: HostTier;
  level: number;
  monthlyEarnings: number;
  monthlyRake: number;
  roomsCompleted: number;
}

// =============================================================================
// REQUEST / RESPONSE TYPES
// =============================================================================

/** Earnings history query filters. */
export interface EarningsHistoryFilters {
  period?: 'week' | 'month' | 'year';
  startDate?: string;
  endDate?: string;
}

/** Settlement query filters. */
export interface SettlementFilters {
  limit?: number;
  offset?: number;
}

/** Room history query filters. */
export interface RoomHistoryFilters {
  limit?: number;
  offset?: number;
  category?: HostGameCategory;
}

/** Leaderboard query filters. */
export interface HostLeaderboardFilters {
  period?: 'week' | 'month' | 'all';
  category?: HostGameCategory;
  limit?: number;
}

/** Withdrawal request payload. */
export interface WithdrawRequest {
  amount: number;
  currency: string;
  walletAddress: string;
}

/** Withdrawal response. */
export interface WithdrawResponse {
  transactionId: string;
  estimatedArrival: string;
}

/** Age verification response. */
export interface AgeVerificationResponse {
  success: boolean;
  verifiedAt: string;
}

/** Age verification status check. */
export interface AgeVerificationStatus {
  isVerified: boolean;
  verifiedAt: string | null;
}

/** Paginated list response (settlements, room history). */
export interface PaginatedHostResponse<T> {
  data: T[];
  total: number;
}

/** My rank response. */
export interface MyRankResponse {
  rank: number;
  total: number;
}

// =============================================================================
// HELPER TYPES (for display functions)
// =============================================================================

/** Tier display info (name, icon, CSS colors). */
export interface TierDisplayInfo {
  name: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/** Level display info (title, CSS color, unlocked benefits). */
export interface LevelDisplayInfo {
  title: string;
  color: string;
  benefits: string[];
}