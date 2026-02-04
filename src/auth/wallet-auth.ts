// =============================================================================
// Deskillz Web SDK - Wallet Authentication Service
// Path: src/auth/wallet-auth.ts
// Sign-In With Ethereum (SIWE) and wallet management
// Replicates: useBackendAuth.ts authenticate() (lines 172-299)
// and auth.ts wallet methods (lines 310-331)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { TokenManager } from '../core/storage';
import type { TypedEventEmitter } from '../core/event-emitter';
import type { SDKEventMap, BackendUser } from '../core/types';
import { SDKEventName } from '../core/types';
import { AuthError, ErrorCode } from '../core/errors';
import type {
  AuthResponse,
  AuthResult,
  NonceResponse,
  WalletVerifyPayload,
  WalletLinkPayload,
  SIWEMessageParams,
  WalletSignFunction,
} from './auth-types';
import { SIWE_DEFAULTS } from './auth-types';

/**
 * Wallet-based authentication service using SIWE (Sign-In With Ethereum).
 *
 * The Web SDK does NOT include wallet connection UI (no RainbowKit/wagmi).
 * The game developer handles wallet connection and provides a sign function.
 *
 * Usage:
 * ```typescript
 * const result = await sdk.walletAuth.authenticate({
 *   address: '0x1234...',
 *   chainId: 56,
 *   signMessage: async (message) => {
 *     // Use your preferred wallet library to sign
 *     return await signer.signMessage(message);
 *   },
 * });
 * ```
 */
export class WalletAuthService {
  private http: HttpClient;
  private tokenManager: TokenManager;
  private events: TypedEventEmitter<SDKEventMap>;
  private debug: boolean;

  // Module-level mutex to prevent concurrent auth attempts
  // Replicates: useBackendAuth.ts isAuthenticatingGlobal (line 13)
  private isAuthenticating = false;

  constructor(
    http: HttpClient,
    tokenManager: TokenManager,
    events: TypedEventEmitter<SDKEventMap>,
    debug = false
  ) {
    this.http = http;
    this.tokenManager = tokenManager;
    this.events = events;
    this.debug = debug;
  }

  // ---------------------------------------------------------------------------
  // Full SIWE Authentication Flow
  // Replicates: useBackendAuth.ts authenticate() (lines 172-299)
  // ---------------------------------------------------------------------------

  /**
   * Full SIWE wallet authentication flow:
   * 1. Get nonce from backend
   * 2. Construct SIWE message
   * 3. Sign message with wallet
   * 4. Verify signature with backend
   * 5. Store tokens and dispatch events
   *
   * @param params.address - Wallet address (checksummed).
   * @param params.chainId - Connected chain ID (e.g., 56 for BSC).
   * @param params.signMessage - Function to sign the SIWE message string.
   * @param params.domain - Optional SIWE domain override (defaults to window.location.host).
   * @param params.uri - Optional SIWE URI override (defaults to window.location.origin).
   * @returns Auth result with user, tokens, and isNewUser flag.
   */
  async authenticate(params: {
    address: string;
    chainId: number;
    signMessage: WalletSignFunction;
    domain?: string;
    uri?: string;
  }): Promise<AuthResult> {
    const { address, chainId, signMessage, domain, uri } = params;

    // Prevent concurrent auth attempts (useBackendAuth.ts line 186-189)
    if (this.isAuthenticating) {
      this.log('Already authenticating, skipping...');
      throw new AuthError(
        'Authentication already in progress',
        ErrorCode.AUTH_FAILED
      );
    }

    // Check if already authenticated (useBackendAuth.ts lines 179-183)
    const isAuth = await this.tokenManager.isAuthenticated();
    if (isAuth) {
      this.log('Already authenticated');
      throw new AuthError(
        'Already authenticated. Call logout() first.',
        ErrorCode.AUTH_FAILED
      );
    }

    this.isAuthenticating = true;

    try {
      // Step 1: Get nonce from backend (useBackendAuth.ts lines 196-201)
      this.log('Getting nonce for:', address);
      const nonce = await this.getNonce(address);

      // Step 2: Construct SIWE message (useBackendAuth.ts lines 204-215)
      const siweParams: SIWEMessageParams = {
        domain: domain ?? (typeof window !== 'undefined' ? window.location.host : ''),
        address,
        statement: SIWE_DEFAULTS.STATEMENT,
        uri: uri ?? (typeof window !== 'undefined' ? window.location.origin : ''),
        version: SIWE_DEFAULTS.VERSION,
        chainId,
        nonce,
        issuedAt: new Date().toISOString(),
      };

      const message = this.constructSIWEMessage(siweParams);
      this.log('SIWE message constructed');

      // Step 3: Sign the message with wallet (useBackendAuth.ts lines 219-221)
      this.log('Requesting signature...');
      let signature: string;
      try {
        signature = await signMessage(message);
      } catch (signError) {
        // Handle wallet rejection (useBackendAuth.ts lines 286-289)
        const err = signError as Error & { code?: number };
        if (err.code === 4001 || err.message?.includes('rejected')) {
          throw new AuthError(
            'Signature rejected. Please try again.',
            ErrorCode.WALLET_SIGNATURE_FAILED
          );
        }
        throw new AuthError(
          err.message || 'Failed to sign message',
          ErrorCode.WALLET_SIGNATURE_FAILED
        );
      }
      this.log('Got signature');

      // Step 4: Verify with backend (useBackendAuth.ts lines 225-233)
      this.log('Verifying with backend...');
      const response = await this.http.post<AuthResponse>(
        '/api/v1/auth/wallet/verify',
        { message, signature } as WalletVerifyPayload
      );

      const data = response.data as unknown as Record<string, unknown>;
      const accessToken = (data.accessToken as string) ?? '';
      const refreshToken = (data.refreshToken as string) ?? '';
      const user = data.user as BackendUser;
      const isNewUser = (data.isNewUser as boolean) ?? false;

      if (!accessToken || !user) {
        throw new AuthError(
          'Invalid auth response from server',
          ErrorCode.AUTH_FAILED
        );
      }

      this.log('Authentication successful! User:', user.username);

      // Step 5: Store tokens (useBackendAuth.ts lines 236-237)
      await this.tokenManager.setTokens(accessToken, refreshToken);
      await this.tokenManager.setAuthCompleted(true);

      // Step 6: Handle new user (useBackendAuth.ts lines 240-255)
      if (isNewUser) {
        this.log('NEW USER DETECTED');
        await this.tokenManager.setIsNewUser(true);
        this.dispatchNewUserEvent();
      }

      // Dispatch auth state changed (useBackendAuth.ts lines 268-272)
      this.events.emit(SDKEventName.AUTH_STATE_CHANGED, {
        isAuthenticated: true,
        user,
        timestamp: Date.now(),
      });

      const result: AuthResult = {
        user,
        tokens: { accessToken, refreshToken },
        isNewUser,
      };

      this.isAuthenticating = false;
      return result;

    } catch (error) {
      this.isAuthenticating = false;
      throw error;
    }
  }

  // ---------------------------------------------------------------------------
  // Nonce Retrieval
  // Replicates: auth.ts authApi.getNonce (lines 185-189)
  // ---------------------------------------------------------------------------

  /**
   * Get a SIWE nonce for a wallet address.
   *
   * @param walletAddress - The wallet address to get a nonce for.
   * @returns The nonce string.
   */
  async getNonce(walletAddress: string): Promise<string> {
    const response = await this.http.get<NonceResponse>(
      '/api/v1/auth/nonce',
      { walletAddress }
    );
    return response.data.nonce;
  }

  // ---------------------------------------------------------------------------
  // Wallet Management (for authenticated users)
  // Replicates: auth.ts lines 310-331
  // ---------------------------------------------------------------------------

  /**
   * Get a nonce for linking a wallet to an existing account.
   * Replicates: auth.ts authApi.getWalletLinkNonce (lines 311-315)
   *
   * @param walletAddress - The wallet address to link.
   * @returns The nonce for signing.
   */
  async getWalletLinkNonce(walletAddress: string): Promise<NonceResponse> {
    const response = await this.http.get<NonceResponse>(
      '/api/v1/auth/wallet/nonce',
      { walletAddress }
    );
    return response.data;
  }

  /**
   * Link a wallet to the current authenticated account.
   * Replicates: auth.ts authApi.linkWallet (lines 318-321)
   *
   * @param payload - Wallet address, signature, message, and nonce.
   * @returns Updated user profile.
   */
  async linkWallet(payload: WalletLinkPayload): Promise<BackendUser> {
    const response = await this.http.post<BackendUser>(
      '/api/v1/auth/wallet/link',
      payload
    );
    return response.data;
  }

  /**
   * Disconnect a wallet from the current account.
   * Replicates: auth.ts authApi.disconnectWallet (lines 324-331)
   *
   * @param walletAddress - Optional specific wallet to disconnect.
   * @returns Updated user profile.
   */
  async disconnectWallet(walletAddress?: string): Promise<BackendUser> {
    const path = walletAddress
      ? `/api/v1/auth/wallet/disconnect?walletAddress=${encodeURIComponent(walletAddress)}`
      : '/api/v1/auth/wallet/disconnect';

    const response = await this.http.post<BackendUser>(path);
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // SIWE Message Construction
  // Replicates: useBackendAuth.ts SiweMessage (lines 204-215)
  // EIP-4361 format: https://eips.ethereum.org/EIPS/eip-4361
  // ---------------------------------------------------------------------------

  /**
   * Construct an EIP-4361 SIWE message string.
   * This is a pure function - no external `siwe` library needed.
   *
   * Format:
   * ```
   * {domain} wants you to sign in with your Ethereum account:
   * {address}
   *
   * {statement}
   *
   * URI: {uri}
   * Version: {version}
   * Chain ID: {chainId}
   * Nonce: {nonce}
   * Issued At: {issuedAt}
   * ```
   */
  private constructSIWEMessage(params: SIWEMessageParams): string {
    const lines: string[] = [
      `${params.domain} wants you to sign in with your Ethereum account:`,
      params.address,
      '',
      params.statement,
      '',
      `URI: ${params.uri}`,
      `Version: ${params.version}`,
      `Chain ID: ${params.chainId}`,
      `Nonce: ${params.nonce}`,
      `Issued At: ${params.issuedAt}`,
    ];

    return lines.join('\n');
  }

  // ---------------------------------------------------------------------------
  // Event Dispatching
  // ---------------------------------------------------------------------------

  /**
   * Dispatch new user event with 3 attempts (0ms, 100ms, 500ms).
   * Replicates: useBackendAuth.ts notifyNewUser (lines 82-105)
   */
  private dispatchNewUserEvent(): void {
    const base = { isNewUser: true, timestamp: Date.now() };

    this.events.emit(SDKEventName.NEW_USER, base);

    setTimeout(() => {
      this.events.emit(SDKEventName.NEW_USER, {
        ...base,
        timestamp: Date.now(),
        delayed: true,
      });
    }, 100);

    setTimeout(() => {
      this.events.emit(SDKEventName.NEW_USER, {
        ...base,
        timestamp: Date.now(),
        final: true,
      });
    }, 500);
  }

  /**
   * Debug logger.
   */
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:WalletAuth]', ...args);
    }
  }
}