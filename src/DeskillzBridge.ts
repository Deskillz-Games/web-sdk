// =============================================================================
// Deskillz Universal Game Bridge (Consolidated)
// Path: src/sdk/DeskillzBridge.ts
//
// SINGLE-FILE SDK + BRIDGE for Deskillz web games.
// Contains: HTTP client, token manager, auth, wallet, rooms, tournaments,
// realtime, event system, and guest fallbacks.
// No external npm dependencies (socket.io-client is optional).
// All endpoints use /api/v1/ prefix.
//
// USAGE:
//   import { DeskillzBridge } from './sdk/DeskillzBridge';
//
//   const bridge = DeskillzBridge.getInstance({
//     gameId: 'your-game-id',
//     gameKey: 'YOUR_API_KEY',
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

interface ResolvedConfig {
  gameId: string;
  gameKey: string;
  apiBaseUrl: string;
  socketUrl: string;
  debug: boolean;
  timeout: number;
}

function resolveConfig(cfg: BridgeConfig): ResolvedConfig {
  return {
    gameId: cfg.gameId,
    gameKey: cfg.gameKey,
    apiBaseUrl: (cfg.apiBaseUrl || 'https://api.deskillz.games').replace(/\/$/, ''),
    socketUrl: cfg.socketUrl || 'wss://ws.deskillz.games/lobby',
    debug: cfg.debug ?? false,
    timeout: 120_000,
  };
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
  minPlayers: number;
  currentPlayers: number;
  /** ESPORTS or SOCIAL */
  gameCategory: 'ESPORTS' | 'SOCIAL';
  /** Kept for backward compat; derived from gameCategory === 'SOCIAL' */
  isSocialGame: boolean;
  // Social game settings (present when gameCategory === 'SOCIAL')
  pointValue?: number;
  rakePercent?: number;
  rakeCap?: number;
  minBuyIn?: number;
  maxBuyIn?: number;
  defaultBuyIn?: number;
  turnTimerSeconds?: number;
  // Room metadata
  visibility?: string;
  roomCode?: string;
  name?: string;
  description?: string;
}

/** Options for creating an esports private room */
export interface CreateEsportRoomOpts {
  name?: string;
  entryFee: number;
  currency?: string;
  maxPlayers?: number;
  minPlayers?: number;
  format?: string;
  visibility?: 'PUBLIC_LISTED' | 'PRIVATE_CODE';
}

/** Options for creating a social game room */
export interface CreateSocialRoomOpts {
  name?: string;
  currency?: string;
  maxPlayers?: number;
  minPlayers?: number;
  pointValue: number;
  rakePercent?: number;
  rakeCap?: number;
  minBuyIn?: number;
  maxBuyIn?: number;
  turnTimerSeconds?: number;
  gameType?: 'MAHJONG' | 'BIG_TWO' | 'CHINESE_POKER_13';
  visibility?: 'PUBLIC_LISTED' | 'PRIVATE_CODE';
}

export interface GameScorePayload {
  gameId: string;
  matchId?: string;
  tournamentId?: string;
  roomId?: string;
  score: number;
  metadata?: Record<string, unknown>;
}

export interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  totalEarnings: number;
  currentStreak: number;
  bestStreak: number;
  avgScore: number;
  tournamentWins: number;
}

export interface MatchRecord {
  id: string;
  date: string;
  opponent: string;
  result: 'win' | 'loss';
  score: number;
  earnings: number;
  currency: string;
  gameMode: string;
}

export interface UpdateProfilePayload {
  username?: string;
  avatarUrl?: string;
}

export interface TransactionRequest {
  currency: string;
  amount: number;
  address?: string;
}

export interface TransactionResult {
  success: boolean;
  txHash?: string;
  message?: string;
}

export interface TournamentListing {
  id: string;
  name: string;
  description?: string;
  entryFee: number;
  currency: string;
  prizePool: number;
  currentPlayers: number;
  maxPlayers: number;
  minPlayers: number;
  format: string;
  mode: string;
  status: string;
  gameMode?: string;
  startsAt?: string;
  minimumFan?: number;
  prizeDistribution?: Array<{ place: number; percentage: number }>;
}

export interface QuickPlayJoinParams {
  /** Game ID to join Quick Play for */
  gameId: string;
  /** Entry fee (esport) or point value (social) in USD */
  entryFee: number;
  /** Number of players (2 = 1v1, 3 = FFA-3, 4 = FFA-4 or social table) */
  playerCount: number;
  /** Payment currency (e.g., 'BNB', 'USDT_BSC', 'USDC_TRON') */
  currency: string;
}

export interface QuickPlayJoinResult {
  success: boolean;
  queueKey: string;
  gameId: string;
  entryFee: number;
  playerCount: number;
  currency: string;
  position: number;
  estimatedWait: number;
  playersInQueue: number;
  matchId?: string;
}

export interface QuickPlayStatus {
  inQueue: boolean;
  queues: Array<{
    queueKey: string;
    gameId: string;
    entryFee: number;
    playerCount: number;
    currency: string;
    position: number;
    estimatedWait: number;
    playersInQueue: number;
    joinedAt: string;
  }>;
}

export interface QuickPlayLaunchData {
  matchId: string;
  matchSessionId: string;
  gameId: string;
  deepLink: string;
  token: string;
  entryFee: number;
  currency: string;
  prizePool: number;
  players: Array<{ id: string; username: string; isNPC: boolean }>;
  matchDurationSecs: number | null;
}

export interface QuickPlayScoreResult {
  success: boolean;
  matchId: string;
  playerId: string;
  score: number;
  allScoresSubmitted: boolean;
}

export interface QuickPlayMatchResult {
  matchId: string;
  gameId: string;
  status: string;
  entryFee: number;
  currency: string;
  prizePool: number;
  platformFee: number;
  players: Array<{
    id: string;
    username: string;
    score: number | null;
    rank: number | null;
    prizeWon: number;
    isNPC: boolean;
  }>;
  winnerId: string | null;
  completedAt: string | null;
}

export interface QuickPlayMatchData {
  matchId: string;
  gameId: string;
  entryFee: number;
  currency: string;
  players: Array<{ id: string; rating: number }>;
  npcCount?: number;
}
// =============================================================================
// EVENT SYSTEM
// =============================================================================

export type BridgeEventType =
  | 'initialized'
  | 'authenticated'
  | 'logout'
  | 'profileUpdated'
  | 'roomJoined'
  | 'roomLeft'
  | 'matchFound'
  | 'gameStarted'
  | 'gameEnded'
  | 'error'
  | 'connectionChanged'
  | 'walletUpdated'
  | 'walletDisconnected'
  | 'depositComplete'
  | 'withdrawComplete'
  | 'playerJoined'
  | 'playerLeft'
  | 'quickPlaySearching'
  | 'quickPlayFound'
  | 'quickPlayNPCFilling'
  | 'quickPlayStarting'
  | 'quickPlayLeft'
  | 'quickPlayMatchLaunched'
  | 'quickPlayScoreSubmitted'
  | 'quickPlayMatchCompleted';

export type BridgeEventCallback = (type: BridgeEventType, data: unknown) => void;

// =============================================================================
// TOKEN MANAGER (localStorage-based JWT storage)
// =============================================================================

const ACCESS_KEY = 'deskillz_access_token';
const REFRESH_KEY = 'deskillz_refresh_token';

class TokenManager {
  getAccessToken(): string | null {
    try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
  }
  getRefreshToken(): string | null {
    try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
  }
  setTokens(access: string, refresh?: string): void {
    try {
      localStorage.setItem(ACCESS_KEY, access);
      if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
    } catch { /* storage unavailable */ }
  }
  clearTokens(): void {
    try {
      localStorage.removeItem(ACCESS_KEY);
      localStorage.removeItem(REFRESH_KEY);
    } catch { /* storage unavailable */ }
  }
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

// =============================================================================
// HTTP CLIENT (native fetch with 401 auto-refresh interceptor)
// Replicates the axios interceptor chain from api-client.ts:
//   - Request: attach Authorization Bearer token
//   - Response: 401 -> refresh token -> retry once
//   - Mutex to prevent concurrent refresh attempts
// =============================================================================

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

class HttpClient {
  private config: ResolvedConfig;
  private tokens: TokenManager;
  private refreshPromise: Promise<boolean> | null = null;
  private onForceLogout?: () => void;

  constructor(config: ResolvedConfig, tokens: TokenManager, onForceLogout?: () => void) {
    this.config = config;
    this.tokens = tokens;
    this.onForceLogout = onForceLogout;
  }

  async get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
    return this.request<T>('GET', this.buildUrl(path, params));
  }

  async post<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('POST', this.buildUrl(path), data);
  }

  async put<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('PUT', this.buildUrl(path), data);
  }

  async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.request<T>('PATCH', this.buildUrl(path), data);
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', this.buildUrl(path));
  }

  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const base = `${this.config.apiBaseUrl}${path}`;
    if (!params) return base;
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) sp.set(k, String(v));
    }
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  }

  private async request<T>(method: HttpMethod, url: string, body?: unknown, isRetry = false): Promise<T> {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const token = this.tokens.getAccessToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    const opts: RequestInit = { method, headers, signal: controller.signal };
    if (body !== undefined && method !== 'GET') {
      opts.body = JSON.stringify(body);
    }

    if (this.config.debug) {
      console.log(`[DeskillzBridge] ${method} ${url}`, body ?? '');
    }

    try {
      const res = await fetch(url, opts);
      clearTimeout(timeoutId);

      // 401 auto-refresh (one retry only)
      if (res.status === 401 && !isRetry) {
        const refreshed = await this.attemptRefresh();
        if (refreshed) return this.request<T>(method, url, body, true);
        this.tokens.clearTokens();
        this.onForceLogout?.();
        throw new Error('Session expired. Please log in again.');
      }

      const json = await res.json().catch(() => null);

      if (!res.ok) {
        const msg = json?.message || json?.error || `Request failed (${res.status})`;
        throw new Error(msg);
      }

      if (this.config.debug) {
        console.log(`[DeskillzBridge] ${method} ${url} -> ${res.status}`);
      }

      // Backend may wrap in { data, success } or return raw
      if (json && typeof json === 'object' && 'data' in json) {
        return json.data as T;
      }
      return json as T;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('Request timed out.');
      }
      throw err;
    }
  }

  private async attemptRefresh(): Promise<boolean> {
    if (this.refreshPromise) return this.refreshPromise;
    this.refreshPromise = this.doRefresh();
    try { return await this.refreshPromise; }
    finally { this.refreshPromise = null; }
  }

  private async doRefresh(): Promise<boolean> {
    try {
      const refreshToken = this.tokens.getRefreshToken();
      if (!refreshToken) return false;

      if (this.config.debug) console.log('[DeskillzBridge] Attempting token refresh...');

      const res = await fetch(`${this.config.apiBaseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;
      const data = await res.json();
      this.tokens.setTokens(data.accessToken, data.refreshToken);

      if (this.config.debug) console.log('[DeskillzBridge] Token refresh successful');
      return true;
    } catch {
      return false;
    }
  }
}

// =============================================================================
// REALTIME SERVICE (Socket.io - dynamically imported, optional)
// =============================================================================

class RealtimeService {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private socket: any = null;
  private _isConnected = false;
  private config: ResolvedConfig;
  private tokens: TokenManager;

  constructor(config: ResolvedConfig, tokens: TokenManager) {
    this.config = config;
    this.tokens = tokens;
  }

  async connect(): Promise<void> {
    try {
      const { io } = await import('socket.io-client');
      const token = this.tokens.getAccessToken();

      this.socket = io(this.config.socketUrl, {
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        this._isConnected = true;
        if (this.config.debug) console.log('[DeskillzBridge] Socket connected');
      });

      this.socket.on('disconnect', () => {
        this._isConnected = false;
        if (this.config.debug) console.log('[DeskillzBridge] Socket disconnected');
      });
      // --- Quick Play socket event listeners ---

  this.socket.on('quick-play:searching', (data: unknown) => {
    if (this.config.debug) console.log('[DeskillzBridge] QP: Searching', data);
  });

  this.socket.on('quick-play:found', (data: unknown) => {
    if (this.config.debug) console.log('[DeskillzBridge] QP: Match Found', data);
  });

  this.socket.on('quick-play:npc-filling', (data: unknown) => {
    if (this.config.debug) console.log('[DeskillzBridge] QP: NPC Filling', data);
  });

  this.socket.on('quick-play:starting', (data: unknown) => {
    if (this.config.debug) console.log('[DeskillzBridge] QP: Match Starting', data);
  });
   // --- Quick Play Match socket event listeners (Phase 4) ---

      this.socket.on('quick-play:match-launched', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] QP Match: Launched', data);
      });

      this.socket.on('quick-play:score-submitted', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] QP Match: Score Submitted', data);
      });

      this.socket.on('quick-play:match-completed', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] QP Match: Completed', data);
      });
    } catch {
      if (this.config.debug) console.log('[DeskillzBridge] socket.io-client not available, realtime disabled');
    }
  }

  disconnect(): void {
    this.socket?.disconnect();
    this._isConnected = false;
  }

  subscribeRoom(roomId: string): void {
    this.socket?.emit('room:join', { roomId });
  }

  unsubscribeRoom(roomId: string): void {
    this.socket?.emit('room:leave', { roomId });
  }

  on(event: string, handler: (...args: unknown[]) => void): () => void {
    this.socket?.on(event, handler);
    return () => { this.socket?.off(event, handler); };
  }

  sendChat(roomId: string, message: string): void {
    this.socket?.emit('room:chat', { roomId, message });
  }

 setReady(roomId: string, isReady: boolean): void {
    this.socket?.emit('room:ready', { roomId, isReady });
  }

  /** Generic emit for any event */
  emit(event: string, data: unknown): void {
    this.socket?.emit(event, data);
  }

  get isConnected(): boolean {
    return this._isConnected;
  }
}

// =============================================================================
// MAIN BRIDGE CLASS
// =============================================================================

export class DeskillzBridge {
  private static instance: DeskillzBridge | null = null;

  // -- Core --
  protected config: BridgeConfig;
  protected resolved: ResolvedConfig;
  protected http: HttpClient;
  protected tokens: TokenManager;
  protected realtime: RealtimeService;
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
    this.resolved = resolveConfig(config);
    this.tokens = new TokenManager();
    this.http = new HttpClient(this.resolved, this.tokens, () => {
      this.log('Forced logout - tokens expired');
      this._isAuthenticated = false;
      this._isGuest = false;
      this.currentUser = null;
      this.emit('logout', {});
    });
    this.realtime = new RealtimeService(this.resolved, this.tokens);
  }

  static getInstance(config?: BridgeConfig): DeskillzBridge {
    if (!DeskillzBridge.instance) {
      if (!config) throw new Error('[DeskillzBridge] Config required on first initialization');
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

  /** Instance-level cleanup for subclass override */
  destroy(): void {
    this.cleanup();
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
      // Attempt session restore from stored tokens
      await this.restoreSession();

      this.isInitialized = true;
      this.emit('initialized', { success: true, mode: 'live' });
      this.log('Bridge ready (live mode)');
    } catch (err) {
      this.log('Init error (non-critical):', err);
      this.isInitialized = true;
      this.emit('initialized', { success: true, mode: 'live' });
    }
  }

  // ---------------------------------------------------------------------------
  // SESSION RESTORE
  // ---------------------------------------------------------------------------

  private async restoreSession(): Promise<void> {
    if (!this.tokens.isAuthenticated()) return;

    try {
      const user = await this.http.get<{
        id: string; username: string; email?: string; avatarUrl?: string; walletAddress?: string;
      }>('/api/v1/users/me');

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
    }
  }

  // ---------------------------------------------------------------------------
  // AUTHENTICATION - EMAIL
  // ---------------------------------------------------------------------------

  async login(email: string, password: string): Promise<DeskillzUser> {
    this.ensureInitialized();
    this.log('Logging in with email:', email);

    try {
      const result = await this.http.post<any>('/api/v1/auth/login', { email, password });

      const accessToken = result.tokens?.accessToken ?? result.accessToken;
      const refreshToken = result.tokens?.refreshToken ?? result.refreshToken;
      this.tokens.setTokens(accessToken, refreshToken);

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

      this.connectRealtime();
      return this.currentUser;
    } catch (err) {
      this.log('Login failed:', err);
      throw err;
    }
  }

  async register(username: string, email: string, password: string): Promise<DeskillzUser> {
    this.ensureInitialized();
    this.log('Registering:', username, email);

    try {
     const result = await this.http.post<any>('/api/v1/auth/register', { email, password, username });

      const accessToken = result.tokens?.accessToken ?? result.accessToken;
      const refreshToken = result.tokens?.refreshToken ?? result.refreshToken;
      this.tokens.setTokens(accessToken, refreshToken);

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

      this.connectRealtime();
      return this.currentUser;
    } catch (err) {
      this.log('Registration failed:', err);
      throw err;
    }
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

    if (!signMessage) {
      // No sign function provided - fall back to guest with wallet display name
      const shortAddr = `${address.slice(0, 6)}...${address.slice(-4)}`;
      return this.loginAsGuest(shortAddr, address);
    }

    this.log('Authenticating wallet:', address);

    try {
      // Step 1: Get nonce from backend
      const { nonce } = await this.http.get<{ nonce: string }>('/api/v1/auth/nonce', {
        walletAddress: address,
      });

      // Step 2: Construct SIWE message
      const domain = window.location.host;
      const uri = window.location.origin;
      const issuedAt = new Date().toISOString();

      const message = [
        `${domain} wants you to sign in with your Ethereum account:`,
        address,
        '',
        'Sign in to Deskillz.Games to access tournaments and compete for prizes.',
        '',
        `URI: ${uri}`,
        `Version: 1`,
        `Chain ID: ${chainId}`,
        `Nonce: ${nonce}`,
        `Issued At: ${issuedAt}`,
      ].join('\n');

      // Step 3: Sign with wallet
      const signature = await signMessage(message);

      // Step 4: Verify with backend
     const result = await this.http.post<any>('/api/v1/auth/wallet/verify', { message, signature, walletAddress: address });

      const accessToken = result.tokens?.accessToken ?? result.accessToken;
      const refreshToken = result.tokens?.refreshToken ?? result.refreshToken;
      this.tokens.setTokens(accessToken, refreshToken);

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

      this.connectRealtime();
      return this.currentUser;
    } catch (err) {
      this.log('Wallet auth failed:', err);
      throw err;
    }
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

    this.disconnectRealtime();

    if (this._isAuthenticated && !this._isGuest) {
      try { await this.http.post('/api/v1/auth/logout'); } catch { /* best effort */ }
    }

    this.tokens.clearTokens();
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
    if (this._isGuest || !this._isAuthenticated) {
      return { total: 0, currency: 'USD', balances: [] };
    }

    try {
      const [allBalances, totalUsd] = await Promise.all([
        this.http.get<Array<{ currency: string; balance: number; usdValue: number }>>('/api/v1/wallet/balances'),
        this.http.get<{ totalUsd: number }>('/api/v1/wallet/total'),
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
    if (this._isGuest || !this._isAuthenticated) return 0;

    try {
      const result = await this.http.get<{ balance: number }>(`/api/v1/wallet/balances/${currency}`);
      return result.balance;
    } catch (err) {
      this.log('Balance fetch error for', currency, ':', err);
      return 0;
    }
  }

  async deposit(currency: string, amount: number): Promise<TransactionResult> {
    if (this._isGuest || !this._isAuthenticated) {
      return { success: false, message: 'Wallet not available in guest mode.' };
    }

    try {
      this.log('Depositing:', amount, currency);
      const result = await this.http.post<TransactionResult>('/api/v1/wallet/deposit', { currency, amount });
      if (result.success) {
        const updated = await this.getWalletBalance();
        this.emit('walletUpdated', updated);
      }
      return result;
    } catch (err) {
      this.log('Deposit error:', err);
      return { success: false, message: 'Deposit failed. Please try again.' };
    }
  }

  async withdraw(currency: string, amount: number, address?: string): Promise<TransactionResult> {
    if (this._isGuest || !this._isAuthenticated) {
      return { success: false, message: 'Wallet not available in guest mode.' };
    }

    try {
      this.log('Withdrawing:', amount, currency);
      const result = await this.http.post<TransactionResult>('/api/v1/wallet/withdraw', { currency, amount, address });
      if (result.success) {
        const updated = await this.getWalletBalance();
        this.emit('walletUpdated', updated);
      }
      return result;
    } catch (err) {
      this.log('Withdraw error:', err);
      return { success: false, message: 'Withdrawal failed. Please try again.' };
    }
  }

  async disconnectWallet(): Promise<void> {
    if (this._isGuest || !this._isAuthenticated) return;

    try {
      this.log('Disconnecting wallet...');
      await this.http.post('/api/v1/auth/wallet/disconnect');
      if (this.currentUser) this.currentUser.walletAddress = undefined;
      this.emit('walletUpdated', { total: 0, currency: 'USD', balances: [] });
    } catch (err) {
      this.log('Disconnect wallet error:', err);
    }
  }

  // ---------------------------------------------------------------------------
  // USER PROFILE
  // ---------------------------------------------------------------------------

  async getProfile(): Promise<DeskillzUser | null> {
    if (this._isGuest || !this._isAuthenticated) return this.currentUser;

    try {
      const profile = await this.http.get<{
        id: string; username: string; email?: string; avatarUrl?: string; walletAddress?: string;
      }>('/api/v1/users/me');

      this.currentUser = {
        id: profile.id,
        username: profile.username,
        email: profile.email,
        avatarUrl: profile.avatarUrl,
        walletAddress: profile.walletAddress,
        isGuest: false,
      };
      return this.currentUser;
    } catch (err) {
      this.log('Get profile error:', err);
      return this.currentUser;
    }
  }

  async updateProfile(data: UpdateProfilePayload): Promise<DeskillzUser | null> {
    if (this._isGuest || !this._isAuthenticated) {
      if (this.currentUser) {
        if (data.username) this.currentUser.username = data.username;
        if (data.avatarUrl) this.currentUser.avatarUrl = data.avatarUrl;
      }
      this.emit('profileUpdated', this.currentUser);
      return this.currentUser;
    }

    try {
      const updated = await this.http.put<{
        id: string; username: string; email?: string; avatarUrl?: string;
      }>('/api/v1/users/me', data);

      if (this.currentUser) {
        this.currentUser.username = updated.username;
        this.currentUser.email = updated.email;
        this.currentUser.avatarUrl = updated.avatarUrl;
      }
      this.emit('profileUpdated', this.currentUser);
      return this.currentUser;
    } catch (err) {
      this.log('Update profile error:', err);
      throw err;
    }
  }

  // ---------------------------------------------------------------------------
  // PLAYER STATS
  // ---------------------------------------------------------------------------

  async getPlayerStats(): Promise<PlayerStats> {
    const empty: PlayerStats = {
      gamesPlayed: 0, gamesWon: 0, winRate: 0, totalEarnings: 0,
      currentStreak: 0, bestStreak: 0, avgScore: 0, tournamentWins: 0,
    };

    if (this._isGuest || !this._isAuthenticated) return empty;

    try {
      return await this.http.get<PlayerStats>('/api/v1/users/stats');
    } catch (err) {
      this.log('Get stats error:', err);
      return empty;
    }
  }

  // ---------------------------------------------------------------------------
  // MATCH HISTORY
  // ---------------------------------------------------------------------------

  async getMatchHistory(page = 1, limit = 20): Promise<MatchRecord[]> {
    if (this._isGuest || !this._isAuthenticated) return [];

    try {
      const result = await this.http.get<{
        matches: MatchRecord[];
        pagination: { page: number; limit: number; total: number };
      }>('/api/v1/users/match-history', { page, limit });
      return result.matches;
    } catch (err) {
      this.log('Get match history error:', err);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // ---------------------------------------------------------------------------
  // TOURNAMENTS
  // ---------------------------------------------------------------------------

  async getTournaments(filters?: Record<string, string>): Promise<TournamentListing[]> {
    if (this._isGuest || !this._isAuthenticated) return [];

    try {
      const params: Record<string, string> = { ...filters };
      if (!params.gameId) params.gameId = this.config.gameId;
      const result = await this.http.get<{
        tournaments: TournamentListing[];
      }>('/api/v1/tournaments', params);
      return result.tournaments || [];
    } catch (err) {
      this.log('Get tournaments error:', err);
      return [];
    }
  }

  async joinTournament(tournamentId: string): Promise<{ success: boolean }> {
    this.ensureAuthenticated();
    if (this._isGuest) return { success: false };
    return this.http.post(`/api/v1/tournaments/${tournamentId}/join`);
  }

  // ---------------------------------------------------------------------------
  // HOST DASHBOARD
  // ---------------------------------------------------------------------------

  async getHostDashboard(): Promise<{
    profile: {
      id: string; username: string; avatarUrl?: string; tier: string; level: number;
      isVerified: boolean; totalEarnings: number; monthlyEarnings: number; weeklyEarnings: number;
      pendingSettlement: number; roomsHosted: number; totalPlayersHosted: number; revenueSharePercent: number;
    };
    tierInfo: {
      tier: string; icon: string; currentValue: number; minThreshold: number; maxThreshold: number | null;
      progressPercent: number; nextTier: string | null; valueToNextTier: number | null;
      hostShare: number; platformShare: number; developerShare: number;
    };
    activeRooms: Array<{
      id: string; roomCode: string; name: string; gameName: string; currentPlayers: number;
      maxPlayers: number; status: string; entryFee: number; entryCurrency: string; createdAt: string;
    }>;
    recentSettlements: Array<{
      id: string; roomName: string; totalRake: number; hostShare: number;
      platformShare: number; developerShare: number; settledAt: string;
    }>;
    badges: Array<{ id: string; name: string; description: string; icon: string; earnedAt: string }>;
  }> {
    const defaultDashboard = {
      profile: {
        id: this.currentUser?.id || 'offline', username: this.currentUser?.username || 'Host',
        tier: 'bronze', level: 1, isVerified: false,
        totalEarnings: 0, monthlyEarnings: 0, weeklyEarnings: 0, pendingSettlement: 0,
        roomsHosted: 0, totalPlayersHosted: 0, revenueSharePercent: 40,
      },
      tierInfo: {
        tier: 'bronze', icon: '\uD83E\uDD49', currentValue: 0, minThreshold: 0,
        maxThreshold: 500, progressPercent: 0, nextTier: 'silver', valueToNextTier: 500,
        hostShare: 40, platformShare: 30, developerShare: 30,
      },
      activeRooms: [] as Array<any>,
      recentSettlements: [] as Array<any>,
      badges: [] as Array<any>,
    };

    if (this._isGuest || !this._isAuthenticated) return defaultDashboard;

    try {
      const result = await this.http.get<any>('/api/v1/host/dashboard');
      // Normalize: backend may return flat or nested structure
      if (result && result.profile) return result;
      // If backend returns flat shape, wrap it
      return {
        ...defaultDashboard,
        profile: { ...defaultDashboard.profile, ...result },
      };
    } catch (err) {
      this.log('Get host dashboard error:', err);
      return defaultDashboard;
    }
  }

  async withdrawHostEarnings(): Promise<boolean> {
    if (this._isGuest || !this._isAuthenticated) return false;

    try {
      await this.http.post('/api/v1/host/earnings/withdraw');
      const updated = await this.getWalletBalance();
      this.emit('walletUpdated', updated);
      return true;
    } catch (err) {
      this.log('Withdraw host earnings error:', err);
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // PRIVATE ROOMS
  // ---------------------------------------------------------------------------

  /**
   * Create an esports private room.
   * Endpoint: POST /api/v1/private-rooms
   */
  async createRoom(opts: CreateEsportRoomOpts): Promise<PrivateRoom> {
    this.ensureAuthenticated();

    if (this._isGuest) return this.createMockRoom({ ...opts, isSocialGame: false });

    this.log('Creating esport room:', opts);
    const res = await this.http.post<any>('/api/v1/private-rooms', {
      gameId: this.config.gameId,
      name: opts.name || `${this.currentUser?.username}'s Room`,
      maxPlayers: opts.maxPlayers || 4,
      minPlayers: opts.minPlayers || 2,
      entryFee: opts.entryFee || 0,
      entryCurrency: opts.currency || 'USDT',
      visibility: opts.visibility || 'PUBLIC_LISTED',
      gameCategory: 'ESPORTS',
    });

    const room = this.normalizeRoom(res, false);
    this.currentRoom = room;
    if (this.realtime.isConnected) this.realtime.subscribeRoom(room.id);
    this.emit('roomJoined', { room });
    return room;
  }

  /**
   * Create a social game room with rake/buy-in settings.
   * Endpoint: POST /api/v1/private-rooms/social
   */
  async createSocialRoom(opts: CreateSocialRoomOpts): Promise<PrivateRoom> {
    this.ensureAuthenticated();

    if (this._isGuest) return this.createMockRoom({ ...opts, isSocialGame: true });

    this.log('Creating social room:', opts);
    const res = await this.http.post<any>('/api/v1/private-rooms/social', {
      gameId: this.config.gameId,
      name: opts.name || `${this.currentUser?.username}'s Social Room`,
      maxPlayers: opts.maxPlayers || 4,
      minPlayers: opts.minPlayers || 2,
      entryCurrency: opts.currency || 'USDT',
      visibility: opts.visibility || 'PUBLIC_LISTED',
      gameType: opts.gameType || 'MAHJONG',
      pointValueUsd: opts.pointValue,
      rakePercentage: opts.rakePercent ?? 5,
      rakeCapPerRound: opts.rakeCap ?? 50,
      minBuyIn: opts.minBuyIn ?? opts.pointValue * 100,
      maxBuyIn: opts.maxBuyIn,
      turnTimerSeconds: opts.turnTimerSeconds ?? 60,
    });

    const room = this.normalizeRoom(res, true);
    this.currentRoom = room;
    if (this.realtime.isConnected) this.realtime.subscribeRoom(room.id);
    this.emit('roomJoined', { room });
    return room;
  }

  /**
   * Normalize backend room response to PrivateRoom interface.
   * Backend uses roomCode/pointValueUsd, client uses code/pointValue.
   */
  private normalizeRoom(raw: any, isSocial: boolean): PrivateRoom {
    return {
      id: raw.id,
      code: raw.roomCode || raw.code || '',
      hostId: raw.hostId || raw.host?.id || '',
      gameId: raw.gameId || raw.game?.id || '',
      status: raw.status || 'WAITING',
      entryFee: Number(raw.entryFee ?? 0),
      maxPlayers: raw.maxPlayers || 4,
      minPlayers: raw.minPlayers || 2,
      currentPlayers: raw.currentPlayers || 1,
      gameCategory: isSocial ? 'SOCIAL' : 'ESPORTS',
      isSocialGame: isSocial,
      pointValue: raw.pointValueUsd != null ? Number(raw.pointValueUsd) : raw.pointValue,
      rakePercent: raw.rakePercentage != null ? Number(raw.rakePercentage) : raw.rakePercent,
      rakeCap: raw.rakeCapPerRound != null ? Number(raw.rakeCapPerRound) : raw.rakeCap,
      minBuyIn: raw.minBuyIn != null ? Number(raw.minBuyIn) : undefined,
      maxBuyIn: raw.maxBuyIn != null ? Number(raw.maxBuyIn) : undefined,
      defaultBuyIn: raw.defaultBuyIn != null ? Number(raw.defaultBuyIn) : undefined,
      turnTimerSeconds: raw.turnTimerSeconds,
      visibility: raw.visibility,
      roomCode: raw.roomCode,
      name: raw.name,
      description: raw.description,
    };
  }

  async joinRoom(code: string): Promise<PrivateRoom> {
    this.ensureAuthenticated();

    if (this._isGuest) return this.joinMockRoom(code);

    this.log('Joining room:', code);
    const room = await this.http.post<PrivateRoom>('/api/v1/private-rooms/join', { joinCode: code });
    this.currentRoom = room;
    if (this.realtime.isConnected) this.realtime.subscribeRoom(room.id);
    this.emit('roomJoined', { room });
    return room;
  }

  async leaveRoom(): Promise<void> {
    if (!this.currentRoom) return;

    const roomId = this.currentRoom.id;
    this.log('Leaving room:', roomId);

    if (this.realtime.isConnected) this.realtime.unsubscribeRoom(roomId);

    if (!this._isGuest && this._isAuthenticated) {
      try { await this.http.post(`/api/v1/private-rooms/${roomId}/leave`); } catch { /* non-critical */ }
    }

    this.emit('roomLeft', { roomId });
    this.currentRoom = null;
  }

  async roomBuyIn(amount: number, currency: string = 'USDT'): Promise<{ success: boolean; pointBalance: number }> {
    if (this._isGuest || !this.currentRoom) return { success: true, pointBalance: amount };

    return this.http.post(`/api/v1/private-rooms/${this.currentRoom.id}/buy-in`, { amount, currency });
  }

  async roomCashOut(): Promise<{ success: boolean; amount: number }> {
    if (this._isGuest || !this.currentRoom) return { success: true, amount: 0 };

    return this.http.post(`/api/v1/private-rooms/${this.currentRoom.id}/cash-out`);
  }

  // ---------------------------------------------------------------------------
  // SCORE SUBMISSION
  // ---------------------------------------------------------------------------

  async submitScore(payload: GameScorePayload): Promise<{ success: boolean }> {
    if (this._isGuest || !this._isAuthenticated) {
      this.log('Score submitted (local only):', payload);
      return { success: true };
    }

    this.log('Submitting score:', payload);

    if (payload.tournamentId) {
      return this.http.post(`/api/v1/tournaments/${payload.tournamentId}/score`, {
        score: payload.score,
        metadata: payload.metadata,
      });
    }

    // Non-tournament scoring handled server-side via socket events
    this.log('Score recorded (non-tournament):', payload.score);
    return { success: true };
  }

   // ---------------------------------------------------------------------------
  // QUICK PLAY (Phase 3 - Instant Matchmaking)
  // ---------------------------------------------------------------------------

  private _quickPlayCleanups: Array<() => void> = [];

  async joinQuickPlay(params: QuickPlayJoinParams): Promise<QuickPlayJoinResult> {
    this.ensureAuthenticated();

    if (this._isGuest) {
      this.log('Quick Play: simulating join (guest mode)');
      const mockResult: QuickPlayJoinResult = {
        success: true,
        queueKey: `qp:mock:${params.entryFee}:${params.playerCount}`,
        gameId: params.gameId || this.config.gameId,
        entryFee: params.entryFee,
        playerCount: params.playerCount,
        currency: params.currency,
        position: 1,
        estimatedWait: 5,
        playersInQueue: 1,
      };
      this.emit('quickPlaySearching', mockResult);

      // Simulate match found after 3 seconds in guest mode
      setTimeout(() => {
        this.emit('quickPlayFound', {
          matchId: `mock_match_${Date.now()}`,
          gameId: params.gameId || this.config.gameId,
          entryFee: params.entryFee,
          currency: params.currency,
          players: [{ id: this.currentUser?.id || 'guest', rating: 1000 }],
        });
      }, 3000);

      return mockResult;
    }

    this.log('Quick Play: joining queue', params);

    // Set up socket listeners for this session
    this.cleanupQuickPlayListeners();
    this.setupQuickPlayListeners();

    const result = await this.http.post<QuickPlayJoinResult>(
      '/api/v1/lobby/quick-play/join',
      {
        gameId: params.gameId || this.config.gameId,
        entryFee: params.entryFee,
        playerCount: params.playerCount,
        currency: params.currency,
      },
    );

    this.emit('quickPlaySearching', result);

    // If match was created immediately, emit found event
    if (result.matchId) {
      this.emit('quickPlayFound', {
        matchId: result.matchId,
        gameId: result.gameId,
        entryFee: result.entryFee,
        currency: result.currency,
        players: [],
      });
    }

    return result;
  }

  async leaveQuickPlay(): Promise<{ success: boolean }> {
    this.ensureAuthenticated();

    if (this._isGuest) {
      this.log('Quick Play: leaving queue (guest mode)');
      this.cleanupQuickPlayListeners();
      this.emit('quickPlayLeft', {});
      return { success: true };
    }

    this.log('Quick Play: leaving queue');

    try {
      const result = await this.http.post<{ success: boolean }>(
        '/api/v1/lobby/quick-play/leave',
      );
      this.cleanupQuickPlayListeners();
      this.emit('quickPlayLeft', {});
      return result;
    } catch (err) {
      this.log('Quick Play leave error:', err);
      this.cleanupQuickPlayListeners();
      return { success: false };
    }
  }

  async getQuickPlayStatus(): Promise<QuickPlayStatus> {
    this.ensureAuthenticated();

    if (this._isGuest) {
      return { inQueue: false, queues: [] };
    }

    try {
      return await this.http.get<QuickPlayStatus>('/api/v1/lobby/quick-play/status');
    } catch (err) {
      this.log('Quick Play status error:', err);
      return { inQueue: false, queues: [] };
    }
  }
 
  // ---------------------------------------------------------------------------
  // QUICK PLAY MATCH LIFECYCLE (Phase 4)
  // ---------------------------------------------------------------------------

  private _currentQuickPlayMatch: QuickPlayLaunchData | null = null;

  async launchQuickPlayMatch(matchSessionId: string): Promise<QuickPlayLaunchData> {
    this.ensureAuthenticated();

    if (this._isGuest) {
      this.log('Quick Play Match: simulating launch (guest mode)');
      const mock: QuickPlayLaunchData = {
        matchId: `mock_match_${Date.now()}`,
        matchSessionId,
        gameId: this.config.gameId,
        deepLink: `deskillz://quick-play?matchId=mock&token=mock`,
        token: 'mock-token',
        entryFee: 1,
        currency: 'USDT_BSC',
        prizePool: 1.80,
        players: [
          { id: this.currentUser?.id || 'guest', username: this.currentUser?.username || 'Guest', isNPC: false },
          { id: 'npc-1', username: 'BotPlayer', isNPC: true },
        ],
        matchDurationSecs: 120,
      };
      this._currentQuickPlayMatch = mock;
      this.emit('quickPlayMatchLaunched', mock);
      return mock;
    }

    this.log('Quick Play Match: launching', matchSessionId);

    const result = await this.http.post<QuickPlayLaunchData>(
      '/api/v1/lobby/quick-play/match/launch',
      { matchSessionId },
    );

    this._currentQuickPlayMatch = result;
    this.emit('quickPlayMatchLaunched', result);
    return result;
  }

  async submitQuickPlayScore(matchId: string, score: number): Promise<QuickPlayScoreResult> {
    this.ensureAuthenticated();

    if (this._isGuest) {
      this.log('Quick Play Score: simulated (guest mode)', score);
      const mock: QuickPlayScoreResult = {
        success: true,
        matchId,
        playerId: this.currentUser?.id || 'guest',
        score,
        allScoresSubmitted: true,
      };
      this.emit('quickPlayScoreSubmitted', mock);

      // Simulate match completion in guest mode
      setTimeout(() => {
        this.emit('quickPlayMatchCompleted', {
          matchId,
          gameId: this.config.gameId,
          status: 'COMPLETED',
          entryFee: 1,
          currency: 'USDT_BSC',
          prizePool: 1.80,
          platformFee: 0.20,
          players: [
            { id: 'guest', username: 'Guest', score, rank: 1, prizeWon: 1.80, isNPC: false },
            { id: 'npc-1', username: 'BotPlayer', score: score - 50, rank: 2, prizeWon: 0, isNPC: true },
          ],
          winnerId: 'guest',
          completedAt: new Date().toISOString(),
        });
      }, 1000);

      return mock;
    }

    this.log('Quick Play Score: submitting', matchId, score);

    const result = await this.http.post<QuickPlayScoreResult>(
      `/api/v1/lobby/quick-play/match/${matchId}/score`,
      { score },
    );

    this.emit('quickPlayScoreSubmitted', result);
    return result;
  }

  async getQuickPlayMatchResults(matchId: string): Promise<QuickPlayMatchResult> {
    this.ensureAuthenticated();

    if (this._isGuest) {
      return {
        matchId,
        gameId: this.config.gameId,
        status: 'COMPLETED',
        entryFee: 1,
        currency: 'USDT_BSC',
        prizePool: 1.80,
        platformFee: 0.20,
        players: [],
        winnerId: null,
        completedAt: null,
      };
    }

    return await this.http.get<QuickPlayMatchResult>(
      `/api/v1/lobby/quick-play/match/${matchId}/results`,
    );
  }

  async forceCompleteQuickPlayMatch(matchId: string): Promise<QuickPlayMatchResult> {
    this.ensureAuthenticated();

    if (this._isGuest) return this.getQuickPlayMatchResults(matchId);

    this.log('Quick Play Match: force completing', matchId);

    const result = await this.http.post<QuickPlayMatchResult>(
      `/api/v1/lobby/quick-play/match/${matchId}/complete`,
    );

    this._currentQuickPlayMatch = null;
    this.emit('quickPlayMatchCompleted', result);
    return result;
  }

  getCurrentQuickPlayMatch(): QuickPlayLaunchData | null {
    return this._currentQuickPlayMatch;
  }

  private setupQuickPlayListeners(): void {
    const onSearching = this.onRealtimeEvent('quick-play:searching', (data) => {
      this.emit('quickPlaySearching', data);
    });

    const onFound = this.onRealtimeEvent('quick-play:found', (data) => {
      this.emit('quickPlayFound', data);
      // Auto-cleanup after match found
      this.cleanupQuickPlayListeners();
    });

    const onNPCFilling = this.onRealtimeEvent('quick-play:npc-filling', (data) => {
      this.emit('quickPlayNPCFilling', data);
    });

    const onStarting = this.onRealtimeEvent('quick-play:starting', (data) => {
      this.emit('quickPlayStarting', data);
      // Auto-cleanup after match starts
      this.cleanupQuickPlayListeners();
    });
   
    const onMatchLaunched = this.onRealtimeEvent('quick-play:match-launched', (data) => {
      this._currentQuickPlayMatch = data as QuickPlayLaunchData;
      this.emit('quickPlayMatchLaunched', data);
    });

    const onScoreSubmitted = this.onRealtimeEvent('quick-play:score-submitted', (data) => {
      this.emit('quickPlayScoreSubmitted', data);
    });

    const onMatchCompleted = this.onRealtimeEvent('quick-play:match-completed', (data) => {
      this._currentQuickPlayMatch = null;
      this.emit('quickPlayMatchCompleted', data);
    });
    
    this._quickPlayCleanups = [
      onSearching, onFound, onNPCFilling, onStarting,
      onMatchLaunched, onScoreSubmitted, onMatchCompleted,
    ];
  }

  private cleanupQuickPlayListeners(): void {
    this._quickPlayCleanups.forEach((cleanup) => cleanup());
    this._quickPlayCleanups = [];
  }
  // ---------------------------------------------------------------------------
  // REALTIME / SOCKET
  // ---------------------------------------------------------------------------

  connectRealtime(): void {
    if (this._isGuest) {
      this.log('Realtime: skipped (guest mode)');
      return;
    }

    this.log('Connecting realtime...');
    this.realtime.connect().catch((err: unknown) => {
      this.log('Realtime connect error:', err);
    });
  }

  disconnectRealtime(): void {
    this.realtimeCleanups.forEach((cleanup) => cleanup());
    this.realtimeCleanups = [];
    this.realtime.disconnect();
    this.log('Realtime disconnected');
  }

  onRealtimeEvent(event: string, handler: (...args: unknown[]) => void): () => void {
    const cleanup = this.realtime.on(event, handler);
    this.realtimeCleanups.push(cleanup);
    return cleanup;
  }

  sendRealtimeMessage(event: string, data: unknown): void {
    if (!this.realtime.isConnected) {
      this.log('Realtime send skipped (not connected):', event);
      return;
    }

    if (event === 'room:chat' && this.currentRoom) {
      this.realtime.sendChat(this.currentRoom.id, data as string);
    } else if (event === 'room:ready' && this.currentRoom) {
      this.realtime.setReady(this.currentRoom.id, data as boolean);
   } else {
    this.realtime.emit(event, data);
  }
  }

  get isRealtimeConnected(): boolean {
    return this.realtime.isConnected;
  }

  // ---------------------------------------------------------------------------
  // STATE ACCESSORS
  // ---------------------------------------------------------------------------

  getCurrentUser(): DeskillzUser | null { return this.currentUser; }
  getIsAuthenticated(): boolean { return this._isAuthenticated; }
  getIsGuest(): boolean { return this._isGuest; }
  getCurrentRoom(): PrivateRoom | null { return this.currentRoom; }
  isReady(): boolean { return this.isInitialized; }
  getConfig(): BridgeConfig { return { ...this.config }; }

  /** True when connected to real backend (not guest/offline) */
  get isLive(): boolean {
    return this._isAuthenticated && !this._isGuest;
  }

  // ---------------------------------------------------------------------------
  // EVENT SYSTEM
  // ---------------------------------------------------------------------------

  on(callback: BridgeEventCallback): () => void {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter((l) => l !== callback); };
  }

  protected emit(type: BridgeEventType, data: unknown): void {
    for (const cb of this.listeners) {
      try { cb(type, data); }
      catch (err) { console.error('[DeskillzBridge] Event listener error:', err); }
    }
  }

  // ---------------------------------------------------------------------------
  // MOCK FALLBACKS (guest mode only)
  // ---------------------------------------------------------------------------

  private createMockRoom(opts: Record<string, unknown>): PrivateRoom {
    const isSocial = (opts.isSocialGame as boolean) || false;
    const pointValue = (opts.pointValue as number) || 0.10;
    const room: PrivateRoom = {
      id: `mock_room_${Date.now()}`,
      code: this.generateRoomCode(),
      hostId: this.currentUser?.id || '',
      gameId: this.config.gameId,
      status: 'WAITING',
      entryFee: (opts.entryFee as number) || 0,
      maxPlayers: (opts.maxPlayers as number) || 4,
      minPlayers: (opts.minPlayers as number) || 2,
      currentPlayers: 1,
      gameCategory: isSocial ? 'SOCIAL' : 'ESPORTS',
      isSocialGame: isSocial,
      pointValue: isSocial ? pointValue : undefined,
      rakePercent: isSocial ? ((opts.rakePercent as number) ?? 5) : undefined,
      rakeCap: isSocial ? ((opts.rakeCap as number) ?? 50) : undefined,
      minBuyIn: isSocial ? ((opts.minBuyIn as number) ?? pointValue * 100) : undefined,
      maxBuyIn: isSocial ? (opts.maxBuyIn as number) : undefined,
      defaultBuyIn: isSocial ? pointValue * 500 : undefined,
      turnTimerSeconds: isSocial ? ((opts.turnTimerSeconds as number) ?? 60) : undefined,
      name: (opts.name as string) || `${this.currentUser?.username}'s Room`,
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
      minPlayers: 2,
      currentPlayers: 2,
      gameCategory: 'ESPORTS',
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
    this.cleanupQuickPlayListeners();
    this.disconnectRealtime();
    this.listeners = [];
    this.tokens.clearTokens();
    this.isInitialized = false;
    this._isAuthenticated = false;
    this._isGuest = false;
    this.currentUser = null;
    this.currentRoom = null;
  }

  protected log(...args: unknown[]): void {
    if (this.config.debug || this.resolved.debug) {
      console.log('[DeskillzBridge]', ...args);
    }
  }
}

export default DeskillzBridge;