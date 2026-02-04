// =============================================================================
// Deskillz Web SDK - Core Types
// Path: src/core/types.ts
// Base types, enums, and interfaces shared across all SDK modules
// Replicates patterns from: api-client.ts (lines 100-116)
// =============================================================================

// -----------------------------------------------------------------------------
// API Response Types (exact match to api-client.ts)
// -----------------------------------------------------------------------------

/**
 * Standard API response wrapper.
 * Every backend endpoint returns this shape.
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

/**
 * Paginated API response.
 * Used by list endpoints that support pagination.
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

/**
 * Pagination metadata returned by paginated endpoints.
 */
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Pagination query parameters for list endpoints.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Sort order for list endpoints.
 */
export type SortOrder = 'asc' | 'desc';

/**
 * Date range filter for history/analytics endpoints.
 */
export interface DateRange {
  startDate?: string;
  endDate?: string;
}

// -----------------------------------------------------------------------------
// Platform Enums
// -----------------------------------------------------------------------------

/**
 * Game platform targeting.
 * WEB and ALL are additions for the Web SDK.
 */
export const GamePlatform = {
  ANDROID: 'ANDROID',
  IOS: 'IOS',
  BOTH: 'BOTH',
  WEB: 'WEB',
  ALL: 'ALL',
} as const;

export type GamePlatform = (typeof GamePlatform)[keyof typeof GamePlatform];

/**
 * Build platform for uploaded game builds.
 */
export const BuildPlatform = {
  ANDROID: 'ANDROID',
  IOS: 'IOS',
  WEB: 'WEB',
} as const;

export type BuildPlatform = (typeof BuildPlatform)[keyof typeof BuildPlatform];

// -----------------------------------------------------------------------------
// User Roles
// -----------------------------------------------------------------------------

export const UserRole = {
  PLAYER: 'PLAYER',
  DEVELOPER: 'DEVELOPER',
  ADMIN: 'ADMIN',
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

// -----------------------------------------------------------------------------
// Currency
// -----------------------------------------------------------------------------

/**
 * Supported cryptocurrencies for entry fees, prizes, and wallet operations.
 */
export const Currency = {
  BNB: 'BNB',
  USDT: 'USDT',
  USDC: 'USDC',
  TRX: 'TRX',
  ETH: 'ETH',
  MATIC: 'MATIC',
} as const;

export type Currency = (typeof Currency)[keyof typeof Currency];

// -----------------------------------------------------------------------------
// Backend User (core user shape returned by auth endpoints)
// Replicated from useBackendAuth.ts lines 28-36
// -----------------------------------------------------------------------------

export interface BackendUser {
  id: string;
  username: string;
  displayName?: string | null;
  email?: string | null;
  walletAddress?: string | null;
  role: UserRole;
  avatarUrl?: string | null;
}

// -----------------------------------------------------------------------------
// HTTP Method Types
// -----------------------------------------------------------------------------

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Query parameters for GET requests.
 * Supports string, number, boolean, and arrays.
 */
export type QueryParams = Record<
  string,
  string | number | boolean | string[] | number[] | undefined | null
>;

// -----------------------------------------------------------------------------
// SDK Event Names (custom events replicated from useBackendAuth.ts)
// -----------------------------------------------------------------------------

/**
 * Well-known SDK event names.
 * These match the CustomEvent names dispatched by the React frontend.
 */
export const SDKEventName = {
  AUTH_LOGOUT: 'auth:logout',
  AUTH_STATE_CHANGED: 'deskillz-auth-state-changed',
  NEW_USER: 'deskillz-new-user',
  SOCKET_CONNECTED: 'socket:connected',
  SOCKET_DISCONNECTED: 'socket:disconnected',
  SOCKET_RECONNECTING: 'socket:reconnecting',
  SOCKET_RECONNECTED: 'socket:reconnected',
  SOCKET_ERROR: 'socket:error',
} as const;

export type SDKEventName = (typeof SDKEventName)[keyof typeof SDKEventName];

// -----------------------------------------------------------------------------
// SDK-Wide Event Map (used by TypedEventEmitter)
// -----------------------------------------------------------------------------

export interface SDKEventMap {
  // Auth events
  [SDKEventName.AUTH_LOGOUT]: void;
  [SDKEventName.AUTH_STATE_CHANGED]: {
    isAuthenticated: boolean;
    user: BackendUser | null;
    timestamp: number;
  };
  [SDKEventName.NEW_USER]: {
    isNewUser: boolean;
    timestamp: number;
    delayed?: boolean;
    final?: boolean;
  };

  // Socket lifecycle events
  [SDKEventName.SOCKET_CONNECTED]: void;
  [SDKEventName.SOCKET_DISCONNECTED]: { reason: string };
  [SDKEventName.SOCKET_RECONNECTING]: { attempt: number; delay: number };
  [SDKEventName.SOCKET_RECONNECTED]: { attempt: number };
  [SDKEventName.SOCKET_ERROR]: { error: string };
}

// -----------------------------------------------------------------------------
// Generic Utility Types
// -----------------------------------------------------------------------------

/**
 * Makes selected keys of T required.
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Extracts the data type from an ApiResponse.
 */
export type ExtractData<T> = T extends ApiResponse<infer U> ? U : never;

/**
 * Extracts the item type from a PaginatedResponse.
 */
export type ExtractPaginatedItem<T> = T extends PaginatedResponse<infer U> ? U : never;