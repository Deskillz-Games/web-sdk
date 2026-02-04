// =============================================================================
// Deskillz Web SDK - Storage Adapter
// Path: src/core/storage.ts
// Abstracts token/data storage for any environment (browser, WebView, SSR)
// Replicates token keys and tokenManager from: api-client.ts (lines 15-34)
// =============================================================================

// -----------------------------------------------------------------------------
// Storage Adapter Interface
// -----------------------------------------------------------------------------

/**
 * Pluggable storage interface.
 * Methods may return synchronously or asynchronously to support
 * async storage backends (e.g., React Native AsyncStorage, IndexedDB).
 */
export interface StorageAdapter {
  getItem(key: string): string | null | Promise<string | null>;
  setItem(key: string, value: string): void | Promise<void>;
  removeItem(key: string): void | Promise<void>;
}

// -----------------------------------------------------------------------------
// Built-in Adapters
// -----------------------------------------------------------------------------

/**
 * localStorage-based adapter.
 * Default for browser environments.
 */
export class LocalStorageAdapter implements StorageAdapter {
  getItem(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      // localStorage may throw in private browsing or restricted contexts
      return null;
    }
  }

  setItem(key: string, value: string): void {
    try {
      localStorage.setItem(key, value);
    } catch {
      console.warn('[DeskillzSDK] localStorage.setItem failed for key:', key);
    }
  }

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      console.warn('[DeskillzSDK] localStorage.removeItem failed for key:', key);
    }
  }
}

/**
 * In-memory storage adapter.
 * Used as fallback when localStorage is unavailable (WebView, SSR, tests).
 * Data does NOT persist across page reloads.
 */
export class MemoryStorageAdapter implements StorageAdapter {
  private store = new Map<string, string>();

  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  /**
   * Clear all stored data. Useful for testing.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Get the number of stored items. Useful for testing.
   */
  get size(): number {
    return this.store.size;
  }
}

// -----------------------------------------------------------------------------
// Token Storage Keys (exact match to api-client.ts lines 16-17)
// -----------------------------------------------------------------------------

const ACCESS_TOKEN_KEY = 'deskillz_access_token';
const REFRESH_TOKEN_KEY = 'deskillz_refresh_token';

// Additional keys from useBackendAuth.ts
const IS_NEW_USER_KEY = 'deskillz_is_new_user';
const AUTH_COMPLETED_KEY = 'deskillz_auth_completed';

// -----------------------------------------------------------------------------
// Token Manager
// Replicates api-client.ts tokenManager (lines 20-34) with adapter pattern
// -----------------------------------------------------------------------------

/**
 * Manages access and refresh token lifecycle using a pluggable storage adapter.
 * All methods handle async storage transparently.
 */
export class TokenManager {
  private storage: StorageAdapter;

  constructor(storage: StorageAdapter) {
    this.storage = storage;
  }

  /**
   * Get the current access token.
   */
  async getAccessToken(): Promise<string | null> {
    return await this.storage.getItem(ACCESS_TOKEN_KEY);
  }

  /**
   * Get the current refresh token.
   */
  async getRefreshToken(): Promise<string | null> {
    return await this.storage.getItem(REFRESH_TOKEN_KEY);
  }

  /**
   * Store a new token pair.
   * Replicates api-client.ts tokenManager.setTokens (lines 23-28).
   *
   * @param accessToken - The JWT access token.
   * @param refreshToken - Optional refresh token. If omitted, existing refresh token is kept.
   */
  async setTokens(accessToken: string, refreshToken?: string): Promise<void> {
    await this.storage.setItem(ACCESS_TOKEN_KEY, accessToken);
    if (refreshToken) {
      await this.storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  }

  /**
   * Clear all tokens (logout).
   * Replicates api-client.ts tokenManager.clearTokens (lines 29-32).
   */
  async clearTokens(): Promise<void> {
    await this.storage.removeItem(ACCESS_TOKEN_KEY);
    await this.storage.removeItem(REFRESH_TOKEN_KEY);
    await this.storage.removeItem(IS_NEW_USER_KEY);
    await this.storage.removeItem(AUTH_COMPLETED_KEY);
  }

  /**
   * Check if an access token exists.
   * Replicates api-client.ts tokenManager.isAuthenticated (line 33).
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this.storage.getItem(ACCESS_TOKEN_KEY);
    return token !== null && token.length > 0;
  }

  /**
   * Mark the current session as a new user registration.
   * Used to trigger onboarding flows.
   */
  async setIsNewUser(isNewUser: boolean): Promise<void> {
    if (isNewUser) {
      await this.storage.setItem(IS_NEW_USER_KEY, 'true');
    } else {
      await this.storage.removeItem(IS_NEW_USER_KEY);
    }
  }

  /**
   * Check if current session is a new user registration.
   */
  async getIsNewUser(): Promise<boolean> {
    const value = await this.storage.getItem(IS_NEW_USER_KEY);
    return value === 'true';
  }

  /**
   * Mark authentication as completed.
   */
  async setAuthCompleted(completed: boolean): Promise<void> {
    if (completed) {
      await this.storage.setItem(AUTH_COMPLETED_KEY, 'true');
    } else {
      await this.storage.removeItem(AUTH_COMPLETED_KEY);
    }
  }

  /**
   * Check if authentication has been completed.
   */
  async getAuthCompleted(): Promise<boolean> {
    const value = await this.storage.getItem(AUTH_COMPLETED_KEY);
    return value === 'true';
  }

  /**
   * Replace the storage adapter at runtime.
   * Useful for migrating from memory to persistent storage after initialization.
   */
  setStorage(storage: StorageAdapter): void {
    this.storage = storage;
  }
}

// -----------------------------------------------------------------------------
// Auto-detect best available storage
// -----------------------------------------------------------------------------

/**
 * Detect whether localStorage is available and functional.
 * Returns false in private browsing modes, SSR, or restricted WebView contexts.
 */
function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__deskillz_storage_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * Create the best available storage adapter for the current environment.
 * Prefers localStorage, falls back to in-memory.
 */
export function createDefaultStorage(): StorageAdapter {
  if (typeof window !== 'undefined' && isLocalStorageAvailable()) {
    return new LocalStorageAdapter();
  }
  return new MemoryStorageAdapter();
}