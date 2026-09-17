// =============================================================================
// Deskillz Web SDK - Quick Play Service
// Path: src/quick-play/quick-play-service.ts
// HTTP service for Quick Play matchmaking queue
// All endpoints use /api/v1/lobby/quick-play/ prefix
// 3 endpoints total. Auth required.
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type {
  QuickPlayJoinParams,
  QuickPlayJoinResult,
  QuickPlayLeaveResult,
  QuickPlayStatusResponse,
} from './quick-play-types';

// Re-export types for consumer convenience
export type {
  QuickPlayJoinParams,
  QuickPlayJoinResult,
  QuickPlayLeaveResult,
  QuickPlayStatusResponse,
  QuickPlayStatusItem,
  QuickPlaySearchingData,
  QuickPlayFoundData,
  QuickPlayFillingData,
  QuickPlayStartingData,
} from './quick-play-types';

// =============================================================================
// QUICK PLAY SERVICE
// =============================================================================

/**
 * Service for Quick Play instant matchmaking.
 *
 * Quick Play allows players to tap "Play Now" and get matched instantly
 * against other players. If the queue is not full within the timeout,
 * the remaining seats are filled so the match can start.
 *
 * Supports two game categories:
 * - **Esport:** 1v1, FFA-3, FFA-4 with entry fees, winner-takes-all prizes
 * - **Social:** Big 2, Mahjong, 13-Card Poker with point values, rake
 *
 * Socket events (listen via `sdk.realtime.on(event, handler)`):
 * - `quick-play:searching`  - Joined queue, searching for opponents
 * - `quick-play:found`      - Match found with all human players
 * - `quick-play:filling`    - Remaining seats being filled (SDK 3.7.0 P3)
 * - `quick-play:starting`   - Match launching (all seats ready)
 *
 * All endpoints require authentication.
 * All paths use /api/v1/lobby/quick-play/ prefix.
 *
 * 3 endpoints total.
 *
 * @example
 * ```ts
 * // Join Quick Play
 * const result = await sdk.quickPlay.joinQuickPlay({
 *   gameId: 'abc-123',
 *   entryFee: 5,
 *   playerCount: 2,
 *   currency: 'USDT_BSC',
 * });
 *
 * // Listen for match events
 * sdk.realtime.on('quick-play:found', (data) => {
 *   console.log('Match found!', data.matchId);
 * });
 *
 * // Leave queue
 * await sdk.quickPlay.leaveQuickPlay();
 * ```
 */
export class QuickPlayService {
  private readonly http: HttpClient;
  private readonly debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ---------------------------------------------------------------------------
  // Join Quick Play Queue
  // POST /api/v1/lobby/quick-play/join
  // ---------------------------------------------------------------------------

  /**
   * Join a Quick Play matchmaking queue.
   *
   * Adds the player to the queue for the specified game, entry fee tier,
   * player count, and currency. If enough players are already in the queue,
   * a match is created immediately (check `result.matchId`). Otherwise,
   * the player waits and receives socket events as the queue progresses.
   *
   * Listen for the quick play socket events to follow the queue.
   *
   * @param params - Game ID, entry fee, player count, and currency.
   * @returns Queue position, estimated wait, and optional immediate match ID.
   * @throws If already in a queue, if Quick Play is not enabled, or if
   *         the entry fee / player count / currency is not in allowed tiers.
   */
  async joinQuickPlay(params: QuickPlayJoinParams): Promise<QuickPlayJoinResult> {
    this.log('joinQuickPlay', params.gameId, `$${params.entryFee}`, params.playerCount, params.currency);

    const response = await this.http.post<QuickPlayJoinResult>(
      '/api/v1/lobby/quick-play/join',
      params,
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Leave Quick Play Queue
  // POST /api/v1/lobby/quick-play/leave
  // ---------------------------------------------------------------------------

  /**
   * Leave the current Quick Play matchmaking queue.
   *
   * Removes the player from any active Quick Play queue. Safe to call even
   * if not currently in a queue.
   *
   * @returns `{ success: true }` if removed, `{ success: false }` if not in queue.
   */
  async leaveQuickPlay(): Promise<QuickPlayLeaveResult> {
    this.log('leaveQuickPlay');

    const response = await this.http.post<QuickPlayLeaveResult>(
      '/api/v1/lobby/quick-play/leave',
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Get Quick Play Status
  // GET /api/v1/lobby/quick-play/status
  // ---------------------------------------------------------------------------

  /**
   * Get the current Quick Play queue status for the authenticated user.
   *
   * Returns all active queue entries (a player can only be in one at a time),
   * including position, estimated wait time, and number of players in queue.
   *
   * @returns `{ inQueue: boolean, queues: QuickPlayStatusItem[] }`
   */
  async getQuickPlayStatus(): Promise<QuickPlayStatusResponse> {
    this.log('getQuickPlayStatus');

    const response = await this.http.get<QuickPlayStatusResponse>(
      '/api/v1/lobby/quick-play/status',
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Debug Logger
  // ---------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:QuickPlay]', ...args);
    }
  }
}