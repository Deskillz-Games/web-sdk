// =============================================================================
// Deskillz Web SDK - Leaderboard Service
// Path: src/users/leaderboard-service.ts
// Global and per-game leaderboards, user ranks, game stats, platform stats
// Replicates: leaderboard.ts leaderboardApi (lines 62-111)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { QueryParams } from '../core/types';
import type {
  LeaderboardResponse,
  LeaderboardFilters,
  UserRank,
  GameStats,
  PlatformStats,
} from './user-types';

// =============================================================================
// LEADERBOARD SERVICE
// =============================================================================

/**
 * Service for leaderboards and platform statistics.
 *
 * Covers:
 * - Global leaderboard (all players across all games)
 * - Per-game leaderboards
 * - Current user's rank (global or per-game)
 * - Any user's rank (public)
 * - Per-game statistics
 * - Platform-wide statistics
 *
 * All endpoints are public (no auth required) except getMyRank / getMyGameRank.
 * All paths use the /api/v1/leaderboard/ prefix.
 *
 * 7 endpoints total. Replicates: leaderboard.ts leaderboardApi (lines 62-111).
 */
export class LeaderboardService {
  private readonly http: HttpClient;
  private readonly debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ===========================================================================
  // LEADERBOARDS (2 endpoints)
  // Replicates: leaderboard.ts lines 63-81
  // ===========================================================================

  /**
   * Get the global leaderboard (all players, all games).
   * GET /api/v1/leaderboard/global
   *
   * @param filters - Optional period, limit, offset.
   */
  async getGlobalLeaderboard(filters?: LeaderboardFilters): Promise<LeaderboardResponse> {
    this.log('getGlobalLeaderboard', filters);
    const res = await this.http.get<LeaderboardResponse>(
      '/api/v1/leaderboard/global',
      filters as QueryParams
    );
    return res.data;
  }

  /**
   * Get a game-specific leaderboard.
   * GET /api/v1/leaderboard/game/:gameId
   *
   * @param gameId - The game's unique identifier.
   * @param filters - Optional period, limit, offset.
   */
  async getGameLeaderboard(
    gameId: string,
    filters?: LeaderboardFilters
  ): Promise<LeaderboardResponse> {
    this.log('getGameLeaderboard', gameId, filters);
    const res = await this.http.get<LeaderboardResponse>(
      `/api/v1/leaderboard/game/${encodeURIComponent(gameId)}`,
      filters as QueryParams
    );
    return res.data;
  }

  // ===========================================================================
  // USER RANKS (3 endpoints)
  // Replicates: leaderboard.ts lines 96-111
  // ===========================================================================

  /**
   * Get the current authenticated user's global rank.
   * GET /api/v1/leaderboard/me
   */
  async getMyRank(): Promise<UserRank> {
    this.log('getMyRank');
    const res = await this.http.get<UserRank>('/api/v1/leaderboard/me');
    return res.data;
  }

  /**
   * Get the current user's rank for a specific game.
   * GET /api/v1/leaderboard/me/game/:gameId
   *
   * @param gameId - The game's unique identifier.
   */
  async getMyGameRank(gameId: string): Promise<UserRank> {
    this.log('getMyGameRank', gameId);
    const res = await this.http.get<UserRank>(
      `/api/v1/leaderboard/me/game/${encodeURIComponent(gameId)}`
    );
    return res.data;
  }

  /**
   * Get any user's rank (public).
   * GET /api/v1/leaderboard/user/:userId
   *
   * @param userId - The user's ID.
   */
  async getUserRank(userId: string): Promise<UserRank> {
    this.log('getUserRank', userId);
    const res = await this.http.get<UserRank>(
      `/api/v1/leaderboard/user/${encodeURIComponent(userId)}`
    );
    return res.data;
  }

  // ===========================================================================
  // STATISTICS (2 endpoints)
  // Replicates: leaderboard.ts lines 84-93
  // ===========================================================================

  /**
   * Get per-game statistics (players, tournaments, prize pool).
   * GET /api/v1/leaderboard/game/:gameId/stats
   *
   * @param gameId - The game's unique identifier.
   */
  async getGameStats(gameId: string): Promise<GameStats> {
    this.log('getGameStats', gameId);
    const res = await this.http.get<GameStats>(
      `/api/v1/leaderboard/game/${encodeURIComponent(gameId)}/stats`
    );
    return res.data;
  }

  /**
   * Get platform-wide statistics (users, games, tournaments, prizes).
   * GET /api/v1/leaderboard/platform/stats
   */
  async getPlatformStats(): Promise<PlatformStats> {
    this.log('getPlatformStats');
    const res = await this.http.get<PlatformStats>(
      '/api/v1/leaderboard/platform/stats'
    );
    return res.data;
  }

  // ===========================================================================
  // DEBUG
  // ===========================================================================

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[LeaderboardService]', ...args);
    }
  }
}