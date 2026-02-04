// =============================================================================
// Deskillz Web SDK - Host Module Barrel Export
// Path: src/host/index.ts
// Re-exports all Host System modules
// =============================================================================

// Service
export { HostService } from './host-service';

// Helpers
export {
  getTierDisplayInfo,
  getLevelDisplayInfo,
  formatHostEarnings,
  calculateEffectiveShare,
} from './host-service';

// Enums
export {
  HostTier,
  BadgeCategory,
  HostGameCategory,
  HostSocialGameType,
  SettlementTrigger,
} from './host-types';

// Types
export type {
  HostProfile,
  HostBadge,
  BadgeDefinition,
  BadgeProgressEntry,
  TierInfo,
  LevelInfo,
  EarningsSummary,
  EarningsHistoryItem,
  SettlementRecord,
  ActiveRoomPlayer,
  ActiveRoom,
  RoomHistoryItem,
  HostNotificationSettings,
  HostDashboardStats,
  HostLeaderboardEntry,
  EarningsHistoryFilters,
  SettlementFilters,
  RoomHistoryFilters,
  HostLeaderboardFilters,
  WithdrawRequest,
  WithdrawResponse,
  AgeVerificationResponse,
  AgeVerificationStatus,
  PaginatedHostResponse,
  MyRankResponse,
  TierDisplayInfo,
  LevelDisplayInfo,
} from './host-types';