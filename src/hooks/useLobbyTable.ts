// =============================================================================
// useLobbyTable -- packages/game-ui/src/hooks/useLobbyTable.ts (SDK 3.7.0)
// Seated tournament lobby state for React games (no rendering):
//   - polls GET /api/v1/tournaments/:id/my-launch every 5 s (backoff x1.5 up
//     to 15 s on error, reset on success), one request in flight at a time
//   - optional fast path (match:launch socket event -> poll now)
//   - once the deadline passes without a phase change, polls every 1.5 s and
//     reports 'starting'
//   - onLive fires exactly once; the caller reloads the same tab into webLink
//   - countdown targets come from server timestamps only
// Keep game-engine and multiplayer imports out of the lobby screen: it only
// renders until the table is live.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from 'react';

export interface LobbyRosterEntry {
  userId: string;
  username: string;
  avatarUrl?: string | null;
  checkedInAt: string | null;
  seatNumber?: number;          // SEATED only (1-based)
}

export interface LobbyState {
  live: boolean;
  tournamentId?: string;
  phase?: 'CHECKIN' | 'SEATED' | 'ABORTED';
  scheduledStart?: string | null;
  checkinOpensAt?: string | null;
  checkinClosesAt?: string | null;
  tableSize?: number;
  tableNumber?: number;
  me?: { userId: string; checkedIn: boolean; seatNumber?: number };
  roster?: LobbyRosterEntry[];
  abortReason?: string;
  lobbyLink?: string | null;   // pre-live only
  webLink?: string | null;     // live only
  matchId?: string;            // live only
  hostUserId?: string | null;  // live only: the seat that runs the game engine
}

export interface LobbyTableConfig {
  /** One GET of my-launch. Must resolve to the payload (unwrap axios .data yourself). */
  fetchState: () => Promise<LobbyState>;
  /** Subscribe a "poll now" fast path; return an unsubscribe. Optional. */
  onFastPath?: (pollNow: () => void) => (() => void) | void;
  /** Called once at live:true with the payload. */
  onLive: (state: LobbyState) => void;
  pollMs?: number;
}

export interface LobbyCountdown {
  label: 'lockIn' | 'dealIn' | 'starting';
  msLeft: number;
}

export interface LobbyTableResult {
  state: LobbyState | null;
  countdown: LobbyCountdown | null;
  aborted: string | null;
  pollNow: () => void;
}

const POLL_MS_DEFAULT = 5000;
const POLL_MS_MAX = 15000;
const POLL_MS_GRACE = 1500;

export function useLobbyTable(cfg: LobbyTableConfig): LobbyTableResult {
  const [state, setState] = useState<LobbyState | null>(null);
  const [countdown, setCountdown] = useState<LobbyCountdown | null>(null);
  const [aborted, setAborted] = useState<string | null>(null);

  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;
  const stateRef = useRef<LobbyState | null>(null);
  const liveFired = useRef(false);
  const inFlight = useRef(false);
  const destroyed = useRef(false);
  const pollMs = useRef(cfg.pollMs ?? POLL_MS_DEFAULT);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearPoll = () => {
    if (pollTimer.current) { clearTimeout(pollTimer.current); pollTimer.current = null; }
  };

  const schedulePoll = useCallback((ms: number) => {
    if (destroyed.current || liveFired.current) return;
    clearPoll();
    pollTimer.current = setTimeout(() => { void pollNowRef.current(); }, ms);
  }, []);

  const applyState = useCallback((st: LobbyState) => {
    if (!st || destroyed.current) return;
    stateRef.current = st;
    setState(st);
    if (st.live) {
      if (liveFired.current) return;
      liveFired.current = true;
      clearPoll();
      setCountdown({ label: 'starting', msLeft: 0 });
      console.log('[N228] live: reload into table (D5) matchId=' + (st.matchId ?? '?'));
      cfgRef.current.onLive(st);
      return;
    }
    if (st.phase === 'ABORTED') {
      clearPoll();
      setAborted(st.abortReason ?? 'UNKNOWN');
    }
  }, []);

  const pollNow = useCallback(async () => {
    if (destroyed.current || liveFired.current || inFlight.current) return;
    inFlight.current = true;
    try {
      const st = await cfgRef.current.fetchState();
      pollMs.current = cfgRef.current.pollMs ?? POLL_MS_DEFAULT;   // reset backoff
      applyState(st);
    } catch (err: unknown) {
      pollMs.current = Math.min(POLL_MS_MAX, Math.round(pollMs.current * 1.5));
      const msg = err instanceof Error ? err.message : String(err);
      console.warn('[N228] lobby: poll failed, retry in', pollMs.current, 'ms --', msg);
    } finally {
      inFlight.current = false;
      if (stateRef.current?.phase !== 'ABORTED') schedulePoll(pollMs.current);
    }
  }, [applyState, schedulePoll]);
  const pollNowRef = useRef(pollNow);
  pollNowRef.current = pollNow;

  // Boot: fast path + first poll. Teardown: timers + fast-path unsubscribe.
  useEffect(() => {
    destroyed.current = false;
    console.log('[N228] lobby: render-only');
    let unsubFast: (() => void) | undefined;
    if (cfgRef.current.onFastPath) {
      const u = cfgRef.current.onFastPath(() => { void pollNowRef.current(); });
      if (typeof u === 'function') unsubFast = u;
    }
    void pollNowRef.current();
    return () => {
      destroyed.current = true;
      clearPoll();
      if (unsubFast) unsubFast();
    };
  }, []);

  // Countdown ticker (render only; server timestamps decide the target).
  useEffect(() => {
    const tick = () => {
      const st = stateRef.current;
      if (!st || st.live || st.phase === 'ABORTED') return;
      // N228-T0: once the seat-lock deadline has passed but the phase has not
      // flipped (backend sweeps on the minute), count toward scheduledStart.
      let target = st.phase === 'SEATED'
        ? (st.scheduledStart ?? null)
        : (st.checkinClosesAt ?? st.scheduledStart ?? null);
      let label: LobbyCountdown['label'] = st.phase === 'SEATED' ? 'dealIn' : 'lockIn';
      if (target && st.phase !== 'SEATED' && st.scheduledStart
          && new Date(target).getTime() - Date.now() <= 0) {
        target = st.scheduledStart;
        label = 'dealIn';
      }
      if (!target) { setCountdown(null); return; }
      const left = new Date(target).getTime() - Date.now();
      setCountdown(left <= 0 ? { label: 'starting', msLeft: 0 } : { label, msLeft: left });
      // Deadline passed but state has not flipped yet: poll faster.
      if (left <= 0 && !inFlight.current) schedulePoll(POLL_MS_GRACE);
    };
    const id = setInterval(tick, 250);
    tick();
    return () => clearInterval(id);
  }, [schedulePoll]);

  return { state, countdown, aborted, pollNow: () => { void pollNowRef.current(); } };
}

/** mm:ss for a countdown remainder. */
export function fmtCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
}

/** Copy for the ABORTED card (D12). Backend emits exactly these four. */
export const LOBBY_ABORT_COPY: Record<string, string> = {
  CANCELLED: 'This tournament was cancelled.',
  DQ_NO_SHOW: 'You did not check in before seats locked.',
  NOT_REGISTERED: 'You are not registered for this tournament.',
  ENDED: 'This tournament has ended.',
  UNKNOWN: 'This table is no longer available.',
};
