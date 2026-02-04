// =============================================================================
// Deskillz Web SDK - Rooms Module Barrel Export
// Path: src/rooms/index.ts
// Re-exports all private room, social room, spectator services and types
// =============================================================================

// Services
export { PrivateRoomService, SpectatorService } from './room-service';

// Helper functions
export {
  enrichRoomData,
  enrichRoomList,
  getStatusInfo,
  getSocialGameTypeInfo,
  calculateBuyInLimits,
  formatPointsAsUsd,
  needsRebuy,
  hasLowBalance,
} from './room-service';

// Enums (const objects)
export {
  PrivateRoomStatus,
  RoomVisibility,
  RoomTournamentMode,
  InviteStatus,
  GameCategory,
  SocialGameType,
  SocialRoomPhase,
} from './room-types';

// Types
export type {
  PlayerInRoom,
  PrivateRoom,
  RoomListItem,
  SocialGameSettings,
  SocialRoomPlayer,
  SocialRoom,
  SocialRoundResult,
  BuyInRequest,
  BuyInResponse,
  CashOutResponse,
  SessionStats,
  CreateRoomRequest,
  UpdateRoomRequest,
  RoomInvite,
  InvitePlayerRequest,
  SpectatorRoomState,
  SpectatorPlayer,
  SpectatorAction,
  SpectatorRoundResult,
  SpectatorPlayerUpdate,
  SpectatorSettings,
  StatusInfo,
  SocialGameTypeInfo,
} from './room-types';