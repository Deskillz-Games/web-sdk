// =============================================================================
// Deskillz Web SDK - User Service
// Path: src/users/user-service.ts
// User profile, stats, wallet, settings (notifications, preferences, privacy),
// role management, and transaction history
// Replicates: users.ts usersApi (lines 196-328)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { PaginatedResponse, QueryParams } from '../core/types';
import type {
  UserProfile,
  UserStats,
  UserWallet,
  UserTransaction,
  UserTransactionFilters,
  UpdateProfileRequest,
  UpdateRoleRequest,
  RoleUpdateResponse,
  UserSettings,
  UpdateNotificationsRequest,
  UpdatePreferencesRequest,
  UpdatePrivacyRequest,
  LinkWalletRequest,
} from './user-types';

// =============================================================================
// USER SERVICE
// =============================================================================

/**
 * Service for user profile, settings, wallet, and role management.
 *
 * Covers:
 * - Profile CRUD (get self, get other, update)
 * - Player stats
 * - Wallet info and linking
 * - Transaction history
 * - Settings (notifications, preferences, privacy)
 * - Role upgrade (PLAYER -> DEVELOPER)
 *
 * Most endpoints require authentication.
 * 15 endpoints total. Replicates: users.ts usersApi (lines 196-328).
 */
export class UserService {
  private readonly http: HttpClient;
  private readonly debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ===========================================================================
  // PROFILE (3 endpoints)
  // Replicates: users.ts lines 197-213
  // ===========================================================================

  /**
   * Get another user's public profile.
   * GET /api/v1/users/:userId
   *
   * @param userId - The user's ID.
   */
  async getProfile(userId: string): Promise<UserProfile> {
    this.log('getProfile', userId);
    const res = await this.http.get<UserProfile>(
      `/api/v1/users/${encodeURIComponent(userId)}`
    );
    return res.data;
  }

  /**
   * Get the current authenticated user's profile.
   * GET /api/v1/users/me
   */
  async getMyProfile(): Promise<UserProfile> {
    this.log('getMyProfile');
    const res = await this.http.get<UserProfile>('/api/v1/users/me');
    return res.data;
  }

  /**
   * Update the current user's profile.
   * PUT /api/v1/users/me
   *
   * @param data - Fields to update (username, email, bio, avatarUrl).
   */
  async updateProfile(data: UpdateProfileRequest): Promise<UserProfile> {
    this.log('updateProfile', data);
    const res = await this.http.put<UserProfile>('/api/v1/users/me', data);
    return res.data;
  }

  // ===========================================================================
  // STATS (1 endpoint)
  // Replicates: users.ts lines 216-219
  // ===========================================================================

  /**
   * Get a user's player stats (wins, losses, earnings, streak, tier).
   * GET /api/v1/users/:userId/stats
   *
   * @param userId - The user's ID.
   */
  async getUserStats(userId: string): Promise<UserStats> {
    this.log('getUserStats', userId);
    const res = await this.http.get<UserStats>(
      `/api/v1/users/${encodeURIComponent(userId)}/stats`
    );
    return res.data;
  }

  // ===========================================================================
  // WALLET (3 endpoints)
  // Replicates: users.ts lines 222-243
  // ===========================================================================

  /**
   * Get user transaction history (paginated).
   * GET /api/v1/wallet/transactions
   *
   * @param filters - Optional page, limit, type filter.
   */
  async getTransactions(
    filters?: UserTransactionFilters
  ): Promise<PaginatedResponse<UserTransaction>> {
    this.log('getTransactions', filters);
    const res = await this.http.get<PaginatedResponse<UserTransaction>>(
      '/api/v1/wallet/transactions',
      filters as QueryParams
    );
    return res.data;
  }

  /**
   * Get the current user's wallet info (address, balances).
   * GET /api/v1/users/me/wallets
   */
  async getWallet(): Promise<UserWallet> {
    this.log('getWallet');
    const res = await this.http.get<UserWallet>('/api/v1/users/me/wallets');
    return res.data;
  }

  /**
   * Link an external wallet address to the user's account.
   * POST /api/v1/users/me/wallets
   *
   * @param data - Wallet address and signature for verification.
   */
  async linkWallet(data: LinkWalletRequest): Promise<void> {
    this.log('linkWallet', data.walletAddress);
    await this.http.post('/api/v1/users/me/wallets', data);
  }

  // ===========================================================================
  // SETTINGS (4 endpoints)
  // Replicates: users.ts lines 283-314
  // ===========================================================================

  /**
   * Get all user settings (notifications, preferences, privacy).
   * GET /api/v1/users/me/settings
   */
  async getSettings(): Promise<UserSettings> {
    this.log('getSettings');
    const res = await this.http.get<UserSettings>('/api/v1/users/me/settings');
    return res.data;
  }

  /**
   * Update notification settings (partial).
   * PATCH /api/v1/users/me/settings/notifications
   *
   * @param data - Fields to update.
   */
  async updateNotifications(data: UpdateNotificationsRequest): Promise<UserSettings> {
    this.log('updateNotifications', data);
    const res = await this.http.patch<UserSettings>(
      '/api/v1/users/me/settings/notifications',
      data
    );
    return res.data;
  }

  /**
   * Update display preferences (partial).
   * PATCH /api/v1/users/me/settings/preferences
   *
   * @param data - Fields to update (theme, language, currency, timezone).
   */
  async updatePreferences(data: UpdatePreferencesRequest): Promise<UserSettings> {
    this.log('updatePreferences', data);
    const res = await this.http.patch<UserSettings>(
      '/api/v1/users/me/settings/preferences',
      data
    );
    return res.data;
  }

  /**
   * Update privacy settings (partial).
   * PATCH /api/v1/users/me/settings/privacy
   *
   * @param data - Fields to update.
   */
  async updatePrivacy(data: UpdatePrivacyRequest): Promise<UserSettings> {
    this.log('updatePrivacy', data);
    const res = await this.http.patch<UserSettings>(
      '/api/v1/users/me/settings/privacy',
      data
    );
    return res.data;
  }

  // ===========================================================================
  // ROLE MANAGEMENT (1 endpoint)
  // Replicates: users.ts lines 320-327
  // ===========================================================================

  /**
   * Update user role (e.g. upgrade PLAYER -> DEVELOPER).
   * PATCH /api/v1/users/me/role
   *
   * @param data - New role and optional developer info (studioName, businessEmail).
   */
  async updateRole(data: UpdateRoleRequest): Promise<RoleUpdateResponse> {
    this.log('updateRole', data.role);
    const res = await this.http.patch<RoleUpdateResponse>(
      '/api/v1/users/me/role',
      data
    );
    return res.data;
  }

  // ===========================================================================
  // DEBUG
  // ===========================================================================

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[UserService]', ...args);
    }
  }
}