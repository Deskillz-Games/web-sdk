// =============================================================================
// Deskillz Web SDK - Users Module Barrel Export
// Path: src/users/index.ts
// Re-exports all User Profile, Settings, and Leaderboard modules
// =============================================================================

// Services
export { UserService } from './user-service';
export { LeaderboardService } from './leaderboard-service';

// Enums
export {
  UserRole,
  PlayerTier,
  UserTransactionType,
  UserTransactionStatus,
  AchievementRarity,
  LeaderboardPeriod,
  ThemePreference,
} from './user-types';

// Types - Profile
export type {
  UserProfile,
  UserStats,
  Achievement,
  RecentGame,
} from './user-types';

// Types - Transactions & Wallet
export type {
  TransactionMetadata,
  UserTransaction,
  WalletBalance,
  UserWallet,
} from './user-types';

// Types - Settings
export type {
  NotificationSettings,
  PreferenceSettings,
  PrivacySettings,
  UserSettings,
} from './user-types';

// Types - Leaderboard
export type {
  LeaderboardEntry,
  LeaderboardResponse,
  UserRank,
  GameStats,
  PlatformStats,
} from './user-types';

// Types - Requests
export type {
  UpdateProfileRequest,
  UpdateRoleRequest,
  RoleUpdateResponse,
  UpdateNotificationsRequest,
  UpdatePreferencesRequest,
  UpdatePrivacyRequest,
  LinkWalletRequest,
  UserTransactionFilters,
  LeaderboardFilters,
} from './user-types';