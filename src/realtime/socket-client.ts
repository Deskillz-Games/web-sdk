// =============================================================================
// Deskillz Web SDK - Socket Client
// Path: src/realtime/socket-client.ts
// Main Socket.io connection manager replacing Zustand store with event emitter
// Replicates: socket.ts useSocketStore (lines 414-1190)
// Only external dependency: socket.io-client
// =============================================================================

import { io, Socket } from 'socket.io-client';
import type { ResolvedConfig } from '../core/config';
import type { TokenManager } from '../core/storage';
import { TypedEventEmitter } from '../core/event-emitter';
import type { SDKEventMap } from '../core/types';
import { SDKEventName } from '../core/types';
import {
  ReconnectionManager,
  extractReconnectionConfig,
} from './reconnection-manager';
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  ConnectionStatus,
  NotificationData,
  SocketClientState,
  MatchFoundData,
  QueuedTournament,
  ServerEventCallback,
} from './socket-types';
import {
  ConnectionStatus as CS,
  MatchState,
  RECONNECTABLE_REASONS,
} from './socket-types';

// Max notifications to keep in memory (socket.ts line 628)
const MAX_NOTIFICATIONS = 50;

// Typed socket alias for cleaner internal usage
type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// =============================================================================
// SOCKET CLIENT EVENT MAP (internal events for SDK consumers)
// =============================================================================

export interface SocketEventMap {
  // Connection lifecycle
  'socket:connected': void;
  'socket:disconnected': { reason: string };
  'socket:reconnecting': { attempt: number; delay: number; maxAttempts: number };
  'socket:reconnected': { attempt: number };
  'socket:reconnect-failed': void;
  'socket:error': { message: string; code?: string };
  'socket:offline': void;

  // State changes (emitted after internal state updates)
  'socket:state-changed': SocketClientState;
}

// =============================================================================
// SOCKET CLIENT
// =============================================================================

/**
 * Framework-agnostic Socket.io client manager.
 *
 * Replaces the Zustand-based `useSocketStore` with a class that:
 * - Manages Socket.io connection lifecycle
 * - Handles manual reconnection with exponential backoff
 * - Maintains matchmaking, lobby, and notification state
 * - Emits typed events via TypedEventEmitter
 * - Auto-rejoins lobby and match rooms on reconnect
 *
 * Usage:
 * ```typescript
 * const socket = sdk.realtime;
 *
 * socket.connect();
 * socket.on('socket:connected', () => console.log('Connected!'));
 * socket.onServerEvent('lobby:match_found', (data) => {
 *   console.log('Match found:', data.matchId);
 * });
 * socket.joinLobby();
 * ```
 */
export class SocketClient {
  private config: ResolvedConfig;
  private tokenManager: TokenManager;
  private sdkEvents: TypedEventEmitter<SDKEventMap>;
  private events = new TypedEventEmitter<SocketEventMap>();
  private reconnectionManager: ReconnectionManager;
  private debug: boolean;

  // Socket.io instance
  private socket: TypedSocket | null = null;
  private storedToken: string | null = null;

  // Internal state (replaces Zustand store)
  private state: SocketClientState;

  constructor(
    config: ResolvedConfig,
    tokenManager: TokenManager,
    sdkEvents: TypedEventEmitter<SDKEventMap>,
    debug = false
  ) {
    this.config = config;
    this.tokenManager = tokenManager;
    this.sdkEvents = sdkEvents;
    this.debug = debug;

    // Initialize state (socket.ts lines 415-441)
    this.state = this.createInitialState();

    // Initialize reconnection manager
    this.reconnectionManager = new ReconnectionManager(
      extractReconnectionConfig(config),
      {
        onReconnect: () => this.doConnect(),
        onStateChange: (rs) => {
          if (rs.isReconnecting) {
            this.updateState({ connectionStatus: CS.RECONNECTING, reconnectAttempt: rs.attempt });
            this.events.emit('socket:reconnecting', {
              attempt: rs.attempt,
              delay: rs.nextDelay,
              maxAttempts: rs.maxAttempts,
            });
            this.sdkEvents.emit(SDKEventName.SOCKET_RECONNECTING, {
              attempt: rs.attempt,
              delay: rs.nextDelay,
            });
          }
          if (rs.isWaitingForNetwork) {
            this.updateState({ connectionStatus: CS.OFFLINE });
            this.events.emit('socket:offline');
          }
        },
        onMaxAttemptsReached: () => {
          this.updateState({
            connectionStatus: CS.DISCONNECTED,
            error: 'Unable to reconnect. Please refresh the page.',
          });
          this.events.emit('socket:reconnect-failed');
        },
        onWaitingForNetwork: () => {
          this.log('Offline - waiting for network');
        },
      }
    );
  }

  // ===========================================================================
  // CONNECTION (socket.ts connect: lines 447-868)
  // ===========================================================================

  /**
   * Connect to the WebSocket server.
   * Uses the stored access token for authentication.
   * Replicates: socket.ts connect() (lines 447-868)
   */
  async connect(): Promise<void> {
    // Get token from storage
    const token = await this.tokenManager.getAccessToken();
    if (!token) {
      this.log('No access token - cannot connect');
      this.updateState({ error: 'Not authenticated' });
      return;
    }

    this.connectWithToken(token);
  }

  /**
   * Connect with an explicit token.
   * Replicates: socket.ts connect(token) (lines 447-868)
   */
  connectWithToken(token: string): void {
    // Already connected check (socket.ts lines 448-454)
    if (this.socket?.connected) {
      this.log('Already connected');
      return;
    }

    // Offline check (socket.ts lines 456-461)
    if (!this.isOnline()) {
      this.updateState({ connectionStatus: CS.OFFLINE, error: 'No internet connection' });
      this.log('Offline - cannot connect');
      return;
    }

    // Store token for reconnection (socket.ts line 464)
    this.storedToken = token;

    // Cancel pending reconnection (socket.ts lines 467-470)
    this.reconnectionManager.cancel();

    this.updateState({
      isConnecting: true,
      connectionStatus: CS.CONNECTING,
      error: null,
    });

    this.log('Connecting to', this.config.socketUrl);
    this.doConnect();
  }

  /**
   * Disconnect from the WebSocket server.
   * Replicates: socket.ts disconnect() (lines 875-902)
   */
  disconnect(): void {
    // Cancel reconnection (socket.ts lines 879-882)
    this.reconnectionManager.cancel();

    // Clear stored token (socket.ts line 885)
    this.storedToken = null;

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Reset state (socket.ts lines 889-901)
    this.state = this.createInitialState();
    this.emitStateChanged();
  }

  // ===========================================================================
  // EVENT SUBSCRIPTIONS
  // ===========================================================================

  /**
   * Subscribe to socket client events (connection, state changes).
   */
  on<K extends keyof SocketEventMap>(
    event: K,
    handler: (data: SocketEventMap[K]) => void
  ): () => void {
    return this.events.on(event, handler as any);
  }

  /**
   * Subscribe to a server-to-client event with full type safety.
   * This is the primary way SDK consumers listen for game events.
   *
   * @param event - Server event name.
   * @param handler - Typed callback.
   * @returns Unsubscribe function.
   */
  onServerEvent<K extends keyof ServerToClientEvents>(
    event: K,
    handler: ServerEventCallback<K>
  ): () => void {
    if (!this.socket) {
      this.log('Cannot subscribe - not connected. Event:', String(event));
      // Queue for when socket connects
      const unsub = this.events.on('socket:connected', () => {
        unsub();
        if (this.socket) {
          this.socket.on(event as any, handler as any);
        }
      });
      return () => {
        unsub();
        this.socket?.off(event as any, handler as any);
      };
    }

    this.socket.on(event as any, handler as any);
    return () => {
      this.socket?.off(event as any, handler as any);
    };
  }

  /**
   * Unsubscribe from a server event.
   */
  offServerEvent<K extends keyof ServerToClientEvents>(
    event: K,
    handler?: ServerEventCallback<K>
  ): void {
    if (handler) {
      this.socket?.off(event as any, handler as any);
    } else {
      this.socket?.off(event as any);
    }
  }

  // ===========================================================================
  // LOBBY ACTIONS (socket.ts lines 1054-1096)
  // ===========================================================================

  /** Join the global lobby. Replicates: socket.ts joinLobby (lines 1054-1066) */
  joinLobby(): void {
    if (this.emitIfConnected('lobby:join')) {
      this.state.lobbyState.isInLobby = true;
      this.emitStateChanged();
      this.log('Joined lobby');
    }
  }

  /** Leave the global lobby. Replicates: socket.ts leaveLobby (lines 1068-1080) */
  leaveLobby(): void {
    if (this.emitIfConnected('lobby:leave')) {
      this.state.lobbyState.isInLobby = false;
      this.emitStateChanged();
      this.log('Left lobby');
    }
  }

  /** Subscribe to game updates. Replicates: socket.ts subscribeToGame (lines 1082-1088) */
  subscribeToGame(gameId: string): void {
    this.emitIfConnected('lobby:subscribe_game', { gameId });
  }

  /** Unsubscribe from game updates. Replicates: socket.ts unsubscribeFromGame (lines 1090-1096) */
  unsubscribeFromGame(gameId: string): void {
    this.emitIfConnected('lobby:unsubscribe_game', { gameId });
  }

  // ===========================================================================
  // QUEUE ACTIONS (socket.ts lines 1140-1162)
  // ===========================================================================

  /** Join tournament queue. Replicates: socket.ts joinQueue (lines 1140-1146) */
  joinQueue(tournamentId: string): void {
    this.emitIfConnected('lobby:join_queue', { tournamentId });
    this.log('Joining queue:', tournamentId);
  }

  /** Leave tournament queue. Replicates: socket.ts leaveQueueSocket (lines 1148-1162) */
  leaveQueue(tournamentId: string): void {
    if (this.emitIfConnected('lobby:leave_queue', { tournamentId })) {
      this.state.lobbyState.queuedTournaments =
        this.state.lobbyState.queuedTournaments.filter(
          (t) => t.tournamentId !== tournamentId
        );
      this.emitStateChanged();
      this.log('Left queue:', tournamentId);
    }
  }

  // ===========================================================================
  // MATCH ACTIONS (socket.ts lines 1098-1134, 1168-1189)
  // ===========================================================================

  /** Join a match room. Replicates: socket.ts joinMatchRoom (lines 1098-1104) */
  joinMatchRoom(matchId: string): void {
    this.emitIfConnected('match:join_room', { matchId });
  }

  /** Leave a match room. Replicates: socket.ts leaveMatchRoom (lines 1106-1112) */
  leaveMatchRoom(matchId: string): void {
    this.emitIfConnected('match:leave_room', { matchId });
  }

  /** Signal ready in match. Replicates: socket.ts signalReady (lines 1114-1120) */
  signalReady(matchId: string): void {
    this.emitIfConnected('match:ready', { matchId });
  }

  /** Leave a match. Replicates: socket.ts leaveMatch (lines 1122-1134) */
  leaveMatch(matchId: string): void {
    if (this.emitIfConnected('match:leave', { matchId })) {
      this.state.lobbyState.currentMatch = null;
      this.emitStateChanged();
      this.log('Left match:', matchId);
    }
  }

  /** Accept match. Replicates: socket.ts acceptMatch (lines 1168-1174) */
  acceptMatch(matchId: string): void {
    this.emitIfConnected('match:accept', { matchId });
  }

  /** Decline match. Replicates: socket.ts declineMatch (lines 1176-1189) */
  declineMatch(matchId: string): void {
    if (this.emitIfConnected('match:decline', { matchId })) {
      this.state.lobbyState.currentMatch = null;
      this.state.lobbyState.queuedTournaments = [];
      this.emitStateChanged();
    }
  }

  // ===========================================================================
  // MATCHMAKING ACTIONS (Legacy) (socket.ts lines 965-1011)
  // ===========================================================================

  /** Join matchmaking queue. Replicates: socket.ts joinMatchmaking (lines 965-976) */
  joinMatchmaking(gameId: string, tournamentId?: string): void {
    if (this.emitIfConnected('matchmaking:join', { gameId, tournamentId })) {
      this.state.matchmaking.isSearching = true;
      this.emitStateChanged();
    }
  }

  /** Leave matchmaking queue. Replicates: socket.ts leaveMatchmaking (lines 978-991) */
  leaveMatchmaking(): void {
    if (this.emitIfConnected('matchmaking:leave')) {
      this.state.matchmaking = {
        ...this.state.matchmaking,
        isSearching: false,
        matchFound: null,
        readyCheck: null,
      };
      this.emitStateChanged();
    }
  }

  /** Confirm ready in matchmaking. Replicates: socket.ts confirmReady (lines 993-998) */
  confirmReady(matchId: string): void {
    this.emitIfConnected('matchmaking:ready', { matchId });
  }

  /** Reset matchmaking state. Replicates: socket.ts resetMatchmaking (lines 1000-1011) */
  resetMatchmaking(): void {
    this.state.matchmaking = {
      isSearching: false,
      queuePosition: 0,
      estimatedWait: 0,
      matchFound: null,
      readyCheck: null,
      playersReady: [],
    };
    this.emitStateChanged();
  }

  // ===========================================================================
  // TOURNAMENT ACTIONS (socket.ts lines 1017-1029)
  // ===========================================================================

  /** Subscribe to tournament updates. */
  subscribeTournament(tournamentId: string): void {
    this.emitIfConnected('tournament:subscribe', { tournamentId });
  }

  /** Unsubscribe from tournament updates. */
  unsubscribeTournament(tournamentId: string): void {
    this.emitIfConnected('tournament:unsubscribe', { tournamentId });
  }

  // ===========================================================================
  // GAMEPLAY ACTIONS
  // ===========================================================================

  /** Send a score update during gameplay. */
  sendScoreUpdate(matchId: string, score: number): void {
    this.emitIfConnected('game:score_update', { matchId, score });
  }

  /** Sync game state. */
  sendStateSync(matchId: string, state: unknown): void {
    this.emitIfConnected('game:state_sync', { matchId, state });
  }

  /** Signal game completion. */
  sendGameComplete(matchId: string, finalScore: number): void {
    this.emitIfConnected('game:complete', { matchId, finalScore });
  }

  // ===========================================================================
  // CHAT ACTIONS
  // ===========================================================================

  /** Send a chat message. */
  sendChatMessage(roomId: string, message: string): void {
    this.emitIfConnected('chat:send', { roomId, message });
  }

  /** Join a chat room. */
  joinChatRoom(roomId: string): void {
    this.emitIfConnected('chat:join_room', { roomId });
  }

  /** Leave a chat room. */
  leaveChatRoom(roomId: string): void {
    this.emitIfConnected('chat:leave_room', { roomId });
  }

  // ===========================================================================
  // PRIVATE ROOM ACTIONS
  // ===========================================================================

  /** Subscribe to private room events. */
  subscribeRoom(roomId: string): void {
    this.emitIfConnected('room:subscribe', { roomId });
  }

  /** Unsubscribe from private room events. */
  unsubscribeRoom(roomId: string): void {
    this.emitIfConnected('room:unsubscribe', { roomId });
  }

  /** Set ready status in a private room. */
  setRoomReady(roomId: string, isReady: boolean): void {
    this.emitIfConnected('room:ready', { roomId, isReady });
  }

  /** Send a chat message in a private room. */
  sendRoomChat(roomId: string, message: string): void {
    this.emitIfConnected('room:chat', { roomId, message });
  }

  // ===========================================================================
  // NOTIFICATION STATE (socket.ts lines 1035-1048)
  // ===========================================================================

  /** Mark all notifications as read. */
  markNotificationsRead(): void {
    this.state.unreadCount = 0;
    this.emitStateChanged();
  }

  /** Clear all notifications. */
  clearNotifications(): void {
    this.state.notifications = [];
    this.state.unreadCount = 0;
    this.emitStateChanged();
  }

  // ===========================================================================
  // STATE GETTERS
  // ===========================================================================

  /** Get a snapshot of the current socket state. */
  getState(): Readonly<SocketClientState> {
    return { ...this.state };
  }

  /** Check if the socket is connected. */
  get isConnected(): boolean {
    return this.state.isConnected;
  }

  /** Get current connection status. */
  get connectionStatus(): ConnectionStatus {
    return this.state.connectionStatus;
  }

  /** Get the underlying Socket.io instance (for advanced use). */
  getRawSocket(): TypedSocket | null {
    return this.socket;
  }

  // ===========================================================================
  // INTERNAL - Connection Setup
  // ===========================================================================

  /**
   * Create and wire up the Socket.io connection.
   * Called by connect() and by ReconnectionManager.
   */
  private doConnect(): void {
    if (!this.storedToken) return;

    // Disconnect existing socket cleanly
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }

    // Create socket (socket.ts lines 480-485)
    this.socket = io(this.config.socketUrl, {
      auth: { token: this.storedToken },
      transports: ['websocket', 'polling'],
      reconnection: false, // Manual reconnection
      timeout: 10000,
    }) as TypedSocket;

    this.wireConnectionEvents();
    this.wireServerEvents();
  }

  /**
   * Wire up connection lifecycle events.
   * Replicates: socket.ts lines 491-558
   */
  private wireConnectionEvents(): void {
    const s = this.socket;
    if (!s) return;

    // --- connect (socket.ts lines 491-521) ---
    s.on('connect', (): void => {
      const prevAttempt = this.state.reconnectAttempt;

      this.updateState({
        isConnected: true,
        isConnecting: false,
        connectionStatus: CS.CONNECTED,
        error: null,
        reconnectAttempt: 0,
        lastDisconnectReason: null,
      });

      this.reconnectionManager.reset();

      // Auto-rejoin lobby (socket.ts lines 506-509)
      if (this.state.lobbyState.isInLobby && this.socket) {
        this.socket.emit('lobby:join');
        this.log('Auto-rejoined lobby');
      }

      // Auto-rejoin match room (socket.ts lines 512-515)
      if (this.state.lobbyState.currentMatch && this.socket) {
        this.socket.emit('match:join_room', {
          matchId: this.state.lobbyState.currentMatch.matchId,
        });
        this.log('Auto-rejoined match room:', this.state.lobbyState.currentMatch.matchId);
      }

      this.log('Connected successfully');
      this.events.emit('socket:connected');
      this.sdkEvents.emit(SDKEventName.SOCKET_CONNECTED);

      // Emit reconnected if this was a reconnection (socket.ts lines 518-520)
      if (prevAttempt > 0) {
        this.events.emit('socket:reconnected', { attempt: prevAttempt });
        this.sdkEvents.emit(SDKEventName.SOCKET_RECONNECTED, { attempt: prevAttempt });
        this.log('Reconnected after', prevAttempt, 'attempts');
      }
    });

    // --- disconnect (socket.ts lines 523-543) ---
    s.on('disconnect', (reason: Socket.DisconnectReason): void => {
      this.updateState({
        isConnected: false,
        connectionStatus: CS.DISCONNECTED,
        lastDisconnectReason: reason,
      });

      this.log('Disconnected:', reason);
      this.events.emit('socket:disconnected', { reason });
      this.sdkEvents.emit(SDKEventName.SOCKET_DISCONNECTED, { reason });

      // Auto-reconnect for recoverable reasons (socket.ts lines 533-542)
      if (
        RECONNECTABLE_REASONS.includes(reason) &&
        this.storedToken &&
        this.config.autoReconnect
      ) {
        this.reconnectionManager.scheduleReconnect();
      }
    });

    // --- connect_error (socket.ts lines 545-558) ---
    // Use s.io.on('error') for manager-level connection errors
    s.io.on('error', (error: Error): void => {
      this.updateState({
        isConnecting: false,
        connectionStatus: CS.DISCONNECTED,
        error: error.message,
      });

      this.log('Connection error:', error.message);
      this.events.emit('socket:error', { message: error.message });
      this.sdkEvents.emit(SDKEventName.SOCKET_ERROR, { error: error.message });

      // Try to reconnect (socket.ts lines 555-557)
      if (this.storedToken && this.config.autoReconnect) {
        this.reconnectionManager.scheduleReconnect();
      }
    });

    // --- error (socket.ts lines 560-563) ---
    s.on('error', (data: { message: string; code?: string }): void => {
      this.updateState({ error: data.message });
      this.log('Error:', data);
      this.events.emit('socket:error', data);
      this.sdkEvents.emit(SDKEventName.SOCKET_ERROR, { error: data.message });
    });
  }

  /**
   * Wire up server-to-client game/lobby events.
   * Replicates: socket.ts lines 569-866 (all event handlers)
   *
   * All callbacks have explicit type annotations to satisfy strict mode
   * since Socket.io generic inference does not flow through .on() reliably.
   */
  private wireServerEvents(): void {
    const s = this.socket;
    if (!s) return;

    // --- Matchmaking (Legacy) (socket.ts lines 569-620) ---

    s.on('matchmaking:searching', (data: { queuePosition: number; estimatedWait: number }): void => {
      this.state.matchmaking.isSearching = true;
      this.state.matchmaking.queuePosition = data.queuePosition;
      this.state.matchmaking.estimatedWait = data.estimatedWait;
      this.emitStateChanged();
    });

    s.on('matchmaking:found', (data: MatchFoundData): void => {
      this.state.matchmaking.isSearching = false;
      this.state.matchmaking.matchFound = data;
      this.emitStateChanged();
    });

    s.on('matchmaking:ready_check', (data: { matchId: string; timeout: number }): void => {
      this.state.matchmaking.readyCheck = data;
      this.state.matchmaking.playersReady = [];
      this.emitStateChanged();
    });

    s.on('matchmaking:player_ready', (data: { odid: string; username: string }): void => {
      this.state.matchmaking.playersReady.push(data.odid);
      this.emitStateChanged();
    });

    s.on('matchmaking:cancelled', (_data: { reason: string }): void => {
      this.state.matchmaking.isSearching = false;
      this.state.matchmaking.matchFound = null;
      this.state.matchmaking.readyCheck = null;
      this.state.matchmaking.playersReady = [];
      this.emitStateChanged();
    });

    // --- Notifications (socket.ts lines 626-631) ---

    s.on('notification', (data: NotificationData): void => {
      this.state.notifications = [data, ...this.state.notifications].slice(0, MAX_NOTIFICATIONS);
      this.state.unreadCount += 1;
      this.emitStateChanged();
    });

    // --- Global Lobby (socket.ts lines 637-681) ---

    s.on('lobby:player_count_update', (data: { gameId: string; activePlayers: number; inQueue: number }): void => {
      this.state.lobbyState.activeGames.set(data.gameId, {
        activePlayers: data.activePlayers,
        inQueue: data.inQueue,
      });
      this.emitStateChanged();
    });

    s.on('lobby:match_found', (data: { matchId: string; gameId: string; tournamentId: string }): void => {
      this.state.lobbyState.queuedTournaments =
        this.state.lobbyState.queuedTournaments.filter(
          (q) => q.tournamentId !== data.tournamentId
        );
      this.state.lobbyState.currentMatch = {
        matchId: data.matchId,
        state: MatchState.WAITING,
        players: [],
      };
      this.emitStateChanged();
    });

    s.on('lobby:queue_update', (data: { tournamentId: string; position: number; estimatedWait: number }): void => {
      this.state.lobbyState.queuedTournaments =
        this.state.lobbyState.queuedTournaments.map((q) =>
          q.tournamentId === data.tournamentId
            ? { ...q, position: data.position, estimatedWait: data.estimatedWait }
            : q
        );
      this.emitStateChanged();
    });

    // --- Queue Events (socket.ts lines 799-830) ---

    s.on('lobby:queue_joined', (data: {
      success: boolean;
      tournamentId: string;
      gameId?: string;
      position: number;
      estimatedWait: number;
      entryFee: number;
      currency: string;
    }): void => {
      const entry: QueuedTournament = {
        tournamentId: data.tournamentId,
        gameId: data.gameId || '',
        position: data.position,
        estimatedWait: data.estimatedWait,
        queuedAt: new Date(),
        entryFee: data.entryFee,
        currency: data.currency,
      };
      this.state.lobbyState.queuedTournaments = [
        ...this.state.lobbyState.queuedTournaments.filter(
          (t) => t.tournamentId !== data.tournamentId
        ),
        entry,
      ];
      this.emitStateChanged();
    });

    s.on('lobby:queue_left', (data: { success: boolean; tournamentId: string }): void => {
      this.state.lobbyState.queuedTournaments =
        this.state.lobbyState.queuedTournaments.filter(
          (t) => t.tournamentId !== data.tournamentId
        );
      this.emitStateChanged();
    });

    // --- Pre-Match Room (socket.ts lines 687-793) ---

    s.on('match:player_joined', (data: { player: { id: string; username: string; avatarUrl?: string; rating?: number } }): void => {
      const match = this.state.lobbyState.currentMatch;
      if (match) {
        match.players.push({
          id: data.player.id,
          username: data.player.username,
          isReady: false,
        });
        this.emitStateChanged();
      }
    });

    s.on('match:player_left', (data: { playerId: string }): void => {
      const match = this.state.lobbyState.currentMatch;
      if (match) {
        match.players = match.players.filter((p) => p.id !== data.playerId);
        this.emitStateChanged();
      }
    });

    s.on('match:ready_update', (data: { playerId: string; isReady: boolean }): void => {
      const match = this.state.lobbyState.currentMatch;
      if (match) {
        match.players = match.players.map((p) =>
          p.id === data.playerId ? { ...p, isReady: data.isReady } : p
        );
        this.emitStateChanged();
      }
    });

    s.on('match:all_ready', (): void => {
      const match = this.state.lobbyState.currentMatch;
      if (match) {
        match.state = MatchState.COUNTDOWN;
        this.emitStateChanged();
      }
    });

    s.on('match:state_change', (data: { state: string }): void => {
      const match = this.state.lobbyState.currentMatch;
      if (match) {
        match.state = data.state as any;
        this.emitStateChanged();
      }
    });

    s.on('match:launch', (_data: { deepLink: string; token: string }): void => {
      const match = this.state.lobbyState.currentMatch;
      if (match) {
        match.state = MatchState.LAUNCHED;
        this.emitStateChanged();
      }
    });

    s.on('match:cancelled', (_data: { reason: string; declinedBy?: string }): void => {
      this.state.lobbyState.currentMatch = null;
      this.state.lobbyState.queuedTournaments = [];
      this.emitStateChanged();
    });

    // --- Match Accept/Decline (socket.ts lines 836-866) ---

    s.on('match:declined', (_data: { matchId: string; success: boolean }): void => {
      this.state.lobbyState.currentMatch = null;
      this.emitStateChanged();
    });

    s.on('match:player_accepted', (data: { playerId: string; username: string }): void => {
      const match = this.state.lobbyState.currentMatch;
      if (match) {
        match.players = match.players.map((p) =>
          p.id === data.playerId ? { ...p, hasAccepted: true } : p
        );
        this.emitStateChanged();
      }
    });
  }

  // ===========================================================================
  // INTERNAL HELPERS
  // ===========================================================================

  /**
   * Emit a client-to-server event if connected.
   * Returns true if emitted, false if not connected.
   */
  private emitIfConnected<K extends keyof ClientToServerEvents>(
    event: K,
    ...args: Parameters<ClientToServerEvents[K]>
  ): boolean {
    if (this.socket?.connected) {
      (this.socket.emit as any)(event, ...args);
      return true;
    }
    this.log('Cannot emit - not connected. Event:', String(event));
    return false;
  }

  /** Create the initial state object. */
  private createInitialState(): SocketClientState {
    return {
      connectionStatus: CS.DISCONNECTED,
      isConnected: false,
      isConnecting: false,
      error: null,
      reconnectAttempt: 0,
      lastDisconnectReason: null,
      matchmaking: {
        isSearching: false,
        queuePosition: 0,
        estimatedWait: 0,
        matchFound: null,
        readyCheck: null,
        playersReady: [],
      },
      notifications: [],
      unreadCount: 0,
      lobbyState: {
        isInLobby: false,
        activeGames: new Map(),
        queuedTournaments: [],
        currentMatch: null,
      },
    };
  }

  /** Update internal state and emit state-changed event. */
  private updateState(partial: Partial<SocketClientState>): void {
    Object.assign(this.state, partial);
    this.emitStateChanged();
  }

  /** Emit the state-changed event with current state snapshot. */
  private emitStateChanged(): void {
    this.events.emit('socket:state-changed', { ...this.state });
  }

  /** Check if the browser is online. */
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /** Debug logger. */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:Socket]', ...args);
    }
  }
}