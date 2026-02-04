// =============================================================================
// Deskillz Web SDK - Developer & Build Types
// Path: src/developer/developer-types.ts
// All interfaces and enums for Developer Portal + Game Build management
// Replicates: developer.ts lines 12-178, game-builds.ts lines 12-201
// =============================================================================

// =============================================================================
// ENUMS (const objects for tree-shaking)
// =============================================================================

/**
 * Build processing/review status.
 * Replicates: game-builds.ts lines 12-19.
 */
export const BuildStatus = {
  UPLOADING: 'UPLOADING',
  PROCESSING: 'PROCESSING',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  DEPRECATED: 'DEPRECATED',
  REMOVED: 'REMOVED',
} as const;
export type BuildStatus = (typeof BuildStatus)[keyof typeof BuildStatus];

/**
 * Build target platform.
 * Replicates: game-builds.ts line 21.
 */
export const DevBuildPlatform = {
  ANDROID: 'ANDROID',
  IOS: 'IOS',
} as const;
export type DevBuildPlatform = (typeof DevBuildPlatform)[keyof typeof DevBuildPlatform];

/**
 * SDK key / payout environment.
 * Replicates: developer.ts line 101, game-builds.ts line 132.
 */
export const SdkEnvironment = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  SANDBOX: 'sandbox',
  STAGING: 'staging',
} as const;
export type SdkEnvironment = (typeof SdkEnvironment)[keyof typeof SdkEnvironment];

/**
 * Payout status.
 * Replicates: developer.ts line 125.
 */
export const PayoutStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;
export type PayoutStatus = (typeof PayoutStatus)[keyof typeof PayoutStatus];

// =============================================================================
// DEVELOPER DASHBOARD & ANALYTICS
// Replicates: developer.ts lines 12-69
// =============================================================================

/** Game summary shown on the developer dashboard. */
export interface GameSummary {
  id: string;
  name: string;
  status: string;
  totalMatches: number;
  totalPlayers: number;
  revenue: string;
  tournamentsCount: number;
}

/** Developer activity feed item. */
export interface DeveloperActivity {
  id?: string;
  type:
    | 'game_approved'
    | 'game_rejected'
    | 'tournament_completed'
    | 'payout_received'
    | 'new_player'
    | 'tournament'
    | string;
  message?: string;
  gameName?: string;
  tournamentName?: string;
  players?: number;
  status?: string;
  metadata?: Record<string, unknown>;
  createdAt: string | Date;
}

/** Full developer dashboard response. */
export interface DeveloperDashboard {
  totalGames: number;
  activeGames: number;
  pendingGames: number;
  approvedGames: number;
  totalTournaments: number;
  activeTournaments: number;
  totalRevenue: number | string;
  pendingPayout: number | string;
  pendingPayouts: number | string;
  totalPlayers: number;
  totalMatches: number;
  games: GameSummary[];
  recentActivity: DeveloperActivity[];
}

/** Daily game analytics data point. */
export interface DailyGameStats {
  date: string;
  players: number;
  tournaments: number;
  revenue: number;
}

/** Game analytics report. */
export interface GameAnalytics {
  gameId: string;
  gameName: string;
  totalPlayers: number;
  activePlayers: number;
  totalTournaments: number;
  activeTournaments: number;
  totalRevenue: number;
  averageEntryFee: number;
  averagePrizePool: number;
  playerRetention: number;
  dailyStats: DailyGameStats[];
}

// =============================================================================
// REVENUE & PAYOUTS
// Replicates: developer.ts lines 71-129
// =============================================================================

/** Revenue breakdown by game. */
export interface GameRevenue {
  gameId: string;
  gameName: string;
  revenue: number;
  tournaments: number;
  percentage: number;
}

/** Revenue breakdown by time period. */
export interface PeriodRevenue {
  period: string;
  revenue: number;
  tournaments: number;
}

/** Full revenue report. */
export interface RevenueReport {
  totalRevenue: number | string;
  pendingPayout: number;
  paidOut: number;
  revenueByGame: GameRevenue[];
  revenueByPeriod: PeriodRevenue[];
}

/** Payout request payload. */
export interface PayoutRequest {
  amount: number;
  currency: string;
  walletAddress: string;
  chain?: string;
}

/** Payout response / history item. */
export interface PayoutResponse {
  id: string;
  amount: number | string;
  currency: string;
  walletAddress: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'PENDING' | 'COMPLETED';
  txHash?: string;
  estimatedArrival?: string | Date;
  createdAt: string | Date;
}

// =============================================================================
// SDK KEYS
// Replicates: developer.ts lines 93-111
// =============================================================================

/** SDK key record. */
export interface SdkKey {
  id?: string;
  name: string;
  key?: string;
  apiKey?: string;
  apiSecret?: string;
  gameId?: string;
  gameName?: string;
  environment: 'development' | 'production' | 'sandbox' | 'staging';
  isActive?: boolean;
  lastUsedAt?: string;
  createdAt: string | Date;
}

/** Create SDK key request payload. */
export interface CreateSdkKeyRequest {
  name: string;
  gameId?: string;
  environment: 'development' | 'production';
}

// =============================================================================
// DRAFT GAME (Credentials-First Flow)
// Replicates: developer.ts lines 135-178
// =============================================================================

/** Create draft game request (Step 0 - just a name). */
export interface CreateDraftGameRequest {
  name: string;
  platform?: 'ANDROID' | 'IOS' | 'BOTH';
}

/** Draft game response with immediate credentials. */
export interface DraftGameResponse {
  gameId: string;
  name: string;
  slug: string;
  status: string;
  apiKey: string;
  apiSecret: string;
  environment: string;
  deepLinkScheme: string;
  createdAt: string | Date;
  message: string;
}

/** Draft game listing item. */
export interface DraftGame {
  id: string;
  name: string;
  slug: string;
  status: string;
  deepLinkScheme: string;
  platform: string;
  hasApiKey: boolean;
  apiKeyHint: string | null;
  createdAt: string | Date;
}

/** Game credentials lookup response. */
export interface GameCredentials {
  gameId: string;
  name: string;
  status: string;
  deepLinkScheme: string;
  apiKeys: Array<{
    apiKey: string;
    gameId: string;
    name: string;
    environment: string;
    createdAt: string | Date;
  }>;
  createdAt: string | Date;
}

// =============================================================================
// GAME BUILDS
// Replicates: game-builds.ts lines 23-120
// =============================================================================

/** Build uploader / reviewer info. */
export interface BuildUser {
  id: string;
  username: string;
}

/** Full game build record. */
export interface GameBuild {
  id: string;
  gameId: string;
  gameName: string;
  version: string;
  versionCode: number;
  buildNumber: number;
  platform: DevBuildPlatform;
  fileName: string;
  fileSize: string;
  fileHash?: string;
  status: BuildStatus;
  isLatest: boolean;
  isBeta: boolean;
  isForced: boolean;
  releaseNotes?: string;
  sdkVersion?: string;
  packageName?: string;
  deepLinkScheme?: string;
  minOsVersion?: string;
  downloadCount: number;
  installCount: number;
  downloadUrl?: string;
  uploadedAt: string;
  reviewedAt?: string;
  releasedAt?: string;
  uploadedBy: BuildUser;
  reviewedBy?: BuildUser;
  reviewNotes?: string;
  rejectionReason?: string;
}

/** Paginated build list response. */
export interface BuildListResponse {
  builds: GameBuild[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/** Presigned upload URL response. */
export interface UploadInitiatedResponse {
  buildId: string;
  uploadUrl: string;
  storageKey: string;
  expiresAt: string;
}

/** Direct upload response. */
export interface DirectUploadResponse {
  buildId: string;
  storageKey: string;
  fileHash: string;
}

/** Public download info for a game. */
export interface DownloadInfo {
  gameId: string;
  gameName: string;
  gameIcon?: string;
  builds: Array<{
    platform: DevBuildPlatform;
    version: string;
    versionCode: number;
    fileSize: string;
    downloadUrl: string;
    releaseNotes?: string;
    minOsVersion?: string;
    releasedAt: string;
  }>;
  totalDownloads: number;
}

/** Version check response (auto-updater). */
export interface VersionCheckResponse {
  latestVersion: string;
  versionCode: number;
  updateAvailable: boolean;
  isForced: boolean;
  downloadUrl?: string;
  fileSize?: string;
  releaseNotes?: string;
}

// =============================================================================
// API KEYS (per-game)
// Replicates: game-builds.ts lines 126-150
// =============================================================================

/** Game API key record (secret NOT included). */
export interface GameApiKey {
  id: string;
  gameId: string;
  name: string;
  keyPrefix: string;
  keyHint: string;
  environment: 'production' | 'sandbox';
  permissions: string[];
  rateLimit: number;
  isActive: boolean;
  lastUsedAt?: string;
  usageCount: number;
  createdAt: string;
  expiresAt?: string;
}

/** API key creation response (secret shown once!). */
export interface ApiKeyCreatedResponse extends GameApiKey {
  apiKey: string;
  apiSecret: string;
}

/** API key list response. */
export interface ApiKeyListResponse {
  keys: GameApiKey[];
  total: number;
}

// =============================================================================
// REQUEST TYPES
// Replicates: game-builds.ts lines 156-201
// =============================================================================

/** Initiate presigned upload request. */
export interface InitiateUploadRequest {
  version: string;
  versionCode: number;
  platform?: DevBuildPlatform;
  fileName: string;
  fileSize: number;
  releaseNotes?: string;
  isBeta?: boolean;
}

/** Confirm upload completion payload. */
export interface ConfirmUploadRequest {
  fileHash: string;
  packageName?: string;
  sdkVersion?: string;
  deepLinkScheme?: string;
  minOsVersion?: string;
  signatureHash?: string;
}

/** Update build metadata payload. */
export interface UpdateBuildRequest {
  releaseNotes?: string;
  changelog?: string;
  isBeta?: boolean;
  isForced?: boolean;
}

/** Build query / filter parameters. */
export interface BuildQueryParams {
  status?: BuildStatus;
  platform?: DevBuildPlatform;
  includeBeta?: boolean;
  page?: number;
  limit?: number;
}

/** Create per-game API key request. */
export interface CreateApiKeyRequest {
  name: string;
  environment: 'production' | 'sandbox';
  permissions?: string[];
  rateLimit?: number;
}

/** Revenue report query filters. */
export interface RevenueReportFilters {
  startDate?: string;
  endDate?: string;
}

/** Payout history query params. */
export interface PayoutHistoryParams {
  page?: number;
  limit?: number;
}

/** Version check query params. */
export interface VersionCheckParams {
  currentVersion?: string;
  versionCode?: number;
  platform?: DevBuildPlatform;
}

// =============================================================================
// HELPER TYPES (for display functions)
// =============================================================================

/** Build status display info. */
export interface BuildStatusInfo {
  label: string;
  color: string;
}