// =============================================================================
// Deskillz Web SDK - Games & Tournaments Module Barrel Export
// Path: src/games/index.ts
// Re-exports all game and tournament services, types, and enums
// =============================================================================

// Services
export { GameService } from './game-service';
export { TournamentService } from './game-service';

// Enums (const objects)
export {
  GamePlatform,
  GameStatus,
  TournamentMode,
  TournamentStatus,
  TournamentEntryStatus,
} from './game-types';

// Types
export type {
  Game,
  GameStats,
  GameFilters,
  PaginationMeta,
  PaginatedGamesResponse,
  CreateGameDto,
  UpdateGameDto,
  GameDeleteResponse,
  Tournament,
  PrizeDistribution,
  TournamentEntry,
  LeaderboardEntry,
  TournamentFilters,
  PaginatedTournamentsResponse,
  JoinTournamentRequest,
  SubmitScoreRequest,
} from './game-types';