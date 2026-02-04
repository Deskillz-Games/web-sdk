// =============================================================================
// Deskillz Web SDK - Auth Module Barrel Export
// Path: src/auth/index.ts
// Re-exports all authentication modules
// =============================================================================

// Services
export { AuthService } from './auth-service';
export { WalletAuthService } from './wallet-auth';
export { TwoFactorService } from './two-factor';
export { TwoFactorTokenManager } from './token-manager';

// Types
export {
  AuthMethod,
  SocialProvider,
  SIWE_DEFAULTS,
} from './auth-types';

export type {
  TokenPair,
  AuthResponse,
  AuthResult,
  EmailRegisterPayload,
  EmailLoginPayload,
  ChangePasswordPayload,
  ResetPasswordPayload,
  SocialAuthPayload,
  NonceResponse,
  SIWEMessageParams,
  WalletVerifyPayload,
  WalletLinkPayload,
  WalletSignFunction,
  TwoFactorStatus,
  TwoFactorSetupResponse,
  TwoFactorEnableResponse,
  TwoFactorVerifyResponse,
  TwoFactorDisableResponse,
  RecoveryCodesResponse,
  RegenerateRecoveryCodesResponse,
  TwoFactorTokenState,
  AuthState,
  AuthEventMap,
} from './auth-types';