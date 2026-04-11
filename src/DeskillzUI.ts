// =============================================================================
// DeskillzUI.ts — packages/game-ui/src/DeskillzUI.ts
//
// UMD entry point. This is what non-React games call.
// Exposes a single global: window.DeskillzUI
//
// Usage (in any non-React game):
//
//   <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
//   <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
//   <script src="./sdk/DeskillzUI.umd.js"></script>
//
//   <div id="dsk-lobby-overlay"></div>
//
//   <script>
//     DeskillzUI.renderLobby('#dsk-lobby-overlay', {
//       gameId: 'YOUR_GAME_ID',
//       apiUrl: 'https://api.deskillz.games',
//       token: DeskillzBridge.getInstance().getToken(),
//       onMatchStart: (matchData) => {
//         document.getElementById('dsk-lobby-overlay').style.display = 'none'
//         startGame(matchData)
//       },
//       onClose: () => {
//         document.getElementById('dsk-lobby-overlay').style.display = 'none'
//       }
//     })
//   </script>
// =============================================================================

import './tokens/colors.css'
import React from 'react'
import { createRoot, Root } from 'react-dom/client'
import LobbyOverlay, { LobbyConfig } from './LobbyOverlay'
import type { QuickPlayLaunchData } from './bridge-types'

// Track mounted React roots so we can unmount/remount cleanly
const roots = new Map<Element, Root>()

/**
 * Mount the Deskillz lobby overlay into a DOM element.
 *
 * @param selector  CSS selector or DOM element (e.g. '#dsk-lobby-overlay')
 * @param config    Lobby configuration
 */
function renderLobby(
  selector: string | Element,
  config: LobbyConfig,
): void {
  const container =
    typeof selector === 'string'
      ? document.querySelector(selector)
      : selector

  if (!container) {
    console.error(`[DeskillzUI] renderLobby: element not found — "${selector}"`)
    return
  }

  // Unmount any existing root in this container
  const existingRoot = roots.get(container)
  if (existingRoot) {
    existingRoot.unmount()
    roots.delete(container)
  }

  const root = createRoot(container)
  roots.set(container, root)
  root.render(React.createElement(LobbyOverlay, { config }))
}

/**
 * Unmount the lobby from a container.
 * Call this when the game session ends and the lobby is no longer needed.
 */
function unmountLobby(selector: string | Element): void {
  const container =
    typeof selector === 'string'
      ? document.querySelector(selector)
      : selector

  if (!container) return

  const root = roots.get(container)
  if (root) {
    root.unmount()
    roots.delete(container)
  }
}

/**
 * Show the lobby overlay (if it was hidden via CSS display:none).
 */
function showLobby(selector: string | Element): void {
  const el =
    typeof selector === 'string'
      ? (document.querySelector(selector) as HTMLElement | null)
      : (selector as HTMLElement)
  if (el) el.style.display = 'block'
}

/**
 * Hide the lobby overlay.
 * Call this when a match starts and the game canvas should take over.
 */
function hideLobby(selector: string | Element): void {
  const el =
    typeof selector === 'string'
      ? (document.querySelector(selector) as HTMLElement | null)
      : (selector as HTMLElement)
  if (el) el.style.display = 'none'
}

// =============================================================================
// VERSION
// =============================================================================

const version = '3.0.0'

// =============================================================================
// EXPORTS
// =============================================================================

// Named exports for ES module consumers (React games importing as a package)
export { renderLobby, unmountLobby, showLobby, hideLobby, version }
export type { LobbyConfig, QuickPlayLaunchData }
export { default as LobbyOverlay } from './LobbyOverlay'
export { default as TournamentCard } from './components/tournaments/TournamentCard'
export { default as QuickPlayCard } from './components/tournaments/QuickPlayCard'
export { useEnrollmentStatus } from './hooks/useEnrollmentStatus'
export { useQuickPlayQueue } from './hooks/useQuickPlayQueue'
export type { TournamentCardProps } from './components/tournaments/TournamentCard'
export type { QuickPlayCardProps } from './components/tournaments/QuickPlayCard'
export type { QuickPlayStatus, QuickPlayQueueState } from './hooks/useQuickPlayQueue'

// Default export — the full DeskillzUI namespace for UMD consumers
// window.DeskillzUI.renderLobby(...)
const DeskillzUI = {
  renderLobby,
  unmountLobby,
  showLobby,
  hideLobby,
  version,
}

export default DeskillzUI
