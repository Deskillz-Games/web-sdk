// =============================================================================
// Deskillz Web SDK - User & Leaderboard Types
// Path: src/users/user-types.ts
// All interfaces and enums for User Profile, Settings, Roles,
// Leaderboard, and Platform Stats
// Replicates: users.ts lines 4-190, leaderboard.ts lines 4-59
// =============================================================================

// =============================================================================
// ENUMS (const objects for tree-shaking)
// =============================================================================

/**
 * User role.
 * Replicates: users.ts line 106.
 */
export const UserRole = {
  PLAYER: 'PLAYER',
  DEVELOPER: 'DEVELOPER',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

/**
 * Player competitive tier.
 * Replicates: users.ts line 27.
 */
export const PlayerTier = {
  BRONZE: 'Bronze',
  SILVER: 'Silver',
  GOLD: 'Gold',
  PLATINUM: 'Platinum',
  DIAMOND: 'Diamond',
} as const;
export type PlayerTier = (typeof PlayerTier)[keyof typeof PlayerTier];

/**
 * Transaction type.
 * Replicates: users.ts line 51.
 */
export const UserTransactionType = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  ENTRY_FEE: 'entry_fee',
  PRIZE: 'prize',
  REFUND: 'refund',
} as const;
export type UserTransactionType =
  (typeof UserTransactionType)[keyof typeof UserTransactionType];

/**
 * Transaction status.
 * Replicates: users.ts line 55.
 */
export const UserTransactionStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const;
export type UserTransactionStatus =
  (typeof UserTransactionStatus)[keyof typeof UserTransactionStatus];

/**
 * Achievement rarity tier.
 * Replicates: users.ts line 36.
 */
export const AchievementRarity = {
  COMMON: 'common',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary',
} as const;
export type AchievementRarity =
  (typeof AchievementRarity)[keyof typeof AchievementRarity];

/**
 * Leaderboard time period filter.
 * Replicates: leaderboard.ts line 56.
 */
export const LeaderboardPeriod = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  ALL_TIME: 'alltime',
} as const;
export type LeaderboardPeriod =
  (typeof LeaderboardPeriod)[keyof typeof LeaderboardPeriod];

/**
 * Theme preference.
 * Replicates: users.ts line 141.
 */
export const ThemePreference = {
  DARK: 'dark',
  LIGHT: 'light',
  SYSTEM: 'system',
} as const;
export type ThemePreference =
  (typeof ThemePreference)[keyof typeof ThemePreference];

// =============================================================================
// USER PROFILE
// Replicates: users.ts lines 4-46
// =============================================================================

/** Player stats summary. */
export interface UserStats {
  totalEarnings: number;
  totalWins: number;
  totalLosses: number;
  totalTournaments: number;
  winRate: number;
  currentStreak: number;
  bestStreak: number;
  rank?: number;
  tier?: PlayerTier;
}

/** Unlocked achievement. */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string;
  unlockedAt: string;
  rarity: AchievementRarity;
}

/** Recently played game summary. */
export interface RecentGame {
  gameId: string;
  gameName: string;
  gameIcon: string;
  lastPlayed: string;
  totalMatches: number;
  wins: number;
}

/** Full user profile. */
export interface UserProfile {
  id: string;
  username: string;
  email: string;
  role: 'player' | 'developer' | 'admin';
  avatarUrl?: string;
  bio?: string;
  walletAddress?: string;
  createdAt: string;
  stats: UserStats;
  achievements?: Achievement[];
  recentGames?: RecentGame[];
}

// =============================================================================
// TRANSACTIONS & WALLET
// Replicates: users.ts lines 48-80
// =============================================================================

/** Transaction metadata. */
export interface TransactionMetadata {
  tournamentId?: string;
  tournamentName?: string;
  gameId?: string;
  gameName?: string;
}

/** User transaction record. */
export interface UserTransaction {
  id: string;
  userId: string;
  type: UserTransactionType;
  amount: number;
  currency: string;
  txHash?: string;
  status: UserTransactionStatus;
  description?: string;
  createdAt: string;
  metadata?: TransactionMetadata;
}

/** Single currency balance. */
export interface WalletBalance {
  currency: string;
  symbol: string;
  amount: number;
  usdValue: number;
  color: string;
}

/** User wallet summary. */
export interface UserWallet {
  address: string;
  chainId: number;
  chainName: string;
  balances: WalletBalance[];
  totalBalanceUSD: number;
}

// =============================================================================
// SETTINGS
// Replicates: users.ts lines 126-190
// =============================================================================

/** Notification settings. */
export interface NotificationSettings {
  notifyTournamentStart: boolean;
  notifyTournamentEnd: boolean;
  notifyMatchFound: boolean;
  notifyPrizeWon: boolean;
  notifyDepositConfirmed: boolean;
  notifyWithdrawalComplete: boolean;
  notifyWeeklyReport: boolean;
  notifyPromotions: boolean;
  emailNotificationsEnabled: boolean;
  pushNotificationsEnabled: boolean;
  soundEnabled: boolean;
}

/** Display preferences. */
export interface PreferenceSettings {
  theme: ThemePreference;
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'vi' | 'ko' | 'ja';
  displayCurrency: 'USD' | 'EUR' | 'GBP' | 'CAD';
  timezone: string;
}

/** Privacy settings. */
export interface PrivacySettings {
  profilePublic: boolean;
  showOnlineStatus: boolean;
  showRecentActivity: boolean;
  allowFriendRequests: boolean;
}

/** Aggregate user settings. */
export interface UserSettings {
  id: string;
  userId: string;
  notifications: NotificationSettings;
  preferences: PreferenceSettings;
  privacy: PrivacySettings;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// LEADERBOARD
// Replicates: leaderboard.ts lines 4-59
// =============================================================================

/** Leaderboard entry (row). */
export interface LeaderboardEntry {
  rank: number;
  previousRank?: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  earnings: number;
  wins: number;
  winRate: number;
  tournaments: number;
  tier?: string;
}

/** Leaderboard response with metadata. */
export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  period: string;
  totalPlayers: number;
  updatedAt: string;
}

/** User's personal rank on a leaderboard. */
export interface UserRank {
  rank: number;
  totalPlayers: number;
  percentile: number;
  earnings: number;
  wins: number;
  tier?: string;
}

/** Per-game statistics (public). */
export interface GameStats {
  gameId: string;
  gameName: string;
  totalPlayers: number;
  activePlayers: number;
  totalTournaments: number;
  activeTournaments: number;
  totalPrizePool: number;
  averageEntryFee: number;
}

/** Platform-wide statistics (public). */
export interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  totalGames: number;
  activeGames: number;
  totalTournaments: number;
  activeTournaments: number;
  totalPrizeDistributed: number;
  totalTransactions: number;
}

// =============================================================================
// REQUEST TYPES
// =============================================================================

/** Update profile request. */
export interface UpdateProfileRequest {
  username?: string;
  email?: string;
  bio?: string;
  avatarUrl?: string;
}

/** Update user role request (e.g. PLAYER -> DEVELOPER). */
export interface UpdateRoleRequest {
  role: UserRole;
  studioName?: string;
  businessEmail?: string;
}

/** Role update response. */
export interface RoleUpdateResponse {
  id: string;
  username: string;
  previousRole: string;
  newRole: string;
  message: string;
}

/** Partial notification settings update. */
export interface UpdateNotificationsRequest {
  notifyTournamentStart?: boolean;
  notifyTournamentEnd?: boolean;
  notifyMatchFound?: boolean;
  notifyPrizeWon?: boolean;
  notifyDepositConfirmed?: boolean;
  notifyWithdrawalComplete?: boolean;
  notifyWeeklyReport?: boolean;
  notifyPromotions?: boolean;
  emailNotificationsEnabled?: boolean;
  pushNotificationsEnabled?: boolean;
  soundEnabled?: boolean;
}

/** Partial display preferences update. */
export interface UpdatePreferencesRequest {
  theme?: ThemePreference;
  language?: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'vi' | 'ko' | 'ja';
  displayCurrency?: 'USD' | 'EUR' | 'GBP' | 'CAD';
  timezone?: string;
}

/** Partial privacy settings update. */
export interface UpdatePrivacyRequest {
  profilePublic?: boolean;
  showOnlineStatus?: boolean;
  showRecentActivity?: boolean;
  allowFriendRequests?: boolean;
}

/** Link wallet request payload. */
export interface LinkWalletRequest {
  walletAddress: string;
  signature: string;
}

/** User transaction list filters. */
export interface UserTransactionFilters {
  page?: number;
  limit?: number;
  type?: string;
}

/** Leaderboard query filters. */
export interface LeaderboardFilters {
  period?: LeaderboardPeriod;
  limit?: number;
  offset?: number;
}