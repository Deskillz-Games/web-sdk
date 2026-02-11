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
  | 'playerLeft';

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
      const result = await this.http.post<{
        user: { id: string; username: string; email?: string; avatarUrl?: string };
        tokens: { accessToken: string; refreshToken: string };
        isNewUser: boolean;
      }>('/api/v1/auth/login', { email, password });

      this.tokens.setTokens(result.tokens.accessToken, result.tokens.refreshToken);

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
      const result = await this.http.post<{
        user: { id: string; username: string; email?: string; avatarUrl?: string };
        tokens: { accessToken: string; refreshToken: string };
        isNewUser: boolean;
      }>('/api/v1/auth/register', { email, password, username });

      this.tokens.setTokens(result.tokens.accessToken, result.tokens.refreshToken);

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
      const result = await this.http.post<{
        user: { id: string; username: string; walletAddress?: string };
        tokens: { accessToken: string; refreshToken: string };
        isNewUser: boolean;
      }>('/api/v1/auth/wallet/verify', { message, signature, walletAddress: address });

      this.tokens.setTokens(result.tokens.accessToken, result.tokens.refreshToken);

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
        this.http.get<Array<{ currency: string; balance: number; usdValue: number }>>('/api/v1/wallet/balance'),
        this.http.get<{ totalUsd: number }>('/api/v1/wallet/balance/total'),
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
      const result = await this.http.get<{ balance: number }>(`/api/v1/wallet/balance/${currency}`);
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
      const updated = await this.http.patch<{
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

    if (this._isGuest) return this.createMockRoom(opts);

    this.log('Creating room:', opts);
    const room = await this.http.post<PrivateRoom>('/api/v1/private-rooms', {
      gameId: this.config.gameId,
      name: opts.name || `${this.currentUser?.username}'s Room`,
      maxPlayers: opts.maxPlayers || 4,
      isSocialGame: opts.isSocialGame || false,
      entryFee: opts.entryFee || 0,
      pointValue: opts.pointValue,
      currency: opts.currency || 'USDT',
    });

    this.currentRoom = room;
    if (this.realtime.isConnected) this.realtime.subscribeRoom(room.id);
    this.emit('roomJoined', { room });
    return room;
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
      this.log('Unhandled realtime event:', event);
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