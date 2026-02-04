// =============================================================================
// Deskillz Web SDK - Private Room Types
// Path: src/rooms/room-types.ts
// All interfaces for private rooms (esports + social), invites, spectator
// Replicates: private-rooms.ts (lines 13-448, 1034-1160)
// =============================================================================

// =============================================================================
// ENUMS (const objects for runtime + type use)
// Replicates: private-rooms.ts (lines 13-100)
// =============================================================================

/**
 * Private room lifecycle status.
 * Replicates: private-rooms.ts PrivateRoomStatus (lines 17-26)
 */
export const PrivateRoomStatus = {
  WAITING: 'WAITING',
  READY_CHECK: 'READY_CHECK',
  COUNTDOWN: 'COUNTDOWN',
  LAUNCHING: 'LAUNCHING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;

export type PrivateRoomStatus = (typeof PrivateRoomStatus)[keyof typeof PrivateRoomStatus];

/**
 * Room visibility setting.
 * Replicates: private-rooms.ts RoomVisibility (lines 34-39)
 */
export const RoomVisibility = {
  PUBLIC: 'PUBLIC_LISTED',
  PUBLIC_LISTED: 'PUBLIC_LISTED',
  UNLISTED: 'UNLISTED',
  PRIVATE: 'PRIVATE',
} as const;

export type RoomVisibility = (typeof RoomVisibility)[keyof typeof RoomVisibility];

/**
 * Room tournament mode.
 * Replicates: private-rooms.ts TournamentMode (lines 47-50)
 */
export const RoomTournamentMode = {
  SYNC: 'SYNC',
  ASYNC: 'ASYNC',
} as const;

export type RoomTournamentMode = (typeof RoomTournamentMode)[keyof typeof RoomTournamentMode];

/**
 * Invite status.
 * Replicates: private-rooms.ts InviteStatus (lines 57-63)
 */
export const InviteStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;

export type InviteStatus = (typeof InviteStatus)[keyof typeof InviteStatus];

/**
 * Game category (esports vs social).
 * Replicates: private-rooms.ts GameCategory (lines 70-73)
 */
export const GameCategory = {
  ESPORTS: 'ESPORTS',
  SOCIAL: 'SOCIAL',
} as const;

export type GameCategory = (typeof GameCategory)[keyof typeof GameCategory];

/**
 * Social game type.
 * Replicates: private-rooms.ts SocialGameType (lines 80-84)
 */
export const SocialGameType = {
  BIG_TWO: 'BIG_TWO',
  MAHJONG: 'MAHJONG',
  CHINESE_POKER_13: 'CHINESE_POKER_13',
} as const;

export type SocialGameType = (typeof SocialGameType)[keyof typeof SocialGameType];

/**
 * Social room phase.
 * Replicates: private-rooms.ts SocialRoomPhase (lines 91-98)
 */
export const SocialRoomPhase = {
  LOBBY: 'LOBBY',
  ROUND_ACTIVE: 'ROUND_ACTIVE',
  ROUND_END: 'ROUND_END',
  PAUSED: 'PAUSED',
  SETTLING: 'SETTLING',
  CLOSED: 'CLOSED',
} as const;

export type SocialRoomPhase = (typeof SocialRoomPhase)[keyof typeof SocialRoomPhase];

// =============================================================================
// BASE TYPES
// Replicates: private-rooms.ts (lines 106-208)
// =============================================================================

/**
 * Player in a private room.
 * Replicates: private-rooms.ts PlayerInRoom (lines 106-114)
 */
export interface PlayerInRoom {
  id: string;
  odid: string;
  username: string;
  avatarUrl: string | null;
  isReady: boolean;
  isAdmin: boolean;
  joinedAt: string;
}

/**
 * Full private room record.
 * Replicates: private-rooms.ts PrivateRoom (lines 116-177)
 */
export interface PrivateRoom {
  id: string;
  roomCode: string;
  name: string;
  description: string | null;

  // Host info
  host: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };

  // Game info
  game: {
    id: string;
    name: string;
    iconUrl: string | null;
  };

  // Settings
  mode: RoomTournamentMode;
  entryFee: number;
  entryCurrency: string;
  prizePool: number;
  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;

  // Status & Visibility
  status: PrivateRoomStatus;
  visibility: RoomVisibility;
  inviteRequired: boolean;

  // Game Category
  gameCategory?: GameCategory;

  // Players
  players: PlayerInRoom[];

  // Timestamps
  createdAt: string;
  expiresAt: string;

  // Extended properties (for component compatibility)
  gameImageUrl?: string;
  gameName?: string;
  adminUsername?: string;
  readyPlayers?: number;
  isPlayer?: boolean;
  canJoin?: boolean;
  requiresApproval?: boolean;
  pendingRequest?: boolean;
  minSkillRating?: number | null;
  maxSkillRating?: number | null;

  // Social room extended properties
  socialSettings?: SocialGameSettings;
}

/**
 * Compact room listing item.
 * Replicates: private-rooms.ts RoomListItem (lines 179-208)
 */
export interface RoomListItem {
  id: string;
  roomCode: string;
  name: string;
  host: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  game: {
    id: string;
    name: string;
    iconUrl: string | null;
  };
  entryFee: number;
  entryCurrency: string;
  currentPlayers: number;
  maxPlayers: number;
  status: PrivateRoomStatus;
  visibility: RoomVisibility;
  mode: RoomTournamentMode;
  gameCategory?: GameCategory;

  // Extended
  gameImageUrl?: string | null;
  gameName?: string;
  adminUsername?: string;
  readyPlayers?: number;
  isPlayer?: boolean;
}

// =============================================================================
// SOCIAL GAME TYPES
// Replicates: private-rooms.ts (lines 214-384)
// =============================================================================

/**
 * Social game room settings.
 * Replicates: private-rooms.ts SocialGameSettings (lines 217-226)
 */
export interface SocialGameSettings {
  gameType: SocialGameType;
  pointValueUsd: number;
  rakePercentage: number;
  rakeCapPerRound: number;
  turnTimerSeconds: number;
  minBuyIn: number;
  defaultBuyIn: number;
  maxBuyIn?: number | null;
}

/**
 * Player in a social game room.
 * Replicates: private-rooms.ts SocialRoomPlayer (lines 231-257)
 */
export interface SocialRoomPlayer {
  id: string;
  odid: string;
  username: string;
  avatarUrl: string | null;

  // Game state
  isReady: boolean;
  isActive: boolean;
  isTurn: boolean;

  // Balance
  pointBalance: number;
  totalBuyIn: number;
  rebuyCount: number;

  // Session stats
  roundsPlayed: number;
  roundsWon: number;
  biggestWin: number;
  biggestLoss: number;
  rakePaid: number;

  // Timestamps
  joinedAt: string;
  lastActionAt: string;
}

/**
 * Social game room (full state).
 * Replicates: private-rooms.ts SocialRoom (lines 262-310)
 */
export interface SocialRoom {
  id: string;
  roomCode: string;
  name: string;
  description: string | null;

  gameCategory: 'SOCIAL';

  host: {
    id: string;
    odid: string;
    username: string;
    avatarUrl: string | null;
    hostTier?: string;
    revenueShare?: number;
  };

  game: {
    id: string;
    name: string;
    iconUrl: string | null;
    type: SocialGameType;
  };

  socialSettings: SocialGameSettings;

  minPlayers: number;
  maxPlayers: number;
  currentPlayers: number;
  visibility: RoomVisibility;
  inviteRequired: boolean;

  players: SocialRoomPlayer[];

  // Game state
  phase: SocialRoomPhase;
  currentRound: number;
  currentTurnOdid: string | null;
  turnStartedAt: string | null;
  turnEndsAt: string | null;
  isPaused: boolean;
  pauseRequestedBy: string | null;
  pauseVotes: { odid: string; approved: boolean }[];

  totalRakeCollected: number;

  createdAt: string;
  expiresAt: string | null;
}

/**
 * Social room round result.
 * Replicates: private-rooms.ts SocialRoundResult (lines 315-328)
 */
export interface SocialRoundResult {
  roundNumber: number;
  winnerOdid: string;
  winnerUsername: string;
  pointsWon: number;
  rakeDeducted: number;
  netPointsWon: number;
  loserResults: {
    odid: string;
    username: string;
    pointsLost: number;
  }[];
  timestamp: string;
}

// =============================================================================
// BUY-IN / CASH-OUT TYPES
// Replicates: private-rooms.ts (lines 333-384)
// =============================================================================

/**
 * Buy-in request.
 * Replicates: private-rooms.ts BuyInRequest (lines 333-337)
 */
export interface BuyInRequest {
  roomId: string;
  amount: number;
  currency: string;
}

/**
 * Buy-in response.
 * Replicates: private-rooms.ts BuyInResponse (lines 342-348)
 */
export interface BuyInResponse {
  success: boolean;
  transactionId: string;
  pointsReceived: number;
  newBalance: number;
  walletBalance: number;
}

/**
 * Cash-out response.
 * Replicates: private-rooms.ts CashOutResponse (lines 353-367)
 */
export interface CashOutResponse {
  success: boolean;
  transactionId: string;
  pointsCashedOut: number;
  amountReceived: number;
  currency: string;
  sessionStats: {
    totalBuyIn: number;
    totalCashOut: number;
    netProfitLoss: number;
    roundsPlayed: number;
    roundsWon: number;
    rakePaid: number;
  };
}

/**
 * Player session stats.
 * Replicates: private-rooms.ts SessionStats (lines 372-384)
 */
export interface SessionStats {
  totalBuyIn: number;
  currentBalance: number;
  pointsWon: number;
  pointsLost: number;
  netProfitLoss: number;
  roundsPlayed: number;
  roundsWon: number;
  winRate: number;
  rakePaid: number;
  biggestWin: number;
  biggestLoss: number;
}

// =============================================================================
// REQUEST TYPES
// Replicates: private-rooms.ts (lines 390-448)
// =============================================================================

/**
 * Request body for creating a private room.
 * Replicates: private-rooms.ts CreateRoomRequest (lines 390-419)
 */
export interface CreateRoomRequest {
  name: string;
  gameId: string;
  mode?: RoomTournamentMode;
  entryFee?: number;
  entryCurrency: string;
  minPlayers?: number;
  maxPlayers?: number;
  matchDuration?: number;
  roundsCount?: number;
  visibility?: RoomVisibility;
  inviteRequired?: boolean;
  prizeDistribution?: Record<string, number>;
  description?: string;

  // Game category
  gameCategory?: GameCategory;

  // Social game settings (only for SOCIAL category)
  socialSettings?: {
    gameType: SocialGameType;
    pointValueUsd: number;
    rakePercentage: number;
    rakeCapPerRound: number;
    turnTimerSeconds: number;
    minBuyIn: number;
    defaultBuyIn: number;
    maxBuyIn?: number | null;
  };
}

/**
 * Request body for updating room settings.
 */
export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  minPlayers?: number;
  maxPlayers?: number;
  visibility?: RoomVisibility;
  inviteRequired?: boolean;
}

/**
 * Room invite record.
 * Replicates: private-rooms.ts RoomInvite (lines 421-448)
 */
export interface RoomInvite {
  id: string;
  roomId: string;
  inviterId: string;
  inviteeId: string;
  message: string | null;
  status: InviteStatus;
  isRequest: boolean;
  createdAt: string;
  expiresAt: string;
  room: {
    id: string;
    roomCode: string;
    name: string;
    host: {
      id: string;
      username: string;
      avatarUrl: string | null;
    };
    game: {
      id: string;
      name: string;
      iconUrl: string | null;
    };
    entryFee: number;
    entryCurrency: string;
  };
}

/**
 * Request body for inviting a player.
 */
export interface InvitePlayerRequest {
  username?: string;
  odid?: string;
  message?: string;
}

// =============================================================================
// SPECTATOR TYPES
// Replicates: private-rooms.ts (lines 1041-1160)
// =============================================================================

/**
 * Spectator room state (sanitized view).
 * Replicates: private-rooms.ts SpectatorRoomState (lines 1041-1084)
 */
export interface SpectatorRoomState {
  roomId: string;
  roomCode: string;
  roomName: string;
  gameCategory: GameCategory;

  game: {
    id: string;
    name: string;
    iconUrl: string | null;
    type?: SocialGameType;
  };

  host: {
    username: string;
    avatarUrl: string | null;
  };

  // Room settings
  pointValueUsd?: number;
  rakePercentage?: number;
  turnTimerSeconds?: number;

  // Current state
  phase: SocialRoomPhase | PrivateRoomStatus;
  currentRound: number;
  currentTurnUsername: string | null;
  turnEndsAt: string | null;
  isPaused: boolean;

  // Players (limited info)
  players: SpectatorPlayer[];

  // Stats
  totalPot: number;
  totalRakeCollected: number;
  spectatorCount: number;

  // Timestamps
  startedAt: string | null;
  duration: number;
}

/**
 * Player info visible to spectators.
 * Replicates: private-rooms.ts SpectatorPlayer (lines 1089-1099)
 */
export interface SpectatorPlayer {
  odid: string;
  username: string;
  avatarUrl: string | null;
  pointBalance: number;
  isActive: boolean;
  isTurn: boolean;
  roundsWon: number;
  lastAction?: string;
  lastActionAt?: string;
}

/**
 * Action broadcast to spectators.
 * Replicates: private-rooms.ts SpectatorAction (lines 1104-1114)
 */
export interface SpectatorAction {
  roomId: string;
  roundNumber: number;
  player: {
    odid: string;
    username: string;
  };
  action: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

/**
 * Round result for spectators.
 * Replicates: private-rooms.ts SpectatorRoundResult (lines 1119-1134)
 */
export interface SpectatorRoundResult {
  roomId: string;
  roundNumber: number;
  winner: {
    odid: string;
    username: string;
    pointsWon: number;
  };
  losers: {
    odid: string;
    username: string;
    pointsLost: number;
  }[];
  rakeDeducted: number;
  timestamp: string;
}

/**
 * Player update for spectators.
 * Replicates: private-rooms.ts SpectatorPlayerUpdate (lines 1139-1149)
 */
export interface SpectatorPlayerUpdate {
  roomId: string;
  player: {
    odid: string;
    username: string;
  };
  updateType: 'balance' | 'status' | 'joined' | 'left' | 'busted';
  newBalance?: number;
  balanceChange?: number;
  isActive?: boolean;
}

/**
 * Spectator settings for a room.
 * Replicates: private-rooms.ts SpectatorSettings (lines 1154-1160)
 */
export interface SpectatorSettings {
  allowSpectators: boolean;
  maxSpectators: number;
  showBalances: boolean;
  showActions: boolean;
  delaySeconds: number;
}

// =============================================================================
// STATUS DISPLAY INFO
// Replicates: private-rooms.ts getStatusInfo (lines 480-501)
// =============================================================================

/**
 * Status display metadata.
 */
export interface StatusInfo {
  label: string;
  color: string;
}

/**
 * Social game type display metadata.
 */
export interface SocialGameTypeInfo {
  name: string;
  icon: string;
  minPlayers: number;
  maxPlayers: number;
  description: string;
}