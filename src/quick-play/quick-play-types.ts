// =============================================================================
// Deskillz Web SDK - Quick Play Types
// Path: src/quick-play/quick-play-types.ts
// All Quick Play matchmaking interfaces
// Endpoints: /api/v1/lobby/quick-play/*
// =============================================================================

// -----------------------------------------------------------------------------
// Join Parameters
// POST /api/v1/lobby/quick-play/join
// -----------------------------------------------------------------------------

/**
 * Parameters for joining a Quick Play queue.
 */
export interface QuickPlayJoinParams {
  /** Game ID to join Quick Play for */
  gameId: string;
  /** Entry fee (esport) or point value (social) in USD */
  entryFee: number;
  /** Number of players for the match (2 for 1v1, 3 for FFA-3, 4 for FFA-4 or social) */
  playerCount: number;
  /** Payment currency (e.g., 'BNB', 'USDT_BSC', 'USDC_TRON') */
  currency: string;
}

/**
 * Result of joining a Quick Play queue.
 * Returned by POST /api/v1/lobby/quick-play/join.
 */
export interface QuickPlayJoinResult {
  success: boolean;
  /** Unique queue key (e.g., 'qp:gameId:fee:count:currency') */
  queueKey: string;
  gameId: string;
  entryFee: number;
  playerCount: number;
  currency: string;
  /** Player's position in the queue */
  position: number;
  /** Estimated wait time in seconds */
  estimatedWait: number;
  /** Total players currently in this queue */
  playersInQueue: number;
  /** If a match was created immediately, the match ID */
  matchId?: string;
}

// -----------------------------------------------------------------------------
// Leave Result
// POST /api/v1/lobby/quick-play/leave
// -----------------------------------------------------------------------------

/**
 * Result of leaving a Quick Play queue.
 */
export interface QuickPlayLeaveResult {
  success: boolean;
}

// -----------------------------------------------------------------------------
// Queue Status
// GET /api/v1/lobby/quick-play/status
// -----------------------------------------------------------------------------

/**
 * A single Quick Play queue entry for the current user.
 */
export interface QuickPlayStatusItem {
  queueKey: string;
  gameId: string;
  entryFee: number;
  playerCount: number;
  currency: string;
  position: number;
  estimatedWait: number;
  playersInQueue: number;
  joinedAt: string;
}

/**
 * Full Quick Play status response.
 * Returned by GET /api/v1/lobby/quick-play/status.
 */
export interface QuickPlayStatusResponse {
  inQueue: boolean;
  queues: QuickPlayStatusItem[];
}

// -----------------------------------------------------------------------------
// Socket Event Data Types
// Emitted by server, consumed by SDK/Bridge
// -----------------------------------------------------------------------------

/**
 * Data for 'quick-play:searching' event.
 * Emitted when player successfully joins a queue.
 */
export interface QuickPlaySearchingData {
  queueKey: string;
  gameId: string;
  entryFee: number;
  playerCount: number;
  currency: string;
  position: number;
  playersInQueue: number;
}

/**
 * Data for 'quick-play:found' event.
 * Emitted when enough human players are matched.
 */
export interface QuickPlayFoundData {
  matchId: string;
  gameId: string;
  entryFee: number;
  currency: string;
  players: Array<{
    id: string;
    rating: number;
  }>;
}

/**
 * Data for 'quick-play:npc-filling' event.
 * Emitted when NPC bots are being added to fill remaining slots.
 */
export interface QuickPlayNPCFillingData {
  queueKey: string;
  gameId: string;
  npcsAdding: number;
  totalPlayers: number;
  requiredPlayers: number;
}

/**
 * Data for 'quick-play:starting' event.
 * Emitted when the match is about to launch (humans + NPCs assembled).
 */
export interface QuickPlayStartingData {
  matchId: string;
  gameId: string;
  entryFee: number;
  currency: string;
  players: Array<{
    id: string;
    rating: number;
  }>;
  npcCount: number;
}