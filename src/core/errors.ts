// =============================================================================
// Deskillz Web SDK - Error Classes
// Path: src/core/errors.ts
// Typed error hierarchy for consistent error handling across all SDK modules
// Replicates error extraction pattern from: api-client.ts (lines 88-98)
// =============================================================================

/**
 * Error codes used across the SDK.
 * Consumers can switch on these codes for programmatic error handling.
 */
export const ErrorCode = {
  // Network & transport
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT: 'TIMEOUT',
  REQUEST_FAILED: 'REQUEST_FAILED',

  // Auth
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_FAILED: 'AUTH_FAILED',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',
  TWO_FACTOR_INVALID: 'TWO_FACTOR_INVALID',
  WALLET_SIGNATURE_FAILED: 'WALLET_SIGNATURE_FAILED',

  // Validation
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  MISSING_PARAMETER: 'MISSING_PARAMETER',

  // Rate limiting
  RATE_LIMITED: 'RATE_LIMITED',

  // Business logic
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
  ROOM_FULL: 'ROOM_FULL',
  TOURNAMENT_FULL: 'TOURNAMENT_FULL',
  ALREADY_JOINED: 'ALREADY_JOINED',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  CONFLICT: 'CONFLICT',

  // Socket
  SOCKET_CONNECTION_FAILED: 'SOCKET_CONNECTION_FAILED',
  SOCKET_DISCONNECTED: 'SOCKET_DISCONNECTED',
  SOCKET_TIMEOUT: 'SOCKET_TIMEOUT',

  // SDK
  SDK_NOT_INITIALIZED: 'SDK_NOT_INITIALIZED',
  SDK_ALREADY_INITIALIZED: 'SDK_ALREADY_INITIALIZED',

  // Unknown
  UNKNOWN: 'UNKNOWN',
} as const;

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

// -----------------------------------------------------------------------------
// Base SDK Error
// -----------------------------------------------------------------------------

/**
 * Base error class for all SDK errors.
 * Extends native Error with a typed code and optional HTTP status.
 */
export class DeskillzError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'DeskillzError';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    // Maintain proper prototype chain for instanceof checks
    Object.setPrototypeOf(this, new.target.prototype);
  }

  /**
   * Serialize to a plain object for logging or transmission.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      details: this.details,
    };
  }
}

// -----------------------------------------------------------------------------
// Specific Error Classes
// -----------------------------------------------------------------------------

/**
 * Authentication errors (login, registration, token refresh, 2FA).
 */
export class AuthError extends DeskillzError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.AUTH_FAILED,
    statusCode?: number,
    details?: Record<string, unknown>
  ) {
    super(message, code, statusCode, details);
    this.name = 'AuthError';
  }
}

/**
 * Network errors (connection failures, timeouts, DNS).
 */
export class NetworkError extends DeskillzError {
  constructor(
    message: string = 'Network error. Please check your connection.',
    code: ErrorCode = ErrorCode.NETWORK_ERROR,
    details?: Record<string, unknown>
  ) {
    super(message, code, undefined, details);
    this.name = 'NetworkError';
  }
}

/**
 * Validation errors (invalid parameters, missing fields).
 */
export class ValidationError extends DeskillzError {
  public readonly field?: string;

  constructor(
    message: string,
    field?: string,
    details?: Record<string, unknown>
  ) {
    super(message, ErrorCode.VALIDATION_ERROR, 400, details);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Rate limit errors (429 Too Many Requests).
 */
export class RateLimitError extends DeskillzError {
  public readonly retryAfter?: number;

  constructor(
    message: string = 'Rate limited. Please try again later.',
    retryAfter?: number
  ) {
    super(message, ErrorCode.RATE_LIMITED, 429, { retryAfter });
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
  }
}

/**
 * Insufficient funds for entry fees, withdrawals, or buy-ins.
 */
export class InsufficientFundsError extends DeskillzError {
  public readonly required?: number;
  public readonly available?: number;
  public readonly currency?: string;

  constructor(
    message: string = 'Insufficient funds.',
    details?: { required?: number; available?: number; currency?: string }
  ) {
    super(message, ErrorCode.INSUFFICIENT_FUNDS, 402, details as Record<string, unknown>);
    this.name = 'InsufficientFundsError';
    this.required = details?.required;
    this.available = details?.available;
    this.currency = details?.currency;
  }
}

/**
 * Socket connection or communication errors.
 */
export class SocketError extends DeskillzError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SOCKET_CONNECTION_FAILED,
    details?: Record<string, unknown>
  ) {
    super(message, code, undefined, details);
    this.name = 'SocketError';
  }
}

/**
 * SDK initialization or lifecycle errors.
 */
export class SDKError extends DeskillzError {
  constructor(
    message: string,
    code: ErrorCode = ErrorCode.SDK_NOT_INITIALIZED
  ) {
    super(message, code);
    this.name = 'SDKError';
  }
}

// -----------------------------------------------------------------------------
// Error Factory - Maps HTTP status codes and backend errors to typed errors
// Replicates getErrorMessage from api-client.ts lines 88-98
// -----------------------------------------------------------------------------

/**
 * Backend error response shape.
 */
interface BackendErrorBody {
  message?: string;
  error?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Create the appropriate typed error from an HTTP response.
 * Maps status codes to specific error classes.
 */
export function createErrorFromResponse(
  status: number,
  body?: BackendErrorBody | null,
  fallbackMessage?: string
): DeskillzError {
  const message =
    body?.message ||
    body?.error ||
    fallbackMessage ||
    'An error occurred';

  const details = body?.details;

  switch (status) {
    case 400:
      return new ValidationError(message, undefined, details);

    case 401:
      return new AuthError(
        message,
        ErrorCode.AUTH_REQUIRED,
        401,
        details
      );

    case 402:
      return new InsufficientFundsError(message, details as {
        required?: number;
        available?: number;
        currency?: string;
      });

    case 403:
      return new DeskillzError(message, ErrorCode.FORBIDDEN, 403, details);

    case 404:
      return new DeskillzError(message, ErrorCode.NOT_FOUND, 404, details);

    case 409:
      return new DeskillzError(message, ErrorCode.CONFLICT, 409, details);

    case 429: {
      const retryAfter = details?.retryAfter as number | undefined;
      return new RateLimitError(message, retryAfter);
    }

    default:
      return new DeskillzError(message, ErrorCode.REQUEST_FAILED, status, details);
  }
}

/**
 * Create a network error from a fetch failure (no response received).
 * Replicates the fallback from api-client.ts line 97.
 */
export function createNetworkError(error: unknown): NetworkError {
  if (error instanceof TypeError) {
    // fetch throws TypeError for network failures
    return new NetworkError('Network error. Please check your connection.');
  }
  if (error instanceof DOMException && error.name === 'AbortError') {
    return new NetworkError('Request timed out.', ErrorCode.TIMEOUT);
  }
  const message =
    error instanceof Error ? error.message : 'Network error. Please check your connection.';
  return new NetworkError(message);
}

/**
 * Type guard: check if an unknown error is a DeskillzError.
 */
export function isDeskillzError(error: unknown): error is DeskillzError {
  return error instanceof DeskillzError;
}

/**
 * Type guard: check if a DeskillzError has a specific code.
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return isDeskillzError(error) && error.code === code;
}