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
  visibility?: 'PUBLIC_LISTED' | 'PRIVATE_CODE' | 'UNLISTED';
  hostRole?: 'PLAYER' | 'SPECTATOR';
  esportMatchMode?: 'ASYNC' | 'SYNC' | 'BLITZ_1V1' | 'DUEL_1V1' | 'TURN_BASED' | 'SINGLE_PLAYER';
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
  visibility?: 'PUBLIC_LISTED' | 'PRIVATE_CODE' | 'UNLISTED';
  hostRole?: 'PLAYER' | 'SPECTATOR';
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
// ENROLLMENT TYPES (v3.0)
// =============================================================================

/** Player's registration state for a specific tournament. */
export type TournamentEnrollmentStatus =
  | 'NOT_REGISTERED'  // Not yet registered
  | 'REGISTERED'      // Registered, check-in window not open yet
  | 'CHECKIN_OPEN'    // Check-in window open — must check in or be DQ'd
  | 'CHECKED_IN'      // Checked in, waiting for game to start
  | 'STARTING'        // Match launching
  | 'IN_PROGRESS'     // Game in progress
  | 'COMPLETED'       // Match complete
  | 'DQ_NO_SHOW';     // No-show — entry forfeited, no refund

export interface TournamentRegistration {
  entryId: string;
  tournamentId: string;
  status: TournamentEnrollmentStatus;
  registeredAt: string;
  checkinOpensAt: string;   // ISO — when check-in window opens (T-30 min)
  checkinClosesAt: string;  // ISO — when DQ fires (T-10 min)
  seatNumber?: number;
  tableId?: string;
}

export interface TournamentEnrollmentState {
  status: TournamentEnrollmentStatus;
  entryId?: string;
  dqCountdownSeconds?: number;  // Seconds until DQ fires (during CHECKIN_OPEN)
  checkinOpensAt?: string;
  checkinClosesAt?: string;
  seatNumber?: number;
  tableId?: string;
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
  /** Prize pool type: DYNAMIC grows with entries, GUARANTEED is fixed */
  prizePoolType?: 'DYNAMIC' | 'GUARANTEED';
  /** Platform fee percentage deducted from prize pool */
  platformFeePercent?: number;
  /** Game category: ESPORTS (entry fee) or SOCIAL (rake-based) */
  gameCategory?: 'ESPORTS' | 'SOCIAL';
  /** Social game type when gameCategory is SOCIAL */
  socialGameType?: 'BIG_TWO' | 'MAHJONG' | 'CHINESE_POKER_13';
  /** Mahjong variant (required when socialGameType is MAHJONG) */
  mahjongVariant?: 'HONG_KONG' | 'TAIWANESE' | 'RIICHI' | 'MCR' | 'CANTONESE';
  /** USD value per game point (social games) */
  pointValueUsd?: number;
  /** Point target to end game (Big 2 / 13 Card Poker) */
  pointTarget?: number;
  /** Rake percentage taken per pot (social games) */
  rakePercentage?: number;
  /** Max rake per round in USD (social games) */
  rakeCapPerRound?: number;
  /** Turn timer in seconds (social games) */
  turnTimerSeconds?: number;
  /** Minimum buy-in amount (social games) */
  minBuyIn?: number;
  /** Maximum buy-in amount (social games) */
  maxBuyIn?: number;
  /** Match queue window in minutes (SYNC esport rolling matches) */
  matchQueueWindowMinutes?: number;
  /** Number of rounds */
  roundsCount?: number;
  /** Match duration in seconds */
  matchDuration?: number;
  /** Scheduled start time (ISO string) */
  scheduledStart?: string;
  /** Scheduled end time (ISO string) */
  scheduledEnd?: string;
}

// QuickPlay configuration returned by GET /api/v1/quick-play/games/:gameId
export interface QuickPlayConfig {
  gameId: string;
  enabled: boolean;
  gameCategory: 'ESPORTS' | 'SOCIAL';
  // Esport
  esportMinPlayers: number;
  esportMaxPlayers: number;
  esportPlayerModes: number[];
  esportEntryFeeTiers: number[];
  esportCurrencies: string[];
  esportPrizeType: 'WINNER_TAKES_ALL' | 'TOP_HEAVY' | 'EVEN_SPLIT';
  esportPlatformFee: number;
  // Social
  socialMinPlayers: number;
  socialMaxPlayers: number;
  socialPointValueTiers: number[];
  socialCurrencies: string[];
  socialGameType: string | null;
  socialDefaultBuyInMultiplier: number;
  socialMinBuyInMultiplier: number;
  socialRakePercent: number;
  socialRakeCapUsd: number;
  socialAutoCashout: boolean;
  // Matchmaking
  matchmakingTimeoutSecs: number;
  matchDurationSecs: number | null;
  sessionDurationMins: number | null;
  // NPC (internal — not shown to players)
  npcFillEnabled: boolean;
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
// TOURNAMENT SCHEDULE TYPES
// =============================================================================

export interface TournamentSchedulePlayer {
  userId: string;
  username: string;
  avatarUrl?: string;
  seatNumber: number;
  isNPC: boolean;
  status: string;
  finalScore: number | null;
  finalRank: number | null;
  isWinner: boolean;
  roundWins?: number;
}

export interface TournamentScheduleTable {
  id: string;
  tableNumber: number;
  seats: number;
  filledSeats: number;
  npcCount: number;
  status: string;
  matchRoundsCount: number;
  currentMatchRound: number;
  winnerId: string | null;
  winnerScore: number | null;
  players: TournamentSchedulePlayer[];
}

export interface TournamentScheduleRound {
  id: string;
  roundNumber: number;
  totalTables: number;
  playersRemaining: number;
  status: string;
  checkinOpensAt: string | null;
  startsAt: string | null;
  endsAt: string | null;
  tables: TournamentScheduleTable[];
}

export interface TournamentSchedule {
  tournamentId: string;
  name: string;
  totalRounds: number;
  currentRound: number;
  seatsPerTable: number;
  playersAdvancePerTable: number;
  matchRoundsCount: number;
  estimatedDurationMins: number;
  scheduledStart: string;
  status: string;
  rounds: TournamentScheduleRound[];
}

export interface TournamentPlayerStatus {
  tournamentId: string;
  tournamentName: string;
  isRegistered: boolean;
  bookingStatus: string;
  currentRound: number;
  totalRounds: number;
  eliminatedInRound?: number | null;
  canCheckin: boolean;
  checkinOpensAt?: string | null;
  checkinDeadline?: string | null;
  secondsUntilCheckin?: number | null;
  currentTable: {
    tableId: string;
    tableNumber: number;
    seatNumber: number;
    status: string;
    players: TournamentSchedulePlayer[];
  } | null;
  schedule: {
    scheduledStart: string;
    registrationCloses: string;
    estimatedFinish: string;
    estimatedDurationMins: number;
  };
}

// =============================================================================
// DISPUTE TYPES
// =============================================================================

export interface DisputeRecord {
  id: string;
  disputeType: 'TOURNAMENT' | 'QUICK_PLAY' | 'PRIVATE_ROOM';
  tournamentId: string | null;
  tournamentName: string | null;
  matchId: string | null;
  roomCode: string | null;
  reason: string;
  description: string;
  evidence: string[];
  status: 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'DISMISSED';
  resolution: string | null;
  reviewerName: string | null;
  resolvedAt: string | null;
  createdAt: string;
}

// =============================================================================
// GAP 9 -- ACTIVE SESSION RESUME (v3.4.12)
// =============================================================================

/**
 * Payload emitted with the 'roomReconnect' event when the bridge detects an
 * active in-match session on initialize() (or when checkForActiveSession()
 * is called manually). The deepLink embeds a current, valid launchToken so
 * the game can resume without additional API calls.
 *
 * Games should listen for 'roomReconnect' and prompt the player to rejoin,
 * e.g. show a "Rejoin Game?" modal and on confirm, navigate to the deep
 * link or call their own in-game resume flow.
 *
 * isReissued === true means the backend minted a fresh launchToken during
 * the check (the previous one had expired). Either way, launchToken is
 * valid and embedded in deepLink.
 */
export interface ActiveSessionPayload {
  roomId: string;
  roomCode: string;
  roomName: string;
  gameCategory?: 'ESPORTS' | 'SOCIAL';
  gameId: string;
  gameName: string;
  deepLink: string;
  launchToken: string;
  tokenExpiresAt: string;
  isReissued: boolean;
}

interface MyActiveRaw {
  room: {
    id: string;
    roomCode: string;
    name: string;
    gameCategory?: 'ESPORTS' | 'SOCIAL';
    game: { id: string; name: string; iconUrl: string | null };
    [key: string]: unknown;
  };
  deepLink: string;
  launchToken: string;
  tokenExpiresAt: string;
  isReissued: boolean;
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
  | 'quickPlayMatchCompleted'
  | 'quickPlayLobbyUpdate'
  // Enrollment events (v3.0)
  | 'tournamentRegistered'    // Successfully registered for a tournament
  | 'tournamentCheckedIn'     // Successfully checked in
  | 'tournamentCheckinOpen'   // Check-in window just opened (T-30 min)
  | 'tournamentDQNoShow'      // Player was DQ'd for no-show (entry forfeited)
  | 'tournamentStarting'      // Tournament about to start
  | 'tournamentLeft'          // Successfully left / unregistered from a tournament
  // GAP 9 (v3.4.12) -- Session resume on crash
  | 'roomReconnect';          // Active in-match session detected on bridge init

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

      this.socket.on('quick-play:lobby-update', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] QP: Lobby Update', data);
      });

      // --- Enrollment socket event listeners (v3.0) ---

      this.socket.on('tournament:registered', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] Tournament: Registered', data);
        this.emit('tournamentRegistered', data);
      });

      this.socket.on('tournament:checked-in', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] Tournament: Checked In', data);
        this.emit('tournamentCheckedIn', data);
      });

      this.socket.on('tournament:checkin-open', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] Tournament: Check-in Open', data);
        this.emit('tournamentCheckinOpen', data);
      });

      this.socket.on('tournament:dq-noshow', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] Tournament: DQ No-Show', data);
        this.emit('tournamentDQNoShow', data);
      });

      this.socket.on('tournament:starting', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] Tournament: Starting', data);
        this.emit('tournamentStarting', data);
      });

      this.socket.on('tournament:left', (data: unknown) => {
        if (this.config.debug) console.log('[DeskillzBridge] Tournament: Left', data);
        this.emit('tournamentLeft', data);
      });

      // --- Cash game table assignment events (v3.3) ---

      this.socket.on('room:table-assigned', (data: {
        tableId: string;
        seatNumber: number;
        tableName: string;
      }) => {
        if (this.config.debug) console.log('[DeskillzBridge] Room: Table Assigned', data);
        // NOTE: currentTableAssignment and callbacks are on DeskillzBridge instance,
        // not on RealtimeService. Bridge wires these up via onRealtimeEvent().
      });

      this.socket.on('room:table-closed', (data: {
        tableId: string;
        reason: string;
        tournamentId: string;
      }) => {
        if (this.config.debug) console.log('[DeskillzBridge] Room: Table Closed', data);
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
  protected currentTableAssignment: { tableId: string; seatNumber: number; tableName: string } | null = null;
  onTableAssigned: ((data: { tableId: string; seatNumber: number; tableName: string }) => void) | null = null;
  onTableClosed: ((data: { tableId: string; reason: string; tournamentId: string }) => void) | null = null;

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
      // SSO handoff: if the main app launched us with ?token=... in the URL,
      // consume it into storage so restoreSession() uses the fresh token.
      // Must run BEFORE restoreSession so the user is not re-prompted to log in.
      this.consumeSSOToken();

      // Attempt session restore from stored tokens
      await this.restoreSession();

      this.isInitialized = true;
      this.emit('initialized', { success: true, mode: 'live' });
      this.log('Bridge ready (live mode)');

      // GAP 9 (v3.4.12) -- after init completes, check for an active in-match
      // session. Fire-and-forget so a slow/failing check never blocks init.
      // Only runs for authenticated users. Emits 'roomReconnect' if found.
      if (this._isAuthenticated) {
        this.checkForActiveSession().catch((err) => {
          this.log('Active session check failed (non-fatal):', err);
        });
      }
    } catch (err) {
      this.log('Init error (non-critical):', err);
      this.isInitialized = true;
      this.emit('initialized', { success: true, mode: 'live' });
    }
  }

  // ---------------------------------------------------------------------------
  // SSO TOKEN HANDOFF
  // ---------------------------------------------------------------------------

  /**
   * Reads a JWT from the URL query string (?token=...) that was placed there
   * by the main Deskillz app when launching this game, saves it into the
   * TokenManager, and scrubs the token from the visible URL.
   *
   * Flow:
   *   Main app -> navigates to gameUrl?matchId=X&token=JWT
   *   Bridge.initialize() -> consumeSSOToken() saves JWT to localStorage
   *   restoreSession() -> uses stored JWT to call GET /api/v1/users/me
   *   URL is rewritten to strip 'token' so it doesn't leak via history/screenshot
   *
   * Safe no-op if:
   *   - No ?token= present (normal reload / direct launch)
   *   - window / location / history unavailable (SSR / tests)
   *   - User already has a stored access token (we still overwrite with the
   *     newer SSO token to keep sessions consistent with the main app)
   */
  private consumeSSOToken(): void {
    if (typeof window === 'undefined' || !window.location) return;

    try {
      const url = new URL(window.location.href);
      const ssoToken = url.searchParams.get('token');
      if (!ssoToken) return;

      // Save the SSO token. We intentionally do not set a refresh token here;
      // the main app retains it, and the Bridge will use normal refresh flow
      // against /api/v1/auth/refresh if the access token expires.
      this.tokens.setTokens(ssoToken);
      this.log('SSO token consumed from URL');

      // Scrub token from the visible URL. Keep other params (matchId, etc.)
      // so the game can still read them.
      url.searchParams.delete('token');
      const cleaned =
        url.pathname +
        (url.searchParams.toString() ? `?${url.searchParams.toString()}` : '') +
        url.hash;

      try {
        window.history.replaceState({}, '', cleaned);
      } catch {
        // history API unavailable -- non-fatal, token still consumed
      }
    } catch (err) {
      this.log('SSO token consumption failed (non-fatal):', err);
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
  // GAP 9 -- ACTIVE SESSION RESUME (v3.4.12)
  // ---------------------------------------------------------------------------
  //
  // Called from initialize() post-auth to detect if the player has a room in
  // LAUNCHING or IN_PROGRESS status. If so, emits 'roomReconnect' with a
  // ready-to-use deep link + fresh launchToken so the game can prompt the
  // player to rejoin after a browser crash / closed tab.
  //
  // Backend endpoint: GET /api/v1/private-rooms/my-active
  //   - Returns ActiveSessionPayload shape (flattened from backend response)
  //   - Returns null if the user has no active session
  //   - Re-issues launchToken automatically if the stored one has expired
  //
  // Safe to call multiple times. Fire-and-forget from initialize() -- never
  // blocks or throws. Exposed via public getActiveSession() for on-demand use
  // (e.g. game-level "Resume last game" button).
  // ---------------------------------------------------------------------------

  private async checkForActiveSession(): Promise<ActiveSessionPayload | null> {
    if (!this._isAuthenticated) return null;

    try {
      const raw = await this.http.get<MyActiveRaw | null>('/api/v1/private-rooms/my-active');
      if (!raw || !raw.room) return null;

      const payload: ActiveSessionPayload = {
        roomId: raw.room.id,
        roomCode: raw.room.roomCode,
        roomName: raw.room.name,
        gameCategory: raw.room.gameCategory,
        gameId: raw.room.game.id,
        gameName: raw.room.game.name,
        deepLink: raw.deepLink,
        launchToken: raw.launchToken,
        tokenExpiresAt: raw.tokenExpiresAt,
        isReissued: raw.isReissued,
      };

      this.log('[GAP9] Active session detected:', payload.roomId, payload.isReissued ? '(token re-issued)' : '');
      this.emit('roomReconnect', payload);
      return payload;
    } catch (err) {
      // 404 / no active session / network failure -- all silent, non-fatal.
      this.log('[GAP9] checkForActiveSession failed (non-fatal):', err);
      return null;
    }
  }

  /**
   * Public helper for on-demand active-session checks. Games can call this
   * from a "Resume last game" button or after regaining network. Returns
   * the payload if an active session was found (and also emits
   * 'roomReconnect' for consistency), or null otherwise.
   *
   * The bridge already calls this once automatically during initialize()
   * after session restore -- you only need this if you want to re-check
   * later (e.g. after a manual login or a network outage).
   */
  async getActiveSession(): Promise<ActiveSessionPayload | null> {
    this.ensureInitialized();
    return this.checkForActiveSession();
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
      const allBalances = await this.http.get<
        Array<{ currency: string; balance: number; usdValue: number }>
      >('/api/v1/wallet/balances');

      // Compute total from balances (wallet/total endpoint returns 404)
      const totalUsd = allBalances.reduce((sum, b) => sum + (b.usdValue || 0), 0);

      const result: WalletBalance = {
        total: totalUsd,
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
      const userId = this.currentUser?.id;
      if (!userId) return empty;
      return await this.http.get<PlayerStats>(`/api/v1/users/${userId}/stats`);
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
      }>('/api/v1/matches/history/me', { page, limit });
      return result.matches;
    } catch (err) {
      this.log('Get match history error:', err);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // LEADERBOARD
  // ---------------------------------------------------------------------------

  async getLeaderboard(limit = 20): Promise<
    Array<{ rank: number; username: string; wins: number; totalEarnings: number; isCurrentUser?: boolean }>
  > {
    try {
      const params: Record<string, string> = {
        gameId: this.config.gameId,
        limit: String(limit),
      };
      const result = await this.http.get<
        Array<{ rank: number; username: string; wins: number; totalEarnings: number; userId?: string }>
      >('/api/v1/leaderboard/global', params);

      const myId = this.currentUser?.id;
      return (result || []).map((entry) => ({
        ...entry,
        isCurrentUser: myId ? entry.userId === myId : false,
      }));
    } catch (err) {
      this.log('Get leaderboard error:', err);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // LEADERBOARD — EXTENDED (v3.2)
  // ---------------------------------------------------------------------------

  /** GET /api/v1/leaderboard/game/:gameId */
  async getGameLeaderboard(
    gameId: string,
    filters?: { period?: string; limit?: number; offset?: number },
  ): Promise<any> {
    try {
      const params: Record<string, string> = {};
      if (filters?.period) params.period = filters.period;
      if (filters?.limit) params.limit = String(filters.limit);
      if (filters?.offset) params.offset = String(filters.offset);
      return await this.http.get<any>(`/api/v1/leaderboard/game/${gameId}`, params);
    } catch (err) {
      this.log('getGameLeaderboard error:', err);
      return { entries: [], total: 0 };
    }
  }

  /** GET /api/v1/leaderboard/me */
  async getMyRank(): Promise<any> {
    if (this._isGuest || !this._isAuthenticated) return null;
    try {
      return await this.http.get<any>('/api/v1/leaderboard/me');
    } catch (err) {
      this.log('getMyRank error:', err);
      return null;
    }
  }

  /** GET /api/v1/leaderboard/me/game/:gameId */
  async getMyGameRank(gameId: string): Promise<any> {
    if (this._isGuest || !this._isAuthenticated) return null;
    try {
      return await this.http.get<any>(`/api/v1/leaderboard/me/game/${gameId}`);
    } catch (err) {
      this.log('getMyGameRank error:', err);
      return null;
    }
  }

  /** GET /api/v1/leaderboard/user/:userId */
  async getUserRank(userId: string): Promise<any> {
    try {
      return await this.http.get<any>(`/api/v1/leaderboard/user/${userId}`);
    } catch (err) {
      this.log('getUserRank error:', err);
      return null;
    }
  }

  /** GET /api/v1/leaderboard/game/:gameId/stats */
  async getGameStats(gameId: string): Promise<any> {
    try {
      return await this.http.get<any>(`/api/v1/leaderboard/game/${gameId}/stats`);
    } catch (err) {
      this.log('getGameStats error:', err);
      return null;
    }
  }

  /** GET /api/v1/leaderboard/platform/stats */
  async getPlatformStats(): Promise<any> {
    try {
      return await this.http.get<any>('/api/v1/leaderboard/platform/stats');
    } catch (err) {
      this.log('getPlatformStats error:', err);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // USER / PROFILE — EXTENDED (v3.2)
  // ---------------------------------------------------------------------------

  /** GET /api/v1/users/me — alias with stronger typing */
  async getMyProfile(): Promise<DeskillzUser | null> {
    return this.getProfile();
  }

  /** GET /api/v1/users/:userId/stats */
  async getUserStats(userId: string): Promise<any> {
    try {
      return await this.http.get<any>(`/api/v1/users/${userId}/stats`);
    } catch (err) {
      this.log('getUserStats error:', err);
      return null;
    }
  }

  /** GET /api/v1/wallet/transactions */
  async getTransactions(filters?: {
    limit?: number;
    offset?: number;
    type?: string;
  }): Promise<any[]> {
    if (this._isGuest || !this._isAuthenticated) return [];
    try {
      const params: Record<string, string> = {};
      if (filters?.limit) params.limit = String(filters.limit);
      if (filters?.offset) params.offset = String(filters.offset);
      if (filters?.type) params.type = filters.type;
      return await this.http.get<any[]>('/api/v1/wallet/transactions', params);
    } catch (err) {
      this.log('getTransactions error:', err);
      return [];
    }
  }

  // ---------------------------------------------------------------------------
  // SCORE SIGNING (v3.2) — Client-side HMAC-SHA256 for esport anti-cheat
  // ---------------------------------------------------------------------------

  /**
   * Sign a game score with HMAC-SHA256 using the game API key.
   * Returns the payload with `signature` and `hash` appended.
   */
  async signScore(payload: {
    score: number;
    gameId: string;
    matchId: string;
    playerId?: string;
    timestamp?: number;
    metadata?: Record<string, unknown>;
  }): Promise<{
    score: number;
    gameId: string;
    matchId: string;
    playerId?: string;
    timestamp: number;
    metadata?: Record<string, unknown>;
    signature: string;
    hash: string;
  }> {
    const ts = payload.timestamp ?? Date.now();
    const message = [
      payload.gameId,
      payload.matchId,
      String(payload.score),
      String(ts),
      payload.playerId ?? '',
    ].join(':');

    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.gameKey);
    const msgData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const sigArray = Array.from(new Uint8Array(sigBuffer));
    const signature = sigArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const payloadJson = JSON.stringify({ ...payload, timestamp: ts });
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(payloadJson));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return { ...payload, timestamp: ts, signature, hash };
  }

  /**
   * Verify a signed score (client-side HMAC check).
   * Returns true if the signature matches.
   */
  async verifyScore(signedScore: {
    score: number;
    gameId: string;
    matchId: string;
    playerId?: string;
    timestamp: number;
    signature: string;
  }): Promise<boolean> {
    const message = [
      signedScore.gameId,
      signedScore.matchId,
      String(signedScore.score),
      String(signedScore.timestamp),
      signedScore.playerId ?? '',
    ].join(':');

    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.config.gameKey);
    const msgData = encoder.encode(message);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const sigBuffer = await crypto.subtle.sign('HMAC', cryptoKey, msgData);
    const sigArray = Array.from(new Uint8Array(sigBuffer));
    const expected = sigArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return expected === signedScore.signature;
  }

  /** POST /api/v1/private-rooms/:roomId/start — start a room game */
  async startRoom(roomId: string): Promise<any> {
    this.ensureAuthenticated();
    return await this.http.post<any>(`/api/v1/private-rooms/${roomId}/start`);
  }

  // ---------------------------------------------------------------------------
  // PUBLIC ROOMS
  // ---------------------------------------------------------------------------

  async getPublicRooms(): Promise<any[]> {
    try {
      const params: Record<string, string> = { gameId: this.config.gameId };
      const result = await this.http.get<any>('/api/v1/private-rooms', params);
      return Array.isArray(result) ? result : result.rooms || [];
    } catch (err) {
      this.log('Get public rooms error:', err);
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
  // TOURNAMENT ENROLLMENT (v3.0)
  // Three-step flow: Register -> Check In -> Join
  // DQ fires at T-10 min for no-shows. Entry is forfeited — no refund.
  // ---------------------------------------------------------------------------

  /**
   * Step 1: Register for a tournament.
   * Creates a TournamentEntry with status REGISTERED.
   * Player must check in during the 30-min window before start or be DQ'd.
   */
  async registerTournament(tournamentId: string): Promise<TournamentRegistration> {
    this.ensureAuthenticated();
    if (this._isGuest) throw new Error('Guests cannot register for tournaments');
    const result = await this.http.post<TournamentRegistration>(
      `/api/v1/tournaments/${tournamentId}/register`,
    );
    this.emit('tournamentRegistered', result);
    return result;
  }

  /**
   * Step 2: Check in to a tournament.
   * Only works during the check-in window (T-30 to T-10 min before start).
   * Updates entry status from REGISTERED to CHECKED_IN.
   * For cash games: confirms seat at the table.
   */
  async checkInTournament(tournamentId: string): Promise<TournamentRegistration> {
    this.ensureAuthenticated();
    if (this._isGuest) throw new Error('Guests cannot check in to tournaments');
    const result = await this.http.post<TournamentRegistration>(
      `/api/v1/tournaments/${tournamentId}/checkin`,
    );
    this.emit('tournamentCheckedIn', result);
    return result;
  }

  /**
   * Leave / unregister from a tournament.
   * Only works while tournament status is SCHEDULED or OPEN (before it starts).
   * Entry fee is refunded via the process-refund queue.
   *
   * Endpoint: DELETE /api/v1/tournaments/:id/leave
   */
  async leaveTournament(tournamentId: string): Promise<void> {
    this.ensureAuthenticated();
    if (this._isGuest) throw new Error('Guests cannot leave tournaments');
    await this.http.delete(`/api/v1/tournaments/${tournamentId}/leave`);
    this.emit('tournamentLeft', { tournamentId });
  }

  /**
   * Get the current player's enrollment status for a specific tournament.
   * Returns button state, DQ countdown, check-in window times, and seat info.
   * Used to drive TournamentCard enrollment button state machine.
   */
  async getEnrollmentStatus(tournamentId: string): Promise<TournamentEnrollmentState> {
    if (this._isGuest || !this._isAuthenticated) {
      return { status: 'NOT_REGISTERED' };
    }
    try {
      return await this.http.get<TournamentEnrollmentState>(
        `/api/v1/tournaments/${tournamentId}/my-status`,
      );
    } catch {
      return { status: 'NOT_REGISTERED' };
    }
  }

  /**
   * Get all tournaments the current player is registered for.
   * Returned sorted by urgency: CHECKIN_OPEN first, then soonest start.
   * Used for the "My Tournaments" list in the lobby.
   */
  async getMyRegistrations(): Promise<TournamentRegistration[]> {
    if (this._isGuest || !this._isAuthenticated) return [];
    try {
      return await this.http.get<TournamentRegistration[]>(
        '/api/v1/tournaments/my-registrations',
      );
    } catch {
      return [];
    }
  }

  /**
   * Get tournament bracket schedule with rounds, tables, and player assignments.
   * Used by TournamentLobbyCard to show bracket progress, table assignments,
   * and round transitions during live tournament play.
   */
  async getTournamentSchedule(tournamentId: string): Promise<TournamentSchedule> {
    return this.http.get<TournamentSchedule>(
      `/api/v1/tournaments/${tournamentId}/schedule`,
    );
  }

  // ---------------------------------------------------------------------------
  // DISPUTES (v3.4.4)
  // ---------------------------------------------------------------------------

  /**
   * File a dispute against a tournament or QuickPlay match.
   * POST /api/v1/disputes
   */
  async fileDispute(params: {
    disputeType: 'TOURNAMENT' | 'QUICK_PLAY' | 'PRIVATE_ROOM';
    tournamentId?: string;
    matchId?: string;
    roomCode?: string;
    reason: string;
    description: string;
    evidence?: string[];
  }): Promise<DisputeRecord> {
    this.ensureAuthenticated();
    return this.http.post<DisputeRecord>('/api/v1/disputes', params);
  }

  /**
   * Get all disputes filed by the current user.
   * GET /api/v1/disputes/me
   */
  async getMyDisputes(status?: string): Promise<DisputeRecord[]> {
    if (this._isGuest || !this._isAuthenticated) return [];
    try {
      const query = status ? `?status=${status}` : '';
      return await this.http.get<DisputeRecord[]>(`/api/v1/disputes/me${query}`);
    } catch {
      return [];
    }
  }

  /**
   * Get dispute details by ID (own disputes only).
   * GET /api/v1/disputes/:id
   */
  async getDisputeDetails(disputeId: string): Promise<DisputeRecord> {
    return this.http.get<DisputeRecord>(`/api/v1/disputes/${disputeId}`);
  }

  /**
   * Add evidence to an existing open dispute.
   * POST /api/v1/disputes/:id/evidence
   */
  async addDisputeEvidence(disputeId: string, evidence: string[]): Promise<{ success: boolean; evidenceCount: number }> {
    return this.http.post(`/api/v1/disputes/${disputeId}/evidence`, { evidence });
  }


  // ---------------------------------------------------------------------------
  // DISPUTE CONTEXT HELPERS
  // ---------------------------------------------------------------------------

  /**
   * Persist last completed match context to localStorage.
   * Called automatically after score submission or match completion.
   * Enables DisputeModal to auto-suggest the most recent match.
   */
  persistLastMatch(data: {
    matchId: string;
    tournamentId?: string;
    roomCode?: string;
    gameId?: string;
    disputeType: 'TOURNAMENT' | 'QUICK_PLAY' | 'PRIVATE_ROOM';
    opponentName?: string;
    completedAt: string;
  }): void {
    try {
      localStorage.setItem('deskillz_last_match', JSON.stringify(data));
    } catch {}
  }

  /**
   * Get last completed match context from localStorage.
   */
  getLastMatch(): {
    matchId: string;
    tournamentId?: string;
    roomCode?: string;
    gameId?: string;
    disputeType: 'TOURNAMENT' | 'QUICK_PLAY' | 'PRIVATE_ROOM';
    opponentName?: string;
    completedAt: string;
  } | null {
    try {
      const raw = localStorage.getItem('deskillz_last_match');
      if (!raw) return null;
      const data = JSON.parse(raw);
      // Expire after 7 days
      if (data.completedAt) {
        const age = Date.now() - new Date(data.completedAt).getTime();
        if (age > 7 * 24 * 60 * 60 * 1000) {
          localStorage.removeItem('deskillz_last_match');
          return null;
        }
      }
      return data;
    } catch {
      return null;
    }
  }

  /**
   * Fetch recent matches formatted for dispute context selection.
   * Returns last 10 matches with all identifiers needed for DisputeModal.
   */
  async getRecentMatchesForDispute(): Promise<Array<{
    matchId: string;
    tournamentId: string | null;
    matchType: string;
    opponentName: string;
    myScore: number | null;
    isWinner: boolean;
    playedAt: string;
    gameName: string;
  }>> {
    if (this._isGuest || !this._isAuthenticated) return [];
    try {
      const result = await this.http.get<{
        matches: Array<{
          matchId: string;
          tournamentId?: string;
          matchType?: string;
          opponent?: { username: string };
          myScore?: number;
          isWinner: boolean;
          playedAt: string;
          game?: { name: string };
        }>;
      }>('/api/v1/matches/history/me', { limit: 10 });
      const matches = result.matches || (Array.isArray(result) ? result : []);
      return matches.map((m: any) => ({
        matchId: m.matchId,
        tournamentId: m.tournamentId || null,
        matchType: m.matchType || 'QUICK_PLAY',
        opponentName: m.opponent?.username || 'Unknown',
        myScore: m.myScore ?? null,
        isWinner: !!m.isWinner,
        playedAt: m.playedAt,
        gameName: m.game?.name || 'Game',
      }));
    } catch {
      return [];
    }
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
    earnings: {
      totalAllTime: number;
      totalThisMonth: number;
      totalThisWeek: number;
      pendingSettlement: number;
      availableWithdrawal: number;
      esportsEarnings: number;
      socialEarnings: number;
      bonusEarnings: number;
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
    const defaultProfile = {
      id: this.currentUser?.id || 'offline', username: this.currentUser?.username || 'Host',
      avatarUrl: undefined as string | undefined,
      tier: 'bronze', level: 1, isVerified: false,
      totalEarnings: 0, monthlyEarnings: 0, weeklyEarnings: 0, pendingSettlement: 0,
      roomsHosted: 0, totalPlayersHosted: 0, revenueSharePercent: 40,
    };
    const defaultTierInfo = {
      tier: 'bronze', icon: '', currentValue: 0, minThreshold: 0,
      maxThreshold: 500 as number | null, progressPercent: 0,
      nextTier: 'silver' as string | null, valueToNextTier: 500 as number | null,
      hostShare: 40, platformShare: 30, developerShare: 30,
    };
    const defaultDashboard = {
      profile: defaultProfile,
      tierInfo: defaultTierInfo,
      earnings: {
        totalAllTime: 0, totalThisMonth: 0, totalThisWeek: 0,
        pendingSettlement: 0, availableWithdrawal: 0,
        esportsEarnings: 0, socialEarnings: 0, bonusEarnings: 0,
      },
      activeRooms: [] as Array<any>,
      recentSettlements: [] as Array<any>,
      badges: [] as Array<any>,
    };

    if (this._isGuest || !this._isAuthenticated) return defaultDashboard;

    try {
      const d = await this.http.get<any>('/api/v1/host/dashboard');
      if (!d) return defaultDashboard;

      // Backend returns esportsTierInfo/socialTierInfo (NOT tierInfo)
      // and earnings as a separate object (NOT inside profile)
      const t = (d.esportsTierInfo ?? d.socialTierInfo ?? {}) as Record<string, unknown>;
      const e = (d.earnings ?? {}) as Record<string, unknown>;
      const p = (d.profile ?? {}) as Record<string, unknown>;
      const lvl = (d.levelInfo ?? {}) as Record<string, unknown>;

      return {
        profile: {
          ...defaultProfile,
          id: String(p.id ?? p.odid ?? defaultProfile.id),
          username: String(p.username ?? defaultProfile.username),
          avatarUrl: p.avatarUrl as string | undefined,
          tier: String(t.tier ?? p.currentSocialTier ?? p.currentEsportsTier ?? 'bronze').toLowerCase(),
          level: Number(lvl.level ?? p.hostLevel ?? 1),
          isVerified: Boolean(p.isVerified ?? false),
          totalEarnings: Number(e.total ?? 0),
          monthlyEarnings: Number(e.monthly ?? 0),
          weeklyEarnings: Number(e.weekly ?? 0),
          pendingSettlement: Number(e.pending ?? 0),
          roomsHosted: Number(p.totalRoomsCompleted ?? 0),
          totalPlayersHosted: Number(p.totalPlayersHosted ?? 0),
          revenueSharePercent: Number(t.hostShare ?? 15),
        },
        tierInfo: {
          tier: String(t.tier ?? 'bronze').toLowerCase(),
          icon: String(t.icon ?? ''),
          currentValue: Number(t.currentValue ?? t.progress ?? 0),
          minThreshold: Number(t.minThreshold ?? 0),
          maxThreshold: t.maxThreshold != null ? Number(t.maxThreshold) : null,
          progressPercent: Number(t.progress ?? t.progressPercent ?? 0),
          nextTier: t.nextTier ? String(t.nextTier).toLowerCase() : null,
          valueToNextTier: t.valueToNextTier != null ? Number(t.valueToNextTier)
            : t.requirements ? Number((t.requirements as any).earningsRequired ?? 0) : null,
          hostShare: Number(t.hostShare ?? 15),
          platformShare: Number(t.platformShare ?? 30),
          developerShare: Number(t.developerShare ?? 30),
        },
        // Esport games  → use esportsEarnings + pendingEarnings
        // Social games  → use socialEarnings  + pendingEarnings
        earnings: {
          totalAllTime:        Number(e.totalAllTime     ?? e.total   ?? 0),
          totalThisMonth:      Number(e.totalThisMonth   ?? e.monthly ?? 0),
          totalThisWeek:       Number(e.totalThisWeek    ?? e.weekly  ?? 0),
          pendingSettlement:   Number(e.pendingSettlement ?? e.pending ?? 0),
          availableWithdrawal: Number(e.availableWithdrawal ?? e.pending ?? 0),
          esportsEarnings:     Number(e.esportsEarnings  ?? 0),
          socialEarnings:      Number(e.socialEarnings   ?? 0),
          bonusEarnings:       Number(e.bonusEarnings    ?? 0),
        },
        activeRooms: Array.isArray(d.activeRooms) ? d.activeRooms : [],
        recentSettlements: Array.isArray(d.recentSettlements) ? d.recentSettlements : [],
        badges: Array.isArray(d.badges) ? d.badges : [],
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
  // HOST — INDIVIDUAL ENDPOINTS (v3.2)
  // Used by useHostDashboard hook as fallbacks when aggregate fails
  // ---------------------------------------------------------------------------

  /** GET /api/v1/host/profile — auto-creates profile on first call */
  async getHostProfile(): Promise<any> {
    if (this._isGuest || !this._isAuthenticated) return null;
    try {
      return await this.http.get<any>('/api/v1/host/profile');
    } catch (err) {
      this.log('getHostProfile error:', err);
      return null;
    }
  }

  /** GET /api/v1/host/earnings */
  async getHostEarnings(): Promise<any> {
    if (this._isGuest || !this._isAuthenticated) return null;
    try {
      return await this.http.get<any>('/api/v1/host/earnings');
    } catch (err) {
      this.log('getHostEarnings error:', err);
      return null;
    }
  }

  /** GET /api/v1/host/badges */
  async getHostBadges(): Promise<any[]> {
    if (this._isGuest || !this._isAuthenticated) return [];
    try {
      return await this.http.get<any[]>('/api/v1/host/badges');
    } catch (err) {
      this.log('getHostBadges error:', err);
      return [];
    }
  }

  /** GET /api/v1/host/rooms/active */
  async getActiveRooms(): Promise<any[]> {
    if (this._isGuest || !this._isAuthenticated) return [];
    try {
      return await this.http.get<any[]>('/api/v1/host/rooms/active');
    } catch (err) {
      this.log('getActiveRooms error:', err);
      return [];
    }
  }

  /** GET /api/v1/host/tier/esports */
  async getEsportsTier(): Promise<any> {
    if (this._isGuest || !this._isAuthenticated) return null;
    try {
      return await this.http.get<any>('/api/v1/host/tier/esports');
    } catch (err) {
      this.log('getEsportsTier error:', err);
      return null;
    }
  }

  /** GET /api/v1/host/tier/social */
  async getSocialTier(): Promise<any> {
    if (this._isGuest || !this._isAuthenticated) return null;
    try {
      return await this.http.get<any>('/api/v1/host/tier/social');
    } catch (err) {
      this.log('getSocialTier error:', err);
      return null;
    }
  }

  /** GET /api/v1/host/level */
  async getLevelInfo(): Promise<any> {
    if (this._isGuest || !this._isAuthenticated) return null;
    try {
      return await this.http.get<any>('/api/v1/host/level');
    } catch (err) {
      this.log('getLevelInfo error:', err);
      return null;
    }
  }

  /** POST /api/v1/host/verify-age */
  async verifyAge(): Promise<any> {
    this.ensureAuthenticated();
    return await this.http.post<any>('/api/v1/host/verify-age');
  }

  /** GET /api/v1/host/age-verified */
  async checkAgeVerified(): Promise<{ isVerified: boolean; verifiedAt: string | null }> {
    if (this._isGuest || !this._isAuthenticated) {
      return { isVerified: false, verifiedAt: null };
    }
    try {
      return await this.http.get<{ isVerified: boolean; verifiedAt: string | null }>(
        '/api/v1/host/age-verified',
      );
    } catch (err) {
      this.log('checkAgeVerified error:', err);
      return { isVerified: false, verifiedAt: null };
    }
  }

  /** POST /api/v1/host/withdraw — withdraw host earnings to wallet */
  async requestHostWithdrawal(params: {
    amount: number;
    currency: string;
    walletAddress: string;
  }): Promise<{ transactionId: string; estimatedArrival: string }> {
    this.ensureAuthenticated();
    const result = await this.http.post<{ transactionId: string; estimatedArrival: string }>(
      '/api/v1/host/withdraw',
      params,
    );
    // Refresh wallet after withdrawal
    this.getWalletBalance().then((updated) => this.emit('walletUpdated', updated)).catch(() => {});
    return result;
  }
  /** GET /api/v1/tournaments/:tournamentId/my-seat
   * Returns the player's current cash game table assignment, or null if not yet seated.
   */
  async getMyTableAssignment(tournamentId: string): Promise<{
    tableId: string;
    seatNumber: number;
    tableName: string;
  } | null> {
    if (this._isGuest || !this._isAuthenticated) return null;
    try {
      const res = await this.http.get<{ tableId: string; seatNumber: number; tableName: string } | null>(
        `/api/v1/tournaments/${tournamentId}/my-seat`,
      );
      if (res) {
        this.currentTableAssignment = res;
      }
      return res ?? null;
    } catch {
      return null;
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
      ...(opts.hostRole && { hostRole: opts.hostRole }),
      ...(opts.esportMatchMode && { esportMatchMode: opts.esportMatchMode }),
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
      ...(opts.hostRole && { hostRole: opts.hostRole }),
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

  /** POST /api/v1/private-rooms/:roomId/rebuy -- rebuy chips when balance is 0 */
  async roomRebuy(amount: number, currency: string = 'USDT'): Promise<{ success: boolean; pointBalance: number }> {
    if (this._isGuest || !this.currentRoom) return { success: true, pointBalance: amount };

    return this.http.post(`/api/v1/private-rooms/${this.currentRoom.id}/rebuy`, { amount, currency });
  }

  // ---------------------------------------------------------------------------
  // ROUND & SETTLEMENT (Social Games)
  // ---------------------------------------------------------------------------

  /** POST /api/v1/private-rooms/rounds/submit -- submit round results from game */
  async submitRound(payload: {
    roomId: string;
    roundNumber: number;
    playerResults: Array<{ playerId: string; score: number; pointsWon: number }>;
  }): Promise<{ success: boolean; roundId: string }> {
    if (this._isGuest) {
      this.log('Round submitted (local only):', payload);
      return { success: true, roundId: `mock_round_${Date.now()}` };
    }

    return this.http.post('/api/v1/private-rooms/rounds/submit', payload);
  }

  /** POST /api/v1/private-rooms/:roomId/settlement/trigger -- host triggers manual settlement */
  async triggerSettlement(roomId?: string): Promise<{ success: boolean }> {
    const id = roomId || this.currentRoom?.id;
    if (this._isGuest || !id) return { success: true };

    return this.http.post(`/api/v1/private-rooms/${id}/settlement/trigger`);
  }

  // ---------------------------------------------------------------------------
  // ROOM INVITES (v3.5 — CANCEL/ROOM gap fix)
  // ---------------------------------------------------------------------------

  /**
   * Invite a player to the current (or specified) private room.
   * Endpoint: POST /api/v1/private-rooms/:roomId/invite
   *
   * @param roomId - Room ID (defaults to currentRoom)
   * @param target - Object with username OR odid of the player to invite
   * @param message - Optional invite message
   */
  async invitePlayer(
    roomId: string | undefined,
    target: { username?: string; odid?: string },
    message?: string,
  ): Promise<{ id: string; status: string }> {
    this.ensureAuthenticated();
    if (this._isGuest) throw new Error('Guests cannot send invites');

    const id = roomId || this.currentRoom?.id;
    if (!id) throw new Error('No room ID provided and no current room');

    return this.http.post(`/api/v1/private-rooms/${id}/invite`, {
      ...target,
      ...(message && { message }),
    });
  }

  /**
   * Get the current player's pending room invites.
   * Endpoint: GET /api/v1/private-rooms/invites/my
   */
  async getMyInvites(): Promise<Array<{
    id: string;
    roomId: string;
    roomCode: string;
    roomName: string;
    hostUsername: string;
    gameName: string;
    message: string | null;
    createdAt: string;
  }>> {
    if (this._isGuest || !this._isAuthenticated) return [];
    try {
      return await this.http.get('/api/v1/private-rooms/invites/my');
    } catch {
      return [];
    }
  }

  /**
   * Accept or decline a room invite.
   * Accepting auto-joins the room.
   * Endpoint: POST /api/v1/private-rooms/invites/:inviteId/respond
   *
   * @param inviteId - Invite ID
   * @param accept - true to accept (joins room), false to decline
   */
  async respondToInvite(
    inviteId: string,
    accept: boolean,
  ): Promise<PrivateRoom | { success: boolean }> {
    this.ensureAuthenticated();
    if (this._isGuest) throw new Error('Guests cannot respond to invites');

    const result = await this.http.post<PrivateRoom | { success: boolean }>(
      `/api/v1/private-rooms/invites/${inviteId}/respond`,
      { accept },
    );

    // If accepted, the response is the full room — track it
    if (accept && result && 'id' in result) {
      const room = result as PrivateRoom;
      this.currentRoom = room;
      if (this.realtime.isConnected) this.realtime.subscribeRoom(room.id);
      this.emit('roomJoined', { room });
    }

    return result;
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

  /**
   * Fetch the QuickPlay configuration for a game.
   * Returns tiers, player modes, matchmaking settings.
   * Used to render the QuickPlayCard tier selector and prize display.
   */
  async getQuickPlayConfig(gameId: string): Promise<QuickPlayConfig | null> {
    try {
      return await this.http.get<QuickPlayConfig>(
        `/api/v1/quick-play/games/${gameId}`,
      );
    } catch {
      this.log('getQuickPlayConfig error — QuickPlay not configured for this game');
      return null;
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

  // ---------------------------------------------------------------------------
  // QUICK PLAY SOCIAL (Cash game rooms via QuickPlay)
  // ---------------------------------------------------------------------------

  /** POST /api/v1/lobby/quick-play/social/create -- create a social quick-play room */
  async createSocialQuickPlay(params: {
    gameId?: string;
    pointValueUsd: number;
    currency: string;
    seatsPerTable?: number;
  }): Promise<{ success: boolean; roomId: string; roomCode: string }> {
    this.ensureAuthenticated();

    if (this._isGuest) {
      return { success: true, roomId: `mock_room_${Date.now()}`, roomCode: 'MOCK-0000' };
    }

    return this.http.post('/api/v1/lobby/quick-play/social/create', {
      gameId: params.gameId || this.config.gameId,
      ...params,
    });
  }

  /** POST /api/v1/lobby/quick-play/social/:roomId/round -- submit social QP round */
  async submitSocialQuickPlayRound(roomId: string, payload: {
    roundNumber: number;
    playerResults: Array<{ playerId: string; score: number; pointsWon: number }>;
  }): Promise<{ success: boolean }> {
    if (this._isGuest) return { success: true };

    return this.http.post(`/api/v1/lobby/quick-play/social/${roomId}/round`, payload);
  }

  /** POST /api/v1/lobby/quick-play/social/:roomId/rebuy -- rebuy in social QP */
  async socialQuickPlayRebuy(roomId: string, amount: number): Promise<{ success: boolean; pointBalance: number }> {
    if (this._isGuest) return { success: true, pointBalance: amount };

    return this.http.post(`/api/v1/lobby/quick-play/social/${roomId}/rebuy`, { amount });
  }

  /** POST /api/v1/lobby/quick-play/social/:roomId/cashout -- cash out of social QP */
  async socialQuickPlayCashout(roomId: string): Promise<{ success: boolean; amount: number }> {
    if (this._isGuest) return { success: true, amount: 0 };

    return this.http.post(`/api/v1/lobby/quick-play/social/${roomId}/cashout`);
  }

  /** POST /api/v1/lobby/quick-play/social/:roomId/end -- end social QP game */
  async endSocialQuickPlay(roomId: string): Promise<{ success: boolean }> {
    if (this._isGuest) return { success: true };

    return this.http.post(`/api/v1/lobby/quick-play/social/${roomId}/end`);
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
    
   const onLobbyUpdate = this.onRealtimeEvent('quick-play:lobby-update', (data) => {
      this.emit('quickPlayLobbyUpdate', data);
    });

    this._quickPlayCleanups = [
      onSearching, onFound, onNPCFilling, onStarting,
      onMatchLaunched, onScoreSubmitted, onMatchCompleted, onLobbyUpdate,
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
    // Wire table assignment events to instance callbacks
    this.onRealtimeEvent('room:table-assigned', (data: any) => {
      this.currentTableAssignment = data;
      if (typeof this.onTableAssigned === 'function') {
        this.onTableAssigned(data);
      }
    });

    this.onRealtimeEvent('room:table-closed', (data: any) => {
      if (typeof this.onTableClosed === 'function') {
        this.onTableClosed(data);
      }
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

  /** Fetch game capabilities from the API. Used by standalone game CreateRoomScreen. */
  async getGameCapabilities(gameId?: string): Promise<{
    supports1v1: boolean;
    supportsFFA: boolean;
    supportsSinglePlayer: boolean;
    supportsSync: boolean;
    supportsAsync: boolean;
    supportsBlitz1v1: boolean;
    supportsDuel1v1: boolean;
    supportsSinglePlayerMode: boolean;
    supportsTurnBased: boolean;
    supportsSingleElimination: boolean;
    maxTournamentSize: number;
    minPlayers: number;
    maxPlayers: number;
    minMatchDurationSeconds: number;
    maxMatchDurationSeconds: number;
  }> {
    const id = gameId || this.config.gameId;
    const fallback = {
      supports1v1: true, supportsFFA: true, supportsSinglePlayer: true,
      supportsSync: true, supportsAsync: true,
      supportsBlitz1v1: false, supportsDuel1v1: false,
      supportsSinglePlayerMode: false, supportsTurnBased: false,
      supportsSingleElimination: true, maxTournamentSize: 256,
      minPlayers: 2, maxPlayers: 32, minMatchDurationSeconds: 0, maxMatchDurationSeconds: 0,
    };
    if (!id) return fallback;
    try {
      const game = await this.http.get<any>(`/api/v1/games/${id}`);
      const g = game?.data ?? game;
      return {
        supports1v1:               g.supports1v1 ?? false,
        supportsFFA:               g.supportsFFA ?? false,
        supportsSinglePlayer:      g.supportsSinglePlayer ?? false,
        supportsSync:              g.supportsSync ?? true,
        supportsAsync:             g.supportsAsync ?? true,
        supportsBlitz1v1:          g.supportsBlitz1v1 ?? false,
        supportsDuel1v1:           g.supportsDuel1v1 ?? false,
        supportsSinglePlayerMode:  g.supportsSinglePlayerMode ?? false,
        supportsTurnBased:         g.supportsTurnBased ?? false,
        supportsSingleElimination: g.supportsSingleElimination ?? true,
        maxTournamentSize:         g.maxTournamentSize ?? 256,
        minPlayers:                g.minPlayers ?? 2,
        maxPlayers:                g.maxPlayers ?? 32,
        minMatchDurationSeconds:   g.minMatchDurationSeconds ?? 0,
        maxMatchDurationSeconds:   g.maxMatchDurationSeconds ?? 0,
      };
    } catch {
      return fallback;
    }
  }

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