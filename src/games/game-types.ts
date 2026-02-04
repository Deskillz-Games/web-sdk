// =============================================================================
// Deskillz Web SDK - Game & Tournament Types
// Path: src/games/game-types.ts
// All interfaces for games, tournaments, leaderboards, entries, and filters
// Replicates: games.ts (lines 8-274), tournaments.ts (lines 7-114)
// =============================================================================

// -----------------------------------------------------------------------------
// Game Platform
// Replicates: games.ts GamePlatform (line 8)
// -----------------------------------------------------------------------------

/**
 * Supported game platforms.
 * Matches backend GamePlatform enum.
 * Replicates: games.ts line 8
 */
export const GamePlatform = {
  ANDROID: 'ANDROID',
  IOS: 'IOS',
  BOTH: 'BOTH',
} as const;

export type GamePlatform = (typeof GamePlatform)[keyof typeof GamePlatform];

// -----------------------------------------------------------------------------
// Game Status
// Replicates: games.ts Game.status (line 33)
// -----------------------------------------------------------------------------

/**
 * Game lifecycle status.
 */
export const GameStatus = {
  DRAFT: 'DRAFT',
  PENDING_REVIEW: 'PENDING_REVIEW',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED',
} as const;

export type GameStatus = (typeof GameStatus)[keyof typeof GameStatus];

// -----------------------------------------------------------------------------
// Game Interface
// Replicates: games.ts Game (lines 10-47)
// -----------------------------------------------------------------------------

/**
 * Full game record.
 * Returned by GET /api/v1/games/:id.
 * Replicates: games.ts Game (lines 10-47)
 */
export interface Game {
  id: string;
  developerId: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  iconUrl: string;
  bannerUrl?: string;
  screenshots?: string[];
  videoUrl?: string;
  genre: string[];
  tags?: string[];
  platform: GamePlatform;
  androidUrl?: string;
  iosUrl?: string;
  minPlayers: number;
  maxPlayers: number;
  avgMatchDuration: number;
  supportsSync: boolean;
  supportsAsync: boolean;
  demoEnabled: boolean;
  allowPrivateRooms: boolean;
  status: GameStatus;
  totalMatches?: number;
  totalPlayers?: number;
  avgRating?: number;
  ratingCount?: number;
  tournamentsCount?: number;
  createdAt: string;
  approvedAt?: string;
  launchedAt?: string;
  developer?: {
    id: string;
    username: string;
    displayName?: string;
  };
}

// -----------------------------------------------------------------------------
// Game Stats
// Replicates: games.ts GameStats (lines 49-56)
// -----------------------------------------------------------------------------

/**
 * Aggregated game statistics.
 * Replicates: games.ts GameStats (lines 49-56)
 */
export interface GameStats {
  totalPlayers: number;
  activeTournaments: number;
  totalTournaments: number;
  totalPrizePool: number;
  avgRating: number;
  totalRatings: number;
}

// -----------------------------------------------------------------------------
// Game Filters
// Replicates: games.ts GameFilters (lines 58-69)
// -----------------------------------------------------------------------------

/**
 * Query parameters for filtering and paginating games.
 * Replicates: games.ts GameFilters (lines 58-69)
 */
export interface GameFilters {
  genre?: string;
  platform?: GamePlatform;
  status?: string;
  search?: string;
  developerId?: string;
  sortBy?: 'createdAt' | 'totalMatches' | 'avgRating' | 'name';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  allowPrivateRooms?: boolean;
}

// -----------------------------------------------------------------------------
// Pagination
// Shared between games and tournaments
// Replicates: games.ts (lines 74-78), tournaments.ts (lines 83-88)
// -----------------------------------------------------------------------------

/**
 * Standard pagination metadata.
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Paginated response wrapper for games.
 * Replicates: games.ts PaginatedGamesResponse (lines 82-90)
 */
export interface PaginatedGamesResponse {
  data: Game[];
  pagination: PaginationMeta;
}

// -----------------------------------------------------------------------------
// Game DTOs (Create / Update)
// Replicates: games.ts CreateGameDto (lines 251-272), UpdateGameDto (line 274)
// -----------------------------------------------------------------------------

/**
 * Data transfer object for creating a new game.
 * Replicates: games.ts CreateGameDto (lines 251-272)
 */
export interface CreateGameDto {
  name: string;
  description: string;
  shortDescription?: string;
  iconUrl: string;
  bannerUrl?: string;
  screenshots?: string[];
  videoUrl?: string;
  genre?: string[];
  tags?: string[];
  /** Must be ANDROID, IOS, or BOTH - matches backend GamePlatform enum */
  platform: GamePlatform;
  androidUrl?: string;
  iosUrl?: string;
  minPlayers?: number;
  maxPlayers?: number;
  avgMatchDuration?: number;
  supportsSync?: boolean;
  supportsAsync?: boolean;
  demoEnabled?: boolean;
  allowPrivateRooms?: boolean;
}

/**
 * Data transfer object for updating a game.
 * All fields are optional.
 * Replicates: games.ts UpdateGameDto (line 274)
 */
export interface UpdateGameDto extends Partial<CreateGameDto> {}

// =============================================================================
// TOURNAMENT TYPES
// Replicates: tournaments.ts (lines 7-114)
// =============================================================================

// -----------------------------------------------------------------------------
// Tournament Mode
// Replicates: tournaments.ts Tournament.mode (line 19)
// -----------------------------------------------------------------------------

/**
 * Tournament play mode.
 */
export const TournamentMode = {
  SYNC: 'SYNC',
  ASYNC: 'ASYNC',
} as const;

export type TournamentMode = (typeof TournamentMode)[keyof typeof TournamentMode];

// -----------------------------------------------------------------------------
// Tournament Status
// Replicates: tournaments.ts Tournament.status (line 20)
// -----------------------------------------------------------------------------

/**
 * Tournament lifecycle status.
 */
export const TournamentStatus = {
  UPCOMING: 'UPCOMING',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type TournamentStatus = (typeof TournamentStatus)[keyof typeof TournamentStatus];

// -----------------------------------------------------------------------------
// Tournament Interface
// Replicates: tournaments.ts Tournament (lines 7-33)
// -----------------------------------------------------------------------------

/**
 * Full tournament record.
 * Returned by GET /api/v1/tournaments/:id.
 * Replicates: tournaments.ts Tournament (lines 7-33)
 */
export interface Tournament {
  id: string;
  gameId: string;
  name: string;
  description?: string;
  entryFee: number;
  entryCurrency: string;
  prizePool: number;
  prizeCurrency: string;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  mode: TournamentMode;
  status: TournamentStatus;
  scheduledStart: string;
  scheduledEnd?: string;
  registrationEndsAt?: string;
  serviceFeePercent: number;
  createdAt: string;
  game?: {
    id: string;
    name: string;
    iconUrl: string;
    genre: string[];
  };
  prizeDistribution?: PrizeDistribution[];
}

// -----------------------------------------------------------------------------
// Prize Distribution
// Replicates: tournaments.ts PrizeDistribution (lines 35-39)
// -----------------------------------------------------------------------------

/**
 * Prize distribution for a single rank.
 * Replicates: tournaments.ts PrizeDistribution (lines 35-39)
 */
export interface PrizeDistribution {
  rank: number;
  percentage: number;
  amount: number;
}

// -----------------------------------------------------------------------------
// Tournament Entry
// Replicates: tournaments.ts TournamentEntry (lines 41-55)
// -----------------------------------------------------------------------------

/**
 * Entry status for a tournament participant.
 */
export const TournamentEntryStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  PLAYING: 'PLAYING',
  COMPLETED: 'COMPLETED',
  REFUNDED: 'REFUNDED',
} as const;

export type TournamentEntryStatus =
  (typeof TournamentEntryStatus)[keyof typeof TournamentEntryStatus];

/**
 * A user's entry in a tournament.
 * Replicates: tournaments.ts TournamentEntry (lines 41-55)
 */
export interface TournamentEntry {
  id: string;
  tournamentId: string;
  userId: string;
  entryTxHash?: string;
  status: TournamentEntryStatus;
  joinedAt: string;
  finalRank?: number;
  prizeWon?: number;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

// -----------------------------------------------------------------------------
// Leaderboard Entry
// Replicates: tournaments.ts LeaderboardEntry (lines 57-65)
// -----------------------------------------------------------------------------

/**
 * A single entry on a tournament leaderboard.
 * Replicates: tournaments.ts LeaderboardEntry (lines 57-65)
 */
export interface LeaderboardEntry {
  rank: number;
  odid: string;
  username: string;
  avatarUrl?: string;
  score: number;
  prizeWon?: number;
  submittedAt?: string;
}

// -----------------------------------------------------------------------------
// Tournament Filters
// Replicates: tournaments.ts TournamentFilters (lines 67-78)
// -----------------------------------------------------------------------------

/**
 * Query parameters for filtering and paginating tournaments.
 * Replicates: tournaments.ts TournamentFilters (lines 67-78)
 */
export interface TournamentFilters {
  gameId?: string;
  status?: string;
  mode?: string;
  minEntryFee?: number;
  maxEntryFee?: number;
  search?: string;
  sortBy?: 'scheduledStart' | 'prizePool' | 'entryFee' | 'currentPlayers';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * Paginated response wrapper for tournaments.
 * Replicates: tournaments.ts PaginatedTournamentsResponse (lines 91-99)
 */
export interface PaginatedTournamentsResponse {
  data: Tournament[];
  pagination: PaginationMeta;
}

// -----------------------------------------------------------------------------
// Request Types
// Replicates: tournaments.ts JoinTournamentRequest (lines 105-108),
//   SubmitScoreRequest (lines 110-114)
// -----------------------------------------------------------------------------

/**
 * Request body for joining a tournament.
 * Replicates: tournaments.ts JoinTournamentRequest (lines 105-108)
 */
export interface JoinTournamentRequest {
  tournamentId: string;
  txHash?: string;
}

/**
 * Request body for submitting a tournament score.
 * Replicates: tournaments.ts SubmitScoreRequest (lines 110-114)
 */
export interface SubmitScoreRequest {
  tournamentId: string;
  score: number;
  metadata?: string;
}

// -----------------------------------------------------------------------------
// Game Delete Response
// Replicates: games.ts deleteGame return type (line 232)
// -----------------------------------------------------------------------------

/**
 * Response from DELETE /api/v1/games/:id.
 */
export interface GameDeleteResponse {
  success: boolean;
  gameId: string;
  message: string;
  deletedAt: string;
}