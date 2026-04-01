// =============================================================================
// Deskillz Web SDK - Main SDK Entry Point
// Path: src/deskillz-sdk.ts
// Orchestrates all services: auth, wallet, lobby, games, tournaments,
// private rooms, spectator, host, quick-play, leaderboard, users,
// score signing, and real-time socket
// Replicates: api-client.ts (init pattern), socket.ts (connect pattern),
//   index.ts (hooks barrel export pattern)
// =============================================================================

import { resolveConfig, type DeskillzConfig, type ResolvedConfig } from './core/config';
import { HttpClient } from './core/http-client';
import { TokenManager, createDefaultStorage } from './core/storage';
import { TypedEventEmitter } from './core/event-emitter';
import type { SDKEventMap } from './core/types';

import { AuthService } from './auth/auth-service';
import { WalletAuthService } from './auth/wallet-auth';
import { TwoFactorService } from './auth/two-factor';
import { TwoFactorTokenManager } from './auth/token-manager';

import { WalletService } from './wallet/wallet-service';
import { LobbyService } from './lobby/lobby-service';
import { GameService, TournamentService } from './games/game-service';
import { PrivateRoomService, SpectatorService } from './rooms/room-service';
import { SocketClient } from './realtime/socket-client';
import { HostService } from './host/host-service';
import { QuickPlayService } from './quick-play/quick-play-service';
import { LeaderboardService } from './users/leaderboard-service';
import { UserService } from './users/user-service';
import { ScoreSigner } from './security/score-signer';

// =============================================================================
// SDK VERSION
// =============================================================================

/** Semantic version of the Deskillz Web SDK. */
export const SDK_VERSION = '1.1.0';

// =============================================================================
// MAIN SDK CLASS
// =============================================================================

/**
 * The main Deskillz Web SDK entry point.
 *
 * Provides unified access to every platform service through a single,
 * lazily initialized instance. Services are constructed on first access
 * and share a common HTTP client, token manager, and event bus.
 *
 * @example
 * ```ts
 * import { DeskillzSDK } from '@deskillz/web-sdk';
 *
 * const sdk = new DeskillzSDK({
 *   gameId: 'your-game-id',
 *   gameKey: 'your-game-key',
 * });
 *
 * // Authentication
 * const result = await sdk.auth.loginWithEmail({ email, password });
 *
 * // Host dashboard (social games)
 * const dashboard = await sdk.host.getDashboard();
 *
 * // Quick Play matchmaking
 * const result = await sdk.quickPlay.joinQuickPlay({ gameId, entryFee, playerCount, currency });
 *
 * // Leaderboard
 * const board = await sdk.leaderboard.getGameLeaderboard(gameId);
 *
 * // User profile + stats
 * const profile = await sdk.users.getMyProfile();
 * const stats = await sdk.users.getUserStats(userId);
 *
 * // Score signing (esport anti-cheat)
 * const signed = await sdk.scoreSigner.signScore({ score: 1500, gameId, matchId });
 *
 * // Real-time
 * sdk.realtime.connect();
 *
 * // Cleanup
 * sdk.destroy();
 * ```
 */
export class DeskillzSDK {
  /** Resolved configuration (all defaults applied). */
  readonly config: ResolvedConfig;

  /** Central event bus for cross-service events. */
  readonly events: TypedEventEmitter<SDKEventMap>;

  // ---------------------------------------------------------------------------
  // Shared infrastructure (eagerly constructed)
  // ---------------------------------------------------------------------------
  private readonly _http: HttpClient;
  private readonly _tokenManager: TokenManager;
  private readonly _twoFactorTokenManager: TwoFactorTokenManager;

  // ---------------------------------------------------------------------------
  // Service instances (lazily constructed)
  // ---------------------------------------------------------------------------
  private _auth: AuthService | null = null;
  private _walletAuth: WalletAuthService | null = null;
  private _twoFactor: TwoFactorService | null = null;
  private _wallet: WalletService | null = null;
  private _lobby: LobbyService | null = null;
  private _games: GameService | null = null;
  private _tournaments: TournamentService | null = null;
  private _rooms: PrivateRoomService | null = null;
  private _spectator: SpectatorService | null = null;
  private _realtime: SocketClient | null = null;
  private _host: HostService | null = null;
  private _quickPlay: QuickPlayService | null = null;
  private _leaderboard: LeaderboardService | null = null;
  private _users: UserService | null = null;
  private _scoreSigner: ScoreSigner | null = null;

  // ---------------------------------------------------------------------------
  // Lifecycle state
  // ---------------------------------------------------------------------------
  private _destroyed = false;

  // ---------------------------------------------------------------------------
  // Constructor
  // ---------------------------------------------------------------------------

  /**
   * Create a new DeskillzSDK instance.
   *
   * @param config - SDK configuration (gameId + gameKey required).
   * @throws Error if required config fields are missing.
   */
  constructor(config: DeskillzConfig) {
    this.config = resolveConfig(config);

    this.log('Initializing DeskillzSDK v' + SDK_VERSION);
    this.log('Config:', {
      gameId: this.config.gameId,
      apiBaseUrl: this.config.apiBaseUrl,
      socketUrl: this.config.socketUrl,
      debug: this.config.debug,
    });

    // ---- Event bus ----
    this.events = new TypedEventEmitter<SDKEventMap>();

    // ---- Storage ----
    const storage = this.config.storage ?? createDefaultStorage();

    // ---- Token manager ----
    this._tokenManager = new TokenManager(storage);
    this._twoFactorTokenManager = new TwoFactorTokenManager(storage);

    // ---- HTTP client ----
    this._http = new HttpClient(this.config, this._tokenManager, this.events);

    this.log('Core infrastructure ready');
  }

  // ===========================================================================
  // SERVICE ACCESSORS (lazy singletons)
  // ===========================================================================

  /**
   * Authentication service.
   * Handles email/password login, registration, password reset.
   * Replicates: api-client.ts token interceptors + auth API calls.
   */
  get auth(): AuthService {
    this.assertNotDestroyed();
    if (!this._auth) {
      this._auth = new AuthService(
        this._http,
        this._tokenManager,
        this._twoFactorTokenManager,
        this.events,
        this.config.debug
      );
      this.log('AuthService initialized');
    }
    return this._auth;
  }

  /**
   * Wallet-based authentication service.
   * Handles SIWE (Sign-In With Ethereum), nonce flow, wallet linking.
   */
  get walletAuth(): WalletAuthService {
    this.assertNotDestroyed();
    if (!this._walletAuth) {
      this._walletAuth = new WalletAuthService(
        this._http,
        this._tokenManager,
        this.events,
        this.config.debug
      );
      this.log('WalletAuthService initialized');
    }
    return this._walletAuth;
  }

  /**
   * Two-factor authentication service.
   * Handles TOTP setup, verification, recovery codes.
   */
  get twoFactor(): TwoFactorService {
    this.assertNotDestroyed();
    if (!this._twoFactor) {
      this._twoFactor = new TwoFactorService(
        this._http,
        this._twoFactorTokenManager,
        this.config.debug
      );
      this.log('TwoFactorService initialized');
    }
    return this._twoFactor;
  }

  /**
   * Wallet service.
   * Handles wallet balance queries, deposit/withdraw, transaction history.
   */
  get wallet(): WalletService {
    this.assertNotDestroyed();
    if (!this._wallet) {
      this._wallet = new WalletService(this._http, this.config.debug);
      this.log('WalletService initialized');
    }
    return this._wallet;
  }

  /**
   * Lobby service.
   * Handles game browsing with live stats, queue management, match lifecycle.
   */
  get lobby(): LobbyService {
    this.assertNotDestroyed();
    if (!this._lobby) {
      this._lobby = new LobbyService(this._http, this.config.debug);
      this.log('LobbyService initialized');
    }
    return this._lobby;
  }

  /**
   * Game service.
   * Handles game CRUD, browsing, search, rating, developer operations.
   */
  get games(): GameService {
    this.assertNotDestroyed();
    if (!this._games) {
      this._games = new GameService(this._http, this.config.debug);
      this.log('GameService initialized');
    }
    return this._games;
  }

  /**
   * Tournament service.
   * Handles tournament browsing, join/leave, score submission, leaderboards.
   */
  get tournaments(): TournamentService {
    this.assertNotDestroyed();
    if (!this._tournaments) {
      this._tournaments = new TournamentService(this._http, this.config.debug);
      this.log('TournamentService initialized');
    }
    return this._tournaments;
  }

  /**
   * Private room service.
   * Handles esports + social room creation, invites, buy-in/cash-out, game lifecycle.
   */
  get rooms(): PrivateRoomService {
    this.assertNotDestroyed();
    if (!this._rooms) {
      this._rooms = new PrivateRoomService(this._http, this.config.debug);
      this.log('PrivateRoomService initialized');
    }
    return this._rooms;
  }

  /**
   * Spectator service.
   * Handles spectating live rooms, checking permissions, hosted room listing.
   */
  get spectator(): SpectatorService {
    this.assertNotDestroyed();
    if (!this._spectator) {
      this._spectator = new SpectatorService(this._http, this.config.debug);
      this.log('SpectatorService initialized');
    }
    return this._spectator;
  }

  /**
   * Real-time socket client.
   * Handles WebSocket connection, matchmaking, lobby events, room subscriptions.
   * Replicates: socket.ts full connection lifecycle.
   */
  get realtime(): SocketClient {
    this.assertNotDestroyed();
    if (!this._realtime) {
      this._realtime = new SocketClient(
        this.config,
        this._tokenManager,
        this.events,
        this.config.debug
      );
      this.log('SocketClient initialized');
    }
    return this._realtime;
  }

  // ===========================================================================
  // NEW SERVICE ACCESSORS (v1.1.0)
  // ===========================================================================

  /**
   * Host dashboard service.
   * Handles host profile, tier progression (Bronze-Elite), badges, earnings,
   * settlements, active rooms, room history, leaderboard, notifications,
   * withdrawal requests, and age verification.
   *
   * Required for social games where players become hosts to earn revenue.
   * All endpoints use /api/v1/host/ prefix. Auth required.
   * 20 endpoints total.
   *
   * @example
   * ```ts
   * const dashboard = await sdk.host.getDashboard();
   * const profile = await sdk.host.getProfile();
   * const earnings = await sdk.host.getEarnings();
   * const badges = await sdk.host.getBadges();
   * await sdk.host.requestWithdrawal({ amount: 50, currency: 'USDT_BSC' });
   * ```
   */
  get host(): HostService {
    this.assertNotDestroyed();
    if (!this._host) {
      this._host = new HostService(this._http, this.config.debug);
      this.log('HostService initialized');
    }
    return this._host;
  }

  /**
   * Quick Play matchmaking service.
   * Handles joining/leaving the instant matchmaking queue and status polling.
   *
   * Esport games: entry-fee queue with NPC fill on timeout.
   * Social games: create/join board with point values and rake.
   * All endpoints use /api/v1/lobby/quick-play/ prefix. Auth required.
   * 3 endpoints total (join, leave, status).
   *
   * Note: QuickPlay config is fetched via GET /api/v1/quick-play/games/:gameId
   * (public, no auth). The useQuickPlayQueue hook handles this automatically
   * via window.DeskillzBridge.getInstance().getQuickPlayConfig().
   *
   * @example
   * ```ts
   * const result = await sdk.quickPlay.joinQuickPlay({
   *   gameId: 'abc-123',
   *   entryFee: 5,
   *   playerCount: 2,
   *   currency: 'USDT_BSC',
   * });
   * const status = await sdk.quickPlay.getQuickPlayStatus();
   * await sdk.quickPlay.leaveQuickPlay();
   * ```
   */
  get quickPlay(): QuickPlayService {
    this.assertNotDestroyed();
    if (!this._quickPlay) {
      this._quickPlay = new QuickPlayService(this._http, this.config.debug);
      this.log('QuickPlayService initialized');
    }
    return this._quickPlay;
  }

  /**
   * Leaderboard service.
   * Handles global leaderboard, per-game leaderboard, user rank queries,
   * and game/platform statistics.
   *
   * All endpoints use /api/v1/leaderboard/ prefix.
   * 7 endpoints total.
   *
   * @example
   * ```ts
   * const global = await sdk.leaderboard.getGlobalLeaderboard({ limit: 50 });
   * const gameBoard = await sdk.leaderboard.getGameLeaderboard(gameId);
   * const myRank = await sdk.leaderboard.getMyRank();
   * const myGameRank = await sdk.leaderboard.getMyGameRank(gameId);
   * ```
   */
  get leaderboard(): LeaderboardService {
    this.assertNotDestroyed();
    if (!this._leaderboard) {
      this._leaderboard = new LeaderboardService(this._http, this.config.debug);
      this.log('LeaderboardService initialized');
    }
    return this._leaderboard;
  }

  /**
   * User profile and stats service.
   * Handles user profile CRUD, stats retrieval, transaction history,
   * and wallet management.
   *
   * All endpoints use /api/v1/users/ prefix. Auth required.
   * 6 endpoints total.
   *
   * @example
   * ```ts
   * const me = await sdk.users.getMyProfile();
   * const stats = await sdk.users.getUserStats(userId);
   * const txns = await sdk.users.getTransactions({ limit: 20 });
   * await sdk.users.updateProfile({ username: 'NewName' });
   * ```
   */
  get users(): UserService {
    this.assertNotDestroyed();
    if (!this._users) {
      this._users = new UserService(this._http, this.config.debug);
      this.log('UserService initialized');
    }
    return this._users;
  }

  /**
   * Score signing service (esport anti-cheat).
   * Provides HMAC-SHA256 signing and verification of game scores.
   * Uses the gameKey from SDK config as the signing secret.
   *
   * Esport games MUST sign scores before submission to prevent tampering.
   * The backend verifies the HMAC before accepting any score.
   *
   * @example
   * ```ts
   * const signed = await sdk.scoreSigner.signScore({
   *   score: 1500,
   *   gameId: sdk.config.gameId,
   *   matchId: 'match-uuid',
   *   playerId: 'player-uuid',
   *   timestamp: Date.now(),
   * });
   * // Submit signed.signature along with score to backend
   *
   * const valid = await sdk.scoreSigner.verifyScore(signed);
   * ```
   */
  get scoreSigner(): ScoreSigner {
    this.assertNotDestroyed();
    if (!this._scoreSigner) {
      this._scoreSigner = new ScoreSigner(this.config.gameKey);
      this.log('ScoreSigner initialized');
    }
    return this._scoreSigner;
  }

  // ===========================================================================
  // CONVENIENCE ACCESSORS
  // ===========================================================================

  /**
   * Check if the user is currently authenticated (has stored access token).
   * Returns a promise since token storage may be async.
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await this._tokenManager.getAccessToken();
    return token !== null;
  }

  /**
   * Get the current access token (or null if not authenticated).
   * Returns a promise since token storage may be async.
   */
  async getAccessToken(): Promise<string | null> {
    return this._tokenManager.getAccessToken();
  }

  /** Whether the SDK has been destroyed. */
  get destroyed(): boolean {
    return this._destroyed;
  }

  // ===========================================================================
  // LIFECYCLE
  // ===========================================================================

  /**
   * Destroy the SDK instance.
   * Disconnects the socket, clears service references, and prevents further use.
   * Does NOT clear stored tokens (call auth.logout() first for a full logout).
   */
  destroy(): void {
    if (this._destroyed) return;

    this.log('Destroying DeskillzSDK');

    // Disconnect socket
    if (this._realtime) {
      this._realtime.disconnect();
    }

    // Null out all lazy services
    this._auth = null;
    this._walletAuth = null;
    this._twoFactor = null;
    this._wallet = null;
    this._lobby = null;
    this._games = null;
    this._tournaments = null;
    this._rooms = null;
    this._spectator = null;
    this._realtime = null;
    this._host = null;
    this._quickPlay = null;
    this._leaderboard = null;
    this._users = null;
    this._scoreSigner = null;

    // Remove all event listeners
    this.events.removeAllListeners();

    this._destroyed = true;
    this.log('DeskillzSDK destroyed');
  }

  // ===========================================================================
  // INTERNALS
  // ===========================================================================

  /**
   * Guard against using a destroyed SDK instance.
   */
  private assertNotDestroyed(): void {
    if (this._destroyed) {
      throw new Error(
        '[DeskillzSDK] This SDK instance has been destroyed. Create a new instance.'
      );
    }
  }

  /**
   * Debug logger.
   */
  private log(...args: unknown[]): void {
    if (this.config.debug) {
      console.log('[DeskillzSDK]', ...args);
    }
  }
}

// =============================================================================
// FACTORY FUNCTION
// =============================================================================

/**
 * Create a new DeskillzSDK instance.
 * Convenience wrapper around `new DeskillzSDK(config)`.
 *
 * @example
 * ```ts
 * import { createDeskillzSDK } from '@deskillz/web-sdk';
 *
 * const sdk = createDeskillzSDK({
 *   gameId: 'my-game',
 *   gameKey: 'my-key',
 *   debug: true,
 * });
 * ```
 */
export function createDeskillzSDK(config: DeskillzConfig): DeskillzSDK {
  return new DeskillzSDK(config);
}