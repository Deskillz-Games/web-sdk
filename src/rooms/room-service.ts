// =============================================================================
// Deskillz Web SDK - Private Room Service
// Path: src/rooms/room-service.ts
// All private room, social room, and spectator API operations + helpers
// Replicates: private-rooms.ts privateRoomApi (lines 588-896),
//   spectatorApi (lines 1171-1205), helpers (lines 452-582)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { QueryParams } from '../core/types';
import {
  PrivateRoomStatus,
  type PrivateRoom,
  type RoomListItem,
  type CreateRoomRequest,
  type UpdateRoomRequest,
  type RoomInvite,
  type InvitePlayerRequest,
  type SocialRoom,
  type BuyInRequest,
  type BuyInResponse,
  type CashOutResponse,
  type SocialRoundResult,
  type SessionStats,
  type SpectatorRoomState,
  type StatusInfo,
  type SocialGameTypeInfo,
  type SocialRoomPlayer,
  type GameCategory,
  type SocialGameType,
} from './room-types';

// =============================================================================
// HELPER FUNCTIONS
// Replicates: private-rooms.ts (lines 452-582)
// =============================================================================

/**
 * Enrich a room object with computed/alias properties.
 * Replicates: private-rooms.ts enrichRoomData (lines 457-468)
 */
export function enrichRoomData(room: PrivateRoom, currentUserId?: string): PrivateRoom {
  return {
    ...room,
    gameImageUrl: room.game?.iconUrl || room.gameImageUrl,
    gameName: room.game?.name || room.gameName,
    adminUsername: room.host?.username || room.adminUsername,
    requiresApproval: room.inviteRequired,
    readyPlayers: room.players?.filter((p) => p.isReady).length ?? 0,
    isPlayer: currentUserId
      ? room.players?.some((p) => p.odid === currentUserId) ?? false
      : room.isPlayer,
    canJoin:
      room.status === PrivateRoomStatus.WAITING &&
      room.currentPlayers < room.maxPlayers,
  };
}

/**
 * Enrich a list of rooms.
 * Replicates: private-rooms.ts enrichRoomList (lines 473-475)
 */
export function enrichRoomList(
  rooms: PrivateRoom[],
  currentUserId?: string
): PrivateRoom[] {
  return rooms.map((room) => enrichRoomData(room, currentUserId));
}

/**
 * Get status display info (label + color).
 * Replicates: private-rooms.ts getStatusInfo (lines 480-501)
 */
export function getStatusInfo(status: string): StatusInfo {
  switch (status) {
    case PrivateRoomStatus.WAITING:
      return { label: 'Waiting', color: 'green' };
    case PrivateRoomStatus.READY_CHECK:
      return { label: 'Ready Check', color: 'yellow' };
    case PrivateRoomStatus.COUNTDOWN:
      return { label: 'Starting...', color: 'yellow' };
    case PrivateRoomStatus.LAUNCHING:
      return { label: 'Launching', color: 'cyan' };
    case PrivateRoomStatus.IN_PROGRESS:
      return { label: 'In Progress', color: 'cyan' };
    case PrivateRoomStatus.COMPLETED:
      return { label: 'Completed', color: 'gray' };
    case PrivateRoomStatus.CANCELLED:
      return { label: 'Cancelled', color: 'red' };
    case PrivateRoomStatus.EXPIRED:
      return { label: 'Expired', color: 'red' };
    default:
      return { label: status, color: 'gray' };
  }
}

/**
 * Get social game type display info.
 * Replicates: private-rooms.ts getSocialGameTypeInfo (lines 506-537)
 */
export function getSocialGameTypeInfo(type: SocialGameType): SocialGameTypeInfo {
  const types: Record<SocialGameType, SocialGameTypeInfo> = {
    BIG_TWO: {
      name: 'Big 2',
      icon: '[CARDS]',
      minPlayers: 2,
      maxPlayers: 4,
      description: 'Classic Chinese card game',
    },
    MAHJONG: {
      name: 'Mahjong',
      icon: '[MJ]',
      minPlayers: 4,
      maxPlayers: 4,
      description: 'Traditional tile-based game',
    },
    CHINESE_POKER_13: {
      name: '13-Card Poker',
      icon: '[POKER]',
      minPlayers: 2,
      maxPlayers: 4,
      description: 'Chinese poker with 13 cards',
    },
  };
  return types[type] || types.BIG_TWO;
}

/**
 * Calculate buy-in limits based on point value.
 * Replicates: private-rooms.ts calculateBuyInLimits (lines 542-554)
 */
export function calculateBuyInLimits(pointValueUsd: number): {
  minBuyIn: number;
  defaultBuyIn: number;
  minPoints: number;
  defaultPoints: number;
} {
  return {
    minBuyIn: pointValueUsd * 50,
    defaultBuyIn: pointValueUsd * 100,
    minPoints: 50,
    defaultPoints: 100,
  };
}

/**
 * Format point balance as USD.
 * Replicates: private-rooms.ts formatPointsAsUsd (lines 559-567)
 */
export function formatPointsAsUsd(points: number, pointValueUsd: number): string {
  const usdValue = points * pointValueUsd;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(usdValue);
}

/**
 * Check if player needs rebuy (balance is 0).
 * Replicates: private-rooms.ts needsRebuy (lines 572-574)
 */
export function needsRebuy(player: SocialRoomPlayer): boolean {
  return player.pointBalance <= 0 && player.isActive;
}

/**
 * Check if player has low balance (below 20 point threshold).
 * Replicates: private-rooms.ts hasLowBalance (lines 579-582)
 */
export function hasLowBalance(player: SocialRoomPlayer): boolean {
  const threshold = 20;
  return player.pointBalance > 0 && player.pointBalance <= threshold;
}

// =============================================================================
// PRIVATE ROOM SERVICE
// =============================================================================

/**
 * Private room service for creating, managing, and participating in
 * private esports and social game rooms.
 *
 * All endpoints use /api/v1/private-rooms/ prefix.
 * Most endpoints require authentication.
 * Replicates: private-rooms.ts privateRoomApi (lines 588-896)
 */
export class PrivateRoomService {
  private http: HttpClient;
  private debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ---------------------------------------------------------------------------
  // Base Room Operations
  // Replicates: private-rooms.ts privateRoomApi (lines 596-727)
  // ---------------------------------------------------------------------------

  /**
   * Create a new private room (esports or social).
   *
   * Endpoint: POST /api/v1/private-rooms
   * Replicates: private-rooms.ts privateRoomApi.createRoom (lines 596-599)
   */
  async createRoom(data: CreateRoomRequest): Promise<PrivateRoom> {
    this.log('Creating room:', data.name);

    const response = await this.http.post<PrivateRoom>('/api/v1/private-rooms', data);
    return enrichRoomData(response.data);
  }

  /**
   * Update room settings (admin only).
   *
   * Endpoint: PATCH /api/v1/private-rooms/:roomId
   * Replicates: private-rooms.ts privateRoomApi.updateRoom (lines 604-618)
   */
  async updateRoom(
    roomId: string,
    data: UpdateRoomRequest,
    currentUserId?: string
  ): Promise<PrivateRoom> {
    this.log('Updating room:', roomId);

    const response = await this.http.patch<PrivateRoom>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}`,
      data
    );
    return enrichRoomData(response.data, currentUserId);
  }

  /**
   * Get list of public/listed private rooms.
   *
   * Endpoint: GET /api/v1/private-rooms
   * Replicates: private-rooms.ts privateRoomApi.getPublicRooms (lines 623-635)
   */
  async getPublicRooms(
    gameId?: string,
    category?: GameCategory
  ): Promise<RoomListItem[]> {
    this.log('Getting public rooms', gameId, category);

    const params: Record<string, string> = {};
    if (gameId) params.gameId = gameId;
    if (category) params.category = category;

    const response = await this.http.get<RoomListItem[]>(
      '/api/v1/private-rooms',
      params as QueryParams
    );

    return response.data.map((room) => ({
      ...room,
      gameImageUrl: room.game?.iconUrl,
      gameName: room.game?.name,
      adminUsername: room.host?.username,
    }));
  }

  /**
   * Get current user's rooms (hosted + joined).
   *
   * Endpoint: GET /api/v1/private-rooms/my-rooms
   * Replicates: private-rooms.ts privateRoomApi.getMyRooms (lines 640-649)
   */
  async getMyRooms(): Promise<RoomListItem[]> {
    this.log('Getting my rooms');

    const response = await this.http.get<RoomListItem[]>(
      '/api/v1/private-rooms/my-rooms'
    );

    return response.data.map((room) => ({
      ...room,
      gameImageUrl: room.game?.iconUrl,
      gameName: room.game?.name,
      adminUsername: room.host?.username,
      isPlayer: true,
    }));
  }

  /**
   * Get a room by its invite code.
   *
   * Endpoint: GET /api/v1/private-rooms/code/:roomCode
   * Replicates: private-rooms.ts privateRoomApi.getRoomByCode (lines 654-657)
   */
  async getRoomByCode(roomCode: string, currentUserId?: string): Promise<PrivateRoom> {
    this.log('Getting room by code:', roomCode);

    const response = await this.http.get<PrivateRoom>(
      `/api/v1/private-rooms/code/${encodeURIComponent(roomCode)}`
    );
    return enrichRoomData(response.data, currentUserId);
  }

  /**
   * Get a room by ID.
   *
   * Endpoint: GET /api/v1/private-rooms/:roomId
   * Replicates: private-rooms.ts privateRoomApi.getRoomById (lines 662-665)
   */
  async getRoomById(roomId: string, currentUserId?: string): Promise<PrivateRoom> {
    this.log('Getting room by ID:', roomId);

    const response = await this.http.get<PrivateRoom>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}`
    );
    return enrichRoomData(response.data, currentUserId);
  }

  /**
   * Join a room by its invite code.
   *
   * Endpoint: POST /api/v1/private-rooms/join
   * Replicates: private-rooms.ts privateRoomApi.joinRoom (lines 670-673)
   */
  async joinRoom(roomCode: string, currentUserId?: string): Promise<PrivateRoom> {
    this.log('Joining room:', roomCode);

    const response = await this.http.post<PrivateRoom>(
      '/api/v1/private-rooms/join',
      { roomCode }
    );
    return enrichRoomData(response.data, currentUserId);
  }

  /**
   * Leave a room.
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/leave
   * Replicates: private-rooms.ts privateRoomApi.leaveRoom (lines 678-680)
   */
  async leaveRoom(roomId: string): Promise<void> {
    this.log('Leaving room:', roomId);

    await this.http.post(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/leave`
    );
  }

  /**
   * Set ready status in a room.
   *
   * Endpoint: PUT /api/v1/private-rooms/:roomId/ready
   * Replicates: private-rooms.ts privateRoomApi.setReady (lines 685-688)
   */
  async setReady(
    roomId: string,
    isReady: boolean,
    currentUserId?: string
  ): Promise<PrivateRoom> {
    this.log('Setting ready:', roomId, isReady);

    const response = await this.http.put<PrivateRoom>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/ready`,
      { isReady }
    );
    return enrichRoomData(response.data, currentUserId);
  }

  /**
   * Start the game (admin only).
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/start
   * Replicates: private-rooms.ts privateRoomApi.startGame (lines 693-696)
   */
  async startGame(roomId: string, currentUserId?: string): Promise<PrivateRoom> {
    this.log('Starting game:', roomId);

    const response = await this.http.post<PrivateRoom>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/start`
    );
    return enrichRoomData(response.data, currentUserId);
  }

  /**
   * Kick a player from the room (admin only).
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/kick
   * Replicates: private-rooms.ts privateRoomApi.kickPlayer (lines 701-712)
   */
  async kickPlayer(
    roomId: string,
    playerId: string,
    reason?: string,
    currentUserId?: string
  ): Promise<PrivateRoom> {
    this.log('Kicking player:', playerId, 'from', roomId);

    const response = await this.http.post<PrivateRoom>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/kick`,
      { playerId, reason }
    );
    return enrichRoomData(response.data, currentUserId);
  }

  /**
   * Cancel and delete a room (admin only).
   *
   * Endpoint: DELETE /api/v1/private-rooms/:roomId
   * Replicates: private-rooms.ts privateRoomApi.cancelRoom (lines 717-719)
   */
  async cancelRoom(roomId: string): Promise<void> {
    this.log('Cancelling room:', roomId);

    await this.http.delete(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}`
    );
  }

  /**
   * Regenerate the room invite code (admin only).
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/regenerate-code
   * Replicates: private-rooms.ts privateRoomApi.regenerateCode (lines 724-727)
   */
  async regenerateCode(roomId: string): Promise<{ roomCode: string }> {
    this.log('Regenerating code:', roomId);

    const response = await this.http.post<{ roomCode: string }>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/regenerate-code`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Invites & Requests
  // Replicates: private-rooms.ts privateRoomApi (lines 733-796)
  // ---------------------------------------------------------------------------

  /**
   * Invite a player to the room (admin only).
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/invite
   * Replicates: private-rooms.ts privateRoomApi.invitePlayer (lines 736-742)
   */
  async invitePlayer(roomId: string, data: InvitePlayerRequest): Promise<RoomInvite> {
    this.log('Inviting player to room:', roomId);

    const response = await this.http.post<RoomInvite>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/invite`,
      data
    );
    return response.data;
  }

  /**
   * Request to join a room.
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/request-join
   * Replicates: private-rooms.ts privateRoomApi.requestToJoin (lines 747-752)
   */
  async requestToJoin(roomId: string, message?: string): Promise<RoomInvite> {
    this.log('Requesting to join:', roomId);

    const response = await this.http.post<RoomInvite>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/request-join`,
      { message }
    );
    return response.data;
  }

  /**
   * Get current user's pending invites.
   *
   * Endpoint: GET /api/v1/private-rooms/invites/my
   * Replicates: private-rooms.ts privateRoomApi.getMyInvites (lines 757-760)
   */
  async getMyInvites(): Promise<RoomInvite[]> {
    this.log('Getting my invites');

    const response = await this.http.get<RoomInvite[]>(
      '/api/v1/private-rooms/invites/my'
    );
    return response.data;
  }

  /**
   * Respond to an invite (accept or decline).
   *
   * Endpoint: POST /api/v1/private-rooms/invites/:inviteId/respond
   * Replicates: private-rooms.ts privateRoomApi.respondToInvite (lines 765-778)
   */
  async respondToInvite(
    inviteId: string,
    accept: boolean,
    currentUserId?: string
  ): Promise<PrivateRoom | { success: boolean }> {
    this.log('Responding to invite:', inviteId, accept);

    const response = await this.http.post<PrivateRoom | { success: boolean }>(
      `/api/v1/private-rooms/invites/${encodeURIComponent(inviteId)}/respond`,
      { accept }
    );

    if ('id' in response.data) {
      return enrichRoomData(response.data as PrivateRoom, currentUserId);
    }
    return response.data;
  }

  /**
   * Respond to a join request (admin).
   *
   * Endpoint: POST /api/v1/private-rooms/requests/:requestId/respond
   * Replicates: private-rooms.ts privateRoomApi.respondToRequest (lines 783-789)
   */
  async respondToRequest(
    requestId: string,
    accept: boolean
  ): Promise<{ success: boolean }> {
    this.log('Responding to request:', requestId, accept);

    const response = await this.http.post<{ success: boolean }>(
      `/api/v1/private-rooms/requests/${encodeURIComponent(requestId)}/respond`,
      { accept }
    );
    return response.data;
  }

  /**
   * Send a chat message in a room.
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/chat
   * Replicates: private-rooms.ts privateRoomApi.sendChat (lines 794-796)
   */
  async sendChat(roomId: string, message: string): Promise<void> {
    this.log('Sending chat:', roomId);

    await this.http.post(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/chat`,
      { message }
    );
  }

  // ---------------------------------------------------------------------------
  // Social Room Methods
  // Replicates: private-rooms.ts privateRoomApi (lines 802-895)
  // ---------------------------------------------------------------------------

  /**
   * Get social room by ID (with full social game state).
   *
   * Endpoint: GET /api/v1/private-rooms/:roomId/social
   * Replicates: private-rooms.ts privateRoomApi.getSocialRoom (lines 805-808)
   */
  async getSocialRoom(roomId: string): Promise<SocialRoom> {
    this.log('Getting social room:', roomId);

    const response = await this.http.get<SocialRoom>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/social`
    );
    return response.data;
  }

  /**
   * Buy-in to a social room.
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/buy-in
   * Replicates: private-rooms.ts privateRoomApi.buyIn (lines 813-819)
   */
  async buyIn(request: BuyInRequest): Promise<BuyInResponse> {
    this.log('Buy-in:', request.roomId, request.amount, request.currency);

    const response = await this.http.post<BuyInResponse>(
      `/api/v1/private-rooms/${encodeURIComponent(request.roomId)}/buy-in`,
      { amount: request.amount, currency: request.currency }
    );
    return response.data;
  }

  /**
   * Rebuy in a social room (when balance is 0).
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/rebuy
   * Replicates: private-rooms.ts privateRoomApi.rebuy (lines 824-830)
   */
  async rebuy(request: BuyInRequest): Promise<BuyInResponse> {
    this.log('Rebuy:', request.roomId, request.amount, request.currency);

    const response = await this.http.post<BuyInResponse>(
      `/api/v1/private-rooms/${encodeURIComponent(request.roomId)}/rebuy`,
      { amount: request.amount, currency: request.currency }
    );
    return response.data;
  }

  /**
   * Cash out from a social room.
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/cash-out
   * Replicates: private-rooms.ts privateRoomApi.cashOut (lines 835-838)
   */
  async cashOut(roomId: string): Promise<CashOutResponse> {
    this.log('Cash out:', roomId);

    const response = await this.http.post<CashOutResponse>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/cash-out`
    );
    return response.data;
  }

  /**
   * Request a pause in a social game.
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/pause/request
   * Replicates: private-rooms.ts privateRoomApi.requestPause (lines 843-849)
   */
  async requestPause(
    roomId: string,
    reason?: string
  ): Promise<{ success: boolean; pauseId: string }> {
    this.log('Requesting pause:', roomId);

    const response = await this.http.post<{ success: boolean; pauseId: string }>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/pause/request`,
      { reason }
    );
    return response.data;
  }

  /**
   * Vote on a pause request.
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/pause/vote
   * Replicates: private-rooms.ts privateRoomApi.votePause (lines 854-860)
   */
  async votePause(
    roomId: string,
    approved: boolean
  ): Promise<{ success: boolean; allApproved: boolean }> {
    this.log('Voting on pause:', roomId, approved);

    const response = await this.http.post<{
      success: boolean;
      allApproved: boolean;
    }>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/pause/vote`,
      { approved }
    );
    return response.data;
  }

  /**
   * Cancel a pause request (requester only).
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/pause/cancel
   * Replicates: private-rooms.ts privateRoomApi.cancelPause (lines 865-868)
   */
  async cancelPause(roomId: string): Promise<{ success: boolean }> {
    this.log('Cancelling pause:', roomId);

    const response = await this.http.post<{ success: boolean }>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/pause/cancel`
    );
    return response.data;
  }

  /**
   * Resume from pause (host only, or automatic).
   *
   * Endpoint: POST /api/v1/private-rooms/:roomId/resume
   * Replicates: private-rooms.ts privateRoomApi.resumeGame (lines 873-876)
   */
  async resumeGame(roomId: string): Promise<{ success: boolean }> {
    this.log('Resuming game:', roomId);

    const response = await this.http.post<{ success: boolean }>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/resume`
    );
    return response.data;
  }

  /**
   * Get round history for a social room.
   *
   * Endpoint: GET /api/v1/private-rooms/:roomId/rounds
   * Replicates: private-rooms.ts privateRoomApi.getRoundHistory (lines 881-887)
   */
  async getRoundHistory(
    roomId: string,
    params?: { limit?: number; offset?: number }
  ): Promise<SocialRoundResult[]> {
    this.log('Getting round history:', roomId);

    const response = await this.http.get<SocialRoundResult[]>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/rounds`,
      params as QueryParams
    );
    return response.data;
  }

  /**
   * Get player session stats for a social room.
   *
   * Endpoint: GET /api/v1/private-rooms/:roomId/stats
   * Replicates: private-rooms.ts privateRoomApi.getSessionStats (lines 892-895)
   */
  async getSessionStats(roomId: string): Promise<SessionStats> {
    this.log('Getting session stats:', roomId);

    const response = await this.http.get<SessionStats>(
      `/api/v1/private-rooms/${encodeURIComponent(roomId)}/stats`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Debug Logger
  // ---------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:Rooms]', ...args);
    }
  }
}

// =============================================================================
// SPECTATOR SERVICE
// Replicates: private-rooms.ts spectatorApi (lines 1171-1205)
// =============================================================================

/**
 * Spectator service for viewing live games without participating.
 *
 * All endpoints use /api/v1/spectator/ prefix.
 * Requires authentication.
 */
export class SpectatorService {
  private http: HttpClient;
  private debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  /**
   * Get rooms available for spectating.
   *
   * Endpoint: GET /api/v1/spectator/rooms
   * Replicates: private-rooms.ts spectatorApi.getSpectateableRooms (lines 1175-1178)
   */
  async getSpectateableRooms(): Promise<RoomListItem[]> {
    this.log('Getting spectateable rooms');

    const response = await this.http.get<RoomListItem[]>(
      '/api/v1/spectator/rooms'
    );
    return response.data;
  }

  /**
   * Get spectator state for a room.
   *
   * Endpoint: GET /api/v1/spectator/rooms/:roomId
   * Replicates: private-rooms.ts spectatorApi.getSpectatorState (lines 1183-1186)
   */
  async getSpectatorState(roomId: string): Promise<SpectatorRoomState> {
    this.log('Getting spectator state:', roomId);

    const response = await this.http.get<SpectatorRoomState>(
      `/api/v1/spectator/rooms/${encodeURIComponent(roomId)}`
    );
    return response.data;
  }

  /**
   * Get rooms hosted by current user (for multi-room spectating).
   *
   * Endpoint: GET /api/v1/spectator/hosted
   * Replicates: private-rooms.ts spectatorApi.getHostedRooms (lines 1191-1194)
   */
  async getHostedRooms(): Promise<RoomListItem[]> {
    this.log('Getting hosted rooms');

    const response = await this.http.get<RoomListItem[]>(
      '/api/v1/spectator/hosted'
    );
    return response.data;
  }

  /**
   * Check if user can spectate a room.
   *
   * Endpoint: GET /api/v1/spectator/rooms/:roomId/check
   * Replicates: private-rooms.ts spectatorApi.canSpectate (lines 1199-1204)
   */
  async canSpectate(roomId: string): Promise<{ allowed: boolean; reason?: string }> {
    this.log('Checking spectate permission:', roomId);

    const response = await this.http.get<{ allowed: boolean; reason?: string }>(
      `/api/v1/spectator/rooms/${encodeURIComponent(roomId)}/check`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Debug Logger
  // ---------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:Spectator]', ...args);
    }
  }
}