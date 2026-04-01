// =============================================================================
// LowBalanceWarning.tsx -- packages/game-ui/src/components/rooms/LowBalanceWarning.tsx
//
// Warning displayed when player's balance drops to warningThreshold (default 20).
// Three urgency levels: medium (<=20pts), high (<=15pts), critical (<=10pts).
// Includes: floating toast, inline variant, and useLowBalanceDetection hook.
// No bridge dependency -- pure props-in/JSX-out.
// =============================================================================

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, RefreshCw, TrendingDown } from 'lucide-react'
import { cn } from '../../utils'

// =============================================================================
// TYPES
// =============================================================================

export interface LowBalanceWarningProps {
  currentBalance: number
  pointValueUsd: number
  warningThreshold?: number
  onRebuy: () => void
  onDismiss?: () => void
  position?: 'top' | 'bottom'
  className?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_WARNING_THRESHOLD = 20

// =============================================================================
// MAIN COMPONENT (floating toast)
// =============================================================================

export default function LowBalanceWarning({
  currentBalance,
  pointValueUsd,
  warningThreshold = DEFAULT_WARNING_THRESHOLD,
  onRebuy,
  onDismiss,
  position = 'bottom',
  className,
}: LowBalanceWarningProps) {
  const [isDismissed, setIsDismissed] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  const thresholdPoints = warningThreshold
  const thresholdUsd = thresholdPoints * pointValueUsd
  const currentValueUsd = currentBalance * pointValueUsd
  const shouldShowWarning = currentBalance > 0 && currentBalance <= thresholdPoints
  const urgencyLevel = currentBalance <= 10 ? 'critical' : currentBalance <= 15 ? 'high' : 'medium'

  useEffect(() => {
    setIsVisible(shouldShowWarning && !isDismissed)
  }, [shouldShowWarning, isDismissed])

  useEffect(() => {
    if (currentBalance > thresholdPoints) setIsDismissed(false)
  }, [currentBalance, thresholdPoints])

  const handleDismiss = useCallback(() => {
    setIsDismissed(true)
    setIsVisible(false)
    onDismiss?.()
  }, [onDismiss])

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
        className={cn(
          'fixed left-4 right-4 z-40 max-w-lg mx-auto',
          position === 'top' ? 'top-4' : 'bottom-24',
          className,
        )}
      >
        <div
          className={cn(
            'flex items-start gap-3 p-4 rounded-xl border shadow-xl backdrop-blur-sm',
            urgencyLevel === 'critical' && 'bg-red-500/20 border-red-500/50 animate-pulse',
            urgencyLevel === 'high' && 'bg-amber-500/20 border-amber-500/50',
            urgencyLevel === 'medium' && 'bg-yellow-500/15 border-yellow-500/40',
          )}
        >
          <div
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
              urgencyLevel === 'critical' && 'bg-red-500/30',
              urgencyLevel === 'high' && 'bg-amber-500/30',
              urgencyLevel === 'medium' && 'bg-yellow-500/30',
            )}
          >
            {urgencyLevel === 'critical' ? (
              <TrendingDown className="w-5 h-5 text-red-400" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-amber-400" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p
                  className={cn(
                    'text-sm font-semibold',
                    urgencyLevel === 'critical' && 'text-red-300',
                    urgencyLevel === 'high' && 'text-amber-300',
                    urgencyLevel === 'medium' && 'text-yellow-300',
                  )}
                >
                  {urgencyLevel === 'critical' ? 'Critically Low Balance!' : 'Low Balance Warning'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  You have{' '}
                  <span
                    className={cn(
                      'font-bold',
                      urgencyLevel === 'critical' && 'text-red-400',
                      urgencyLevel === 'high' && 'text-amber-400',
                      urgencyLevel === 'medium' && 'text-yellow-400',
                    )}
                  >
                    {currentBalance} points
                  </span>{' '}
                  (${currentValueUsd.toFixed(2)}) remaining.
                  {urgencyLevel === 'critical'
                    ? ' Consider rebuying now to stay in the game.'
                    : ` Warning threshold: ${thresholdPoints} pts ($${thresholdUsd.toFixed(2)}).`}
                </p>
              </div>
              {onDismiss && (
                <button onClick={handleDismiss} className="p-1 hover:bg-white/10 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              )}
            </div>

            {/* Balance Bar */}
            <div className="mt-3 mb-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Balance</span>
                <span>{currentBalance} / {thresholdPoints} pts</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${(currentBalance / thresholdPoints) * 100}%` }}
                  className={cn(
                    'h-full rounded-full',
                    urgencyLevel === 'critical' && 'bg-gradient-to-r from-red-600 to-red-400',
                    urgencyLevel === 'high' && 'bg-gradient-to-r from-amber-600 to-amber-400',
                    urgencyLevel === 'medium' && 'bg-gradient-to-r from-yellow-600 to-yellow-400',
                  )}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onRebuy}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-2 rounded-lg text-sm font-medium transition-colors',
                  urgencyLevel === 'critical'
                    ? 'bg-red-500 hover:bg-red-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-600 text-black',
                )}
              >
                <RefreshCw className="w-4 h-4" />
                Rebuy Now
              </button>
              <button
                onClick={handleDismiss}
                className="py-2 px-3 rounded-lg text-sm text-gray-400 hover:text-white transition-colors"
              >
                Later
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

// =============================================================================
// INLINE WARNING (for use inside room page, not floating)
// =============================================================================

export interface InlineLowBalanceWarningProps {
  currentBalance: number
  pointValueUsd: number
  warningThreshold?: number
  onRebuy: () => void
  className?: string
}

export function InlineLowBalanceWarning({
  currentBalance,
  pointValueUsd,
  warningThreshold = DEFAULT_WARNING_THRESHOLD,
  onRebuy,
  className,
}: InlineLowBalanceWarningProps) {
  const currentValueUsd = currentBalance * pointValueUsd

  if (currentBalance > warningThreshold || currentBalance <= 0) return null

  const urgencyLevel = currentBalance <= 10 ? 'critical' : currentBalance <= 15 ? 'high' : 'medium'

  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        urgencyLevel === 'critical' && 'bg-red-500/10 border-red-500/30',
        urgencyLevel === 'high' && 'bg-amber-500/10 border-amber-500/30',
        urgencyLevel === 'medium' && 'bg-yellow-500/10 border-yellow-500/30',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle
          className={cn(
            'w-4 h-4',
            urgencyLevel === 'critical' && 'text-red-400',
            urgencyLevel === 'high' && 'text-amber-400',
            urgencyLevel === 'medium' && 'text-yellow-400',
          )}
        />
        <span className="text-sm text-gray-300">
          <span
            className={cn(
              'font-bold',
              urgencyLevel === 'critical' && 'text-red-400',
              urgencyLevel === 'high' && 'text-amber-400',
              urgencyLevel === 'medium' && 'text-yellow-400',
            )}
          >
            {currentBalance} pts
          </span>{' '}
          (${currentValueUsd.toFixed(2)})
        </span>
      </div>
      <button
        onClick={onRebuy}
        className={cn(
          'flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-medium transition-colors',
          urgencyLevel === 'critical' && 'bg-red-500 hover:bg-red-600 text-white',
          urgencyLevel === 'high' && 'bg-amber-500 hover:bg-amber-600 text-black',
          urgencyLevel === 'medium' && 'bg-yellow-500 hover:bg-yellow-600 text-black',
        )}
      >
        <RefreshCw className="w-3 h-3" />
        Rebuy
      </button>
    </div>
  )
}

// =============================================================================
// HOOK: useLowBalanceDetection
// =============================================================================

export interface UseLowBalanceOptions {
  currentBalance: number
  pointValueUsd: number
  warningThreshold?: number
  onLowBalance?: () => void
  onCriticalBalance?: () => void
}

export function useLowBalanceDetection({
  currentBalance,
  pointValueUsd,
  warningThreshold = DEFAULT_WARNING_THRESHOLD,
  onLowBalance,
  onCriticalBalance,
}: UseLowBalanceOptions) {
  const [hasWarned, setHasWarned] = useState(false)
  const [hasCriticalWarned, setHasCriticalWarned] = useState(false)

  const isLowBalance = currentBalance > 0 && currentBalance <= warningThreshold
  const isCriticalBalance = currentBalance > 0 && currentBalance <= 10
  const balanceUsd = currentBalance * pointValueUsd

  useEffect(() => {
    if (isLowBalance && !hasWarned) {
      setHasWarned(true)
      onLowBalance?.()
    }
    if (isCriticalBalance && !hasCriticalWarned) {
      setHasCriticalWarned(true)
      onCriticalBalance?.()
    }
    if (currentBalance > warningThreshold) {
      setHasWarned(false)
      setHasCriticalWarned(false)
    }
  }, [currentBalance, warningThreshold, isLowBalance, isCriticalBalance, hasWarned, hasCriticalWarned, onLowBalance, onCriticalBalance])

  return {
    isLowBalance,
    isCriticalBalance,
    balanceUsd,
    warningThreshold,
    thresholdUsd: warningThreshold * pointValueUsd,
  }
}

export { DEFAULT_WARNING_THRESHOLD }