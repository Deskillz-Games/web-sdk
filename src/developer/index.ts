// =============================================================================
// Deskillz Web SDK - Developer Module Barrel Export
// Path: src/developer/index.ts
// Re-exports all Developer Portal + Build Management modules
// =============================================================================

// Services
export { DeveloperService } from './developer-service';
export { BuildService, PublicBuildService } from './build-service';

// Helpers
export {
  formatFileSize,
  getStatusColor,
  getStatusLabel,
  getBuildStatusInfo,
  calculateFileHash,
} from './build-service';

// Enums
export {
  BuildStatus,
  DevBuildPlatform,
  SdkEnvironment,
  PayoutStatus,
} from './developer-types';

// Types - Developer
export type {
  GameSummary,
  DeveloperActivity,
  DeveloperDashboard,
  DailyGameStats,
  GameAnalytics,
  GameRevenue,
  PeriodRevenue,
  RevenueReport,
  PayoutRequest,
  PayoutResponse,
  SdkKey,
  CreateSdkKeyRequest,
  CreateDraftGameRequest,
  DraftGameResponse,
  DraftGame,
  GameCredentials,
  RevenueReportFilters,
  PayoutHistoryParams,
} from './developer-types';

// Types - Builds
export type {
  BuildUser,
  GameBuild,
  BuildListResponse,
  UploadInitiatedResponse,
  DirectUploadResponse,
  DownloadInfo,
  VersionCheckResponse,
  GameApiKey,
  ApiKeyCreatedResponse,
  ApiKeyListResponse,
  InitiateUploadRequest,
  ConfirmUploadRequest,
  UpdateBuildRequest,
  BuildQueryParams,
  CreateApiKeyRequest,
  VersionCheckParams,
  BuildStatusInfo,
} from './developer-types';