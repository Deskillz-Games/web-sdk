// =============================================================================
// Deskillz Web SDK - Lobby Module Barrel Export
// Path: src/lobby/index.ts
// Re-exports all lobby and matchmaking modules
// =============================================================================

// Service
export { LobbyService } from './lobby-service';

// Types & Enums
export {
  GameMode,
  MatchStatus,
} from './lobby-types';

export type {
  GameWithLobbyStats,
  TournamentInfo,
  QueueStatus,
  QueueJoinResult,
  MatchDetails,
  MatchDetailsResponse,
  MatchFoundResult,
  PlayerInfo,
  DeepLinkConfig,
  LiveStats,
} from './lobby-types';