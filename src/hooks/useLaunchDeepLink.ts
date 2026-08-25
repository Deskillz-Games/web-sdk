// =============================================================================
// useLaunchDeepLink -- packages/game-ui/src/hooks/useLaunchDeepLink.ts
//
// N46: one shared implementation of the "main app launched me" flow so the
// six standalone games stop carrying their own (drifting) copies in App.tsx.
//
// The main site opens a game as:
//   <pwaUrl>?matchId=<MatchSession.id>&token=<single-use launch token>
//            &tournamentId=<id>&round=<n>&table=<n>
// or, for private rooms, <pwaUrl>?roomCode=<code>&token=...
//
// Contract:
//   1. captureLaunchParams() runs at MODULE LOAD of the game's App.tsx (before
//      any router mounts). It stashes matchId / tournamentId / roomCode into
//      sessionStorage and scrubs THOSE from the URL. It NEVER touches ?token=:
//      DeskillzBridge.initialize() -> consumeSSOToken() exchanges that token
//      for a game-scoped session and scrubs it itself. Stripping it first
//      (the pre-N46 bug) left the player as Guest.
//   2. useLaunchDeepLink({ navigate, isAuthenticated }) runs inside the
//      router. Once the bridge reports an authenticated session it performs
//      the navigation the game expects:
//        - matchId  -> navigate('/game', { state: { mode: 'tournament',
//                       matchData: { matchId, tournamentId }, fromDeepLink } })
//        - roomCode -> bridge.joinRoom(roomCode) then navigate('/rooms/<id>')
//      Games can override paths / state via options.
//
// Usage (App.tsx):
//   import { captureLaunchParams, useLaunchDeepLink } from '@deskillz/game-ui'
//   captureLaunchParams()                       // module level, once
//   ...
//   function AppRoutes() {
//     const navigate = useNavigate()
//     const bridge = DeskillzBridge.getInstance()
//     useLaunchDeepLink({ navigate, isAuthenticated: bridge.getIsAuthenticated() })
//     ...
//   }
// =============================================================================

import { useEffect, useRef } from 'react'

export const LAUNCH_SS_MATCH_ID      = 'deskillz_pending_matchId'
export const LAUNCH_SS_TOURNAMENT_ID = 'deskillz_pending_tournamentId'
export const LAUNCH_SS_ROOM_CODE     = 'deskillz_pending_roomCode'
// Kept only so games that still reference the old key keep compiling; it is
// never written any more (the launch token stays in the URL for the bridge).
export const LAUNCH_SS_MATCH_TOKEN   = 'deskillz_pending_matchToken'

export interface LaunchParams {
  matchId: string | null
  tournamentId: string | null
  roomCode: string | null
}

/** Read stashed params without consuming them. */
export function peekLaunchParams(): LaunchParams {
  try {
    return {
      matchId:      sessionStorage.getItem(LAUNCH_SS_MATCH_ID),
      tournamentId: sessionStorage.getItem(LAUNCH_SS_TOURNAMENT_ID),
      roomCode:     sessionStorage.getItem(LAUNCH_SS_ROOM_CODE),
    }
  } catch {
    return { matchId: null, tournamentId: null, roomCode: null }
  }
}

/** Remove stashed params (called after a successful navigate). */
export function clearLaunchParams(): void {
  try {
    sessionStorage.removeItem(LAUNCH_SS_MATCH_ID)
    sessionStorage.removeItem(LAUNCH_SS_TOURNAMENT_ID)
    sessionStorage.removeItem(LAUNCH_SS_ROOM_CODE)
    sessionStorage.removeItem(LAUNCH_SS_MATCH_TOKEN)
  } catch {
    // sessionStorage unavailable -- nothing to clear
  }
}

/**
 * Stash deep-link params from the current URL and scrub them, leaving
 * ?token= untouched for DeskillzBridge.consumeSSOToken(). Safe to call more
 * than once; a no-op when none of the params are present.
 */
export function captureLaunchParams(): LaunchParams {
  const empty: LaunchParams = { matchId: null, tournamentId: null, roomCode: null }
  if (typeof window === 'undefined' || !window.location) return empty
  try {
    const params = new URLSearchParams(window.location.search)
    const matchId      = params.get('matchId')
    const tournamentId = params.get('tournamentId')
    const roomCode     = params.get('roomCode')
    if (!matchId && !tournamentId && !roomCode) return peekLaunchParams()

    if (matchId)      sessionStorage.setItem(LAUNCH_SS_MATCH_ID, matchId)
    if (tournamentId) sessionStorage.setItem(LAUNCH_SS_TOURNAMENT_ID, tournamentId)
    if (roomCode)     sessionStorage.setItem(LAUNCH_SS_ROOM_CODE, roomCode)

    // Scrub what we consumed. round / table / gameplayMode / gameRuleVariant
    // and token are left for the bridge / game to read.
    params.delete('matchId')
    params.delete('tournamentId')
    params.delete('roomCode')
    const cleaned =
      window.location.pathname +
      (params.toString() ? `?${params.toString()}` : '') +
      window.location.hash
    try { window.history.replaceState({}, '', cleaned) } catch { /* non-fatal */ }

    return { matchId, tournamentId, roomCode }
  } catch {
    return empty
  }
}

export interface UseLaunchDeepLinkOptions {
  /** react-router navigate (or any (path, opts) => void). */
  navigate: (path: string, opts?: { state?: any; replace?: boolean }) => void
  /** Bridge auth state; the hook waits until this is true. */
  isAuthenticated: boolean
  /** Route for tournament matches. Default '/game'. */
  gamePath?: string
  /** Route builder for private rooms. Default (id) => `/rooms/${id}`. */
  roomPath?: (roomId: string) => string
  /** Mode value GameScreen expects for tournament play. Default 'tournament'. */
  tournamentMode?: string
  /** Extra fields merged into matchData. */
  extraMatchData?: Record<string, unknown>
  /** Optional hook for games that want to observe / veto the navigation. */
  onBeforeNavigate?: (params: LaunchParams) => boolean | void
}

function getBridge(): any {
  try {
    return (window as any).DeskillzBridge?.getInstance?.() ?? null
  } catch {
    return null
  }
}

/**
 * Perform the deferred deep-link navigation once the bridge is authenticated.
 * Runs at most once per page load.
 */
export function useLaunchDeepLink(options: UseLaunchDeepLinkOptions): void {
  const {
    navigate,
    isAuthenticated,
    gamePath = '/game',
    roomPath = (id: string) => `/rooms/${id}`,
    tournamentMode = 'tournament',
    extraMatchData,
    onBeforeNavigate,
  } = options
  const done = useRef(false)

  useEffect(() => {
    if (done.current || !isAuthenticated) return
    const params = peekLaunchParams()
    if (!params.matchId && !params.roomCode) return
    if (onBeforeNavigate && onBeforeNavigate(params) === false) return
    done.current = true

    if (params.matchId) {
      clearLaunchParams()
      navigate(gamePath, {
        state: {
          mode: tournamentMode,
          matchData: {
            matchId:      params.matchId,
            tournamentId: params.tournamentId ?? undefined,
            ...(extraMatchData ?? {}),
          },
          fromDeepLink: true,
        },
      })
      return
    }

    const bridge = getBridge()
    const roomCode = params.roomCode as string
    clearLaunchParams()
    if (!bridge?.joinRoom) return
    bridge
      .joinRoom(roomCode)
      .then((room: any) => {
        const id = room?.id ?? room?.roomId
        if (id) navigate(roomPath(String(id)))
      })
      .catch((err: any) => {
        console.warn('[LaunchDeepLink] Auto-join room failed:', err?.message ?? err)
      })
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps
}