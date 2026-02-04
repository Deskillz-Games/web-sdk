// =============================================================================
// Deskillz Web SDK - Score Signer
// Path: src/security/score-signer.ts
// HMAC-SHA256 score signing for anti-cheat verification
// Uses Web Crypto API (no external dependencies)
//
// The signature flow:
// 1. Game completes, produces a raw score
// 2. SDK signs the score with HMAC-SHA256 using the apiSecret
// 3. Signed score submitted to backend via /api/v1/tournaments/:id/score
// 4. Backend verifies HMAC signature before accepting
// 5. Backend signs final rankings with ECDSA for on-chain validation
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

/**
 * Score payload for signing.
 */
export interface ScorePayload {
  /** Game's unique identifier */
  gameId: string;
  /** Match/session identifier (on-device ID or server match ID) */
  matchId: string;
  /** Player's final score */
  score: number;
  /** Match duration in seconds (optional, for time validation) */
  duration?: number;
  /** Unix timestamp in seconds when score was achieved */
  timestamp: number;
  /** Unique nonce to prevent replay attacks (optional, auto-generated if omitted) */
  nonce?: string;
}

/**
 * Signed score ready for submission.
 */
export interface SignedScore extends ScorePayload {
  /** HMAC-SHA256 signature (hex-encoded) */
  signature: string;
  /** Nonce used in signature (guaranteed present) */
  nonce: string;
}

/**
 * Score verification result.
 */
export interface VerificationResult {
  /** Whether the signature is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

// =============================================================================
// SCORE SIGNER CLASS
// =============================================================================

/**
 * HMAC-SHA256 score signer for anti-cheat verification.
 *
 * Usage:
 * ```typescript
 * const signer = new ScoreSigner(apiSecret);
 *
 * // Sign a score
 * const signed = await signer.signScore({
 *   gameId: 'game-123',
 *   matchId: 'match-456',
 *   score: 15000,
 *   duration: 120.5,
 *   timestamp: Math.floor(Date.now() / 1000),
 * });
 *
 * // Submit signed.signature along with score to backend
 * await sdk.tournaments.submitScore(tournamentId, {
 *   score: signed.score,
 *   signature: signed.signature,
 *   matchId: signed.matchId,
 *   timestamp: signed.timestamp,
 *   nonce: signed.nonce,
 * });
 * ```
 */
export class ScoreSigner {
  private readonly secret: string;
  private cryptoKey: CryptoKey | null = null;

  /**
   * Create a new ScoreSigner.
   *
   * @param apiSecret - The game's API secret (from developer portal).
   *                    NEVER hardcode this in client code; load from secure storage.
   */
  constructor(apiSecret: string) {
    if (!apiSecret || apiSecret.length < 16) {
      throw new Error('ScoreSigner: apiSecret must be at least 16 characters');
    }
    this.secret = apiSecret;
  }

  /**
   * Sign a score payload with HMAC-SHA256.
   *
   * @param payload - Score data to sign.
   * @returns Signed score with signature and nonce.
   */
  async signScore(payload: ScorePayload): Promise<SignedScore> {
    // Generate nonce if not provided
    const nonce = payload.nonce || this.generateNonce();

    // Build the canonical payload string
    const payloadString = this.buildPayloadString({ ...payload, nonce });

    // Sign with HMAC-SHA256
    const signature = await this.hmacSign(payloadString);

    return {
      ...payload,
      nonce,
      signature,
    };
  }

  /**
   * Verify a signed score (client-side check, for debugging).
   *
   * Note: The authoritative verification happens on the backend.
   * This is useful for debugging or pre-flight checks.
   *
   * @param signedScore - The signed score to verify.
   * @returns Verification result with valid flag and optional error.
   */
  async verifyScore(signedScore: SignedScore): Promise<VerificationResult> {
    try {
      // Rebuild the payload string
      const payloadString = this.buildPayloadString(signedScore);

      // Compute expected signature
      const expectedSignature = await this.hmacSign(payloadString);

      // Constant-time comparison
      const valid = this.constantTimeEquals(signedScore.signature, expectedSignature);

      return {
        valid,
        error: valid ? undefined : 'Signature mismatch',
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Verification failed',
      };
    }
  }

  /**
   * Build the canonical payload string for signing.
   * Format: gameId:matchId:score:duration:timestamp:nonce
   *
   * @param payload - Score payload with nonce.
   * @returns Canonical string representation.
   */
  private buildPayloadString(payload: ScorePayload & { nonce: string }): string {
    const parts = [
      payload.gameId,
      payload.matchId,
      payload.score.toString(),
      payload.duration !== undefined ? payload.duration.toFixed(2) : '0.00',
      payload.timestamp.toString(),
      payload.nonce,
    ];
    return parts.join(':');
  }

  /**
   * Generate a cryptographically secure nonce.
   *
   * @returns 32-character hex string.
   */
  private generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return Array.from(array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Compute HMAC-SHA256 signature.
   *
   * @param message - The message to sign.
   * @returns Hex-encoded signature.
   */
  private async hmacSign(message: string): Promise<string> {
    const key = await this.getOrCreateKey();
    const encoder = new TextEncoder();
    const data = encoder.encode(message);

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
    const signatureArray = new Uint8Array(signatureBuffer);

    return Array.from(signatureArray)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Get or create the HMAC CryptoKey (cached for performance).
   */
  private async getOrCreateKey(): Promise<CryptoKey> {
    if (this.cryptoKey) {
      return this.cryptoKey;
    }

    const encoder = new TextEncoder();
    const keyData = encoder.encode(this.secret);

    this.cryptoKey = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false, // not extractable
      ['sign', 'verify']
    );

    return this.cryptoKey;
  }

  /**
   * Constant-time string comparison to prevent timing attacks.
   *
   * @param a - First string.
   * @param b - Second string.
   * @returns True if equal.
   */
  private constantTimeEquals(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }
}

// =============================================================================
// STANDALONE FUNCTIONS (for one-off use without class instantiation)
// =============================================================================

/**
 * Sign a score with HMAC-SHA256 (standalone function).
 *
 * @param apiSecret - The game's API secret.
 * @param payload - Score data to sign.
 * @returns Signed score with signature.
 */
export async function signScore(
  apiSecret: string,
  payload: ScorePayload
): Promise<SignedScore> {
  const signer = new ScoreSigner(apiSecret);
  return signer.signScore(payload);
}

/**
 * Verify a signed score (standalone function).
 *
 * @param apiSecret - The game's API secret.
 * @param signedScore - The signed score to verify.
 * @returns Verification result.
 */
export async function verifyScore(
  apiSecret: string,
  signedScore: SignedScore
): Promise<VerificationResult> {
  const signer = new ScoreSigner(apiSecret);
  return signer.verifyScore(signedScore);
}

// =============================================================================
// FILE HASHING (SHA-256)
// Re-exported from build-service for convenience, but also available standalone
// =============================================================================

/**
 * Calculate SHA-256 hash of a file using Web Crypto API.
 * Used for build upload confirmation (fileHash field).
 *
 * @param file - The file to hash.
 * @returns Hex-encoded SHA-256 hash string.
 */
export async function calculateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Calculate SHA-256 hash of arbitrary data.
 *
 * @param data - String or ArrayBuffer to hash.
 * @returns Hex-encoded SHA-256 hash string.
 */
export async function calculateHash(data: string | ArrayBuffer): Promise<string> {
  let buffer: ArrayBuffer;

  if (typeof data === 'string') {
    const encoder = new TextEncoder();
    buffer = encoder.encode(data).buffer;
  } else {
    buffer = data;
  }

  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// =============================================================================
// TIMESTAMP UTILITIES
// =============================================================================

/**
 * Get current Unix timestamp in seconds.
 * Use this for score submission timestamps.
 */
export function getTimestamp(): number {
  return Math.floor(Date.now() / 1000);
}

/**
 * Check if a timestamp is within an acceptable window.
 * Used to detect clock manipulation.
 *
 * @param timestamp - The timestamp to check (Unix seconds).
 * @param maxAgeSecs - Maximum age in seconds (default: 5 minutes).
 * @param maxFutureSecs - Maximum future offset in seconds (default: 30 seconds).
 * @returns True if timestamp is within acceptable range.
 */
export function isTimestampValid(
  timestamp: number,
  maxAgeSecs = 300,
  maxFutureSecs = 30
): boolean {
  const now = getTimestamp();
  const age = now - timestamp;
  return age >= -maxFutureSecs && age <= maxAgeSecs;
}