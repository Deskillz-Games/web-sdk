// =============================================================================
// Deskillz Web SDK - Game & Tournament Service
// Path: src/games/game-service.ts
// All game and tournament API operations
// Replicates: games.ts gamesApi (lines 96-244), tournaments.ts tournamentsApi (lines 120-259)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { QueryParams } from '../core/types';
import type {
  Game,
  GameFilters,
  PaginatedGamesResponse,
  CreateGameDto,
  UpdateGameDto,
  GameDeleteResponse,
  Tournament,
  TournamentFilters,
  PaginatedTournamentsResponse,
  TournamentEntry,
  LeaderboardEntry,
  PaginationMeta,
} from './game-types';

// =============================================================================
// GAME SERVICE
// =============================================================================

/**
 * Game service for browsing, searching, and managing games.
 *
 * Public endpoints (game browsing) do not require auth.
 * Developer endpoints (create/update/submit) require authentication.
 *
 * All endpoints use /api/v1/games/ prefix.
 * Replicates: games.ts gamesApi (lines 96-244)
 */
export class GameService {
  private http: HttpClient;
  private debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ---------------------------------------------------------------------------
  // Public Endpoints - Game Browsing
  // ---------------------------------------------------------------------------

  /**
   * Get all games with filtering and pagination.
   *
   * Endpoint: GET /api/v1/games
   * Replicates: games.ts gamesApi.getGames (lines 101-109)
   *
   * @param filters - Optional filters, pagination, and sorting.
   */
  async getGames(filters?: GameFilters): Promise<PaginatedGamesResponse> {
    this.log('Getting games', filters);

    const response = await this.http.get<
      { games: Game[]; pagination: PaginationMeta } | Game[]
    >('/api/v1/games', filters as QueryParams);

    const data = response.data;

    // Handle both { games, pagination } and direct array responses
    if (Array.isArray(data)) {
      return {
        data,
        pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
      };
    }
    if (data && 'games' in data) {
      return { data: data.games, pagination: data.pagination };
    }
    return { data: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } };
  }

  /**
   * Get featured games (top games by matches and rating).
   *
   * Endpoint: GET /api/v1/games/featured
   * Replicates: games.ts gamesApi.getFeaturedGames (lines 115-120)
   *
   * @param limit - Max games to return (default 6).
   */
  async getFeaturedGames(limit = 6): Promise<Game[]> {
    this.log('Getting featured games, limit:', limit);

    const response = await this.http.get<Game[] | { games: Game[] }>(
      '/api/v1/games/featured',
      { limit } as QueryParams
    );

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && 'games' in data) return data.games;
    return [];
  }

  /**
   * Get a single game by ID.
   *
   * Endpoint: GET /api/v1/games/:id
   * Replicates: games.ts gamesApi.getGame (lines 126-129)
   *
   * @param id - Game ID.
   */
  async getGame(id: string): Promise<Game> {
    this.log('Getting game:', id);

    const response = await this.http.get<Game | { game: Game }>(
      `/api/v1/games/${encodeURIComponent(id)}`
    );

    const data = response.data;
    if (data && 'game' in data) return data.game;
    return data as Game;
  }

  /**
   * Get a game by its URL slug.
   *
   * Endpoint: GET /api/v1/games/slug/:slug
   * Replicates: games.ts gamesApi.getGameBySlug (lines 135-138)
   *
   * @param slug - Game slug.
   */
  async getGameBySlug(slug: string): Promise<Game> {
    this.log('Getting game by slug:', slug);

    const response = await this.http.get<Game | { game: Game }>(
      `/api/v1/games/slug/${encodeURIComponent(slug)}`
    );

    const data = response.data;
    if (data && 'game' in data) return data.game;
    return data as Game;
  }

  /**
   * Search games by query string.
   * Convenience method that wraps getGames() with search filter.
   *
   * Replicates: games.ts gamesApi.searchGames (lines 143-150)
   *
   * @param query - Search query.
   * @param limit - Max results (default 10).
   */
  async searchGames(query: string, limit = 10): Promise<Game[]> {
    this.log('Searching games:', query);

    const result = await this.getGames({
      search: query,
      limit,
      status: 'APPROVED',
    });
    return result.data;
  }

  /**
   * Get games filtered by genre.
   * Convenience method that wraps getGames().
   *
   * Replicates: games.ts gamesApi.getGamesByGenre (lines 155-162)
   *
   * @param genre - Genre name.
   * @param limit - Max results (default 10).
   */
  async getGamesByGenre(genre: string, limit = 10): Promise<Game[]> {
    this.log('Getting games by genre:', genre);

    const result = await this.getGames({
      genre,
      limit,
      status: 'APPROVED',
    });
    return result.data;
  }

  /**
   * Get all unique genres from approved games.
   *
   * Replicates: games.ts gamesApi.getGenres (lines 167-179)
   */
  async getGenres(): Promise<string[]> {
    this.log('Getting genres');

    const result = await this.getGames({
      status: 'APPROVED',
      limit: 100,
    });

    const genreSet = new Set<string>();
    result.data.forEach((game) => {
      game.genre.forEach((g) => genreSet.add(g));
    });

    return Array.from(genreSet).sort();
  }

  /**
   * Get games that support private rooms.
   *
   * Replicates: games.ts gamesApi.getPrivateRoomGames (lines 184-193)
   */
  async getPrivateRoomGames(): Promise<Game[]> {
    this.log('Getting private room games');

    const result = await this.getGames({
      status: 'APPROVED',
      allowPrivateRooms: true,
      limit: 100,
      sortBy: 'name',
      sortOrder: 'asc',
    });
    return result.data;
  }

  // ---------------------------------------------------------------------------
  // Authenticated Endpoints - Player Actions
  // ---------------------------------------------------------------------------

  /**
   * Rate a game.
   *
   * Endpoint: POST /api/v1/games/:id/rate
   * Replicates: games.ts gamesApi.rateGame (lines 198-200)
   *
   * @param id - Game ID.
   * @param rating - Rating value (e.g. 1-5).
   */
  async rateGame(id: string, rating: number): Promise<void> {
    this.log('Rating game:', id, rating);

    await this.http.post(`/api/v1/games/${encodeURIComponent(id)}/rate`, { rating });
  }

  // ---------------------------------------------------------------------------
  // Developer Endpoints (Requires Auth)
  // Replicates: games.ts gamesApi (lines 202-243)
  // ---------------------------------------------------------------------------

  /**
   * Create a new game (developer only).
   *
   * Endpoint: POST /api/v1/games
   * Replicates: games.ts gamesApi.createGame (lines 209-212)
   *
   * @param data - Game creation data.
   */
  async createGame(data: CreateGameDto): Promise<Game> {
    this.log('Creating game:', data.name);

    const response = await this.http.post<Game>('/api/v1/games', data);
    return response.data;
  }

  /**
   * Update a game (developer only - must be owner).
   *
   * Endpoint: PUT /api/v1/games/:id
   * Replicates: games.ts gamesApi.updateGame (lines 217-220)
   *
   * @param id - Game ID.
   * @param data - Fields to update.
   */
  async updateGame(id: string, data: UpdateGameDto): Promise<Game> {
    this.log('Updating game:', id);

    const response = await this.http.put<Game>(
      `/api/v1/games/${encodeURIComponent(id)}`,
      data
    );
    return response.data;
  }

  /**
   * Submit a game for review (developer only).
   *
   * Endpoint: POST /api/v1/games/:id/submit
   * Replicates: games.ts gamesApi.submitForReview (lines 225-228)
   *
   * @param id - Game ID.
   */
  async submitForReview(id: string): Promise<Game> {
    this.log('Submitting game for review:', id);

    const response = await this.http.post<Game>(
      `/api/v1/games/${encodeURIComponent(id)}/submit`
    );
    return response.data;
  }

  /**
   * Delete a game (soft delete - developer or admin).
   *
   * Endpoint: DELETE /api/v1/games/:id
   * Replicates: games.ts gamesApi.deleteGame (lines 232-235)
   *
   * @param id - Game ID.
   */
  async deleteGame(id: string): Promise<GameDeleteResponse> {
    this.log('Deleting game:', id);

    const response = await this.http.delete<GameDeleteResponse>(
      `/api/v1/games/${encodeURIComponent(id)}`
    );
    return response.data;
  }

  /**
   * Restore a soft-deleted game (admin only).
   *
   * Endpoint: POST /api/v1/games/:id/restore
   * Replicates: games.ts gamesApi.restoreGame (lines 240-243)
   *
   * @param id - Game ID.
   */
  async restoreGame(id: string): Promise<Game> {
    this.log('Restoring game:', id);

    const response = await this.http.post<Game>(
      `/api/v1/games/${encodeURIComponent(id)}/restore`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Debug Logger
  // ---------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:Games]', ...args);
    }
  }
}

// =============================================================================
// TOURNAMENT SERVICE
// =============================================================================

/**
 * Tournament service for browsing, joining, and competing in tournaments.
 *
 * Public endpoints (tournament browsing, leaderboards) do not require auth.
 * Player endpoints (join/leave/score/entries) require authentication.
 *
 * All endpoints use /api/v1/tournaments/ prefix.
 * Replicates: tournaments.ts tournamentsApi (lines 120-259)
 */
export class TournamentService {
  private http: HttpClient;
  private debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ---------------------------------------------------------------------------
  // Public Endpoints - Tournament Browsing
  // ---------------------------------------------------------------------------

  /**
   * Get all tournaments with filtering and pagination.
   *
   * Endpoint: GET /api/v1/tournaments
   * Replicates: tournaments.ts tournamentsApi.getTournaments (lines 125-133)
   *
   * @param filters - Optional filters, pagination, and sorting.
   */
  async getTournaments(filters?: TournamentFilters): Promise<PaginatedTournamentsResponse> {
    this.log('Getting tournaments', filters);

    const response = await this.http.get<
      { tournaments: Tournament[]; pagination: PaginationMeta } | Tournament[]
    >('/api/v1/tournaments', filters as QueryParams);

    const data = response.data;

    if (Array.isArray(data)) {
      return {
        data,
        pagination: { page: 1, limit: data.length, total: data.length, totalPages: 1 },
      };
    }
    if (data && 'tournaments' in data) {
      return { data: data.tournaments, pagination: data.pagination };
    }
    return { data: [], pagination: { page: 1, limit: 0, total: 0, totalPages: 0 } };
  }

  /**
   * Get a single tournament by ID.
   *
   * Endpoint: GET /api/v1/tournaments/:id
   * Replicates: tournaments.ts tournamentsApi.getTournament (lines 139-142)
   *
   * @param id - Tournament ID.
   */
  async getTournament(id: string): Promise<Tournament> {
    this.log('Getting tournament:', id);

    const response = await this.http.get<Tournament | { tournament: Tournament }>(
      `/api/v1/tournaments/${encodeURIComponent(id)}`
    );

    const data = response.data;
    if (data && 'tournament' in data) return data.tournament;
    return data as Tournament;
  }

  /**
   * Get tournament leaderboard.
   *
   * Endpoint: GET /api/v1/tournaments/:id/leaderboard
   * Replicates: tournaments.ts tournamentsApi.getLeaderboard (lines 148-151)
   *
   * @param id - Tournament ID.
   */
  async getLeaderboard(id: string): Promise<LeaderboardEntry[]> {
    this.log('Getting leaderboard:', id);

    const response = await this.http.get<LeaderboardEntry[] | { leaderboard: LeaderboardEntry[] }>(
      `/api/v1/tournaments/${encodeURIComponent(id)}/leaderboard`
    );

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && 'leaderboard' in data) return data.leaderboard;
    return [];
  }

  /**
   * Get active tournaments for a specific game.
   *
   * Endpoint: GET /api/v1/tournaments/game/:gameId/active
   * Replicates: tournaments.ts tournamentsApi.getActiveTournamentsByGame (lines 157-160)
   *
   * @param gameId - Game ID.
   */
  async getActiveTournamentsByGame(gameId: string): Promise<Tournament[]> {
    this.log('Getting active tournaments for game:', gameId);

    const response = await this.http.get<Tournament[] | { tournaments: Tournament[] }>(
      `/api/v1/tournaments/game/${encodeURIComponent(gameId)}/active`
    );

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && 'tournaments' in data) return data.tournaments;
    return [];
  }

  /**
   * Get tournaments by game with optional status filter.
   * Convenience method that wraps getTournaments().
   *
   * Replicates: tournaments.ts tournamentsApi.getTournamentsByGame (lines 166-179)
   *
   * @param gameId - Game ID.
   * @param status - Optional status filter.
   * @param limit - Max results (default 20).
   */
  async getTournamentsByGame(
    gameId: string,
    status?: string,
    limit = 20
  ): Promise<Tournament[]> {
    this.log('Getting tournaments by game:', gameId, status);

    const result = await this.getTournaments({
      gameId,
      status,
      limit,
      sortBy: 'scheduledStart',
      sortOrder: 'asc',
    });
    return result.data;
  }

  /**
   * Get live / in-progress tournaments.
   * Convenience method that wraps getTournaments().
   *
   * Replicates: tournaments.ts tournamentsApi.getLiveTournaments (lines 184-192)
   *
   * @param limit - Max results (default 10).
   */
  async getLiveTournaments(limit = 10): Promise<Tournament[]> {
    this.log('Getting live tournaments');

    const result = await this.getTournaments({
      status: 'IN_PROGRESS',
      limit,
      sortBy: 'scheduledStart',
      sortOrder: 'asc',
    });
    return result.data;
  }

  /**
   * Get upcoming tournaments.
   * Convenience method that wraps getTournaments().
   *
   * Replicates: tournaments.ts tournamentsApi.getUpcomingTournaments (lines 197-205)
   *
   * @param limit - Max results (default 10).
   */
  async getUpcomingTournaments(limit = 10): Promise<Tournament[]> {
    this.log('Getting upcoming tournaments');

    const result = await this.getTournaments({
      status: 'UPCOMING',
      limit,
      sortBy: 'scheduledStart',
      sortOrder: 'asc',
    });
    return result.data;
  }

  /**
   * Get open tournaments (registration open).
   * Convenience method that wraps getTournaments().
   *
   * Replicates: tournaments.ts tournamentsApi.getOpenTournaments (lines 210-218)
   *
   * @param limit - Max results (default 10).
   */
  async getOpenTournaments(limit = 10): Promise<Tournament[]> {
    this.log('Getting open tournaments');

    const result = await this.getTournaments({
      status: 'OPEN',
      limit,
      sortBy: 'scheduledStart',
      sortOrder: 'asc',
    });
    return result.data;
  }

  // ---------------------------------------------------------------------------
  // Authenticated Endpoints - Player Actions
  // ---------------------------------------------------------------------------

  /**
   * Join a tournament.
   * Requires authentication and sufficient wallet balance for entry fee.
   *
   * Endpoint: POST /api/v1/tournaments/:id/join
   * Replicates: tournaments.ts tournamentsApi.joinTournament (lines 223-229)
   *
   * @param tournamentId - Tournament ID.
   * @param txHash - Optional blockchain transaction hash for entry fee payment.
   */
  async joinTournament(tournamentId: string, txHash?: string): Promise<TournamentEntry> {
    this.log('Joining tournament:', tournamentId);

    const response = await this.http.post<TournamentEntry>(
      `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/join`,
      { txHash }
    );
    return response.data;
  }

  /**
   * Leave a tournament.
   * Entry fee may be refunded depending on tournament rules.
   *
   * Endpoint: DELETE /api/v1/tournaments/:id/leave
   * Replicates: tournaments.ts tournamentsApi.leaveTournament (lines 234-236)
   *
   * @param tournamentId - Tournament ID.
   */
  async leaveTournament(tournamentId: string): Promise<void> {
    this.log('Leaving tournament:', tournamentId);

    await this.http.delete(
      `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/leave`
    );
  }

  /**
   * Submit a score for a tournament.
   * Score is HMAC-SHA256 signed by the game SDK before submission.
   *
   * Endpoint: POST /api/v1/tournaments/:id/score
   * Replicates: tournaments.ts tournamentsApi.submitScore (lines 241-250)
   *
   * @param tournamentId - Tournament ID.
   * @param score - Final score value.
   * @param metadata - Optional metadata (JSON string).
   */
  async submitScore(
    tournamentId: string,
    score: number,
    metadata?: string
  ): Promise<void> {
    this.log('Submitting score:', tournamentId, score);

    await this.http.post(
      `/api/v1/tournaments/${encodeURIComponent(tournamentId)}/score`,
      { score, metadata }
    );
  }

  /**
   * Get the current user's tournament entries.
   *
   * Endpoint: GET /api/v1/tournaments/user/entries
   * Replicates: tournaments.ts tournamentsApi.getMyEntries (lines 255-258)
   */
  async getMyEntries(): Promise<TournamentEntry[]> {
    this.log('Getting my tournament entries');

    const response = await this.http.get<TournamentEntry[] | { entries: TournamentEntry[] }>(
      '/api/v1/tournaments/user/entries'
    );

    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && 'entries' in data) return data.entries;
    return [];
  }

  // ---------------------------------------------------------------------------
  // Debug Logger
  // ---------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:Tournaments]', ...args);
    }
  }
}