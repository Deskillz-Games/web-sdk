// =============================================================================
// Deskillz Web SDK - Socket Types
// Path: src/realtime/socket-types.ts
// All WebSocket event interfaces, data types, and state shapes
// Replicates from: socket.ts (lines 14-290), useRoomSocket.ts (lines 16-31)
// =============================================================================

// =============================================================================
// SERVER -> CLIENT EVENT DATA TYPES
// Replicates: socket.ts lines 164-251
// =============================================================================

/**
 * Match found data from matchmaking.
 * Replicates: socket.ts MatchFoundData (lines 164-183)
 */
export interface MatchFoundData {
  matchId: string;
  opponent: {
    odid: string;
    username: string;
    avatar: string;
    tier: string;
    rating: number;
  };
  game: {
    id: string;
    name: string;
    icon: string;
  };
  tournament?: {
    id: string;
    name: string;
    prizePool: number;
  };
}

/**
 * Tournament update data.
 * Replicates: socket.ts TournamentUpdateData (lines 185-192)
 */
export interface TournamentUpdateData {
  tournamentId: string;
  status: 'upcoming' | 'open' | 'in_progress' | 'completed' | 'cancelled';
  playerCount: number;
  maxPlayers: number;
  startsAt?: string;
  endsAt?: string;
}

/**
 * Tournament ended data with winners.
 * Replicates: socket.ts TournamentEndedData (lines 194-208)
 */
export interface TournamentEndedData {
  tournamentId: string;
  winners: Array<{
    odid: string;
    username: string;
    place: number;
    prize: number;
    score: number;
  }>;
  yourResult?: {
    place: number;
    prize: number;
    score: number;
  };
}

/**
 * Score submitted data.
 * Replicates: socket.ts ScoreSubmittedData (lines 210-217)
 */
export interface ScoreSubmittedData {
  tournamentId: string;
  odid: string;
  username: string;
  score: number;
  rank: number;
  timestamp: string;
}

/**
 * Leaderboard update data.
 * Replicates: socket.ts LeaderboardUpdateData (lines 219-230)
 */
export interface LeaderboardUpdateData {
  tournamentId?: string;
  gameId?: string;
  entries: Array<{
    rank: number;
    odid: string;
    username: string;
    avatar: string;
    score: number;
    change: number;
  }>;
}

/**
 * Notification type enum.
 */
export const NotificationType = {
  TOURNAMENT_START: 'tournament_start',
  TOURNAMENT_END: 'tournament_end',
  PRIZE_WON: 'prize_won',
  MATCH_FOUND: 'match_found',
  SYSTEM: 'system',
} as const;

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType];

/**
 * Notification data.
 * Replicates: socket.ts NotificationData (lines 232-239)
 */
export interface NotificationData {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Chat message data.
 * Replicates: socket.ts ChatMessageData (lines 241-251)
 */
export interface ChatMessageData {
  id: string;
  roomId: string;
  sender: {
    odid: string;
    username: string;
    avatar: string;
  };
  message: string;
  timestamp: string;
}

// =============================================================================
// SERVER -> CLIENT EVENTS MAP
// Replicates: socket.ts ServerToClientEvents (lines 15-107)
// =============================================================================

export interface ServerToClientEvents {
  // Connection lifecycle
  connect: () => void;
  disconnect: (reason: string) => void;
  error: (data: { message: string; code?: string }) => void;

  // Matchmaking (Legacy - SDK based)
  'matchmaking:searching': (data: { queuePosition: number; estimatedWait: number }) => void;
  'matchmaking:found': (data: MatchFoundData) => void;
  'matchmaking:ready_check': (data: { matchId: string; timeout: number }) => void;
  'matchmaking:player_ready': (data: { odid: string; username: string }) => void;
  'matchmaking:cancelled': (data: { reason: string }) => void;
  'matchmaking:starting': (data: { matchId: string; countdown: number }) => void;

  // Tournament
  'tournament:update': (data: TournamentUpdateData) => void;
  'tournament:player_joined': (data: { odid: string; username: string; playerCount: number }) => void;
  'tournament:player_left': (data: { odid: string; username: string; playerCount: number }) => void;
  'tournament:starting': (data: { tournamentId: string; countdown: number }) => void;
  'tournament:started': (data: { tournamentId: string }) => void;
  'tournament:ended': (data: TournamentEndedData) => void;
  'tournament:score_submitted': (data: ScoreSubmittedData) => void;

  // Leaderboard
  'leaderboard:update': (data: LeaderboardUpdateData) => void;

  // Notifications
  notification: (data: NotificationData) => void;

  // Chat
  'chat:message': (data: ChatMessageData) => void;

  // Global Lobby
  'lobby:player_count_update': (data: { gameId: string; activePlayers: number; inQueue: number }) => void;
  'lobby:match_found': (data: { matchId: string; gameId: string; tournamentId: string }) => void;
  'lobby:queue_update': (data: { tournamentId: string; position: number; estimatedWait: number }) => void;
  'lobby:game_stats': (data: { games: Array<{ gameId: string; activePlayers: number; inQueue: number }> }) => void;

  // Queue
  'lobby:queue_joined': (data: {
    success: boolean;
    tournamentId: string;
    gameId?: string;
    position: number;
    estimatedWait: number;
    entryFee: number;
    currency: string;
  }) => void;
  'lobby:queue_left': (data: { success: boolean; tournamentId: string }) => void;

  // Pre-Match Room
  'match:player_joined': (data: { player: { id: string; username: string; avatarUrl?: string; rating?: number } }) => void;
  'match:player_left': (data: { playerId: string }) => void;
  'match:ready_update': (data: { playerId: string; isReady: boolean }) => void;
  'match:all_ready': () => void;
  'match:state_change': (data: { state: string }) => void;
  'match:launch': (data: { deepLink: string; token: string }) => void;
  'match:cancelled': (data: { reason: string; declinedBy?: string }) => void;

  // Match Accept/Decline
  'match:accepted': (data: { matchId: string; success: boolean }) => void;
  'match:declined': (data: { matchId: string; success: boolean }) => void;
  'match:player_accepted': (data: { playerId: string; username: string }) => void;

  // Private Room State
  'room:state': (data: unknown) => void;

  // Private Room Player Events
  'private-room:player-joined': (data: { odid: string; username: string; avatarUrl: string | null }) => void;
  'private-room:player-left': (data: { odid: string }) => void;
  'private-room:player-kicked': (data: { odid: string }) => void;
  'private-room:player-ready': (data: { odid: string; isReady: boolean; allReady: boolean }) => void;

  // Private Room Admin Events
  'private-room:admin-transferred': (data: { newAdminId: string; newAdminUsername: string }) => void;

  // Private Room Game Start Events
  'private-room:countdown-started': (data: { countdownSeconds: number; prizePool: number }) => void;
  'private-room:countdown-tick': (data: { seconds: number }) => void;
  'private-room:launching': (data: { deepLink: string; token: string }) => void;

  // Private Room Status Events
  'private-room:cancelled': (data: { reason: string }) => void;
  'private-room:code-changed': (data: { roomCode: string }) => void;
  'private-room:join-request': (data: { requestId: string; odid: string }) => void;
}

// =============================================================================
// CLIENT -> SERVER EVENTS MAP
// Replicates: socket.ts ClientToServerEvents (lines 110-159)
// =============================================================================

export interface ClientToServerEvents {
  // Matchmaking (Legacy)
  'matchmaking:join': (data: { gameId: string; tournamentId?: string }) => void;
  'matchmaking:leave': () => void;
  'matchmaking:ready': (data: { matchId: string }) => void;

  // Tournament
  'tournament:join': (data: { tournamentId: string }) => void;
  'tournament:leave': (data: { tournamentId: string }) => void;
  'tournament:subscribe': (data: { tournamentId: string }) => void;
  'tournament:unsubscribe': (data: { tournamentId: string }) => void;

  // Gameplay
  'game:score_update': (data: { matchId: string; score: number }) => void;
  'game:state_sync': (data: { matchId: string; state: unknown }) => void;
  'game:complete': (data: { matchId: string; finalScore: number }) => void;

  // Chat
  'chat:send': (data: { roomId: string; message: string }) => void;
  'chat:join_room': (data: { roomId: string }) => void;
  'chat:leave_room': (data: { roomId: string }) => void;

  // Global Lobby
  'lobby:join': () => void;
  'lobby:leave': () => void;
  'lobby:subscribe_game': (data: { gameId: string }) => void;
  'lobby:unsubscribe_game': (data: { gameId: string }) => void;

  // Queue
  'lobby:join_queue': (data: { tournamentId: string }) => void;
  'lobby:leave_queue': (data: { tournamentId: string }) => void;

  // Pre-Match Room
  'match:join_room': (data: { matchId: string }) => void;
  'match:leave_room': (data: { matchId: string }) => void;
  'match:ready': (data: { matchId: string }) => void;
  'match:leave': (data: { matchId: string }) => void;

  // Match Accept/Decline
  'match:accept': (data: { matchId: string }) => void;
  'match:decline': (data: { matchId: string }) => void;

  // Private Room Subscriptions
  'room:subscribe': (data: { roomId: string }) => void;
  'room:unsubscribe': (data: { roomId: string }) => void;

  // Private Room Actions
  'room:ready': (data: { roomId: string; isReady: boolean }) => void;
  'room:chat': (data: { roomId: string; message: string }) => void;
}

// =============================================================================
// CONNECTION STATUS
// Replicates: socket.ts ConnectionStatus (lines 257-262)
// =============================================================================

export const ConnectionStatus = {
  CONNECTED: 'connected',
  CONNECTING: 'connecting',
  RECONNECTING: 'reconnecting',
  DISCONNECTED: 'disconnected',
  OFFLINE: 'offline',
} as const;

export type ConnectionStatus = (typeof ConnectionStatus)[keyof typeof ConnectionStatus];

// =============================================================================
// MATCH STATE
// =============================================================================

export const MatchState = {
  WAITING: 'waiting',
  READY_CHECK: 'ready_check',
  COUNTDOWN: 'countdown',
  LAUNCHING: 'launching',
  LAUNCHED: 'launched',
} as const;

export type MatchState = (typeof MatchState)[keyof typeof MatchState];

// =============================================================================
// LOBBY STATE
// Replicates: socket.ts LobbyState (lines 268-290)
// =============================================================================

export interface QueuedTournament {
  tournamentId: string;
  gameId: string;
  position: number;
  estimatedWait: number;
  queuedAt: Date;
  entryFee?: number;
  currency?: string;
}

export interface MatchPlayer {
  id: string;
  username: string;
  isReady: boolean;
  hasAccepted?: boolean;
}

export interface CurrentMatch {
  matchId: string;
  state: MatchState;
  players: MatchPlayer[];
}

export interface LobbyState {
  isInLobby: boolean;
  activeGames: Map<string, { activePlayers: number; inQueue: number }>;
  queuedTournaments: QueuedTournament[];
  currentMatch: CurrentMatch | null;
}

// =============================================================================
// MATCHMAKING STATE (Legacy)
// Replicates: socket.ts SocketState.matchmaking (lines 319-327)
// =============================================================================

export interface MatchmakingState {
  isSearching: boolean;
  queuePosition: number;
  estimatedWait: number;
  matchFound: MatchFoundData | null;
  readyCheck: { matchId: string; timeout: number } | null;
  playersReady: string[];
}

// =============================================================================
// SOCKET CLIENT STATE
// Replicates: socket.ts SocketState (lines 308-373)
// =============================================================================

export interface SocketClientState {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  reconnectAttempt: number;
  lastDisconnectReason: string | null;
  matchmaking: MatchmakingState;
  notifications: NotificationData[];
  unreadCount: number;
  lobbyState: LobbyState;
}

// =============================================================================
// PRIVATE ROOM STATE (for room socket)
// Replicates: useRoomSocket.ts PrivateRoomState (lines 16-31)
// =============================================================================

export interface PrivateRoomSocketState {
  isSubscribed: boolean;
  isConnecting: boolean;
  countdown: number | null;
  launchData: { deepLink: string; token: string } | null;
  cancelReason: string | null;
  error: string | null;
}

// =============================================================================
// SOCKET EVENT CALLBACK TYPES
// =============================================================================

/**
 * Typed callback for server events.
 * Used when subscribing to specific events via on().
 */
export type ServerEventCallback<K extends keyof ServerToClientEvents> =
  ServerToClientEvents[K] extends (data: infer D) => void
    ? (data: D) => void
    : () => void;

/**
 * Disconnect reason codes.
 * These map to socket.io's built-in disconnect reasons.
 */
export const DisconnectReason = {
  IO_SERVER_DISCONNECT: 'io server disconnect',
  IO_CLIENT_DISCONNECT: 'io client disconnect',
  TRANSPORT_CLOSE: 'transport close',
  TRANSPORT_ERROR: 'transport error',
  PING_TIMEOUT: 'ping timeout',
} as const;

export type DisconnectReason = (typeof DisconnectReason)[keyof typeof DisconnectReason];

/**
 * Disconnect reasons that should trigger automatic reconnection.
 * Replicates: socket.ts lines 533-538
 */
export const RECONNECTABLE_REASONS: readonly string[] = [
  DisconnectReason.IO_SERVER_DISCONNECT,
  DisconnectReason.TRANSPORT_CLOSE,
  DisconnectReason.TRANSPORT_ERROR,
  DisconnectReason.PING_TIMEOUT,
] as const;