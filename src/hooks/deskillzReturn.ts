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
//   - Page launched by the site (captureLaunchParams saw ?matchId=,
//     ?tournamentId= or ?roomCode= and recorded the launch origin): after
//     RETURN_DELAY_MS (so the leave request is on the wire) this page is
//     replaced by the launching page on the site: /tournaments/<id> for a
//     tournament, /lobby for a room, and [N621] /games/<gameId> for a Quick
//     Play match or table (the game's own page launched it).
//     [N655] D-F3 one tab for the whole journey: the site opens the game in
//     the same tab, so the way back is a navigation and the tab is never
//     closed. replace(), not assign(): browser Back on the site never
//     reopens a finished table. The launch origin is forgotten first.
//   - [N658] D-Q7 showCashOutNotice: after an armed cash-out the hand result
//     stays on screen with a bar 'You cashed out X' + Back to Deskillz that
//     counts down (15 s) and then leaves. [N653-a] setLeavingBadge: a lasting
//     cue while a Cash Out waits for the hand. Both are plain DOM with inline
//     styles so every game can use them (DDZ has no React).
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
/** [N658] D-Q7: seconds the cash-out notice waits before it returns by itself. */
export const CASH_OUT_RETURN_SECONDS = 15

export interface LaunchOrigin {
  matchId: string | null
  tournamentId: string | null
  roomCode: string | null
  /** [N621] the game the link named, when it did (the return target). */
  gameId?: string | null
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
      gameId: str(o.gameId),
    }
    return origin.matchId || origin.tournamentId || origin.roomCode ? origin : null
  } catch {
    return null
  }
}

export function isDeskillzLaunched(): boolean {
  return getLaunchOrigin() !== null
}

/** [N621] The game this tab runs: the bridge's own config, else the launch link. */
function currentGameId(origin: LaunchOrigin): string | null {
  try {
    const id = (window as any).DeskillzBridge?.getInstance?.()?.getConfig?.()?.gameId
    if (typeof id === 'string' && id) return id
  } catch {
    // no bridge on this page -- fall through to the link's own game id
  }
  return origin.gameId ?? null
}

/** The site page a launch origin returns to. */
export function deskillzReturnUrl(origin: LaunchOrigin): string {
  if (origin.tournamentId) {
    return `${DESKILLZ_SITE_URL}/tournaments/${encodeURIComponent(origin.tournamentId)}`
  }
  if (origin.roomCode) return `${DESKILLZ_SITE_URL}/lobby`
  // [N621] a Quick Play match or table: back to the game's own page
  const gameId = currentGameId(origin)
  return gameId ? `${DESKILLZ_SITE_URL}/games/${encodeURIComponent(gameId)}` : `${DESKILLZ_SITE_URL}/games`
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
  // [N655] D-F3: same tab -- replace this page with the launching page
  setTimeout(() => {
    try { sessionStorage.removeItem(LAUNCH_SS_ORIGIN) } catch { /* storage blocked */ }
    try {
      window.location.replace(url)
    } catch { /* navigation refused -- nothing else to do */ }
  }, RETURN_DELAY_MS)
}

// =============================================================================
// [N658] D-Q7 cash-out notice + [N653-a] armed badge (plain DOM, inline styles)
// =============================================================================

const NOTICE_ID = 'dskz-cashout-notice'
const BADGE_ID = 'dskz-leaving-badge'
const OVERLAY_Z = '2147483000'

function hasDom(): boolean {
  return typeof document !== 'undefined' && !!document.body
}

/**
 * [N658] D-Q7: after an armed cash-out the game keeps its hand result on
 * screen and calls this. A bar at the bottom shows `message` (e.g. 'You
 * cashed out 1.1472 USDT (Tron)') and 'Back to Deskillz (n)'; the button, or
 * the countdown reaching 0, runs onBack once (the game passes its leave via
 * backToDeskillz). Returns a dispose that removes the bar without onBack.
 */
export function showCashOutNotice(
  message: string,
  onBack: () => void,
  seconds: number = CASH_OUT_RETURN_SECONDS,
): () => void {
  if (!hasDom()) return () => {}
  document.getElementById(NOTICE_ID)?.remove()

  const bar = document.createElement('div')
  bar.id = NOTICE_ID
  bar.setAttribute('role', 'status')
  Object.assign(bar.style, {
    position: 'fixed',
    left: '50%',
    bottom: 'max(12px, env(safe-area-inset-bottom))',
    transform: 'translateX(-50%)',
    zIndex: OVERLAY_Z,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px 14px',
    width: 'max-content',  // [N659b] left 50% caps shrink-to-fit at half the screen
    maxWidth: 'calc(100vw - 24px)',
    boxSizing: 'border-box',
    padding: '10px 14px',
    borderRadius: '14px',
    border: '1px solid rgba(34, 211, 238, 0.55)',
    background: 'rgba(10, 12, 22, 0.94)',
    boxShadow: '0 8px 28px rgba(0, 0, 0, 0.55)',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  } as Partial<CSSStyleDeclaration>)

  const text = document.createElement('span')
  text.textContent = message
  Object.assign(text.style, { fontSize: '15px', fontWeight: '700', lineHeight: '1.3', textAlign: 'center' })

  const btn = document.createElement('button')
  btn.type = 'button'
  Object.assign(btn.style, {
    border: '0',
    borderRadius: '10px',
    padding: '8px 14px',
    fontSize: '14px',
    fontWeight: '700',
    color: '#ffffff',
    background: 'linear-gradient(90deg, #0891b2, #3b82f6)',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  } as Partial<CSSStyleDeclaration>)

  let left = Math.max(1, Math.floor(seconds))
  const label = () => { btn.textContent = `${BACK_TO_DESKILLZ_LABEL} (${left})` }
  label()

  let done = false
  let timer: ReturnType<typeof setInterval> | null = null
  const dispose = () => {
    done = true
    if (timer !== null) { clearInterval(timer); timer = null }
    bar.remove()
  }
  const fire = () => {
    if (done) return
    dispose()
    try { onBack() } catch (err) { console.warn('[showCashOutNotice] back handler failed:', err) }
  }
  btn.addEventListener('click', fire)
  timer = setInterval(() => {
    left -= 1
    if (left <= 0) fire()
    else label()
  }, 1000)

  bar.appendChild(text)
  bar.appendChild(btn)
  document.body.appendChild(bar)
  return dispose
}

/**
 * [N653-a] A lasting 'Leaving after this hand' pill while a Cash Out waits
 * for the live hand (D-Q5). on = show (idempotent), off = remove. It never
 * takes a click (pointer-events none).
 */
export function setLeavingBadge(on: boolean, placement: 'top' | 'bottom' = 'top'): void {
  if (!hasDom()) return
  const existing = document.getElementById(BADGE_ID)
  if (!on) { existing?.remove(); return }
  const pill = existing ?? document.createElement('div')
  pill.id = BADGE_ID
  pill.textContent = 'Leaving after this hand'
  Object.assign(pill.style, {
    position: 'fixed',
    left: '50%',
    top: placement === 'top' ? 'max(6px, env(safe-area-inset-top))' : 'auto',
    bottom: placement === 'bottom' ? 'max(6px, env(safe-area-inset-bottom))' : 'auto',
    transform: 'translateX(-50%)',
    zIndex: OVERLAY_Z,
    pointerEvents: 'none',
    padding: '3px 12px',
    borderRadius: '999px',
    border: '1px solid rgba(245, 158, 11, 0.65)',
    background: 'rgba(30, 20, 4, 0.88)',
    color: '#fcd34d',
    fontSize: '12px',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
  } as Partial<CSSStyleDeclaration>)
  if (!existing) document.body.appendChild(pill)
}
