// =============================================================================
// Deskillz Web SDK - Developer Service
// Path: src/developer/developer-service.ts
// Developer portal: draft games, dashboard, analytics, revenue, payouts, SDK keys
// Replicates: developer.ts developerApi (lines 184-300)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { PaginatedResponse, QueryParams } from '../core/types';
import type {
  CreateDraftGameRequest,
  DraftGameResponse,
  DraftGame,
  GameCredentials,
  DeveloperDashboard,
  GameAnalytics,
  RevenueReport,
  RevenueReportFilters,
  PayoutResponse,
  PayoutHistoryParams,
  PayoutRequest,
  SdkKey,
  CreateSdkKeyRequest,
} from './developer-types';

// =============================================================================
// DEVELOPER SERVICE
// =============================================================================

/**
 * Service for the Developer Portal.
 *
 * Provides the Credentials-First Flow (Step 0): create a draft game with
 * just a name, receive gameId + API key immediately, then configure
 * the SDK and build the APK before completing full game registration.
 *
 * Also covers dashboard stats, per-game analytics, revenue reports,
 * payout requests, and SDK key management.
 *
 * All endpoints require authentication with DEVELOPER role.
 * All paths use /api/v1/developer/ prefix.
 *
 * 11 endpoints total. Replicates: developer.ts developerApi (lines 184-300).
 */
export class DeveloperService {
  private readonly http: HttpClient;
  private readonly debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ===========================================================================
  // DRAFT GAME (Credentials-First Flow) - 3 endpoints
  // Replicates: developer.ts lines 189-217
  // ===========================================================================

  /**
   * Create a draft game and receive credentials immediately.
   * This is Step 0 of the Credentials-First Flow: developer gets
   * gameId, apiKey, apiSecret, and deepLinkScheme before building APK.
   *
   * POST /api/v1/developer/games/draft
   *
   * @param data - Game name and optional platform.
   * @returns Draft game with all credentials.
   */
  async createDraftGame(data: CreateDraftGameRequest): Promise<DraftGameResponse> {
    this.log('createDraftGame', data.name);
    const res = await this.http.post<DraftGameResponse>(
      '/api/v1/developer/games/draft',
      data
    );
    return res.data;
  }

  /**
   * Get all draft games for the current developer.
   * GET /api/v1/developer/games/drafts
   */
  async getDraftGames(): Promise<DraftGame[]> {
    this.log('getDraftGames');
    const res = await this.http.get<DraftGame[]>('/api/v1/developer/games/drafts');
    return res.data;
  }

  /**
   * Get credentials for an existing game.
   * GET /api/v1/developer/games/:gameId/credentials
   *
   * @param gameId - The game's unique identifier.
   */
  async getGameCredentials(gameId: string): Promise<GameCredentials> {
    this.log('getGameCredentials', gameId);
    const res = await this.http.get<GameCredentials>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/credentials`
    );
    return res.data;
  }

  // ===========================================================================
  // DASHBOARD & ANALYTICS - 2 endpoints
  // Replicates: developer.ts lines 223-239
  // ===========================================================================

  /**
   * Get developer dashboard (aggregate stats, game list, activity feed).
   * GET /api/v1/developer/dashboard
   */
  async getDashboard(): Promise<DeveloperDashboard> {
    this.log('getDashboard');
    const res = await this.http.get<DeveloperDashboard>('/api/v1/developer/dashboard');
    return res.data;
  }

  /**
   * Get analytics for a specific game.
   * GET /api/v1/developer/games/:gameId/analytics
   *
   * @param gameId - The game's unique identifier.
   */
  async getGameAnalytics(gameId: string): Promise<GameAnalytics> {
    this.log('getGameAnalytics', gameId);
    const res = await this.http.get<GameAnalytics>(
      `/api/v1/developer/games/${encodeURIComponent(gameId)}/analytics`
    );
    return res.data;
  }

  // ===========================================================================
  // REVENUE & PAYOUTS - 3 endpoints
  // Replicates: developer.ts lines 245-272
  // ===========================================================================

  /**
   * Get revenue report with optional date range filter.
   * GET /api/v1/developer/revenue
   *
   * @param filters - Optional startDate, endDate.
   */
  async getRevenueReport(filters?: RevenueReportFilters): Promise<RevenueReport> {
    this.log('getRevenueReport', filters);
    const res = await this.http.get<RevenueReport>(
      '/api/v1/developer/revenue',
      filters as QueryParams
    );
    return res.data;
  }

  /**
   * Get payout history (paginated).
   * GET /api/v1/developer/payouts
   *
   * @param params - Optional page, limit.
   */
  async getPayoutHistory(
    params?: PayoutHistoryParams
  ): Promise<PaginatedResponse<PayoutResponse>> {
    this.log('getPayoutHistory', params);
    const res = await this.http.get<PaginatedResponse<PayoutResponse>>(
      '/api/v1/developer/payouts',
      params as QueryParams
    );
    return res.data;
  }

  /**
   * Request a payout to an external wallet.
   * POST /api/v1/developer/payouts
   *
   * @param data - Amount, currency, wallet address, optional chain.
   */
  async requestPayout(data: PayoutRequest): Promise<PayoutResponse> {
    this.log('requestPayout', { amount: data.amount, currency: data.currency });
    const res = await this.http.post<PayoutResponse>('/api/v1/developer/payouts', data);
    return res.data;
  }

  // ===========================================================================
  // SDK KEYS - 3 endpoints
  // Replicates: developer.ts lines 278-299
  // ===========================================================================

  /**
   * Get all SDK keys for the current developer.
   * GET /api/v1/developer/sdk-keys
   */
  async getSdkKeys(): Promise<SdkKey[]> {
    this.log('getSdkKeys');
    const res = await this.http.get<SdkKey[]>('/api/v1/developer/sdk-keys');
    return res.data;
  }

  /**
   * Create a new SDK key.
   * POST /api/v1/developer/sdk-keys
   *
   * @param data - Name, optional gameId, environment.
   */
  async createSdkKey(data: CreateSdkKeyRequest): Promise<SdkKey> {
    this.log('createSdkKey', data.name);
    const res = await this.http.post<SdkKey>('/api/v1/developer/sdk-keys', data);
    return res.data;
  }

  /**
   * Revoke (delete) an SDK key.
   * DELETE /api/v1/developer/sdk-keys/:keyId
   *
   * @param keyId - The SDK key's unique identifier.
   */
  async revokeSdkKey(keyId: string): Promise<void> {
    this.log('revokeSdkKey', keyId);
    await this.http.delete(`/api/v1/developer/sdk-keys/${encodeURIComponent(keyId)}`);
  }

  // ===========================================================================
  // DEBUG
  // ===========================================================================

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeveloperService]', ...args);
    }
  }
}