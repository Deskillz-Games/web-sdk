// =============================================================================
// Deskillz Web SDK - Lobby Service
// Path: src/lobby/lobby-service.ts
// All lobby API operations: games, tournaments, queues, matches, stats
// Replicates: lobby.ts lobbyApi (lines 273-459)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type {
  GameWithLobbyStats,
  TournamentInfo,
  QueueStatus,
  QueueJoinResult,
  MatchDetailsResponse,
  DeepLinkConfig,
  LiveStats,
} from './lobby-types';

/**
 * Lobby service for managing game browsing, tournament queues,
 * matchmaking, and live platform statistics.
 *
 * All endpoints use /api/v1/lobby/ prefix.
 * Public endpoints (game browsing, stats) do not require auth.
 * Queue and match endpoints require authentication.
 */
export class LobbyService {
  private http: HttpClient;
  private debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ---------------------------------------------------------------------------
  // Game Browsing
  // Replicates: lobby.ts lobbyApi.getGamesWithStats (lines 277-285)
  // ---------------------------------------------------------------------------

  /**
   * Get all games with live lobby statistics.
   * Returns games with active player counts, queue sizes, and tournaments.
   *
   * Endpoint: GET /api/v1/lobby/games
   * Replicates: lobby.ts lobbyApi.getGamesWithStats (lines 277-285)
   */
  async getGamesWithStats(): Promise<GameWithLobbyStats[]> {
    this.log('Getting games with lobby stats');

    const response = await this.http.get<{ games: GameWithLobbyStats[] } | GameWithLobbyStats[]>(
      '/api/v1/lobby/games'
    );

    // Handle both { games: [...] } and direct array responses
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && 'games' in data) return data.games;
    return [];
  }

  /**
   * Get a single game with detailed lobby statistics.
   *
   * Endpoint: GET /api/v1/lobby/games/:gameId
   * Replicates: lobby.ts lobbyApi.getGameWithStats (lines 290-300)
   *
   * @param gameId - Game ID.
   */
  async getGameWithStats(gameId: string): Promise<GameWithLobbyStats> {
    this.log('Getting game with stats:', gameId);

    const response = await this.http.get<{ game: GameWithLobbyStats } | GameWithLobbyStats>(
      `/api/v1/lobby/games/${encodeURIComponent(gameId)}`
    );

    const data = response.data;
    if (data && 'game' in data) return data.game;
    return data as GameWithLobbyStats;
  }

  // ---------------------------------------------------------------------------
  // Tournaments
  // Replicates: lobby.ts lobbyApi.getGameTournaments (lines 305-316)
  // ---------------------------------------------------------------------------

  /**
   * Get available tournaments for a specific game.
   *
   * Endpoint: GET /api/v1/lobby/games/:gameId/tournaments
   * Replicates: lobby.ts lobbyApi.getGameTournaments (lines 305-316)
   *
   * @param gameId - Game ID.
   */
  async getGameTournaments(gameId: string): Promise<TournamentInfo[]> {
    this.log('Getting tournaments for game:', gameId);

    const response = await this.http.get<{ tournaments: TournamentInfo[] } | TournamentInfo[]>(
      `/api/v1/lobby/games/${encodeURIComponent(gameId)}/tournaments`
    );

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && 'tournaments' in data) return data.tournaments;
    return [];
  }

  // ---------------------------------------------------------------------------
  // Queue Management (auth required)
  // Replicates: lobby.ts lobbyApi.joinQueue (lines 321-326),
  //   leaveQueue (lines 331-336), getQueueStatus (lines 341-349)
  // ---------------------------------------------------------------------------

  /**
   * Join a tournament queue.
   * Deducts entry fee and adds the player to the matchmaking pool.
   *
   * Endpoint: POST /api/v1/lobby/queue/join
   * Replicates: lobby.ts lobbyApi.joinQueue (lines 321-326)
   *
   * @param tournamentId - Tournament ID to join.
   */
  async joinQueue(tournamentId: string): Promise<QueueJoinResult> {
    this.log('Joining queue:', tournamentId);

    const response = await this.http.post<QueueJoinResult>(
      '/api/v1/lobby/queue/join',
      { tournamentId }
    );
    return response.data;
  }

  /**
   * Leave a tournament queue.
   * Refunds the entry fee if applicable.
   *
   * Endpoint: POST /api/v1/lobby/queue/leave
   * Replicates: lobby.ts lobbyApi.leaveQueue (lines 331-336)
   *
   * @param tournamentId - Tournament ID to leave.
   */
  async leaveQueue(tournamentId: string): Promise<{ success: boolean }> {
    this.log('Leaving queue:', tournamentId);

    const response = await this.http.post<{ success: boolean }>(
      '/api/v1/lobby/queue/leave',
      { tournamentId }
    );
    return response.data;
  }

  /**
   * Get current queue status for the authenticated user.
   * Returns all active queue entries.
   *
   * Endpoint: GET /api/v1/lobby/queue/status
   * Replicates: lobby.ts lobbyApi.getQueueStatus (lines 341-349)
   */
  async getQueueStatus(): Promise<QueueStatus[]> {
    this.log('Getting queue status');

    const response = await this.http.get<{ queues: QueueStatus[] } | QueueStatus[]>(
      '/api/v1/lobby/queue/status'
    );

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && 'queues' in data) return data.queues;
    return [];
  }

  // ---------------------------------------------------------------------------
  // Match Management (auth required)
  // Replicates: lobby.ts lobbyApi.getMatchDetails (lines 354-365),
  //   signalReady (lines 370-373), leaveMatch (lines 378-381),
  //   acceptMatch (lines 386-391), declineMatch (lines 396-401)
  // ---------------------------------------------------------------------------

  /**
   * Get match details for the pre-match room.
   * Includes match info, player list, and current user ID.
   *
   * Endpoint: GET /api/v1/lobby/matches/:matchId
   * Replicates: lobby.ts lobbyApi.getMatchDetails (lines 354-365)
   *
   * @param matchId - Match ID.
   */
  async getMatchDetails(matchId: string): Promise<MatchDetailsResponse> {
    this.log('Getting match details:', matchId);

    const response = await this.http.get<MatchDetailsResponse>(
      `/api/v1/lobby/matches/${encodeURIComponent(matchId)}`
    );
    return response.data;
  }

  /**
   * Signal ready in the pre-match room.
   *
   * Endpoint: POST /api/v1/lobby/matches/:matchId/ready
   * Replicates: lobby.ts lobbyApi.signalReady (lines 370-373)
   *
   * @param matchId - Match ID.
   */
  async signalReady(matchId: string): Promise<{ success: boolean }> {
    this.log('Signaling ready:', matchId);

    const response = await this.http.post<{ success: boolean }>(
      `/api/v1/lobby/matches/${encodeURIComponent(matchId)}/ready`
    );
    return response.data;
  }

  /**
   * Leave a match before it starts (forfeit).
   *
   * Endpoint: POST /api/v1/lobby/matches/:matchId/leave
   * Replicates: lobby.ts lobbyApi.leaveMatch (lines 378-381)
   *
   * @param matchId - Match ID.
   */
  async leaveMatch(matchId: string): Promise<{ success: boolean }> {
    this.log('Leaving match:', matchId);

    const response = await this.http.post<{ success: boolean }>(
      `/api/v1/lobby/matches/${encodeURIComponent(matchId)}/leave`
    );
    return response.data;
  }

  /**
   * Accept a match during the ready check phase.
   *
   * Endpoint: POST /api/v1/lobby/matches/:matchId/accept
   * Replicates: lobby.ts lobbyApi.acceptMatch (lines 386-391)
   *
   * @param matchId - Match ID.
   */
  async acceptMatch(matchId: string): Promise<{ success: boolean; matchId: string }> {
    this.log('Accepting match:', matchId);

    const response = await this.http.post<{ success: boolean; matchId: string }>(
      `/api/v1/lobby/matches/${encodeURIComponent(matchId)}/accept`
    );
    return response.data;
  }

  /**
   * Decline a match during the ready check phase.
   *
   * Endpoint: POST /api/v1/lobby/matches/:matchId/decline
   * Replicates: lobby.ts lobbyApi.declineMatch (lines 396-401)
   *
   * @param matchId - Match ID.
   */
  async declineMatch(matchId: string): Promise<{ success: boolean }> {
    this.log('Declining match:', matchId);

    const response = await this.http.post<{ success: boolean }>(
      `/api/v1/lobby/matches/${encodeURIComponent(matchId)}/decline`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Deep Link Configuration
  // Replicates: lobby.ts lobbyApi.getDeepLinkConfig (lines 406-419)
  // ---------------------------------------------------------------------------

  /**
   * Get deep link configuration for launching a specific game.
   * Used to construct the deep link URL for app-to-app navigation.
   *
   * Endpoint: GET /api/v1/lobby/games/:gameId/deep-link
   * Replicates: lobby.ts lobbyApi.getDeepLinkConfig (lines 406-419)
   *
   * @param gameId - Game ID.
   */
  async getDeepLinkConfig(gameId: string): Promise<DeepLinkConfig> {
    this.log('Getting deep link config:', gameId);

    const response = await this.http.get<DeepLinkConfig>(
      `/api/v1/lobby/games/${encodeURIComponent(gameId)}/deep-link`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Live Stats
  // Replicates: lobby.ts lobbyApi.getLiveStats (lines 424-459)
  // ---------------------------------------------------------------------------

  /**
   * Get live platform-wide statistics.
   * Returns total player counts, queue sizes, and per-game breakdowns.
   *
   * Endpoint: GET /api/v1/lobby/stats/live
   * Replicates: lobby.ts lobbyApi.getLiveStats (lines 424-459)
   */
  async getLiveStats(): Promise<LiveStats> {
    this.log('Getting live stats');

    const response = await this.http.get<LiveStats>(
      '/api/v1/lobby/stats/live'
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Debug Logger
  // ---------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:Lobby]', ...args);
    }
  }
}