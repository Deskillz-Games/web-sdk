// =============================================================================
// Deskillz Web SDK - Public API
// Path: src/index.ts
// Single entry point: import everything from '@deskillz/web-sdk'
// =============================================================================

// =============================================================================
// SDK ENTRY POINT
// =============================================================================

export { DeskillzSDK, createDeskillzSDK, SDK_VERSION } from './deskillz-sdk';
// =============================================================================
// BRIDGE (Universal Game Wrapper)
// =============================================================================

export { DeskillzBridge } from './DeskillzBridge';
export type {
  BridgeConfig,
  DeskillzUser,
  WalletBalance as BridgeWalletBalance,
  PrivateRoom as BridgePrivateRoom,
  GameScorePayload,
  BridgeEventType,
  BridgeEventCallback,
} from './DeskillzBridge';
// =============================================================================
// CORE
// =============================================================================

// Configuration
export { resolveConfig } from './core/config';
export type { DeskillzConfig, ResolvedConfig } from './core/config';

// Storage
export {
  TokenManager,
  LocalStorageAdapter,
  MemoryStorageAdapter,
  createDefaultStorage,
} from './core/storage';
export type { StorageAdapter } from './core/storage';

// HTTP Client
export { HttpClient } from './core/http-client';

// Event Emitter
export { TypedEventEmitter } from './core/event-emitter';

// Errors
export {
  DeskillzError,
  AuthError,
  NetworkError,
  ValidationError,
  RateLimitError,
  InsufficientFundsError,
  SocketError,
  SDKError,
  ErrorCode,
  createErrorFromResponse,
  createNetworkError,
  isDeskillzError,
  isErrorCode,
} from './core/errors';

// Core types & enums
export {
  GamePlatform as CoreGamePlatform,
  BuildPlatform,
  UserRole,
  Currency,
  SDKEventName,
} from './core/types';
export type {
  ApiResponse,
  PaginatedResponse,
  PaginationInfo,
  PaginationParams,
  SortOrder,
  DateRange,
  BackendUser,
  HttpMethod,
  QueryParams,
  SDKEventMap,
  RequireKeys,
  ExtractData,
  ExtractPaginatedItem,
} from './core/types';

// =============================================================================
// AUTH
// =============================================================================

export { AuthService } from './auth/auth-service';
export { WalletAuthService } from './auth/wallet-auth';
export { TwoFactorService } from './auth/two-factor';
export { TwoFactorTokenManager } from './auth/token-manager';

export { AuthMethod, SocialProvider, SIWE_DEFAULTS } from './auth/auth-types';
export type {
  TokenPair,
  AuthResponse,
  AuthResult,
  EmailRegisterPayload,
  EmailLoginPayload,
  ChangePasswordPayload,
  ResetPasswordPayload,
  SocialAuthPayload,
  NonceResponse,
  SIWEMessageParams,
  WalletVerifyPayload,
  WalletLinkPayload,
  WalletSignFunction,
  TwoFactorStatus,
  TwoFactorSetupResponse,
  TwoFactorEnableResponse,
  TwoFactorVerifyResponse,
  TwoFactorDisableResponse,
  RecoveryCodesResponse,
  RegenerateRecoveryCodesResponse,
  TwoFactorTokenState,
  AuthState,
  AuthEventMap,
} from './auth/auth-types';

// =============================================================================
// WALLET
// =============================================================================

export { WalletService } from './wallet/wallet-service';
export {
  ChainId,
  chainMeta,
  tokenAddresses,
  ERC20_ABI,
  SUPPORTED_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  formatAddress,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  getTokenAddress,
  isSupportedChain,
  getChainMeta,
  getAvailableTokens,
} from './wallet/chain-config';

export { TransactionType, TransactionStatus } from './wallet/wallet-types';
export type {
  WalletBalance,
  TotalBalanceUSD,
  SupportedCurrency,
  CryptoRate,
  Transaction,
  TransactionMetadata,
  TransactionFilters,
  DepositRequest,
  DepositAddress,
  WithdrawRequest,
} from './wallet/wallet-types';

// =============================================================================
// LOBBY
// =============================================================================

export { LobbyService } from './lobby/lobby-service';

export { GameMode, MatchStatus } from './lobby/lobby-types';
export type {
  GameWithLobbyStats,
  TournamentInfo,
  QueueStatus,
  QueueJoinResult,
  MatchDetails,
  MatchFoundResult,
  PlayerInfo,
  MatchDetailsResponse,
  DeepLinkConfig,
  LiveStats,
} from './lobby/lobby-types';

// =============================================================================
// GAMES & TOURNAMENTS
// =============================================================================

export { GameService, TournamentService } from './games/game-service';

export {
  GamePlatform,
  GameStatus,
  TournamentMode,
  TournamentStatus,
  TournamentEntryStatus,
} from './games/game-types';
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
} from './games/game-types';

// =============================================================================
// PRIVATE ROOMS
// =============================================================================

export { PrivateRoomService, SpectatorService } from './rooms/room-service';

// Helpers
export {
  enrichRoomData,
  enrichRoomList,
  getStatusInfo,
  getSocialGameTypeInfo,
  calculateBuyInLimits,
  formatPointsAsUsd,
  needsRebuy,
  hasLowBalance,
} from './rooms/room-service';

// Enums
export {
  PrivateRoomStatus,
  RoomVisibility,
  RoomTournamentMode,
  InviteStatus,
  GameCategory,
  SocialGameType,
  SocialRoomPhase,
} from './rooms/room-types';

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
} from './rooms/room-types';

// =============================================================================
// REAL-TIME
// =============================================================================

export { SocketClient } from './realtime/socket-client';
export { ReconnectionManager } from './realtime/reconnection-manager';

export {
  ConnectionStatus,
  NotificationType,
  MatchState,
  DisconnectReason,
  RECONNECTABLE_REASONS,
} from './realtime/socket-types';
export type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketClientState,
  MatchmakingState,
  LobbyState,
  QueuedTournament,
  MatchPlayer,
  CurrentMatch,
  MatchFoundData,
  TournamentUpdateData,
  TournamentEndedData,
  ScoreSubmittedData,
  LeaderboardUpdateData,
  NotificationData,
  ChatMessageData,
  PrivateRoomSocketState,
  ServerEventCallback,
} from './realtime/socket-types';