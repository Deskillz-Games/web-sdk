// =============================================================================
// Deskillz Web SDK - Lobby Types
// Path: src/lobby/lobby-types.ts
// All lobby interfaces for games, tournaments, queues, matches, and players
// Replicates from: lobby.ts (lines 12-111)
// =============================================================================

// -----------------------------------------------------------------------------
// Game Types
// Replicates: lobby.ts GameWithLobbyStats (lines 12-36)
// -----------------------------------------------------------------------------

/**
 * Game with live lobby statistics.
 * Returned by GET /api/v1/lobby/games.
 * Replicates: lobby.ts GameWithLobbyStats (lines 12-36)
 */
export interface GameWithLobbyStats {
  id: string;
  name: string;
  description?: string;
  developer?: string;
  imageUrl?: string;
  iconUrl?: string;
  supportsSynchronous: boolean;
  supportsAsynchronous: boolean;
  deepLinkScheme?: string;

  // App Detection Fields (Phase 4)
  androidUrl?: string;
  iosUrl?: string;

  // Live stats
  activePlayers: number;
  playersInQueue: number;
  activeTournaments: number;
  totalPrizePool: number;
  minEntryFee: number;
  maxEntryFee: number;

  // Available tournaments
  tournaments?: TournamentInfo[];
}

// -----------------------------------------------------------------------------
// Tournament Types
// Replicates: lobby.ts TournamentInfo (lines 38-50)
// -----------------------------------------------------------------------------

/**
 * Game mode enum.
 */
export const GameMode = {
  SYNC: 'sync',
  ASYNC: 'async',
} as const;

export type GameMode = (typeof GameMode)[keyof typeof GameMode];

/**
 * Tournament information with queue stats.
 * Replicates: lobby.ts TournamentInfo (lines 38-50)
 */
export interface TournamentInfo {
  id: string;
  name: string;
  mode: GameMode;
  entryFee: number;
  prizePool: number;
  currency: string;
  playersInQueue: number;
  estimatedWait: number;
  minPlayers: number;
  maxPlayers: number;
  matchDuration: number;
}

// -----------------------------------------------------------------------------
// Queue Types
// Replicates: lobby.ts QueueStatus (lines 52-59), QueueJoinResult (lines 94-102)
// -----------------------------------------------------------------------------

/**
 * Current queue status for the user.
 * Returned by GET /api/v1/lobby/queue/status.
 * Replicates: lobby.ts QueueStatus (lines 52-59)
 */
export interface QueueStatus {
  tournamentId: string;
  position: number;
  estimatedWait: number;
  entryFee: number;
  currency: string;
  queuedAt: string;
}

/**
 * Result of joining a tournament queue.
 * Returned by POST /api/v1/lobby/queue/join.
 * Replicates: lobby.ts QueueJoinResult (lines 94-102)
 */
export interface QueueJoinResult {
  success: boolean;
  queueId: string;
  tournamentId: string;
  position: number;
  estimatedWait: number;
  entryFee: number;
  currency: string;
}

// -----------------------------------------------------------------------------
// Match Types
// Replicates: lobby.ts MatchDetails (lines 61-82), MatchFoundResult (lines 104-111)
// -----------------------------------------------------------------------------

/**
 * Match status enum.
 */
export const MatchStatus = {
  WAITING: 'waiting',
  READY_CHECK: 'ready_check',
  STARTING: 'starting',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export type MatchStatus = (typeof MatchStatus)[keyof typeof MatchStatus];

/**
 * Detailed match information for the pre-match room.
 * Returned by GET /api/v1/lobby/matches/:matchId.
 * Replicates: lobby.ts MatchDetails (lines 61-82)
 */
export interface MatchDetails {
  id: string;
  tournamentId: string;
  status: MatchStatus;
  mode: GameMode;
  entryFee: number;
  prizePool: number;
  currency: string;
  maxPlayers: number;
  matchDuration: number;
  token?: string;
  game?: {
    id: string;
    name: string;
    imageUrl?: string;
    deepLinkScheme?: string;
  };
  tournament?: {
    id: string;
    name: string;
  };
}

/**
 * Result returned when a match is found by the matchmaking system.
 * Replicates: lobby.ts MatchFoundResult (lines 104-111)
 */
export interface MatchFoundResult {
  matchId: string;
  tournamentId: string;
  gameId: string;
  players: PlayerInfo[];
  deepLink: string;
  token: string;
}

// -----------------------------------------------------------------------------
// Player Types
// Replicates: lobby.ts PlayerInfo (lines 84-92)
// -----------------------------------------------------------------------------

/**
 * Player information in lobby/match context.
 * Replicates: lobby.ts PlayerInfo (lines 84-92)
 */
export interface PlayerInfo {
  id: string;
  username: string;
  avatarUrl?: string;
  rating?: number;
  wins?: number;
  tier?: string;
  isReady?: boolean;
}

// -----------------------------------------------------------------------------
// Match Details Response
// (Combined response shape from getMatchDetails)
// -----------------------------------------------------------------------------

/**
 * Response from GET /api/v1/lobby/matches/:matchId.
 */
export interface MatchDetailsResponse {
  match: MatchDetails;
  players: PlayerInfo[];
  currentUserId: string;
}

// -----------------------------------------------------------------------------
// Deep Link Configuration
// (Response from getDeepLinkConfig)
// -----------------------------------------------------------------------------

/**
 * Deep link configuration for launching a game.
 * Returned by GET /api/v1/lobby/games/:gameId/deep-link.
 */
export interface DeepLinkConfig {
  scheme: string;
  iosAppId?: string;
  androidPackage?: string;
  fallbackUrl?: string;
}

// -----------------------------------------------------------------------------
// Live Stats
// (Response from getLiveStats)
// -----------------------------------------------------------------------------

/**
 * Live platform-wide statistics.
 * Returned by GET /api/v1/lobby/stats/live.
 */
export interface LiveStats {
  totalPlayers: number;
  totalInQueue: number;
  activeMatches: number;
  gameStats: Array<{
    gameId: string;
    activePlayers: number;
    inQueue: number;
  }>;
}