// =============================================================================
// CashOutModal.tsx -- packages/game-ui/src/components/rooms/CashOutModal.tsx
//
// Modal for leaving a social game room and cashing out remaining balance.
// Shared across all standalone social games (Big 2, Mahjong, etc.)
// Uses standard Tailwind, lucide-react, framer-motion (already in game deps).
// No bridge dependency -- pure props-in/JSX-out display component.
//
// GAP 20 (Path B, Batch 4a): This SDK file is now the single source of truth.
// Main app imports via '@sdk/components/rooms/CashOutModal' alias.
// Previous main-app copy deleted. Strict err: unknown error handling ported
// up from the main-app copy for improved TypeScript safety.
// =============================================================================

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Coins,
  LogOut,
  AlertTriangle,
  Loader2,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle2,
} from 'lucide-react'
import { cn } from '../../utils'

// =============================================================================
// TYPES
// =============================================================================

export interface CashOutStats {
  currentBalance: number    // Current point balance
  totalBuyIn: number        // Total amount bought in (USD)
  pointValueUsd: number     // USD per point
  roundsPlayed: number
  roundsWon: number
  rakePaid: number          // Total rake paid (USD)
  biggestWin: number        // Biggest single win (points)
  biggestLoss: number       // Biggest single loss (points)
}

export interface CashOutModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => Promise<void>
  stats: CashOutStats
  roomName: string
  isRoundInProgress?: boolean
  entryCurrency: string
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function CashOutModal({
  isOpen,
  onClose,
  onConfirm,
  stats,
  roomName,
  isRoundInProgress = false,
  entryCurrency,
}: CashOutModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cashOutValueUsd = useMemo(() => {
    return stats.currentBalance * stats.pointValueUsd
  }, [stats.currentBalance, stats.pointValueUsd])

  const netProfitLoss = useMemo(() => {
    return cashOutValueUsd - stats.totalBuyIn
  }, [cashOutValueUsd, stats.totalBuyIn])

  const winRate = useMemo(() => {
    if (stats.roundsPlayed === 0) return 0
    return (stats.roundsWon / stats.roundsPlayed) * 100
  }, [stats.roundsPlayed, stats.roundsWon])

  const handleConfirm = useCallback(async () => {
    if (isRoundInProgress) {
      setError('Please wait for the current round to finish before leaving.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await onConfirm()
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      setError(error.response?.data?.message || error.message || 'Cash out failed. Please try again.')
      setIsSubmitting(false)
    }
  }, [isRoundInProgress, onConfirm])

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setError(null)
      onClose()
    }
  }, [isSubmitting, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/70 backdrop-blur-sm"
          onClick={handleClose}
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#12121a] border border-gray-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                <LogOut className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Cash Out & Leave</h2>
                <p className="text-xs text-gray-500">{roomName}</p>
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
            {/* Round In Progress Warning */}
            {isRoundInProgress && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Round In Progress</p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    Please wait for the current round to finish before leaving.
                    You cannot cash out mid-round.
                  </p>
                </div>
              </div>
            )}

            {/* Cash Out Amount */}
            <div className="p-6 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-xl border border-cyan-500/30">
              <p className="text-sm text-gray-400 mb-2">You will receive</p>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold text-white">
                  ${cashOutValueUsd.toFixed(2)}
                </span>
                <span className="text-lg text-gray-400">{entryCurrency}</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Coins className="w-4 h-4 text-yellow-400" />
                <span className="text-sm text-gray-400">
                  {stats.currentBalance.toLocaleString()} points @ ${stats.pointValueUsd.toFixed(2)}/pt
                </span>
              </div>
            </div>

            {/* Profit/Loss Summary */}
            <div
              className={cn(
                'p-4 rounded-xl border',
                netProfitLoss >= 0
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30',
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {netProfitLoss >= 0 ? (
                    <TrendingUp className="w-5 h-5 text-green-400" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-400" />
                  )}
                  <span className="text-sm text-gray-300">
                    {netProfitLoss >= 0 ? 'Net Profit' : 'Net Loss'}
                  </span>
                </div>
                <span
                  className={cn(
                    'text-xl font-bold',
                    netProfitLoss >= 0 ? 'text-green-400' : 'text-red-400',
                  )}
                >
                  {netProfitLoss >= 0 ? '+' : '-'}${Math.abs(netProfitLoss).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Session Stats */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Session Summary</p>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-[#1a1a2e] rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Total Buy-in</p>
                  <p className="text-lg font-bold text-white">${stats.totalBuyIn.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-[#1a1a2e] rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Rake Paid</p>
                  <p className="text-lg font-bold text-amber-400">${stats.rakePaid.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-[#1a1a2e] rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Rounds Played</p>
                  <p className="text-lg font-bold text-white">{stats.roundsPlayed}</p>
                </div>
                <div className="p-3 bg-[#1a1a2e] rounded-lg border border-gray-800">
                  <p className="text-xs text-gray-500">Win Rate</p>
                  <p
                    className={cn(
                      'text-lg font-bold',
                      winRate >= 50 ? 'text-green-400' : 'text-gray-400',
                    )}
                  >
                    {winRate.toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>

            {/* Best/Worst Rounds */}
            {(stats.biggestWin > 0 || stats.biggestLoss > 0) && (
              <div className="flex gap-3">
                {stats.biggestWin > 0 && (
                  <div className="flex-1 p-3 bg-green-500/10 rounded-lg border border-green-500/30">
                    <p className="text-xs text-green-400">Biggest Win</p>
                    <p className="text-lg font-bold text-green-400">
                      +{stats.biggestWin.toLocaleString()} pts
                    </p>
                  </div>
                )}
                {stats.biggestLoss > 0 && (
                  <div className="flex-1 p-3 bg-red-500/10 rounded-lg border border-red-500/30">
                    <p className="text-xs text-red-400">Biggest Loss</p>
                    <p className="text-lg font-bold text-red-400">
                      -{stats.biggestLoss.toLocaleString()} pts
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Confirmation Note */}
            <div className="flex items-start gap-3 p-3 bg-[#1a1a2e] rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-400">
                Your balance will be credited to your wallet immediately upon confirmation.
                You can rejoin the room later if there are open slots.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={isSubmitting}
                className="flex-1 py-3 text-gray-400 hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50"
              >
                Stay in Room
              </button>
              <button
                onClick={handleConfirm}
                disabled={isSubmitting || isRoundInProgress}
                className={cn(
                  'flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50',
                  'bg-gradient-to-r from-cyan-600 to-blue-500 hover:from-cyan-700 hover:to-blue-600',
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <LogOut className="w-4 h-4" />
                    Cash Out ${cashOutValueUsd.toFixed(2)}
                  </span>
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
// HELPER: Create default cash out stats
// =============================================================================

export function createEmptyCashOutStats(pointValueUsd: number): CashOutStats {
  return {
    currentBalance: 0,
    totalBuyIn: 0,
    pointValueUsd,
    roundsPlayed: 0,
    roundsWon: 0,
    rakePaid: 0,
    biggestWin: 0,
    biggestLoss: 0,
  }
}

// =============================================================================
// HELPER: Calculate net P/L from stats
// =============================================================================

export function calculateNetProfitLoss(stats: CashOutStats): number {
  const cashOutValue = stats.currentBalance * stats.pointValueUsd
  return cashOutValue - stats.totalBuyIn
}