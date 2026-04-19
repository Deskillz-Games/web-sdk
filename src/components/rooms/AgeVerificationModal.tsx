// =============================================================================
// AgeVerificationModal.tsx -- packages/game-ui/src/components/rooms/AgeVerificationModal.tsx
//
// Modal for verifying user is 21+ before creating/hosting social game rooms.
// Uses onVerify callback prop -- the parent calls bridge.verifyAge() or
// hostApi.verifyAge() and the modal awaits the promise.
// No direct API dependency -- pure props-in/JSX-out.
//
// Also exports a useAgeVerification() hook that accepts injected check/verify
// functions so it can be shared between standalone games (which use the
// bridge) and the main app (which uses hostApi).
//
// GAP 20 (Path B, Batch 5): This SDK file is now the single source of truth.
// Main app imports via '@sdk/components/rooms/AgeVerificationModal' alias.
// Previous main-app copy deleted. hostApi dependency was eliminated via
// dependency injection on useAgeVerification. Strict err: unknown error
// handling ported up. Completes GAP 20 -- all 9 rooms sacred files now
// live at packages/game-ui/src/components/rooms/ as single source of truth.
// =============================================================================

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Shield, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '../../utils'

// =============================================================================
// TYPES
// =============================================================================

export interface AgeVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  /** Called when user confirms age -- parent should call bridge.verifyAge() */
  onVerify: () => Promise<void>
  onDeclined?: () => void
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function AgeVerificationModal({
  isOpen,
  onClose,
  onVerify,
  onDeclined,
}: AgeVerificationModalProps) {
  const [isChecked, setIsChecked] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)

  const handleVerify = useCallback(async () => {
    if (!isChecked) {
      setError('Please confirm you are 21 years or older')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await onVerify()
      setIsVerified(true)
      // Auto-close after success animation
      setTimeout(() => onClose(), 1500)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      setError(error.response?.data?.message || error.message || 'Verification failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [isChecked, onVerify, onClose])

  const handleDecline = useCallback(() => {
    onDeclined?.()
    onClose()
  }, [onDeclined, onClose])

  const handleClose = useCallback(() => {
    if (!isSubmitting) onClose()
  }, [isSubmitting, onClose])

  if (!isOpen) return null

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
                <Shield className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Age Verification</h2>
                <p className="text-xs text-gray-500">Required to host rooms</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {isVerified ? (
              /* Success State */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-4 py-8"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8 text-green-400" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-white">Verified!</h3>
                  <p className="text-sm text-gray-400 mt-1">You can now create and host rooms.</p>
                </div>
              </motion.div>
            ) : (
              <>
                {/* Info Banner */}
                <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                  <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-300">Age Requirement</p>
                    <p className="text-xs text-amber-400/80 mt-1">
                      You must be at least 21 years old to host rooms with real-money entry fees.
                      This is a one-time verification.
                    </p>
                  </div>
                </div>

                {/* What Hosting Means */}
                <div className="p-4 bg-[#1a1a2e] rounded-xl border border-gray-800">
                  <p className="text-sm font-medium text-gray-300 mb-3">As a host, you can:</p>
                  <ul className="space-y-2 text-sm text-gray-400">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      Create private rooms for social games
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      Earn revenue share from rake collected
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      Progress through host tiers (Bronze to Elite)
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      Withdraw earnings to your crypto wallet
                    </li>
                  </ul>
                </div>

                {/* Checkbox */}
                <label className="flex items-start gap-3 cursor-pointer select-none">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => { setIsChecked(e.target.checked); setError(null) }}
                      disabled={isSubmitting}
                      className="sr-only"
                    />
                    <div
                      className={cn(
                        'w-5 h-5 rounded border-2 flex items-center justify-center transition-all',
                        isChecked
                          ? 'bg-purple-500 border-purple-500'
                          : 'border-gray-600 hover:border-gray-500',
                        isSubmitting && 'opacity-50',
                      )}
                    >
                      {isChecked && (
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-sm text-gray-300">
                    I confirm that I am at least <span className="font-bold text-white">21 years old</span> and
                    agree to the terms of the host program.
                  </span>
                </label>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleDecline}
                    disabled={isSubmitting}
                    className="flex-1 py-3 text-gray-400 hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
                  >
                    Not Now
                  </button>
                  <button
                    onClick={handleVerify}
                    disabled={!isChecked || isSubmitting}
                    className={cn(
                      'flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50',
                      'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600',
                    )}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Verifying...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <Shield className="w-4 h-4" />
                        Verify & Continue
                      </span>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// =============================================================================
// useAgeVerification -- parameterized hook shared between main app and games
// -----------------------------------------------------------------------------
// The main app injects hostApi.checkAgeVerified + hostApi.verifyAge;
// standalone games inject bridge.checkAgeVerified + bridge.verifyAge.
// LocalStorage caching is keyed by 'deskillz_age_verified' so it works across
// both environments (same key used by main app pre-GAP-20).
//
// Example (main app):
//   const { isVerified, checkVerification, markVerified } = useAgeVerification({
//     checkVerified: async () => (await hostApi.checkAgeVerified()).isVerified,
//   })
//
// Example (standalone game):
//   const bridge = DeskillzBridge.getInstance()
//   const { isVerified, checkVerification, markVerified } = useAgeVerification({
//     checkVerified: () => bridge.checkAgeVerified(),
//   })
// =============================================================================

const AGE_VERIFIED_STORAGE_KEY = 'deskillz_age_verified'

export interface UseAgeVerificationOptions {
  /** Server-side check -- returns true if current user is age verified. */
  checkVerified: () => Promise<boolean>
  /** Optional: override the localStorage key (default: 'deskillz_age_verified'). */
  storageKey?: string
}

export interface UseAgeVerificationResult {
  /** null = not yet checked; true/false = determined */
  isVerified: boolean | null
  isLoading: boolean
  /** Runs the cached-then-server check, populates isVerified. Returns the final value. */
  checkVerification: () => Promise<boolean>
  /** Marks verified locally (for post-verify-modal-success flows). */
  markVerified: () => void
}

export function useAgeVerification(
  options: UseAgeVerificationOptions,
): UseAgeVerificationResult {
  const { checkVerified, storageKey = AGE_VERIFIED_STORAGE_KEY } = options
  const [isVerified, setIsVerified] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const checkVerification = useCallback(async (): Promise<boolean> => {
    setIsLoading(true)
    try {
      // Fast path: localStorage cache hit.
      const cached = typeof window !== 'undefined'
        ? window.localStorage.getItem(storageKey)
        : null
      if (cached === 'true') {
        setIsVerified(true)
        return true
      }

      // Slow path: server check via injected function.
      const verified = await checkVerified()
      if (verified && typeof window !== 'undefined') {
        window.localStorage.setItem(storageKey, 'true')
      }
      setIsVerified(verified)
      return verified
    } catch {
      // Fail closed -- safer to re-prompt than to accidentally bypass the gate.
      setIsVerified(false)
      return false
    } finally {
      setIsLoading(false)
    }
  }, [checkVerified, storageKey])

  const markVerified = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(storageKey, 'true')
    }
    setIsVerified(true)
  }, [storageKey])

  return { isVerified, isLoading, checkVerification, markVerified }
}