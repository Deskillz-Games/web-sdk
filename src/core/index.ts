// =============================================================================
// Deskillz Web SDK - Core Module Barrel Export
// Path: src/core/index.ts
// Re-exports all core foundation modules
// =============================================================================

// Configuration
export { resolveConfig } from './config';
export type { DeskillzConfig, ResolvedConfig } from './config';

// Storage
export {
  TokenManager,
  LocalStorageAdapter,
  MemoryStorageAdapter,
  createDefaultStorage,
} from './storage';
export type { StorageAdapter } from './storage';

// HTTP Client
export { HttpClient } from './http-client';

// Event Emitter
export { TypedEventEmitter } from './event-emitter';

// Errors
export {
  DeskillzError,
  AuthError,
  NetworkError,
  ValidationError,
  RateLimitError,
  InsufficientFundsError,
  SocketError,
  SDKError,
  ErrorCode,
  createErrorFromResponse,
  createNetworkError,
  isDeskillzError,
  isErrorCode,
} from './errors';

// Types
export {
  GamePlatform,
  BuildPlatform,
  UserRole,
  Currency,
  SDKEventName,
} from './types';
export type {
  ApiResponse,
  PaginatedResponse,
  PaginationInfo,
  PaginationParams,
  SortOrder,
  DateRange,
  BackendUser,
  HttpMethod,
  QueryParams,
  SDKEventMap,
  RequireKeys,
  ExtractData,
  ExtractPaginatedItem,
} from './types';