// =============================================================================
// RejoinModal.tsx -- packages/game-ui/src/components/rooms/RejoinModal.tsx
//
// Shared rejoin-on-crash prompt for both esport and social standalone games.
// Fires when DeskillzBridge detects an active in-match session post-auth
// (GAP 9, v3.4.12 'roomReconnect' event -- see DeskillzBridge.ts).
//
// The event payload embeds a fresh launchToken + deepLink, so on confirm the
// game only needs to navigate to the deepLink -- no extra API call.
//
// USAGE (standalone game root, main.tsx / App.tsx):
//
//   import { RejoinModal, useRejoinModal } from '@deskillz/game-ui'
//   import { DeskillzBridge } from './sdk/DeskillzBridge'
//
//   function App() {
//     const bridge = DeskillzBridge.getInstance()
//     const rejoin = useRejoinModal({ bridge })
//     return (
//       <>
//         <Routes>...</Routes>
//         <RejoinModal {...rejoin} />
//       </>
//     )
//   }
//
// The hook subscribes to 'roomReconnect' on mount, unsubscribes on unmount,
// and exposes imperative recheck() for on-demand "Resume last game" buttons.
//
// No direct bridge-instance import inside this file -- dependency-injected via
// `bridge` prop (same pattern as useAgeVerification). Keeps SDK decoupled from
// any specific bridge singleton wiring.
// =============================================================================

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, RotateCcw, Loader2, GamepadIcon } from 'lucide-react'
import { cn } from '../../utils'

// =============================================================================
// TYPES
// =============================================================================

/**
 * Matches DeskillzBridge.ts ActiveSessionPayload (v3.4.12, GAP 9).
 * Kept structurally compatible so games that import from either place see
 * the same shape.
 */
export interface RejoinSessionPayload {
  roomId: string
  roomCode: string
  roomName: string
  gameCategory?: 'ESPORTS' | 'SOCIAL'
  gameId: string
  gameName: string
  deepLink: string
  launchToken: string
  tokenExpiresAt: string
  isReissued: boolean
}

/**
 * Minimal bridge surface this modal needs. Matches the DeskillzBridge public
 * API but typed narrowly so consumers only have to inject a compatible object
 * (useful for tests / storybooks / mocks).
 */
export interface RejoinBridgeLike {
  on: (
    event: 'roomReconnect',
    handler: (payload: RejoinSessionPayload) => void,
  ) => () => void
  getActiveSession?: () => Promise<RejoinSessionPayload | null>
}

export interface RejoinModalProps {
  /** Session payload to display. null/undefined hides the modal. */
  payload: RejoinSessionPayload | null
  /** Called when user confirms. Receives the deep link to navigate to. */
  onConfirm: (deepLink: string) => void | Promise<void>
  /** Called when user dismisses (X or "Not now"). */
  onDismiss: () => void
  /**
   * Optional: override copy per game category. Default strings work for both
   * esport and social -- this is a customization hook, not a requirement.
   */
  copy?: Partial<RejoinModalCopy>
}

export interface RejoinModalCopy {
  title: string
  subtitle: string
  description: (payload: RejoinSessionPayload) => string
  confirmLabel: string
  dismissLabel: string
}

export interface UseRejoinModalOptions {
  /** DeskillzBridge instance (or any object conforming to RejoinBridgeLike). */
  bridge: RejoinBridgeLike
  /**
   * Optional custom navigation on confirm. Default: sets window.location.href
   * to the deep link. Override if your game uses react-router navigate().
   */
  onNavigate?: (deepLink: string) => void
}

export interface UseRejoinModalResult {
  payload: RejoinSessionPayload | null
  onConfirm: (deepLink: string) => void
  onDismiss: () => void
  /** Imperatively re-check for active session (e.g. "Resume last game" button). */
  recheck: () => Promise<RejoinSessionPayload | null>
  isChecking: boolean
}

// =============================================================================
// DEFAULT COPY
// =============================================================================

const DEFAULT_COPY: RejoinModalCopy = {
  title: 'Rejoin Game?',
  subtitle: 'You have a match in progress',
  description: (p) =>
    p.gameCategory === 'SOCIAL'
      ? `Your cash game "${p.roomName}" in ${p.gameName} is still running. Rejoin to continue playing.`
      : `Your match "${p.roomName}" in ${p.gameName} is still in progress. Rejoin to continue.`,
  confirmLabel: 'Rejoin Now',
  dismissLabel: 'Not Now',
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function RejoinModal({
  payload,
  onConfirm,
  onDismiss,
  copy,
}: RejoinModalProps) {
  const [isConfirming, setIsConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const mergedCopy: RejoinModalCopy = {
    ...DEFAULT_COPY,
    ...copy,
  }

  const handleConfirm = useCallback(async () => {
    if (!payload || isConfirming) return
    setIsConfirming(true)
    setError(null)
    try {
      await onConfirm(payload.deepLink)
    } catch (err: unknown) {
      const e = err as { message?: string }
      setError(e.message || 'Failed to rejoin. Please try again.')
      setIsConfirming(false)
    }
  }, [payload, isConfirming, onConfirm])

  const handleDismiss = useCallback(() => {
    if (isConfirming) return
    onDismiss()
  }, [isConfirming, onDismiss])

  if (!payload) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#12121a] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <GamepadIcon className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{mergedCopy.title}</h2>
                <p className="text-xs text-gray-500">{mergedCopy.subtitle}</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              disabled={isConfirming}
              aria-label="Dismiss"
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-sm text-gray-300 leading-relaxed">
              {mergedCopy.description(payload)}
            </p>

            {/* Session details card */}
            <div className="p-4 bg-[#1a1a2e] rounded-xl border border-gray-800 space-y-2">
              <DetailRow label="Room" value={payload.roomName} />
              <DetailRow label="Room Code" value={payload.roomCode} mono />
              <DetailRow label="Game" value={payload.gameName} />
              {payload.gameCategory && (
                <DetailRow
                  label="Type"
                  value={payload.gameCategory === 'SOCIAL' ? 'Cash Game' : 'Esport'}
                />
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleDismiss}
                disabled={isConfirming}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl border border-gray-700 text-gray-300',
                  'hover:bg-gray-800 transition-colors font-medium text-sm',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                )}
              >
                {mergedCopy.dismissLabel}
              </button>
              <button
                onClick={handleConfirm}
                disabled={isConfirming}
                className={cn(
                  'flex-1 px-4 py-3 rounded-xl bg-purple-500 text-white',
                  'hover:bg-purple-600 transition-colors font-medium text-sm',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'flex items-center justify-center gap-2',
                )}
              >
                {isConfirming ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Rejoining...
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-4 h-4" />
                    {mergedCopy.confirmLabel}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// =============================================================================
// SMALL SUBCOMPONENT
// =============================================================================

function DetailRow({
  label,
  value,
  mono = false,
}: {
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span
        className={cn(
          'text-gray-200 font-medium',
          mono && 'font-mono tracking-wider',
        )}
      >
        {value}
      </span>
    </div>
  )
}

// =============================================================================
// HOOK -- useRejoinModal
// =============================================================================
//
// Wires the bridge 'roomReconnect' listener on mount, returns state + handlers
// ready to spread into <RejoinModal {...}>. Standalone games should only need
// to call this once at app root.
// =============================================================================

export function useRejoinModal(
  options: UseRejoinModalOptions,
): UseRejoinModalResult {
  const { bridge, onNavigate } = options
  const [payload, setPayload] = useState<RejoinSessionPayload | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  // Subscribe to bridge 'roomReconnect' event once.
  useEffect(() => {
    const unsubscribe = bridge.on('roomReconnect', (session) => {
      setPayload(session)
    })
    return unsubscribe
  }, [bridge])

  const handleConfirm = useCallback(
    (deepLink: string) => {
      // Clear modal state before navigating so the game doesn't re-show it
      // if something remounts mid-navigation.
      setPayload(null)
      if (onNavigate) {
        onNavigate(deepLink)
      } else if (typeof window !== 'undefined') {
        window.location.href = deepLink
      }
    },
    [onNavigate],
  )

  const handleDismiss = useCallback(() => {
    setPayload(null)
  }, [])

  const recheck = useCallback(async (): Promise<RejoinSessionPayload | null> => {
    if (!bridge.getActiveSession) return null
    setIsChecking(true)
    try {
      const session = await bridge.getActiveSession()
      if (session) setPayload(session)
      return session
    } catch {
      // Fail silently -- the bridge's own error handling logs it. A missing
      // session is not an error state for the modal consumer.
      return null
    } finally {
      setIsChecking(false)
    }
  }, [bridge])

  return {
    payload,
    onConfirm: handleConfirm,
    onDismiss: handleDismiss,
    recheck,
    isChecking,
  }
}