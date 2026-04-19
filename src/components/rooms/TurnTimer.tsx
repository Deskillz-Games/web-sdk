// =============================================================================
// TurnTimer.tsx -- packages/game-ui/src/components/rooms/TurnTimer.tsx
//
// Visual countdown timer for player turns in social games.
// Includes: circular SVG timer, compact pill variant, fullscreen overlay,
// and useTurnTimer hook for client-side countdown.
// No bridge dependency -- pure props-in/JSX-out.
//
// GAP 20 (Path B, Batch 4b): This SDK file is now the single source of truth.
// Main app imports via '@sdk/components/rooms/TurnTimer' alias.
// Previous main-app copy deleted (was cosmetic drift only -- same hooks,
// same logic, same JSX structure).
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Pause } from 'lucide-react'
import { cn } from '../../utils'

// =============================================================================
// TYPES
// =============================================================================

export interface TurnTimerProps {
  totalSeconds: number
  remainingSeconds: number
  isMyTurn: boolean
  isRunning: boolean
  isPaused?: boolean
  currentPlayerName?: string
  onTimeExpired?: () => void
  warningThreshold?: number
  criticalThreshold?: number
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_WARNING_THRESHOLD = 10
const DEFAULT_CRITICAL_THRESHOLD = 5

// =============================================================================
// MAIN COMPONENT (circular SVG timer)
// =============================================================================

export default function TurnTimer({
  totalSeconds,
  remainingSeconds,
  isMyTurn,
  isRunning,
  isPaused = false,
  currentPlayerName,
  onTimeExpired,
  warningThreshold = DEFAULT_WARNING_THRESHOLD,
  criticalThreshold = DEFAULT_CRITICAL_THRESHOLD,
  size = 'md',
  className,
}: TurnTimerProps) {
  const [hasExpired, setHasExpired] = useState(false)
  const prevRemainingRef = useRef(remainingSeconds)

  const progressPercent = (remainingSeconds / totalSeconds) * 100
  const urgencyState =
    remainingSeconds <= criticalThreshold ? 'critical' :
    remainingSeconds <= warningThreshold ? 'warning' : 'normal'

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`
  }

  useEffect(() => {
    if (remainingSeconds <= 0 && !hasExpired && isRunning) {
      setHasExpired(true)
      onTimeExpired?.()
    }
    if (remainingSeconds > prevRemainingRef.current) {
      setHasExpired(false)
    }
    prevRemainingRef.current = remainingSeconds
  }, [remainingSeconds, hasExpired, isRunning, onTimeExpired])

  const sizeConfig = {
    sm: { container: 'h-12 w-24', circle: 'w-10 h-10', strokeWidth: 3, textSize: 'text-sm', labelSize: 'text-xs' },
    md: { container: 'h-16 w-32', circle: 'w-14 h-14', strokeWidth: 4, textSize: 'text-lg', labelSize: 'text-xs' },
    lg: { container: 'h-24 w-48', circle: 'w-20 h-20', strokeWidth: 5, textSize: 'text-2xl', labelSize: 'text-sm' },
  }

  const cfg = sizeConfig[size]
  const radius = size === 'sm' ? 18 : size === 'md' ? 24 : 36
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - progressPercent / 100)

  return (
    <div className={cn('flex items-center gap-3', cfg.container, className)}>
      <div className="relative">
        <svg
          className={cn(cfg.circle, 'transform -rotate-90')}
          viewBox={`0 0 ${(radius + cfg.strokeWidth) * 2} ${(radius + cfg.strokeWidth) * 2}`}
        >
          <circle
            cx={radius + cfg.strokeWidth}
            cy={radius + cfg.strokeWidth}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={cfg.strokeWidth}
            className="text-gray-800"
          />
          <motion.circle
            cx={radius + cfg.strokeWidth}
            cy={radius + cfg.strokeWidth}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={cfg.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: 0 }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.3, ease: 'linear' }}
            className={cn(
              urgencyState === 'critical' && 'text-red-500',
              urgencyState === 'warning' && 'text-amber-500',
              urgencyState === 'normal' && (isMyTurn ? 'text-cyan-500' : 'text-purple-500'),
            )}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {isPaused ? (
            <Pause className={cn('text-gray-400', size === 'sm' ? 'w-4 h-4' : size === 'md' ? 'w-5 h-5' : 'w-7 h-7')} />
          ) : (
            <span
              className={cn(
                'font-bold font-mono', cfg.textSize,
                urgencyState === 'critical' && 'text-red-400 animate-pulse',
                urgencyState === 'warning' && 'text-amber-400',
                urgencyState === 'normal' && 'text-white',
              )}
            >
              {formatTime(remainingSeconds)}
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col justify-center min-w-0">
        <span className={cn('font-medium truncate', cfg.labelSize, isMyTurn ? 'text-cyan-400' : 'text-gray-400')}>
          {isPaused ? 'Paused' : isMyTurn ? 'Your Turn' : currentPlayerName || 'Waiting...'}
        </span>
        {!isPaused && urgencyState !== 'normal' && isMyTurn && (
          <span className={cn('text-xs', urgencyState === 'critical' ? 'text-red-400' : 'text-amber-400')}>
            {urgencyState === 'critical' ? 'Hurry!' : 'Time running out'}
          </span>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// COMPACT TIMER (pill badge for tight spaces)
// =============================================================================

export interface CompactTurnTimerProps {
  remainingSeconds: number
  totalSeconds: number
  isMyTurn: boolean
  isPaused?: boolean
  warningThreshold?: number
  criticalThreshold?: number
  className?: string
}

export function CompactTurnTimer({
  remainingSeconds,
  totalSeconds,
  isMyTurn,
  isPaused = false,
  warningThreshold = DEFAULT_WARNING_THRESHOLD,
  criticalThreshold = DEFAULT_CRITICAL_THRESHOLD,
  className,
}: CompactTurnTimerProps) {
  const progressPercent = (remainingSeconds / totalSeconds) * 100
  const urgencyState =
    remainingSeconds <= criticalThreshold ? 'critical' :
    remainingSeconds <= warningThreshold ? 'warning' : 'normal'

  return (
    <div
      className={cn(
        'flex items-center gap-2 px-3 py-1.5 rounded-full border',
        urgencyState === 'critical' && 'bg-red-500/20 border-red-500/50',
        urgencyState === 'warning' && 'bg-amber-500/20 border-amber-500/50',
        urgencyState === 'normal' && (isMyTurn ? 'bg-cyan-500/20 border-cyan-500/50' : 'bg-gray-800 border-gray-700'),
        className,
      )}
    >
      {isPaused ? (
        <Pause className="w-3 h-3 text-gray-400" />
      ) : (
        <Clock
          className={cn(
            'w-3 h-3',
            urgencyState === 'critical' && 'text-red-400 animate-pulse',
            urgencyState === 'warning' && 'text-amber-400',
            urgencyState === 'normal' && (isMyTurn ? 'text-cyan-400' : 'text-gray-400'),
          )}
        />
      )}
      <span
        className={cn(
          'text-sm font-mono font-bold',
          urgencyState === 'critical' && 'text-red-400',
          urgencyState === 'warning' && 'text-amber-400',
          urgencyState === 'normal' && 'text-white',
        )}
      >
        {remainingSeconds}s
      </span>
      <div className="w-12 h-1 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={cn(
            'h-full rounded-full',
            urgencyState === 'critical' && 'bg-red-500',
            urgencyState === 'warning' && 'bg-amber-500',
            urgencyState === 'normal' && (isMyTurn ? 'bg-cyan-500' : 'bg-purple-500'),
          )}
          initial={{ width: '100%' }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  )
}

// =============================================================================
// FULLSCREEN TIMER OVERLAY (last 5 seconds dramatic effect)
// =============================================================================

export interface TimerOverlayProps {
  remainingSeconds: number
  isVisible: boolean
  onDismiss?: () => void
}

export function TimerOverlay({ remainingSeconds, isVisible, onDismiss }: TimerOverlayProps) {
  if (!isVisible || remainingSeconds > 5) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
        onClick={onDismiss}
      >
        <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="relative">
          <motion.div
            className="absolute inset-0 bg-red-500/20 rounded-full blur-3xl"
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 200, height: 200, margin: -50 }}
          />
          <motion.span
            className="text-9xl font-bold text-red-500 drop-shadow-2xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
          >
            {remainingSeconds}
          </motion.span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// =============================================================================
// HOOK: useTurnTimer (client-side countdown)
// =============================================================================

export interface UseTurnTimerOptions {
  totalSeconds: number
  isMyTurn: boolean
  isPaused?: boolean
  onWarning?: () => void
  onCritical?: () => void
  onExpired?: () => void
  warningThreshold?: number
  criticalThreshold?: number
}

export function useTurnTimer({
  totalSeconds,
  isPaused = false,
  onWarning,
  onCritical,
  onExpired,
  warningThreshold = DEFAULT_WARNING_THRESHOLD,
  criticalThreshold = DEFAULT_CRITICAL_THRESHOLD,
}: UseTurnTimerOptions) {
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const hasWarnedRef = useRef(false)
  const hasCriticalRef = useRef(false)

  const startTimer = useCallback(() => {
    setRemainingSeconds(totalSeconds)
    setIsRunning(true)
    hasWarnedRef.current = false
    hasCriticalRef.current = false
  }, [totalSeconds])

  const stopTimer = useCallback(() => {
    setIsRunning(false)
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null }
  }, [])

  const resetTimer = useCallback(() => {
    stopTimer()
    setRemainingSeconds(totalSeconds)
    hasWarnedRef.current = false
    hasCriticalRef.current = false
  }, [totalSeconds, stopTimer])

  useEffect(() => {
    if (isRunning && !isPaused && remainingSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          const v = prev - 1
          if (v === warningThreshold && !hasWarnedRef.current) { hasWarnedRef.current = true; onWarning?.() }
          if (v === criticalThreshold && !hasCriticalRef.current) { hasCriticalRef.current = true; onCritical?.() }
          if (v <= 0) { onExpired?.(); return 0 }
          return v
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, isPaused, remainingSeconds, warningThreshold, criticalThreshold, onWarning, onCritical, onExpired])

  return {
    remainingSeconds,
    isRunning,
    progressPercent: (remainingSeconds / totalSeconds) * 100,
    urgencyState:
      remainingSeconds <= criticalThreshold ? 'critical' as const :
      remainingSeconds <= warningThreshold ? 'warning' as const : 'normal' as const,
    startTimer,
    stopTimer,
    resetTimer,
    setRemainingSeconds,
  }
}

export { DEFAULT_WARNING_THRESHOLD, DEFAULT_CRITICAL_THRESHOLD }