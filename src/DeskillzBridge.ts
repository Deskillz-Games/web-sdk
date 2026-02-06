// =============================================================================
// Deskillz Universal Game Bridge
// Path: src/sdk/DeskillzBridge.ts
// Game-agnostic wrapper for @deskillz/web-sdk
// Reusable across ALL Deskillz games (Big 2, Mahjong, Chinese 13, etc.)
// =============================================================================
//
// USAGE:
//   import { DeskillzBridge } from './sdk/DeskillzBridge';
//
//   const bridge = DeskillzBridge.getInstance({
//     gameId: 'your-game-id',
//     gameKey: 'your-game-key',
//     apiBaseUrl: 'https://api.deskillz.games',
//     socketUrl: 'wss://ws.deskillz.games/lobby',
//     debug: true,
//   });
//
//   await bridge.initialize();
//   const user = await bridge.login(email, password);
//
// EXTENDING FOR A SPECIFIC GAME:
//   class Big2Bridge extends DeskillzBridge { ... }
//   class MahjongBridge extends DeskillzBridge { ... }
// =============================================================================

// =============================================================================
// CONFIGURATION
// =============================================================================

export interface BridgeConfig {
  /** Game ID from developer portal */
  gameId: string;
  /** Game API key from developer portal */
  gameKey: string;
  /** Backend API base URL */
  apiBaseUrl?: string;
  /** WebSocket server URL */
  socketUrl?: string;
  /** Enable debug logging */
  debug?: boolean;
  /** Force mock/guest mode (no backend calls) */
  forceMock?: boolean;
}

// =============================================================================
// SHARED TYPES (game-agnostic)
// =============================================================================

export interface DeskillzUser {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  walletAddress?: string;
  isGuest: boolean;
}

export interface WalletBalance {
  total: number;
  currency: string;
  balances: Array<{ currency: string; amount: number; usdValue: number }>;
}

export interface PrivateRoom {
  id: string;
  code: string;
  hostId: string;
  gameId: string;
  status: string;
  entryFee: number;
  maxPlayers: number;
  currentPlayers: number;
  isSocialGame: boolean;
  pointValue?: number;
  rakePercent?: number;
}

export interface GameScorePayload {
  gameId: string;
  matchId?: string;
  tournamentId?: string;
  roomId?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

// =============================================================================
// EVENT SYSTEM
// =============================================================================

export type BridgeEventType =
  | 'initialized'
  | 'authenticated'
  | 'logout'
  | 'roomJoined'
  | 'roomLeft'
  | 'matchFound'
  | 'gameStarted'
  | 'gameEnded'
  | 'error'
  | 'connectionChanged'
  | 'walletUpdated'
  | 'playerJoined'
  | 'playerLeft';

export type BridgeEventCallback = (type: BridgeEventType, data: unknown) => void;

// =============================================================================
// SDK TYPE SHIM
// SDK is imported dynamically; these types mirror @deskillz/web-sdk exports
// so the bridge compiles even when the npm package is not yet installed.
// Once @deskillz/web-sdk is published, replace with direct imports.
// =============================================================================

interface SDKInstance {
  auth: {
    loginWithEmail(payload: { email: string; password: string }): Promise<{
      user: { id: string; username: string; email?: string; avatarUrl?: string };
      tokens: { accessToken: string; refreshToken: string };
      isNewUser: boolean;
    }>;
    registerWithEmail(payload: {
      email: string;
      password: string;
      username: string;
    }): Promise<{
      user: { id: string; username: string; email?: string; avatarUrl?: string };
      tokens: { accessToken: string; refreshToken: string };
      isNewUser: boolean;
    }>;
    logout(): Promise<void>;
    getCurrentUser(): Promise<{
      id: string;
      username: string;
      email?: string;
      avatarUrl?: string;
      walletAddress?: string;
    } | null>;
    getCachedUser(): { id: string; username: string; email?: string } | null;
  };
  walletAuth: {
    authenticate(params: {
      address: string;
      chainId: number;
      signMessage: (message: string) => Promise<string>;
      domain?: string;
      uri?: string;
    }): Promise<{
      user: { id: string; username: string; walletAddress?: string };
      tokens: { accessToken: string; refreshToken: string };
      isNewUser: boolean;
    }>;
    getNonce(walletAddress: string): Promise<string>;
  };
  wallet: {
    getAllBalances(): Promise<
      Array<{ currency: string; balance: number; usdValue: number }>
    >;
    getTotalBalanceUSD(): Promise<{ totalUsd: number }>;
    getBalance(currency: string): Promise<{ currency: string; balance: number; usdValue: number }>;
  };
  rooms: {
    createRoom(data: Record<string, unknown>): Promise<PrivateRoom>;
    joinByCode(code: string): Promise<PrivateRoom>;
    leaveRoom(roomId: string): Promise<void>;
    getRoom(roomId: string): Promise<PrivateRoom>;
    buyIn(request: {
      roomId: string;
      amount: number;
      currency: string;
    }): Promise<{ success: boolean; pointBalance: number }>;
    cashOut(roomId: string): Promise<{ success: boolean; amount: number }>;
  };
  tournaments: {
    submitScore(request: {
      tournamentId: string;
      score: number;
      metadata?: Record<string, unknown>;
    }): Promise<{ success: boolean }>;
  };
  realtime: {
    connect(): Promise<void>;
    connectWithToken(token: string): void;
    disconnect(): void;
    subscribeRoom(roomId: string): void;
    unsubscribeRoom(roomId: string): void;
    on(event: string, handler: (...args: unknown[]) => void): () => void;
    sendRoomChat(roomId: string, message: string): void;
    setRoomReady(roomId: string, isReady: boolean): void;
    readonly isConnected: boolean;
  };
  isAuthenticated(): Promise<boolean>;
  getAccessToken(): Promise<string | null>;
  destroy(): void;
}

// =============================================================================
// MAIN BRIDGE CLASS
// =============================================================================

export class DeskillzBridge {
  private static instance: DeskillzBridge | null = null;

  // -- Core state --
  protected config: BridgeConfig;
  protected sdk: SDKInstance | null = null;
  protected isInitialized = false;
  protected _isAuthenticated = false;
  protected _isGuest = false;
  protected currentUser: DeskillzUser | null = null;
  protected currentRoom: PrivateRoom | null = null;
  protected listeners: BridgeEventCallback[] = [];
  protected realtimeCleanups: Array<() => void> = [];

  // ---------------------------------------------------------------------------
  // SINGLETON
  // ---------------------------------------------------------------------------

  protected constructor(config: BridgeConfig) {
    this.config = config;
  }

  static getInstance(config?: BridgeConfig): DeskillzBridge {
    if (!DeskillzBridge.instance) {
      if (!config) {
        throw new Error('[DeskillzBridge] Config required on first initialization');
      }
      DeskillzBridge.instance = new DeskillzBridge(config);
    }
    return DeskillzBridge.instance;
  }

  static destroy(): void {
    if (DeskillzBridge.instance) {
      DeskillzBridge.instance.cleanup();
      DeskillzBridge.instance = null;
    }
  }

  // ---------------------------------------------------------------------------
  // INITIALIZATION
  // ---------------------------------------------------------------------------

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.log('Initializing DeskillzBridge...');

    if (this.config.forceMock) {
      this.log('Mock mode forced via config');
      this.isInitialized = true;
      this.emit('initialized', { success: true, mode: 'mock' });
      return;
    }

    try {
      // Dynamic import so the bridge compiles even without the SDK package.
      // The package name is constructed at runtime to prevent TypeScript from
      // resolving it at compile time (which fails when the package is missing).
      // Once @deskillz/web-sdk is published on npm, replace this block with:
      //   import { DeskillzSDK } from '@deskillz/web-sdk';
      //   this.sdk = new DeskillzSDK({ ... }) as unknown as SDKInstance;
      const SDK_PACKAGE = '@deskillz/web-sdk';
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let sdkModule: any = null;
      try {
        sdkModule = await (new Function('pkg', 'return import(pkg)')(SDK_PACKAGE));
      } catch {
        sdkModule = null;
      }

      if (sdkModule?.DeskillzSDK) {
        this.sdk = new sdkModule.DeskillzSDK({
          gameId: this.config.gameId,
          gameKey: this.config.gameKey,
          apiBaseUrl: this.config.apiBaseUrl,
          socketUrl: this.config.socketUrl,
          debug: this.config.debug,
        }) as SDKInstance;

        this.log('Real SDK initialized');

        // Attempt session restore
        await this.restoreSession();
      } else {
        this.log('SDK package not installed - running in guest/offline mode');
      }

      this.isInitialized = true;
      this.emit('initialized', { success: true, mode: this.sdk ? 'live' : 'offline' });
      this.log('Bridge ready (mode:', this.sdk ? 'live' : 'offline', ')');
    } catch (err) {
      this.log('SDK init error, falling back to offline mode:', err);
      this.isInitialized = true;
      this.emit('initialized', { success: true, mode: 'offline' });
    }
  }

  // ---------------------------------------------------------------------------
  // SESSION RESTORE
  // ---------------------------------------------------------------------------

  private async restoreSession(): Promise<void> {
    if (!this.sdk) return;

    try {
      const isAuth = await this.sdk.isAuthenticated();
      if (!isAuth) return;

      const user = await this.sdk.auth.getCurrentUser();
      if (user) {
        this.currentUser = {
          id: user.id,
          username: user.username,
          email: user.email,
          avatarUrl: user.avatarUrl,
          walletAddress: user.walletAddress,
          isGuest: false,
        };
        this._isAuthenticated = true;
        this._isGuest = false;
        this.log('Session restored for:', user.username);
      }
    } catch (err) {
      this.log('Session restore failed (token may be expired):', err);
      // Not critical - user will just see the auth screen
    }
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION - EMAIL
  // ---------------------------------------------------------------------------

  async login(email: string, password: string): Promise<DeskillzUser> {
    this.ensureInitialized();

    if (!this.sdk) {
      return this.loginAsGuest(email.split('@')[0]);
    }

    this.log('Logging in with email:', email);
    const result = await this.sdk.auth.loginWithEmail({ email, password });

    this.currentUser = {
      id: result.user.id,
      username: result.user.username,
      email: result.user.email,
      avatarUrl: result.user.avatarUrl,
      isGuest: false,
    };
    this._isAuthenticated = true;
    this._isGuest = false;

    this.emit('authenticated', { user: this.currentUser, isNewUser: result.isNewUser });
    this.log('Login successful:', this.currentUser.username);

    // Auto-connect realtime after auth
    this.connectRealtime();

    return this.currentUser;
  }

  async register(
    username: string,
    email: string,
    password: string
  ): Promise<DeskillzUser> {
    this.ensureInitialized();

    if (!this.sdk) {
      return this.loginAsGuest(username);
    }

    this.log('Registering:', username, email);
    const result = await this.sdk.auth.registerWithEmail({
      email,
      password,
      username,
    });

    this.currentUser = {
      id: result.user.id,
      username: result.user.username || username,
      email: result.user.email,
      avatarUrl: result.user.avatarUrl,
      isGuest: false,
    };
    this._isAuthenticated = true;
    this._isGuest = false;

    this.emit('authenticated', { user: this.currentUser, isNewUser: true });
    this.log('Registration successful:', this.currentUser.username);

    // Auto-connect realtime after auth
    this.connectRealtime();

    return this.currentUser;
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION - WALLET (SIWE)
  // ---------------------------------------------------------------------------

  async loginWithWallet(
    address: string,
    chainId: number = 56,
    signMessage?: (message: string) => Promise<string>
  ): Promise<DeskillzUser> {
    this.ensureInitialized();

    if (!this.sdk || !signMessage) {
      // No SDK or no sign function - create guest with wallet display name
      const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
      return this.loginAsGuest(shortAddr, address);
    }

    this.log('Authenticating wallet:', address);
    const result = await this.sdk.walletAuth.authenticate({
      address,
      chainId,
      signMessage,
    });

    this.currentUser = {
      id: result.user.id,
      username: result.user.username,
      walletAddress: result.user.walletAddress,
      isGuest: false,
    };
    this._isAuthenticated = true;
    this._isGuest = false;

    this.emit('authenticated', { user: this.currentUser, isNewUser: result.isNewUser });
    this.log('Wallet auth successful:', this.currentUser.username);

    // Auto-connect realtime after auth
    this.connectRealtime();

    return this.currentUser;
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION - GUEST
  // ---------------------------------------------------------------------------

  loginAsGuest(displayName?: string, walletAddress?: string): DeskillzUser {
    this.currentUser = {
      id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      username: displayName || 'Guest',
      walletAddress,
      isGuest: true,
    };
    this._isAuthenticated = false;
    this._isGuest = true;

    this.emit('authenticated', { user: this.currentUser, isNewUser: false });
    this.log('Guest session:', this.currentUser.username);

    return this.currentUser;
  }

  // ---------------------------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------------------------

  async logout(): Promise<void> {
    this.log('Logging out...');

    // Disconnect realtime first
    this.disconnectRealtime();

    // Server-side logout (best-effort)
    if (this.sdk && this._isAuthenticated && !this._isGuest) {
      try {
        await this.sdk.auth.logout();
      } catch (err) {
        this.log('Server logout error (non-critical):', err);
      }
    }

    // Clear local state
    this.currentUser = null;
    this._isAuthenticated = false;
    this._isGuest = false;
    this.currentRoom = null;

    this.emit('logout', {});
    this.log('Logged out');
  }

  // ---------------------------------------------------------------------------
  // WALLET
  // ---------------------------------------------------------------------------

  async getWalletBalance(): Promise<WalletBalance> {
    if (!this.sdk || this._isGuest) {
      return { total: 0, currency: 'USD', balances: [] };
    }

    this.ensureAuthenticated();

    try {
      const [allBalances, totalUsd] = await Promise.all([
        this.sdk.wallet.getAllBalances(),
        this.sdk.wallet.getTotalBalanceUSD(),
      ]);

      const result: WalletBalance = {
        total: totalUsd.totalUsd,
        currency: 'USD',
        balances: allBalances.map((b) => ({
          currency: b.currency,
          amount: b.balance,
          usdValue: b.usdValue,
        })),
      };

      this.emit('walletUpdated', result);
      return result;
    } catch (err) {
      this.log('Wallet balance error:', err);
      return { total: 0, currency: 'USD', balances: [] };
    }
  }

  async getBalanceForCurrency(currency: string): Promise<number> {
    if (!this.sdk || this._isGuest) return 0;
    this.ensureAuthenticated();

    try {
      const balance = await this.sdk.wallet.getBalance(currency);
      return balance.balance;
    } catch (err) {
      this.log('Balance fetch error for', currency, ':', err);
      return 0;
    }
  }

  // ---------------------------------------------------------------------------
  // PRIVATE ROOMS
  // ---------------------------------------------------------------------------

  async createRoom(opts: {
    name?: string;
    isSocialGame?: boolean;
    entryFee?: number;
    maxPlayers?: number;
    pointValue?: number;
    currency?: string;
  }): Promise<PrivateRoom> {
    this.ensureAuthenticated();

    if (!this.sdk || this._isGuest) {
      return this.createMockRoom(opts);
    }

    this.log('Creating room:', opts);
    const room = await this.sdk.rooms.createRoom({
      gameId: this.config.gameId,
      name: opts.name || `${this.currentUser?.username}'s Room`,
      maxPlayers: opts.maxPlayers || 4,
      isSocialGame: opts.isSocialGame || false,
      entryFee: opts.entryFee || 0,
      pointValue: opts.pointValue,
      currency: opts.currency || 'USDT',
    });

    this.currentRoom = room;

    // Auto-subscribe to room events
    if (this.sdk.realtime.isConnected) {
      this.sdk.realtime.subscribeRoom(room.id);
    }

    this.emit('roomJoined', { room });
    return room;
  }

  async joinRoom(code: string): Promise<PrivateRoom> {
    this.ensureAuthenticated();

    if (!this.sdk || this._isGuest) {
      return this.joinMockRoom(code);
    }

    this.log('Joining room:', code);
    const room = await this.sdk.rooms.joinByCode(code);
    this.currentRoom = room;

    // Auto-subscribe to room events
    if (this.sdk.realtime.isConnected) {
      this.sdk.realtime.subscribeRoom(room.id);
    }

    this.emit('roomJoined', { room });
    return room;
  }

  async leaveRoom(): Promise<void> {
    if (!this.currentRoom) return;

    const roomId = this.currentRoom.id;
    this.log('Leaving room:', roomId);

    // Unsubscribe from room events
    if (this.sdk?.realtime.isConnected) {
      this.sdk.realtime.unsubscribeRoom(roomId);
    }

    if (this.sdk && !this._isGuest) {
      try {
        await this.sdk.rooms.leaveRoom(roomId);
      } catch (err) {
        this.log('Leave room error (non-critical):', err);
      }
    }

    this.emit('roomLeft', { roomId });
    this.currentRoom = null;
  }

  async roomBuyIn(
    amount: number,
    currency: string = 'USDT'
  ): Promise<{ success: boolean; pointBalance: number }> {
    if (!this.sdk || this._isGuest || !this.currentRoom) {
      return { success: true, pointBalance: amount };
    }

    this.ensureAuthenticated();
    return this.sdk.rooms.buyIn({
      roomId: this.currentRoom.id,
      amount,
      currency,
    });
  }

  async roomCashOut(): Promise<{ success: boolean; amount: number }> {
    if (!this.sdk || this._isGuest || !this.currentRoom) {
      return { success: true, amount: 0 };
    }

    this.ensureAuthenticated();
    return this.sdk.rooms.cashOut(this.currentRoom.id);
  }

  // ---------------------------------------------------------------------------
  // SCORE SUBMISSION
  // ---------------------------------------------------------------------------

  async submitScore(payload: GameScorePayload): Promise<{ success: boolean }> {
    if (!this.sdk || this._isGuest) {
      this.log('Score submitted (local only):', payload);
      return { success: true };
    }

    this.ensureAuthenticated();
    this.log('Submitting score:', payload);

    if (payload.tournamentId) {
      return this.sdk.tournaments.submitScore({
        tournamentId: payload.tournamentId,
        score: payload.score,
        metadata: payload.metadata,
      });
    }

    // For non-tournament games, log and return success
    // (room-based scoring is handled server-side via socket events)
    this.log('Score recorded (non-tournament):', payload.score);
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // REALTIME / SOCKET
  // ---------------------------------------------------------------------------

  connectRealtime(): void {
    if (!this.sdk || this._isGuest) {
      this.log('Realtime: skipped (no SDK or guest mode)');
      return;
    }

    this.log('Connecting realtime...');
    this.sdk.realtime.connect().catch((err: unknown) => {
      this.log('Realtime connect error:', err);
    });
  }

  disconnectRealtime(): void {
    // Cleanup all subscriptions
    this.realtimeCleanups.forEach((cleanup) => cleanup());
    this.realtimeCleanups = [];

    if (this.sdk) {
      this.sdk.realtime.disconnect();
      this.log('Realtime disconnected');
    }
  }

  onRealtimeEvent(event: string, handler: (...args: unknown[]) => void): () => void {
    if (!this.sdk) {
      return () => {}; // No-op unsubscribe for offline mode
    }

    const cleanup = this.sdk.realtime.on(event, handler);
    this.realtimeCleanups.push(cleanup);
    return cleanup;
  }

  sendRealtimeMessage(event: string, data: unknown): void {
    if (!this.sdk || !this.sdk.realtime.isConnected) {
      this.log('Realtime send skipped (not connected):', event);
      return;
    }

    // Route to appropriate SDK method based on event prefix
    if (event === 'room:chat' && this.currentRoom) {
      this.sdk.realtime.sendRoomChat(this.currentRoom.id, data as string);
    } else if (event === 'room:ready' && this.currentRoom) {
      this.sdk.realtime.setRoomReady(this.currentRoom.id, data as boolean);
    } else {
      this.log('Unhandled realtime event:', event);
    }
  }

  get isRealtimeConnected(): boolean {
    return this.sdk?.realtime.isConnected ?? false;
  }

  // ---------------------------------------------------------------------------
  // STATE ACCESSORS
  // ---------------------------------------------------------------------------

  getCurrentUser(): DeskillzUser | null {
    return this.currentUser;
  }

  getIsAuthenticated(): boolean {
    return this._isAuthenticated;
  }

  getIsGuest(): boolean {
    return this._isGuest;
  }

  getCurrentRoom(): PrivateRoom | null {
    return this.currentRoom;
  }

  isReady(): boolean {
    return this.isInitialized;
  }

  getConfig(): BridgeConfig {
    return { ...this.config };
  }

  /** True when connected to real backend (not guest/offline) */
  get isLive(): boolean {
    return this.sdk !== null && this._isAuthenticated && !this._isGuest;
  }

  // ---------------------------------------------------------------------------
  // EVENT SYSTEM
  // ---------------------------------------------------------------------------

  on(callback: BridgeEventCallback): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback);
    };
  }

  protected emit(type: BridgeEventType, data: unknown): void {
    for (const cb of this.listeners) {
      try {
        cb(type, data);
      } catch (err) {
        console.error('[DeskillzBridge] Event listener error:', err);
      }
    }
  }

  // ---------------------------------------------------------------------------
  // MOCK FALLBACKS (guest/offline mode)
  // ---------------------------------------------------------------------------

  private createMockRoom(opts: Record<string, unknown>): PrivateRoom {
    const room: PrivateRoom = {
      id: `mock_room_${Date.now()}`,
      code: this.generateRoomCode(),
      hostId: this.currentUser?.id || '',
      gameId: this.config.gameId,
      status: 'WAITING',
      entryFee: (opts.entryFee as number) || 0,
      maxPlayers: (opts.maxPlayers as number) || 4,
      currentPlayers: 1,
      isSocialGame: (opts.isSocialGame as boolean) || false,
      pointValue: opts.pointValue as number | undefined,
      rakePercent: 5,
    };
    this.currentRoom = room;
    return room;
  }

  private joinMockRoom(code: string): PrivateRoom {
    const room: PrivateRoom = {
      id: `mock_room_${Date.now()}`,
      code,
      hostId: 'mock_host',
      gameId: this.config.gameId,
      status: 'WAITING',
      entryFee: 0,
      maxPlayers: 4,
      currentPlayers: 2,
      isSocialGame: false,
    };
    this.currentRoom = room;
    return room;
  }

  // ---------------------------------------------------------------------------
  // UTILITY
  // ---------------------------------------------------------------------------

  protected ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('[DeskillzBridge] Not initialized. Call initialize() first.');
    }
  }

  protected ensureAuthenticated(): void {
    this.ensureInitialized();
    if (!this._isAuthenticated && !this._isGuest) {
      throw new Error('[DeskillzBridge] Not authenticated. Call login() first.');
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from({ length: 8 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  }

  protected cleanup(): void {
    this.disconnectRealtime();

    if (this.sdk) {
      try {
        this.sdk.destroy();
      } catch (err) {
        this.log('SDK destroy error:', err);
      }
    }

    this.listeners = [];
    this.sdk = null;
    this.isInitialized = false;
    this._isAuthenticated = false;
    this._isGuest = false;
    this.currentUser = null;
    this.currentRoom = null;
  }

  protected log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[DeskillzBridge]', ...args);
    }
  }
}

export default DeskillzBridge;