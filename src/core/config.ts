// =============================================================================
// Deskillz Web SDK - Configuration
// Path: src/core/config.ts
// Central configuration for SDK initialization and runtime settings
// Replicates config patterns from: api-client.ts (lines 4, 8-13)
// and socket.ts connection config
// =============================================================================

import type { StorageAdapter } from './storage';

// -----------------------------------------------------------------------------
// Configuration Interface
// -----------------------------------------------------------------------------

/**
 * Full SDK configuration.
 * Only `gameId` and `gameKey` are required; all others have sensible defaults.
 */
export interface DeskillzConfig {
  /**
   * Unique game identifier from the Deskillz developer portal.
   * Obtained via POST /api/v1/developer/games/draft (Credentials-First Flow).
   */
  gameId: string;

  /**
   * Game API key from the developer portal.
   * Used for request authentication and score signing.
   */
  gameKey: string;

  /**
   * Base URL for all HTTP API requests.
   * Default: 'https://api.deskillz.games'
   * Replicates: api-client.ts line 4 (VITE_API_URL fallback).
   */
  apiBaseUrl?: string;

  /**
   * WebSocket URL for real-time connections.
   * Default: 'wss://ws.deskillz.games/lobby'
   * Replicates: socket.ts VITE_SOCKET_URL.
   */
  socketUrl?: string;

  /**
   * Pluggable storage adapter for tokens and session data.
   * Default: auto-detect (localStorage if available, otherwise in-memory).
   */
  storage?: StorageAdapter;

  /**
   * HTTP request timeout in milliseconds.
   * Default: 120000 (120 seconds).
   * Replicates: api-client.ts line 9 (timeout: 120000).
   */
  timeout?: number;

  /**
   * Enable debug logging to console.
   * Default: false.
   */
  debug?: boolean;

  /**
   * Automatically reconnect WebSocket on disconnect.
   * Default: true.
   */
  autoReconnect?: boolean;

  /**
   * Maximum number of WebSocket reconnection attempts.
   * Default: 10.
   * Replicates: socket.ts MAX_RECONNECT_ATTEMPTS.
   */
  maxReconnectAttempts?: number;

  /**
   * Initial reconnection delay in milliseconds.
   * Default: 1000 (1 second).
   * Replicates: socket.ts reconnection config.
   */
  reconnectBaseDelay?: number;

  /**
   * Maximum reconnection delay in milliseconds.
   * Default: 30000 (30 seconds).
   */
  reconnectMaxDelay?: number;

  /**
   * Reconnection delay multiplier (exponential backoff).
   * Default: 2.
   */
  reconnectMultiplier?: number;

  /**
   * Reconnection jitter percentage (0-1).
   * Default: 0.1 (10%).
   */
  reconnectJitter?: number;

  /**
   * Custom headers to include with every HTTP request.
   * Useful for API versioning or custom tracking headers.
   */
  customHeaders?: Record<string, string>;
}

// -----------------------------------------------------------------------------
// Resolved Configuration (all defaults applied)
// -----------------------------------------------------------------------------

/**
 * Fully resolved configuration with no optional fields.
 * Created by merging user config with defaults.
 */
export interface ResolvedConfig {
  gameId: string;
  gameKey: string;
  apiBaseUrl: string;
  socketUrl: string;
  storage: StorageAdapter | null;
  timeout: number;
  debug: boolean;
  autoReconnect: boolean;
  maxReconnectAttempts: number;
  reconnectBaseDelay: number;
  reconnectMaxDelay: number;
  reconnectMultiplier: number;
  reconnectJitter: number;
  customHeaders: Record<string, string>;
}

// -----------------------------------------------------------------------------
// Default Values
// -----------------------------------------------------------------------------

const DEFAULT_API_BASE_URL = 'https://api.deskillz.games';
const DEFAULT_SOCKET_URL = 'wss://ws.deskillz.games/lobby';
const DEFAULT_TIMEOUT = 120_000;
const DEFAULT_MAX_RECONNECT_ATTEMPTS = 10;
const DEFAULT_RECONNECT_BASE_DELAY = 1_000;
const DEFAULT_RECONNECT_MAX_DELAY = 30_000;
const DEFAULT_RECONNECT_MULTIPLIER = 2;
const DEFAULT_RECONNECT_JITTER = 0.1;

// -----------------------------------------------------------------------------
// Configuration Resolution
// -----------------------------------------------------------------------------

/**
 * Merge user-provided config with defaults.
 * Storage is set to null here and resolved lazily in the SDK init phase
 * (after environment detection).
 *
 * @param config - User-provided partial configuration.
 * @returns Fully resolved configuration.
 * @throws Error if required fields (gameId, gameKey) are missing.
 */
export function resolveConfig(config: DeskillzConfig): ResolvedConfig {
  validateConfig(config);

  return {
    gameId: config.gameId,
    gameKey: config.gameKey,
    apiBaseUrl: normalizeUrl(config.apiBaseUrl ?? DEFAULT_API_BASE_URL),
    socketUrl: config.socketUrl ?? DEFAULT_SOCKET_URL,
    storage: config.storage ?? null,
    timeout: config.timeout ?? DEFAULT_TIMEOUT,
    debug: config.debug ?? false,
    autoReconnect: config.autoReconnect ?? true,
    maxReconnectAttempts: config.maxReconnectAttempts ?? DEFAULT_MAX_RECONNECT_ATTEMPTS,
    reconnectBaseDelay: config.reconnectBaseDelay ?? DEFAULT_RECONNECT_BASE_DELAY,
    reconnectMaxDelay: config.reconnectMaxDelay ?? DEFAULT_RECONNECT_MAX_DELAY,
    reconnectMultiplier: config.reconnectMultiplier ?? DEFAULT_RECONNECT_MULTIPLIER,
    reconnectJitter: config.reconnectJitter ?? DEFAULT_RECONNECT_JITTER,
    customHeaders: config.customHeaders ?? {},
  };
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

/**
 * Validate required configuration fields.
 * Throws descriptive errors for missing or invalid values.
 */
function validateConfig(config: DeskillzConfig): void {
  if (!config.gameId || typeof config.gameId !== 'string' || config.gameId.trim().length === 0) {
    throw new Error(
      '[DeskillzSDK] "gameId" is required. Get it from the developer portal or POST /api/v1/developer/games/draft.'
    );
  }

  if (!config.gameKey || typeof config.gameKey !== 'string' || config.gameKey.trim().length === 0) {
    throw new Error(
      '[DeskillzSDK] "gameKey" is required. Get it from the developer portal or POST /api/v1/developer/games/draft.'
    );
  }

  if (config.timeout !== undefined && (typeof config.timeout !== 'number' || config.timeout <= 0)) {
    throw new Error('[DeskillzSDK] "timeout" must be a positive number (milliseconds).');
  }

  if (
    config.maxReconnectAttempts !== undefined &&
    (typeof config.maxReconnectAttempts !== 'number' || config.maxReconnectAttempts < 0)
  ) {
    throw new Error('[DeskillzSDK] "maxReconnectAttempts" must be a non-negative number.');
  }

  if (
    config.reconnectJitter !== undefined &&
    (typeof config.reconnectJitter !== 'number' || config.reconnectJitter < 0 || config.reconnectJitter > 1)
  ) {
    throw new Error('[DeskillzSDK] "reconnectJitter" must be between 0 and 1.');
  }
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Remove trailing slash from URL to prevent double-slash in path construction.
 */
function normalizeUrl(url: string): string {
  return url.replace(/\/+$/, '');
}