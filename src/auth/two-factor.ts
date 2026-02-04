// =============================================================================
// Deskillz Web SDK - Two-Factor Authentication Service
// Path: src/auth/two-factor.ts
// 2FA setup, verification, disable, and recovery code management
// Replicates: auth.ts 2FA methods (lines 338-422)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { TwoFactorTokenManager } from './token-manager';
import type {
  TwoFactorStatus,
  TwoFactorSetupResponse,
  TwoFactorEnableResponse,
  TwoFactorVerifyResponse,
  TwoFactorDisableResponse,
  RecoveryCodesResponse,
  RegenerateRecoveryCodesResponse,
} from './auth-types';

/**
 * Manages two-factor authentication (TOTP-based).
 *
 * Flow:
 * 1. Check status: `getStatus()`
 * 2. Setup: `setup()` -> returns QR code and secret
 * 3. Enable: `enable(code)` -> user scans QR, enters code
 * 4. Verify: `verify(code)` -> returns temporary 2FA token for sensitive ops
 * 5. Disable: `disable(code)` -> removes 2FA
 *
 * Recovery codes are generated on enable and can be regenerated.
 */
export class TwoFactorService {
  private http: HttpClient;
  private twoFactorTokenManager: TwoFactorTokenManager;
  private debug: boolean;

  constructor(
    http: HttpClient,
    twoFactorTokenManager: TwoFactorTokenManager,
    debug = false
  ) {
    this.http = http;
    this.twoFactorTokenManager = twoFactorTokenManager;
    this.debug = debug;
  }

  // ---------------------------------------------------------------------------
  // Status
  // Replicates: auth.ts authApi.getTwoFactorStatus (lines 338-343)
  // ---------------------------------------------------------------------------

  /**
   * Check the current 2FA status for the authenticated user.
   *
   * @returns Whether 2FA is enabled and remaining recovery codes count.
   */
  async getStatus(): Promise<TwoFactorStatus> {
    this.log('Getting 2FA status');

    const response = await this.http.get<TwoFactorStatus | { data: TwoFactorStatus }>(
      '/api/v1/auth/2fa/status'
    );

    return this.unwrap<TwoFactorStatus>(response.data);
  }

  // ---------------------------------------------------------------------------
  // Setup
  // Replicates: auth.ts authApi.setupTwoFactor (lines 346-351)
  // ---------------------------------------------------------------------------

  /**
   * Begin 2FA setup. Returns the TOTP secret and QR code.
   * User should scan the QR code with an authenticator app,
   * then call `enable()` with the generated code.
   *
   * @returns Secret, QR code data URL, manual entry key, and otpauth URL.
   */
  async setup(): Promise<TwoFactorSetupResponse> {
    this.log('Setting up 2FA');

    const response = await this.http.post<TwoFactorSetupResponse | { data: TwoFactorSetupResponse }>(
      '/api/v1/auth/2fa/setup'
    );

    return this.unwrap<TwoFactorSetupResponse>(response.data);
  }

  // ---------------------------------------------------------------------------
  // Enable
  // Replicates: auth.ts authApi.enableTwoFactor (lines 354-360)
  // ---------------------------------------------------------------------------

  /**
   * Enable 2FA by verifying a TOTP code from the authenticator app.
   * Returns recovery codes that should be saved by the user.
   *
   * @param code - 6-digit TOTP code from authenticator app.
   * @returns Confirmation message and recovery codes.
   */
  async enable(code: string): Promise<TwoFactorEnableResponse> {
    this.log('Enabling 2FA');

    const response = await this.http.post<TwoFactorEnableResponse | { data: TwoFactorEnableResponse }>(
      '/api/v1/auth/2fa/enable',
      { code }
    );

    return this.unwrap<TwoFactorEnableResponse>(response.data);
  }

  // ---------------------------------------------------------------------------
  // Verify
  // Replicates: auth.ts authApi.verifyTwoFactor (lines 363-376)
  // ---------------------------------------------------------------------------

  /**
   * Verify a 2FA code for sensitive operations (e.g., withdrawal).
   * Stores the temporary 2FA token with expiry for subsequent requests.
   *
   * @param code - 6-digit TOTP code.
   * @returns Verification result with temporary token.
   */
  async verify(code: string): Promise<TwoFactorVerifyResponse> {
    this.log('Verifying 2FA code');

    const response = await this.http.post<TwoFactorVerifyResponse | { data: TwoFactorVerifyResponse }>(
      '/api/v1/auth/2fa/verify',
      { code }
    );

    const result = this.unwrap<TwoFactorVerifyResponse>(response.data);

    // Store the 2FA token for subsequent requests (auth.ts lines 371-373)
    if (result.verified && result.twoFactorToken) {
      await this.twoFactorTokenManager.setToken(result.twoFactorToken, result.expiresIn);
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Verify with Recovery Code
  // Replicates: auth.ts authApi.verifyWithRecoveryCode (lines 379-392)
  // ---------------------------------------------------------------------------

  /**
   * Verify 2FA using a recovery code instead of TOTP.
   * Each recovery code can only be used once.
   *
   * @param recoveryCode - One of the recovery codes generated on 2FA enable.
   * @returns Verification result with temporary token.
   */
  async verifyWithRecoveryCode(recoveryCode: string): Promise<TwoFactorVerifyResponse> {
    this.log('Verifying with recovery code');

    const response = await this.http.post<TwoFactorVerifyResponse | { data: TwoFactorVerifyResponse }>(
      '/api/v1/auth/2fa/verify/recovery',
      { recoveryCode }
    );

    const result = this.unwrap<TwoFactorVerifyResponse>(response.data);

    // Store the 2FA token (auth.ts lines 388-390)
    if (result.verified && result.twoFactorToken) {
      await this.twoFactorTokenManager.setToken(result.twoFactorToken, result.expiresIn);
    }

    return result;
  }

  // ---------------------------------------------------------------------------
  // Disable
  // Replicates: auth.ts authApi.disableTwoFactor (lines 395-405)
  // ---------------------------------------------------------------------------

  /**
   * Disable 2FA for the current user.
   * Requires a valid TOTP code for security.
   *
   * @param code - 6-digit TOTP code.
   * @returns Confirmation message.
   */
  async disable(code: string): Promise<TwoFactorDisableResponse> {
    this.log('Disabling 2FA');

    const response = await this.http.post<TwoFactorDisableResponse | { data: TwoFactorDisableResponse }>(
      '/api/v1/auth/2fa/disable',
      { code }
    );

    // Clear 2FA token after disabling (auth.ts line 402)
    await this.twoFactorTokenManager.clearToken();

    return this.unwrap<TwoFactorDisableResponse>(response.data);
  }

  // ---------------------------------------------------------------------------
  // Recovery Codes
  // Replicates: auth.ts authApi.getRecoveryCodes (lines 408-413)
  // and regenerateRecoveryCodes (lines 416-422)
  // ---------------------------------------------------------------------------

  /**
   * Get recovery codes status (count of unused codes).
   *
   * @returns Recovery codes list and usage counts.
   */
  async getRecoveryCodes(): Promise<RecoveryCodesResponse> {
    this.log('Getting recovery codes');

    const response = await this.http.get<RecoveryCodesResponse | { data: RecoveryCodesResponse }>(
      '/api/v1/auth/2fa/recovery-codes'
    );

    return this.unwrap<RecoveryCodesResponse>(response.data);
  }

  /**
   * Regenerate recovery codes. Invalidates all previous codes.
   * Requires a valid TOTP code for security.
   *
   * @param code - 6-digit TOTP code.
   * @returns New recovery codes.
   */
  async regenerateRecoveryCodes(code: string): Promise<RegenerateRecoveryCodesResponse> {
    this.log('Regenerating recovery codes');

    const response = await this.http.post<RegenerateRecoveryCodesResponse | { data: RegenerateRecoveryCodesResponse }>(
      '/api/v1/auth/2fa/recovery-codes/regenerate',
      { code }
    );

    return this.unwrap<RegenerateRecoveryCodesResponse>(response.data);
  }

  // ---------------------------------------------------------------------------
  // 2FA Token State (delegated to TwoFactorTokenManager)
  // ---------------------------------------------------------------------------

  /**
   * Check if a valid 2FA token exists for the current session.
   */
  async hasValidToken(): Promise<boolean> {
    return this.twoFactorTokenManager.isValid();
  }

  /**
   * Get the current 2FA token (for attaching to sensitive requests).
   */
  async getToken(): Promise<string | null> {
    return this.twoFactorTokenManager.getToken();
  }

  /**
   * Get time remaining (in seconds) for the current 2FA token.
   */
  async getTokenTimeRemaining(): Promise<number> {
    return this.twoFactorTokenManager.getTimeRemaining();
  }

  /**
   * Clear the current 2FA session token.
   */
  async clearToken(): Promise<void> {
    await this.twoFactorTokenManager.clearToken();
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Unwrap potentially nested response data.
   * Backend may return `{ data: T }` or `T` directly.
   * Replicates: auth.ts pattern `(response.data as ApiResponse<T>).data || response.data`
   */
  private unwrap<T>(data: unknown): T {
    if (data && typeof data === 'object' && 'data' in data) {
      return (data as { data: T }).data;
    }
    return data as T;
  }

  /**
   * Debug logger.
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:2FA]', ...args);
    }
  }
}