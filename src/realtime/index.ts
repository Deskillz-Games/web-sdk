// =============================================================================
// Deskillz Web SDK - Realtime Module Barrel Export
// Path: src/realtime/index.ts
// Re-exports all real-time/WebSocket modules
// =============================================================================

// Socket Client
export { SocketClient } from './socket-client';
export type { SocketEventMap } from './socket-client';

// Reconnection Manager
export {
  ReconnectionManager,
  extractReconnectionConfig,
} from './reconnection-manager';
export type {
  ReconnectionConfig,
  ReconnectionCallbacks,
  ReconnectionState,
} from './reconnection-manager';

// Types & Enums
export {
  ConnectionStatus,
  MatchState,
  NotificationType,
  DisconnectReason,
  RECONNECTABLE_REASONS,
} from './socket-types';

export type {
  // Event maps
  ServerToClientEvents,
  ClientToServerEvents,
  ServerEventCallback,

  // Data types
  MatchFoundData,
  TournamentUpdateData,
  TournamentEndedData,
  ScoreSubmittedData,
  LeaderboardUpdateData,
  NotificationData,
  ChatMessageData,

  // State types
  SocketClientState,
  LobbyState,
  MatchmakingState,
  QueuedTournament,
  MatchPlayer,
  CurrentMatch,
  PrivateRoomSocketState,
} from './socket-types';