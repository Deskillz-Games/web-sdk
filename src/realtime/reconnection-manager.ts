// =============================================================================
// Deskillz Web SDK - Reconnection Manager
// Path: src/realtime/reconnection-manager.ts
// Exponential backoff reconnection with jitter and network awareness
// Replicates: socket.ts RECONNECTION_CONFIG (lines 296-302)
// and reconnect() (lines 908-959)
// =============================================================================

import type { ResolvedConfig } from '../core/config';

// =============================================================================
// CONFIGURATION
// =============================================================================

/**
 * Reconnection parameters.
 * Default values replicate socket.ts RECONNECTION_CONFIG (lines 296-302).
 */
export interface ReconnectionConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  multiplier: number;
  jitter: number;
}

/**
 * Extract reconnection config from resolved SDK config.
 */
export function extractReconnectionConfig(config: ResolvedConfig): ReconnectionConfig {
  return {
    maxAttempts: config.maxReconnectAttempts,
    initialDelay: config.reconnectBaseDelay,
    maxDelay: config.reconnectMaxDelay,
    multiplier: config.reconnectMultiplier,
    jitter: config.reconnectJitter,
  };
}

// =============================================================================
// RECONNECTION MANAGER
// =============================================================================

/**
 * Callback types for the reconnection manager.
 */
export interface ReconnectionCallbacks {
  /** Called when a reconnection attempt should be made. */
  onReconnect: () => void;
  /** Called when reconnection state changes. */
  onStateChange: (state: ReconnectionState) => void;
  /** Called when max attempts are exhausted. */
  onMaxAttemptsReached: () => void;
  /** Called when waiting for network to come back online. */
  onWaitingForNetwork: () => void;
}

export interface ReconnectionState {
  attempt: number;
  maxAttempts: number;
  nextDelay: number;
  isReconnecting: boolean;
  isWaitingForNetwork: boolean;
}

/**
 * Manages WebSocket reconnection with exponential backoff and jitter.
 *
 * Replicates the manual reconnection logic from socket.ts:
 * - Exponential backoff: `initialDelay * multiplier^(attempt-1)` (line 388)
 * - Cap at maxDelay (line 391)
 * - Random jitter +/- jitterPercent (lines 394-395)
 * - Max attempts check (line 912)
 * - Online detection via navigator.onLine (line 922)
 * - Listen for 'online' event to auto-retry (lines 927-932)
 */
export class ReconnectionManager {
  private config: ReconnectionConfig;
  private callbacks: ReconnectionCallbacks;
  private attempt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private onlineHandler: (() => void) | null = null;
  private active = false;

  constructor(config: ReconnectionConfig, callbacks: ReconnectionCallbacks) {
    this.config = config;
    this.callbacks = callbacks;
  }

  /**
   * Schedule the next reconnection attempt.
   * Replicates: socket.ts reconnect() (lines 908-959)
   */
  scheduleReconnect(): void {
    // Check if max attempts reached (socket.ts line 912)
    if (this.attempt >= this.config.maxAttempts) {
      this.active = false;
      this.callbacks.onMaxAttemptsReached();
      this.callbacks.onStateChange({
        attempt: this.attempt,
        maxAttempts: this.config.maxAttempts,
        nextDelay: 0,
        isReconnecting: false,
        isWaitingForNetwork: false,
      });
      return;
    }

    // Check if offline (socket.ts lines 922-933)
    if (!this.isOnline()) {
      this.active = true;
      this.callbacks.onWaitingForNetwork();
      this.callbacks.onStateChange({
        attempt: this.attempt,
        maxAttempts: this.config.maxAttempts,
        nextDelay: 0,
        isReconnecting: false,
        isWaitingForNetwork: true,
      });

      // Listen for 'online' event to auto-retry (socket.ts lines 927-931)
      this.listenForOnline();
      return;
    }

    // Increment attempt and calculate delay
    this.attempt += 1;
    const delay = this.calculateDelay(this.attempt);

    this.active = true;

    this.callbacks.onStateChange({
      attempt: this.attempt,
      maxAttempts: this.config.maxAttempts,
      nextDelay: delay,
      isReconnecting: true,
      isWaitingForNetwork: false,
    });

    // Schedule the reconnection (socket.ts lines 956-958)
    this.timer = setTimeout(() => {
      this.timer = null;
      this.callbacks.onReconnect();
    }, delay);
  }

  /**
   * Reset the reconnection state (called on successful connection).
   */
  reset(): void {
    this.cancel();
    this.attempt = 0;
    this.active = false;
  }

  /**
   * Cancel any pending reconnection attempt.
   */
  cancel(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.removeOnlineListener();
    this.active = false;
  }

  /**
   * Get current attempt count.
   */
  getAttempt(): number {
    return this.attempt;
  }

  /**
   * Check if actively reconnecting.
   */
  isActive(): boolean {
    return this.active;
  }

  /**
   * Update configuration at runtime.
   */
  updateConfig(config: Partial<ReconnectionConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Destroy the manager, clearing all timers and listeners.
   */
  destroy(): void {
    this.cancel();
    this.attempt = 0;
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  /**
   * Calculate reconnection delay with exponential backoff and jitter.
   * Replicates: socket.ts calculateReconnectDelay() (lines 384-398)
   *
   * Formula: min(initialDelay * multiplier^(attempt-1), maxDelay) +/- jitter
   */
  private calculateDelay(attempt: number): number {
    const { initialDelay, maxDelay, multiplier, jitter } = this.config;

    // Exponential backoff (socket.ts line 388)
    let delay = initialDelay * Math.pow(multiplier, attempt - 1);

    // Cap at max delay (socket.ts line 391)
    delay = Math.min(delay, maxDelay);

    // Add random jitter (socket.ts lines 394-395)
    const jitterAmount = delay * jitter;
    delay += Math.random() * jitterAmount * 2 - jitterAmount;

    return Math.floor(delay);
  }

  /**
   * Check if the browser is online.
   * Replicates: socket.ts isOnline() (lines 403-405)
   */
  private isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * Listen for the browser 'online' event.
   * Replicates: socket.ts lines 927-931
   */
  private listenForOnline(): void {
    this.removeOnlineListener();

    if (typeof window === 'undefined') return;

    this.onlineHandler = () => {
      this.removeOnlineListener();
      this.scheduleReconnect();
    };

    window.addEventListener('online', this.onlineHandler);
  }

  /**
   * Remove the 'online' event listener.
   */
  private removeOnlineListener(): void {
    if (this.onlineHandler && typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
      this.onlineHandler = null;
    }
  }
}