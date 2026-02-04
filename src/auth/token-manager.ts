// =============================================================================
// Deskillz Web SDK - Two-Factor Token Manager
// Path: src/auth/token-manager.ts
// Extends Phase 1 TokenManager with 2FA temporary token lifecycle
// Replicates: auth.ts twoFactorTokenManager (lines 137-177)
// Storage keys: deskillz_2fa_token, deskillz_2fa_token_expiry
// =============================================================================

import type { StorageAdapter } from '../core/storage';
import type { TwoFactorTokenState } from './auth-types';

// Storage keys - exact match to auth.ts lines 137-138
const TWO_FACTOR_TOKEN_KEY = 'deskillz_2fa_token';
const TWO_FACTOR_TOKEN_EXPIRY_KEY = 'deskillz_2fa_token_expiry';

/**
 * Manages temporary 2FA tokens with expiry tracking.
 * These tokens are short-lived and used for sensitive operations
 * after the user verifies their 2FA code.
 *
 * Replicates: auth.ts twoFactorTokenManager (lines 140-177)
 */
export class TwoFactorTokenManager {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Store a 2FA token with expiry time.
   * Replicates: auth.ts twoFactorTokenManager.setToken (lines 141-145)
   *
   * @param token - The temporary 2FA token from verification.
   * @param expiresIn - Seconds until the token expires.
   */
  async setToken(token: string, expiresIn: number): Promise<void> {
    const expiryTime = Date.now() + expiresIn * 1000;
    await this.storage.setItem(TWO_FACTOR_TOKEN_KEY, token);
    await this.storage.setItem(TWO_FACTOR_TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  /**
   * Get the current 2FA token if still valid.
   * Returns null if expired or not set.
   * Replicates: auth.ts twoFactorTokenManager.getToken (lines 147-159)
   */
  async getToken(): Promise<string | null> {
    const token = await this.storage.getItem(TWO_FACTOR_TOKEN_KEY);
    const expiry = await this.storage.getItem(TWO_FACTOR_TOKEN_EXPIRY_KEY);

    if (!token || !expiry) return null;

    // Check if token has expired
    if (Date.now() > parseInt(expiry, 10)) {
      await this.clearToken();
      return null;
    }

    return token;
  }

  /**
   * Clear the stored 2FA token and expiry.
   * Replicates: auth.ts twoFactorTokenManager.clearToken (lines 162-165)
   */
  async clearToken(): Promise<void> {
    await this.storage.removeItem(TWO_FACTOR_TOKEN_KEY);
    await this.storage.removeItem(TWO_FACTOR_TOKEN_EXPIRY_KEY);
  }

  /**
   * Check if the current 2FA token is still valid.
   * Replicates: auth.ts twoFactorTokenManager.isValid (lines 167-169)
   */
  async isValid(): Promise<boolean> {
    const token = await this.getToken();
    return token !== null;
  }

  /**
   * Get time remaining in seconds until the 2FA token expires.
   * Returns 0 if expired or not set.
   * Replicates: auth.ts twoFactorTokenManager.getTimeRemaining (lines 171-176)
   */
  async getTimeRemaining(): Promise<number> {
    const expiry = await this.storage.getItem(TWO_FACTOR_TOKEN_EXPIRY_KEY);
    if (!expiry) return 0;

    const remaining = parseInt(expiry, 10) - Date.now();
    return remaining > 0 ? Math.floor(remaining / 1000) : 0;
  }

  /**
   * Get the full token state (token + expiry) for inspection.
   * Returns null if no valid token exists.
   */
  async getState(): Promise<TwoFactorTokenState | null> {
    const token = await this.storage.getItem(TWO_FACTOR_TOKEN_KEY);
    const expiry = await this.storage.getItem(TWO_FACTOR_TOKEN_EXPIRY_KEY);

    if (!token || !expiry) return null;

    const expiryTime = parseInt(expiry, 10);
    if (Date.now() > expiryTime) {
      await this.clearToken();
      return null;
    }

    return { token, expiryTime };
  }

  /**
   * Replace the storage adapter at runtime.
   */
  setStorage(storage: StorageAdapter): void {
    this.storage = storage;
  }
}