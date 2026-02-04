// =============================================================================
// Deskillz Web SDK - Typed Event Emitter
// Path: src/core/event-emitter.ts
// Framework-agnostic typed event system replacing React hooks/Zustand
// Replicates CustomEvent patterns from: useBackendAuth.ts (lines 54-104)
// =============================================================================

/**
 * Handler function type for a specific event.
 */
type EventHandler<T> = (data: T) => void;

/**
 * Internal listener entry tracking handler and once-flag.
 */
interface ListenerEntry<T> {
  handler: EventHandler<T>;
  once: boolean;
}

/**
 * A strongly-typed, synchronous event emitter.
 *
 * Usage:
 * ```typescript
 * interface MyEvents {
 *   'user:login': { userId: string };
 *   'user:logout': void;
 * }
 *
 * const emitter = new TypedEventEmitter<MyEvents>();
 *
 * const unsub = emitter.on('user:login', (data) => {
 *   console.log(data.userId); // fully typed
 * });
 *
 * emitter.emit('user:login', { userId: '123' });
 * unsub(); // unsubscribe
 * ```
 */
export class TypedEventEmitter<Events extends Record<string, any>> {
  private listeners = new Map<keyof Events, ListenerEntry<any>[]>();

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   *
   * @param event - The event name to listen for.
   * @param handler - Callback invoked when the event fires.
   * @returns A function that removes this specific listener when called.
   */
  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    return this.addListener(event, handler, false);
  }

  /**
   * Subscribe to an event for a single firing, then auto-remove.
   *
   * @param event - The event name to listen for.
   * @param handler - Callback invoked once when the event fires.
   * @returns A function that removes this listener before it fires (if needed).
   */
  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void {
    return this.addListener(event, handler, true);
  }

  /**
   * Remove a specific handler for an event.
   *
   * @param event - The event name.
   * @param handler - The exact handler reference to remove.
   */
  off<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): void {
    const entries = this.listeners.get(event);
    if (!entries) return;

    const filtered = entries.filter((entry) => entry.handler !== handler);
    if (filtered.length === 0) {
      this.listeners.delete(event);
    } else {
      this.listeners.set(event, filtered);
    }
  }

  /**
   * Emit an event, invoking all registered handlers synchronously.
   * Once-listeners are removed after invocation.
   *
   * For events with payload type `void`, call as `emit('event', undefined as void)`.
   *
   * @param event - The event name to emit.
   * @param data - The payload to pass to handlers.
   */
  emit<K extends keyof Events>(event: K, ...[data]: Events[K] extends void ? [void?] : [Events[K]]): void {
    const entries = this.listeners.get(event);
    if (!entries || entries.length === 0) return;

    // Snapshot the array to safely iterate if handlers modify listeners
    const snapshot = [...entries];
    const toRemove: ListenerEntry<Events[K]>[] = [];

    for (const entry of snapshot) {
      try {
        entry.handler(data as Events[K]);
      } catch (err) {
        // Prevent one failing handler from blocking others
        console.error(
          `[DeskillzSDK] Error in event handler for "${String(event)}":`,
          err
        );
      }

      if (entry.once) {
        toRemove.push(entry);
      }
    }

    // Remove once-listeners after all handlers have run
    if (toRemove.length > 0) {
      const current = this.listeners.get(event);
      if (current) {
        const filtered = current.filter((e) => !toRemove.includes(e));
        if (filtered.length === 0) {
          this.listeners.delete(event);
        } else {
          this.listeners.set(event, filtered);
        }
      }
    }
  }

  /**
   * Remove all listeners for a specific event, or all events if none specified.
   *
   * @param event - Optional event name. If omitted, clears everything.
   */
  removeAllListeners(event?: keyof Events): void {
    if (event !== undefined) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get the count of listeners for a specific event.
   *
   * @param event - The event name.
   * @returns Number of registered listeners.
   */
  listenerCount(event: keyof Events): number {
    return this.listeners.get(event)?.length ?? 0;
  }

  /**
   * Check if any listeners are registered for a specific event.
   *
   * @param event - The event name.
   * @returns True if at least one listener is registered.
   */
  hasListeners(event: keyof Events): boolean {
    return this.listenerCount(event) > 0;
  }

  /**
   * Get all event names that have at least one listener.
   *
   * @returns Array of event name keys.
   */
  eventNames(): (keyof Events)[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Wait for an event to fire, returning a promise that resolves with the payload.
   * Useful for one-shot async flows (e.g., waiting for socket connection).
   *
   * @param event - The event name to wait for.
   * @param timeoutMs - Optional timeout in milliseconds. Rejects on timeout.
   * @returns Promise resolving with the event payload.
   */
  waitFor<K extends keyof Events>(
    event: K,
    timeoutMs?: number
  ): Promise<Events[K]> {
    return new Promise<Events[K]>((resolve, reject) => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;

      const unsub = this.once(event, (data: Events[K]) => {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
        resolve(data);
      });

      if (timeoutMs !== undefined && timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          unsub();
          reject(new Error(`Timed out waiting for event "${String(event)}" after ${timeoutMs}ms`));
        }, timeoutMs);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  private addListener<K extends keyof Events>(
    event: K,
    handler: EventHandler<Events[K]>,
    once: boolean
  ): () => void {
    const entry: ListenerEntry<Events[K]> = { handler, once };

    const existing = this.listeners.get(event);
    if (existing) {
      existing.push(entry);
    } else {
      this.listeners.set(event, [entry]);
    }

    // Return unsubscribe function
    return () => this.off(event, handler);
  }
}