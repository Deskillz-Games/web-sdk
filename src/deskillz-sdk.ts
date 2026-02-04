// =============================================================================
// Deskillz Web SDK - Main SDK Entry Point
// Path: src/deskillz-sdk.ts
// Orchestrates all services: auth, wallet, lobby, games, tournaments,
// private rooms, spectator, and real-time socket
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

// =============================================================================
// SDK VERSION
// =============================================================================

/** Semantic version of the Deskillz Web SDK. */
export const SDK_VERSION = '1.0.0';

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
 * // Browse games
 * const games = await sdk.games.getGames();
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