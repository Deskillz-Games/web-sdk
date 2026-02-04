// =============================================================================
// Deskillz Web SDK - Build Service
// Path: src/developer/build-service.ts
// Build management: upload (presigned + direct), confirm, list, CRUD,
// release/deprecate, API keys, public download, version check
// Replicates: game-builds.ts gameBuildsApi (lines 207-417),
//   publicBuildsApi (lines 423-477), helpers (lines 519-573)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { QueryParams } from '../core/types';
import type {
  GameBuild,
  BuildListResponse,
  UploadInitiatedResponse,
  DirectUploadResponse,
  InitiateUploadRequest,
  ConfirmUploadRequest,
  UpdateBuildRequest,
  BuildQueryParams,
  ApiKeyCreatedResponse,
  ApiKeyListResponse,
  CreateApiKeyRequest,
  DownloadInfo,
  VersionCheckResponse,
  VersionCheckParams,
  BuildStatus,
  DevBuildPlatform,
  BuildStatusInfo,
} from './developer-types';

// =============================================================================
// BUILD SERVICE (Developer Endpoints)
// =============================================================================

/**
 * Service for game build management.
 *
 * Supports two upload flows:
 * 1. **Presigned URL** (production): initiateUpload -> uploadToPresignedUrl -> confirmUpload
 * 2. **Direct upload** (dev/testing): directUpload (FormData, single call)
 *
 * Also manages per-game API keys, build lifecycle (release, deprecate, delete),
 * and build metadata updates.
 *
 * All endpoints require authentication with DEVELOPER role.
 * Paths use /api/v1/developer/games/:gameId/builds/ prefix.
 *
 * 16 endpoints total. Replicates: game-builds.ts gameBuildsApi (lines 207-417).
 */
export class BuildService {
  private readonly http: HttpClient;
  private readonly debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ===========================================================================
  // BUILD UPLOAD (3 endpoints + 1 client-side helper)
  // Replicates: game-builds.ts lines 212-302
  // ===========================================================================

  /**
   * Initiate build upload - get a presigned URL for R2 storage.
   * POST /api/v1/developer/games/:gameId/builds/upload
   *
   * Step 1 of the presigned upload flow.
   *
   * @param gameId - The game's unique identifier.
   * @param data - Version, platform, file name/size, optional release notes.
   */
  async initiateUpload(
    gameId: string,
    data: InitiateUploadRequest
  ): Promise<UploadInitiatedResponse> {
    this.log('initiateUpload', gameId, data.version);
    const res = await this.http.post<UploadInitiatedResponse>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/builds/upload`,
      data
    );
    return res.data;
  }

  /**
   * Upload file to the presigned URL (client-side, uses XMLHttpRequest for progress).
   * This is Step 2 of the presigned upload flow. No backend API call is made;
   * the file goes directly to cloud storage (Cloudflare R2).
   *
   * @param uploadUrl - The presigned URL from initiateUpload.
   * @param file - The file (APK/IPA) to upload.
   * @param onProgress - Optional progress callback (0-100).
   */
  async uploadToPresignedUrl(
    uploadUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    this.log('uploadToPresignedUrl', file.name, file.size);
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const progress = Math.round((event.loaded / event.total) * 100);
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve();
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed: network error'));
      });

      xhr.addEventListener('abort', () => {
        reject(new Error('Upload aborted'));
      });

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', 'application/vnd.android.package-archive');
      xhr.send(file);
    });
  }

  /**
   * Confirm upload completion with file hash and metadata.
   * POST /api/v1/developer/games/:gameId/builds/:buildId/confirm
   *
   * Step 3 of the presigned upload flow. After upload to R2 succeeds,
   * call this to finalize the build record.
   *
   * @param gameId - The game's unique identifier.
   * @param buildId - The build ID from initiateUpload.
   * @param data - File hash (SHA-256), package name, SDK version, etc.
   */
  async confirmUpload(
    gameId: string,
    buildId: string,
    data: ConfirmUploadRequest
  ): Promise<GameBuild> {
    this.log('confirmUpload', gameId, buildId);
    const res = await this.http.post<GameBuild>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/builds/${encodeURIComponent(buildId)}/confirm`,
      data
    );
    return res.data;
  }

  /**
   * Direct file upload via FormData (development/testing only).
   * POST /api/v1/developer/games/:gameId/builds/upload/direct
   *
   * Single-call alternative to the 3-step presigned flow.
   * Uses multipart/form-data. 10-minute timeout for large files.
   *
   * @param gameId - The game's unique identifier.
   * @param file - The file (APK/IPA) to upload.
   * @param metadata - Version, versionCode, platform, release notes, isBeta.
   */
  async directUpload(
    gameId: string,
    file: File,
    metadata: Omit<InitiateUploadRequest, 'fileName' | 'fileSize'>
  ): Promise<DirectUploadResponse> {
    this.log('directUpload', gameId, file.name);

    const formData = new FormData();
    formData.append('file', file);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, String(value));
      }
    });

    const res = await this.http.upload<DirectUploadResponse>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/builds/upload/direct`,
      formData
    );
    return res.data;
  }

  // ===========================================================================
  // BUILD CRUD (5 endpoints)
  // Replicates: game-builds.ts lines 304-348
  // ===========================================================================

  /**
   * List builds for a game (paginated, filterable).
   * GET /api/v1/developer/games/:gameId/builds
   *
   * @param gameId - The game's unique identifier.
   * @param params - Optional status, platform, includeBeta, page, limit filters.
   */
  async getBuilds(
    gameId: string,
    params?: BuildQueryParams
  ): Promise<BuildListResponse> {
    this.log('getBuilds', gameId, params);
    const res = await this.http.get<BuildListResponse>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/builds`,
      params as QueryParams
    );
    return res.data;
  }

  /**
   * Get single build details.
   * GET /api/v1/developer/games/:gameId/builds/:buildId
   *
   * @param gameId - The game's unique identifier.
   * @param buildId - The build's unique identifier.
   */
  async getBuild(gameId: string, buildId: string): Promise<GameBuild> {
    this.log('getBuild', gameId, buildId);
    const res = await this.http.get<GameBuild>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/builds/${encodeURIComponent(buildId)}`
    );
    return res.data;
  }

  /**
   * Update build metadata (release notes, beta/forced flags).
   * PATCH /api/v1/developer/games/:gameId/builds/:buildId
   *
   * @param gameId - The game's unique identifier.
   * @param buildId - The build's unique identifier.
   * @param data - Fields to update.
   */
  async updateBuild(
    gameId: string,
    buildId: string,
    data: UpdateBuildRequest
  ): Promise<GameBuild> {
    this.log('updateBuild', gameId, buildId, data);
    const res = await this.http.patch<GameBuild>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/builds/${encodeURIComponent(buildId)}`,
      data
    );
    return res.data;
  }

  /**
   * Delete a build.
   * DELETE /api/v1/developer/games/:gameId/builds/:buildId
   *
   * @param gameId - The game's unique identifier.
   * @param buildId - The build's unique identifier.
   */
  async deleteBuild(gameId: string, buildId: string): Promise<void> {
    this.log('deleteBuild', gameId, buildId);
    await this.http.delete(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/builds/${encodeURIComponent(buildId)}`
    );
  }

  // ===========================================================================
  // BUILD LIFECYCLE (2 endpoints)
  // Replicates: game-builds.ts lines 350-368
  // ===========================================================================

  /**
   * Set build as latest production version (release).
   * POST /api/v1/developer/games/:gameId/builds/:buildId/release
   *
   * @param gameId - The game's unique identifier.
   * @param buildId - The build's unique identifier.
   */
  async releaseBuild(gameId: string, buildId: string): Promise<GameBuild> {
    this.log('releaseBuild', gameId, buildId);
    const res = await this.http.post<GameBuild>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/builds/${encodeURIComponent(buildId)}/release`
    );
    return res.data;
  }

  /**
   * Deprecate a build (mark as outdated but keep downloadable).
   * POST /api/v1/developer/games/:gameId/builds/:buildId/deprecate
   *
   * @param gameId - The game's unique identifier.
   * @param buildId - The build's unique identifier.
   */
  async deprecateBuild(gameId: string, buildId: string): Promise<GameBuild> {
    this.log('deprecateBuild', gameId, buildId);
    const res = await this.http.post<GameBuild>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/builds/${encodeURIComponent(buildId)}/deprecate`
    );
    return res.data;
  }

  // ===========================================================================
  // API KEYS (per-game) - 4 endpoints
  // Replicates: game-builds.ts lines 374-416
  // ===========================================================================

  /**
   * Create an API key for SDK integration.
   * POST /api/v1/developer/games/:gameId/api-keys
   *
   * IMPORTANT: The response contains apiKey and apiSecret in plaintext.
   * These are shown ONCE and cannot be retrieved again.
   *
   * @param gameId - The game's unique identifier.
   * @param data - Name, environment, optional permissions and rate limit.
   */
  async createApiKey(
    gameId: string,
    data: CreateApiKeyRequest
  ): Promise<ApiKeyCreatedResponse> {
    this.log('createApiKey', gameId, data.name);
    const res = await this.http.post<ApiKeyCreatedResponse>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/api-keys`,
      data
    );
    return res.data;
  }

  /**
   * List API keys for a game (secrets NOT included).
   * GET /api/v1/developer/games/:gameId/api-keys
   *
   * @param gameId - The game's unique identifier.
   */
  async getApiKeys(gameId: string): Promise<ApiKeyListResponse> {
    this.log('getApiKeys', gameId);
    const res = await this.http.get<ApiKeyListResponse>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/api-keys`
    );
    return res.data;
  }

  /**
   * Revoke (delete) an API key.
   * DELETE /api/v1/developer/games/:gameId/api-keys/:keyId
   *
   * @param gameId - The game's unique identifier.
   * @param keyId - The API key's unique identifier.
   */
  async revokeApiKey(gameId: string, keyId: string): Promise<void> {
    this.log('revokeApiKey', gameId, keyId);
    await this.http.delete(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/api-keys/${encodeURIComponent(keyId)}`
    );
  }

  /**
   * Rotate an API key's secret (generates new secret, old one invalidated).
   * POST /api/v1/developer/games/:gameId/api-keys/:keyId/rotate
   *
   * @param gameId - The game's unique identifier.
   * @param keyId - The API key's unique identifier.
   * @returns Object containing the new secret (shown once!).
   */
  async rotateApiSecret(
    gameId: string,
    keyId: string
  ): Promise<{ newSecret: string }> {
    this.log('rotateApiSecret', gameId, keyId);
    const res = await this.http.post<{ newSecret: string }>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/api-keys/${encodeURIComponent(keyId)}/rotate`
    );
    return res.data;
  }

  // ===========================================================================
  // DEBUG
  // ===========================================================================

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[BuildService]', ...args);
    }
  }
}

// =============================================================================
// PUBLIC BUILD SERVICE (Unauthenticated Endpoints)
// =============================================================================

/**
 * Service for public game download and version check endpoints.
 *
 * These endpoints do NOT require authentication and are used by
 * players to download games and by SDKs to check for updates.
 *
 * 3 endpoints. Replicates: game-builds.ts publicBuildsApi (lines 423-477).
 */
export class PublicBuildService {
  private readonly http: HttpClient;
  private readonly apiBaseUrl: string;
  private readonly debug: boolean;

  constructor(http: HttpClient, apiBaseUrl: string, debug = false) {
    this.http = http;
    this.apiBaseUrl = apiBaseUrl;
    this.debug = debug;
  }

  /**
   * Get download info for a game (available builds per platform).
   * GET /api/v1/games/:gameId/download
   *
   * @param gameId - The game's unique identifier.
   * @param platform - Optional platform filter ('ANDROID' | 'IOS').
   */
  async getDownloadInfo(
    gameId: string,
    platform?: DevBuildPlatform
  ): Promise<DownloadInfo> {
    this.log('getDownloadInfo', gameId, platform);
    const params: QueryParams = {};
    if (platform) params.platform = platform;
    const res = await this.http.get<DownloadInfo>(
      `/api/v1/games/${encodeURIComponent(gameId)}/download`,
      Object.keys(params).length > 0 ? params : undefined
    );
    return res.data;
  }

  /**
   * Get download URL for a specific platform (tracks download count).
   * GET /api/v1/games/:gameId/download/:platform
   *
   * @param gameId - The game's unique identifier.
   * @param platform - Target platform ('ANDROID' | 'IOS').
   * @param source - Optional tracking source identifier.
   */
  async getDownloadUrl(
    gameId: string,
    platform: DevBuildPlatform,
    source?: string
  ): Promise<{ downloadUrl: string }> {
    this.log('getDownloadUrl', gameId, platform);
    const params: QueryParams = {};
    if (source) params.source = source;
    const res = await this.http.get<{ downloadUrl: string }>(
      `/api/v1/games/${encodeURIComponent(gameId)}/download/${encodeURIComponent(platform)}`,
      Object.keys(params).length > 0 ? params : undefined
    );
    return res.data;
  }

  /**
   * Build a direct download URL string (no API call, no tracking).
   * Useful for generating <a href="..."> links.
   *
   * @param gameId - The game's unique identifier.
   * @param platform - Target platform ('ANDROID' | 'IOS').
   * @param source - Optional tracking source identifier.
   * @returns Fully qualified URL string.
   */
  getDirectDownloadUrl(
    gameId: string,
    platform: DevBuildPlatform,
    source?: string
  ): string {
    const params = source ? `?source=${encodeURIComponent(source)}` : '';
    return `${this.apiBaseUrl}/api/v1/games/${encodeURIComponent(gameId)}/download/${encodeURIComponent(platform)}${params}`;
  }

  /**
   * Check for updates (auto-updater endpoint).
   * GET /api/v1/games/:gameId/version
   *
   * @param gameId - The game's unique identifier.
   * @param params - Optional current version, versionCode, platform.
   */
  async getVersionInfo(
    gameId: string,
    params?: VersionCheckParams
  ): Promise<VersionCheckResponse> {
    this.log('getVersionInfo', gameId, params);
    const res = await this.http.get<VersionCheckResponse>(
      `/api/v1/games/${encodeURIComponent(gameId)}/version`,
      params as QueryParams
    );
    return res.data;
  }

  // ===========================================================================
  // DEBUG
  // ===========================================================================

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[PublicBuildService]', ...args);
    }
  }
}

// =============================================================================
// HELPER FUNCTIONS
// Replicates: game-builds.ts lines 519-573
// =============================================================================

/**
 * Format file size for display.
 * Replicates: game-builds.ts lines 524-531 (formatFileSize).
 *
 * @param bytes - File size as number or numeric string.
 * @returns Human-readable size string (e.g. "45.2 MB").
 */
export function formatFileSize(bytes: string | number): string {
  const size = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(size) || size < 0) return '0 B';
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Get status badge CSS classes for a build status.
 * Replicates: game-builds.ts lines 536-547 (getStatusColor).
 *
 * @param status - The build status.
 * @returns Tailwind CSS class string for bg + text color.
 */
export function getStatusColor(status: BuildStatus): string {
  const colors: Record<string, string> = {
    UPLOADING: 'bg-blue-500/20 text-blue-400',
    PROCESSING: 'bg-yellow-500/20 text-yellow-400',
    PENDING_REVIEW: 'bg-orange-500/20 text-orange-400',
    APPROVED: 'bg-green-500/20 text-green-400',
    REJECTED: 'bg-red-500/20 text-red-400',
    DEPRECATED: 'bg-gray-500/20 text-gray-400',
    REMOVED: 'bg-red-500/20 text-red-400',
  };
  return colors[status] || 'bg-gray-500/20 text-gray-400';
}

/**
 * Get human-readable label for a build status.
 * Replicates: game-builds.ts lines 552-563 (getStatusLabel).
 *
 * @param status - The build status.
 * @returns Display-friendly label string.
 */
export function getStatusLabel(status: BuildStatus): string {
  const labels: Record<string, string> = {
    UPLOADING: 'Uploading',
    PROCESSING: 'Processing',
    PENDING_REVIEW: 'Pending Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    DEPRECATED: 'Deprecated',
    REMOVED: 'Removed',
  };
  return labels[status] || String(status);
}

/**
 * Get both label and color for a build status (convenience).
 *
 * @param status - The build status.
 * @returns Object with label and Tailwind CSS color class.
 */
export function getBuildStatusInfo(status: BuildStatus): BuildStatusInfo {
  return {
    label: getStatusLabel(status),
    color: getStatusColor(status),
  };
}

/**
 * Calculate SHA-256 hash of a file using the Web Crypto API.
 * Used for build upload confirmation (fileHash field).
 * Replicates: game-builds.ts lines 568-573 (calculateFileHash).
 *
 * @param file - The file to hash.
 * @returns Hex-encoded SHA-256 hash string.
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}