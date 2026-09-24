// =============================================================================
// deskillzReturn -- packages/game-ui/src/hooks/deskillzReturn.ts
//
// N510: ONE way off a real-match result screen. Replay buttons (Play Again,
// Rematch, New Game, Next Level, Try Again) opened an unpaid game that looked
// like the paid one; every real-match result shows a single
// "Back to Deskillz" that calls backToDeskillz(fallback) instead.
//
//   - fallback() ALWAYS runs first: it is the game's own leave (leave the
//     room / queue, clean up, show its lobby). N527: the first version ran it
//     only without a launch origin, so a site-launched tab skipped leaveRoom /
//     endSession and only dropped the socket.
//   - Match started from the game's own Quick Play / Rooms screen: no launch
//     origin -> that is all; the player is in the game's lobby (Liam, Sep 23).
//   - Tab launched by the site (captureLaunchParams saw ?matchId=,
//     ?tournamentId= or ?roomCode= and recorded the launch origin): after
//     RETURN_DELAY_MS (so the leave request is on the wire) close this tab --
//     the site opened it with window.open, the Deskillz tab is still behind
//     it. If the browser keeps it open (installed PWA, app webview, typed URL)
//     go to the launching page on the site instead: /tournaments/<id> for a
//     tournament, /lobby for a room or lobby match.
//
// Practice / AI modes are not real matches and keep their own buttons.
// Vendored byte-identical into every game at src/hooks/deskillzReturn.ts,
// next to useLaunchDeepLink.ts (which records the origin).
// =============================================================================

import { LAUNCH_SS_ORIGIN } from './useLaunchDeepLink'

export const DESKILLZ_SITE_URL = 'https://deskillz.games'
export const BACK_TO_DESKILLZ_LABEL = 'Back to Deskillz'
/** N527: time for the game's leave request to leave the tab before it closes. */
export const RETURN_DELAY_MS = 500

export interface LaunchOrigin {
  matchId: string | null
  tournamentId: string | null
  roomCode: string | null
}

const str = (v: unknown): string | null => (typeof v === 'string' && v ? v : null)

/** The site launch this tab came from, or null (game-internal launch). */
export function getLaunchOrigin(): LaunchOrigin | null {
  try {
    const raw = sessionStorage.getItem(LAUNCH_SS_ORIGIN)
    if (!raw) return null
    const o = JSON.parse(raw) as Record<string, unknown>
    const origin: LaunchOrigin = {
      matchId: str(o.matchId),
      tournamentId: str(o.tournamentId),
      roomCode: str(o.roomCode),
    }
    return origin.matchId || origin.tournamentId || origin.roomCode ? origin : null
  } catch {
    return null
  }
}

export function isDeskillzLaunched(): boolean {
  return getLaunchOrigin() !== null
}

/** The site page a launch origin returns to. */
export function deskillzReturnUrl(origin: LaunchOrigin): string {
  return origin.tournamentId
    ? `${DESKILLZ_SITE_URL}/tournaments/${encodeURIComponent(origin.tournamentId)}`
    : `${DESKILLZ_SITE_URL}/lobby`
}

/**
 * The one exit from a real-match result screen. `fallback` is the game's own
 * leave (room / queue cleanup + its lobby); it always runs first.
 */
export function backToDeskillz(fallback?: () => void): void {
  const origin = getLaunchOrigin()
  try {
    fallback?.()
  } catch (err) {
    console.warn('[backToDeskillz] game leave handler failed:', err)
  }
  if (!origin) return
  const url = deskillzReturnUrl(origin)
  setTimeout(() => {
    try { window.close() } catch { /* not script-closable */ }
    setTimeout(() => {
      try {
        if (!window.closed) window.location.assign(url)
      } catch { /* navigation refused -- nothing else to do */ }
    }, 300)
  }, RETURN_DELAY_MS)
}
