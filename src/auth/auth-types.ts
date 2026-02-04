// =============================================================================
// Deskillz Web SDK - Authentication Types
// Path: src/auth/auth-types.ts
// All auth interfaces, enums, and event types
// Replicates from: auth.ts (lines 6-131), useBackendAuth.ts (lines 19-57)
// =============================================================================

import type { BackendUser } from '../core/types';

// -----------------------------------------------------------------------------
// Auth Methods & Providers
// -----------------------------------------------------------------------------

/**
 * Available authentication methods.
 */
export const AuthMethod = {
  EMAIL: 'EMAIL',
  WALLET: 'WALLET',
  SOCIAL: 'SOCIAL',
} as const;

export type AuthMethod = (typeof AuthMethod)[keyof typeof AuthMethod];

/**
 * Social OAuth providers.
 * Replicates: auth.ts SocialAuthRequest.provider (line 71)
 */
export const SocialProvider = {
  GOOGLE: 'google',
  APPLE: 'apple',
  FACEBOOK: 'facebook',
} as const;

export type SocialProvider = (typeof SocialProvider)[keyof typeof SocialProvider];

// -----------------------------------------------------------------------------
// Auth Response Types
// Replicates: auth.ts lines 24-34, 29-34
// -----------------------------------------------------------------------------

/**
 * Token pair returned by all auth endpoints.
 * Replicates: auth.ts AuthTokens (lines 24-27)
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Standard auth response returned by login/register/social endpoints.
 * Replicates: auth.ts AuthResponse (lines 29-34)
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: BackendUser;
  isNewUser: boolean;
}

/**
 * Unified result shape returned by all SDK auth methods.
 */
export interface AuthResult {
  user: BackendUser;
  tokens: TokenPair;
  isNewUser: boolean;
}

// -----------------------------------------------------------------------------
// Email/Password Auth
// Replicates: auth.ts lines 59-68
// -----------------------------------------------------------------------------

/**
 * Email registration payload.
 * Replicates: auth.ts EmailRegisterRequest (lines 59-63)
 */
export interface EmailRegisterPayload {
  email: string;
  password: string;
  username: string;
}

/**
 * Email login payload.
 * Replicates: auth.ts EmailLoginRequest (lines 65-68)
 */
export interface EmailLoginPayload {
  email: string;
  password: string;
}

/**
 * Password change payload (authenticated).
 */
export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

/**
 * Password reset payload (via email link token).
 * Replicates: auth.ts ResetPasswordRequest (lines 79-82)
 */
export interface ResetPasswordPayload {
  token: string;
  password: string;
}

// -----------------------------------------------------------------------------
// Social Auth
// Replicates: auth.ts SocialAuthRequest (lines 70-73)
// -----------------------------------------------------------------------------

/**
 * Social login/register payload.
 */
export interface SocialAuthPayload {
  provider: SocialProvider;
  idToken: string;
  email?: string;
  displayName?: string;
}

// -----------------------------------------------------------------------------
// Wallet Auth (SIWE)
// Replicates: auth.ts LoginRequest (lines 36-40), WalletLinkRequest (lines 84-89)
// and useBackendAuth.ts SIWE constants (lines 50-52)
// -----------------------------------------------------------------------------

/**
 * SIWE nonce response from backend.
 * Replicates: auth.ts NonceResponse (lines 50-53)
 */
export interface NonceResponse {
  nonce: string;
  message?: string;
}

/**
 * SIWE message fields used to construct the sign-in message.
 * Replicates: useBackendAuth.ts SiweMessage construction (lines 204-213)
 */
export interface SIWEMessageParams {
  domain: string;
  address: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number;
  nonce: string;
  issuedAt: string;
}

/**
 * Wallet verification payload sent to backend.
 * Replicates: useBackendAuth.ts line 227 (message + signature)
 */
export interface WalletVerifyPayload {
  message: string;
  signature: string;
}

/**
 * Wallet linking payload (for authenticated users adding a wallet).
 * Replicates: auth.ts WalletLinkRequest (lines 84-89)
 */
export interface WalletLinkPayload {
  walletAddress: string;
  signature: string;
  message: string;
  nonce: string;
}

/**
 * SIWE configuration constants.
 * Replicates: useBackendAuth.ts lines 50-52
 */
export const SIWE_DEFAULTS = {
  STATEMENT: 'Sign in to Deskillz.Games to access tournaments and compete for prizes.',
  VERSION: '1',
} as const;

/**
 * Wallet sign function type.
 * The game developer provides this - it receives a message string and returns the signature.
 * This abstracts away the wallet library (ethers, viem, wagmi, etc.).
 */
export type WalletSignFunction = (message: string) => Promise<string>;

// -----------------------------------------------------------------------------
// Two-Factor Authentication
// Replicates: auth.ts lines 95-131
// -----------------------------------------------------------------------------

/**
 * 2FA status response.
 * Replicates: auth.ts TwoFactorStatus (lines 95-98)
 */
export interface TwoFactorStatus {
  enabled: boolean;
  recoveryCodesRemaining: number;
}

/**
 * 2FA setup response with QR code data.
 * Replicates: auth.ts TwoFactorSetupResponse (lines 100-105)
 */
export interface TwoFactorSetupResponse {
  secret: string;
  qrCodeDataUrl: string;
  manualEntryKey: string;
  otpauthUrl: string;
}

/**
 * 2FA enable response with recovery codes.
 * Replicates: auth.ts TwoFactorEnableResponse (lines 107-110)
 */
export interface TwoFactorEnableResponse {
  message: string;
  recoveryCodes: string[];
}

/**
 * 2FA verification response with temporary token.
 * Replicates: auth.ts TwoFactorVerifyResponse (lines 112-116)
 */
export interface TwoFactorVerifyResponse {
  verified: boolean;
  twoFactorToken: string;
  expiresIn: number;
}

/**
 * 2FA disable response.
 * Replicates: auth.ts TwoFactorDisableResponse (lines 118-120)
 */
export interface TwoFactorDisableResponse {
  message: string;
}

/**
 * Recovery codes response.
 * Replicates: auth.ts RecoveryCodesResponse (lines 122-126)
 */
export interface RecoveryCodesResponse {
  recoveryCodes: string[];
  unusedCount: number;
  totalCount: number;
}

/**
 * Regenerated recovery codes response.
 * Replicates: auth.ts RegenerateRecoveryCodesResponse (lines 128-131)
 */
export interface RegenerateRecoveryCodesResponse {
  recoveryCodes: string[];
  message: string;
}

/**
 * Internal 2FA token state for expiry tracking.
 * Replicates: auth.ts twoFactorTokenManager storage (lines 137-138)
 */
export interface TwoFactorTokenState {
  token: string;
  expiryTime: number;
}

// -----------------------------------------------------------------------------
// Auth State (SDK-managed state)
// Replicates: useBackendAuth.ts AuthState (lines 19-26)
// -----------------------------------------------------------------------------

/**
 * Current authentication state managed by the SDK.
 */
export interface AuthState {
  isAuthenticated: boolean;
  isAuthenticating: boolean;
  error: string | null;
  user: BackendUser | null;
  isNewUser: boolean;
}

// -----------------------------------------------------------------------------
// Auth Events (for TypedEventEmitter)
// Replicates: useBackendAuth.ts custom events (lines 54-57, 86-104, 270-272)
// -----------------------------------------------------------------------------

/**
 * Auth-specific event map for the SDK event emitter.
 */
export interface AuthEventMap {
  /** Fired when auth state changes (login, logout, token refresh). */
  'auth:state-changed': {
    isAuthenticated: boolean;
    user: BackendUser | null;
    timestamp: number;
  };
  /** Fired when a new user registers for the first time. */
  'auth:new-user': {
    isNewUser: boolean;
    timestamp: number;
    delayed?: boolean;
    final?: boolean;
  };
  /** Fired when the user is logged out (token clear, refresh fail). */
  'auth:logout': void;
  /** Fired when auth encounters an error. */
  'auth:error': {
    message: string;
    code?: string;
  };
}