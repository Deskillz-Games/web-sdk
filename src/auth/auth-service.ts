// =============================================================================
// Deskillz Web SDK - Authentication Service
// Path: src/auth/auth-service.ts
// Core authentication: email/password, social, logout, current user
// Replicates: auth.ts authApi (lines 183-305)
// Event dispatching: useBackendAuth.ts (lines 82-272)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { TokenManager } from '../core/storage';
import type { TypedEventEmitter } from '../core/event-emitter';
import type { SDKEventMap, BackendUser } from '../core/types';
import { SDKEventName } from '../core/types';
import { AuthError, ErrorCode } from '../core/errors';
import type { TwoFactorTokenManager } from './token-manager';
import type {
  AuthResponse,
  AuthResult,
  EmailRegisterPayload,
  EmailLoginPayload,
  SocialAuthPayload,
  ChangePasswordPayload,
  ResetPasswordPayload,
  AuthState,
} from './auth-types';

/**
 * Core authentication service.
 * Handles email/password, social login, logout, and user profile.
 *
 * For wallet (SIWE) authentication, see WalletAuthService.
 * For 2FA management, see TwoFactorService.
 */
export class AuthService {
  private http: HttpClient;
  private tokenManager: TokenManager;
  private twoFactorTokenManager: TwoFactorTokenManager;
  private events: TypedEventEmitter<SDKEventMap>;
  private debug: boolean;

  // Internal auth state
  private currentUser: BackendUser | null = null;
  private authenticating = false;

  constructor(
    http: HttpClient,
    tokenManager: TokenManager,
    twoFactorTokenManager: TwoFactorTokenManager,
    events: TypedEventEmitter<SDKEventMap>,
    debug = false
  ) {
    this.http = http;
    this.tokenManager = tokenManager;
    this.twoFactorTokenManager = twoFactorTokenManager;
    this.events = events;
    this.debug = debug;
  }

  // ---------------------------------------------------------------------------
  // Email/Password Registration
  // Replicates: auth.ts authApi.registerWithEmail (lines 259-268)
  // ---------------------------------------------------------------------------

  /**
   * Register a new user with email and password.
   *
   * @param payload - Email, password, and username.
   * @returns Auth result with user, tokens, and isNewUser flag.
   */
  async registerWithEmail(payload: EmailRegisterPayload): Promise<AuthResult> {
    this.log('Registering with email:', payload.email);

    const response = await this.http.post<AuthResponse>(
      '/api/v1/auth/register',
      payload
    );

    const result = this.extractAuthResponse(response.data);
    await this.handleAuthSuccess(result, true);

    return result;
  }

  // ---------------------------------------------------------------------------
  // Email/Password Login
  // Replicates: auth.ts authApi.loginWithEmail (lines 271-280)
  // ---------------------------------------------------------------------------

  /**
   * Login with email and password.
   *
   * @param payload - Email and password.
   * @returns Auth result with user, tokens, and isNewUser flag.
   */
  async loginWithEmail(payload: EmailLoginPayload): Promise<AuthResult> {
    this.log('Logging in with email:', payload.email);

    const response = await this.http.post<AuthResponse>(
      '/api/v1/auth/login',
      payload
    );

    const result = this.extractAuthResponse(response.data);
    await this.handleAuthSuccess(result, result.isNewUser);

    return result;
  }

  // ---------------------------------------------------------------------------
  // Social Authentication
  // Replicates: auth.ts authApi.socialAuth (lines 283-292)
  // ---------------------------------------------------------------------------

  /**
   * Login or register with a social provider (Google, Apple, Facebook).
   *
   * @param payload - Provider name and ID token.
   * @returns Auth result with user, tokens, and isNewUser flag.
   */
  async socialAuth(payload: SocialAuthPayload): Promise<AuthResult> {
    this.log('Social auth with provider:', payload.provider);

    const response = await this.http.post<AuthResponse>(
      '/api/v1/auth/social',
      payload
    );

    const result = this.extractAuthResponse(response.data);
    await this.handleAuthSuccess(result, result.isNewUser);

    return result;
  }

  // ---------------------------------------------------------------------------
  // Logout
  // Replicates: auth.ts authApi.logout (lines 231-238)
  // and useBackendAuth.ts logout (lines 325-339)
  // ---------------------------------------------------------------------------

  /**
   * Logout the current user.
   * Clears all tokens, 2FA state, and dispatches auth events.
   */
  async logout(): Promise<void> {
    this.log('Logging out');

    try {
      // Notify backend (best-effort, don't block on failure)
      await this.http.post('/api/v1/auth/logout');
    } catch {
      // Ignore server-side logout failures - client cleanup is what matters
    } finally {
      await this.clearAuthState();
    }
  }

  // ---------------------------------------------------------------------------
  // Get Current User
  // Replicates: auth.ts authApi.getCurrentUser (lines 225-228)
  // and useBackendAuth.ts mount check (lines 108-136)
  // ---------------------------------------------------------------------------

  /**
   * Fetch the current authenticated user's profile.
   * Also updates the internal user cache.
   *
   * @returns The current user, or null if not authenticated.
   */
  async getCurrentUser(): Promise<BackendUser | null> {
    const isAuth = await this.tokenManager.isAuthenticated();
    if (!isAuth) return null;

    try {
      // Replicates: useBackendAuth.ts line 112 (GET /api/v1/users/me)
      const response = await this.http.get<BackendUser>('/api/v1/users/me');
      this.currentUser = response.data;
      return this.currentUser;
    } catch (error) {
      this.log('Failed to fetch current user:', error);
      // If 401, HttpClient will have already refreshed or cleared tokens
      this.currentUser = null;
      return null;
    }
  }

  /**
   * Get the cached current user (no network call).
   * Returns null if not yet fetched.
   */
  getCachedUser(): BackendUser | null {
    return this.currentUser;
  }

  // ---------------------------------------------------------------------------
  // Password Management
  // Replicates: auth.ts authApi.forgotPassword (lines 295-298)
  // and resetPassword (lines 301-304)
  // ---------------------------------------------------------------------------

  /**
   * Request a password reset email.
   * Replicates: auth.ts authApi.forgotPassword (lines 295-298)
   *
   * @param email - The email address to send reset instructions to.
   */
  async forgotPassword(email: string): Promise<{ success: boolean }> {
    this.log('Requesting password reset for:', email);

    const response = await this.http.post<{ success: boolean }>(
      '/api/v1/auth/forgot-password',
      { email }
    );
    return response.data;
  }

  /**
   * Reset password using a token from the reset email.
   * Replicates: auth.ts authApi.resetPassword (lines 301-304)
   *
   * @param payload - Reset token and new password.
   */
  async resetPassword(payload: ResetPasswordPayload): Promise<{ success: boolean }> {
    this.log('Resetting password with token');

    const response = await this.http.post<{ success: boolean }>(
      '/api/v1/auth/reset-password',
      payload
    );
    return response.data;
  }

  /**
   * Change password for the currently authenticated user.
   *
   * @param payload - Current password and new password.
   */
  async changePassword(payload: ChangePasswordPayload): Promise<{ success: boolean }> {
    this.log('Changing password');

    const response = await this.http.post<{ success: boolean }>(
      '/api/v1/auth/change-password',
      payload
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Auth State
  // ---------------------------------------------------------------------------

  /**
   * Check if the user is currently authenticated (has valid access token).
   */
  async isAuthenticated(): Promise<boolean> {
    return this.tokenManager.isAuthenticated();
  }

  /**
   * Get a snapshot of the current auth state.
   */
  getAuthState(): AuthState {
    return {
      isAuthenticated: this.currentUser !== null,
      isAuthenticating: this.authenticating,
      error: null,
      user: this.currentUser,
      isNewUser: false,
    };
  }

  /**
   * Initialize auth state on SDK startup.
   * Checks for existing tokens and fetches user profile if authenticated.
   * Replicates: useBackendAuth.ts mount effect (lines 108-136)
   */
  async initialize(): Promise<void> {
    const isAuth = await this.tokenManager.isAuthenticated();
    if (isAuth) {
      this.log('Existing tokens found, fetching user...');
      const user = await this.getCurrentUser();
      if (user) {
        this.dispatchAuthStateChanged(true, user);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Internal Helpers
  // ---------------------------------------------------------------------------

  /**
   * Extract AuthResult from the potentially nested backend response.
   * Handles both `{ accessToken, refreshToken, user }` and
   * `{ data: { accessToken, refreshToken, user } }` shapes.
   * Replicates: auth.ts response handling patterns (e.g., lines 198-204)
   */
  private extractAuthResponse(data: unknown): AuthResult {
    const response = data as Record<string, unknown>;

    // Handle nested data shape
    const inner = (response.data as Record<string, unknown>) ?? response;
    const accessToken =
      (inner.accessToken as string) ??
      ((inner.tokens as Record<string, unknown>)?.accessToken as string);
    const refreshToken =
      (inner.refreshToken as string) ??
      ((inner.tokens as Record<string, unknown>)?.refreshToken as string);
    const user = (inner.user as BackendUser) ?? (response.user as BackendUser);
    const isNewUser = (inner.isNewUser as boolean) ?? false;

    if (!accessToken || !user) {
      throw new AuthError(
        'Invalid auth response from server',
        ErrorCode.AUTH_FAILED
      );
    }

    return {
      user,
      tokens: { accessToken, refreshToken },
      isNewUser,
    };
  }

  /**
   * Handle successful authentication: store tokens, update state, dispatch events.
   * Replicates: useBackendAuth.ts lines 236-272
   */
  private async handleAuthSuccess(result: AuthResult, isNewUser: boolean): Promise<void> {
    // Store tokens (api-client.ts tokenManager.setTokens)
    await this.tokenManager.setTokens(result.tokens.accessToken, result.tokens.refreshToken);
    await this.tokenManager.setAuthCompleted(true);

    // Update internal state
    this.currentUser = result.user;
    this.authenticating = false;

    // Handle new user (useBackendAuth.ts lines 240-255)
    if (isNewUser) {
      this.log('NEW USER DETECTED - dispatching events');
      await this.tokenManager.setIsNewUser(true);
      this.dispatchNewUserEvent();
    }

    // Dispatch auth state changed (useBackendAuth.ts lines 268-272)
    this.dispatchAuthStateChanged(true, result.user);
  }

  /**
   * Clear all authentication state.
   * Replicates: useBackendAuth.ts logout (lines 326-339)
   */
  private async clearAuthState(): Promise<void> {
    await this.tokenManager.clearTokens();
    await this.twoFactorTokenManager.clearToken();
    this.currentUser = null;
    this.authenticating = false;

    // Dispatch events
    this.events.emit(SDKEventName.AUTH_LOGOUT);
    this.dispatchAuthStateChanged(false, null);
  }

  /**
   * Dispatch new user event with multiple attempts for late listeners.
   * Replicates: useBackendAuth.ts notifyNewUser (lines 82-105)
   * Fires 3 times: immediately, +100ms, +500ms
   */
  private dispatchNewUserEvent(): void {
    const payload = { isNewUser: true, timestamp: Date.now() };

    // Immediate dispatch
    this.events.emit(SDKEventName.NEW_USER, payload);

    // Delayed dispatch for late listeners (+100ms)
    setTimeout(() => {
      this.events.emit(SDKEventName.NEW_USER, {
        ...payload,
        timestamp: Date.now(),
        delayed: true,
      });
    }, 100);

    // Final dispatch after components likely mounted (+500ms)
    setTimeout(() => {
      this.events.emit(SDKEventName.NEW_USER, {
        ...payload,
        timestamp: Date.now(),
        final: true,
      });
    }, 500);
  }

  /**
   * Dispatch auth state changed event.
   * Replicates: useBackendAuth.ts lines 270-272
   */
  private dispatchAuthStateChanged(isAuthenticated: boolean, user: BackendUser | null): void {
    this.events.emit(SDKEventName.AUTH_STATE_CHANGED, {
      isAuthenticated,
      user,
      timestamp: Date.now(),
    });
  }

  /**
   * Debug logger.
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:Auth]', ...args);
    }
  }
}