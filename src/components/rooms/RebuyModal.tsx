// =============================================================================
// RebuyModal.tsx -- packages/game-ui/src/components/rooms/RebuyModal.tsx
//
// Modal triggered when player's balance reaches 0 -- must rebuy to continue.
// Shared across all standalone social games (Big 2, Mahjong, etc.)
// Backdrop is NOT dismissible -- player must choose rebuy or leave.
// No bridge dependency -- pure props-in/JSX-out display component.
// =============================================================================

import { useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Coins,
  AlertTriangle,
  Loader2,
  Plus,
  Minus,
  LogOut,
  RefreshCw,
} from 'lucide-react'
import { cn } from '../../utils'

// =============================================================================
// TYPES
// =============================================================================

export interface RebuyConfig {
  pointValueUsd: number
  minBuyIn: number          // USD (50x point value)
  defaultBuyIn: number      // USD (100x point value)
  maxBuyIn: number | null   // null = unlimited
  entryCurrency: string
  currentRebuyCount: number
}

export interface RebuyModalProps {
  isOpen: boolean
  onClose: () => void
  onRebuy: (amount: number) => Promise<void>
  onLeaveRoom: () => void
  config: RebuyConfig
  roomName: string
  walletBalance?: number
  currencySymbol?: string
}

// =============================================================================
// CONSTANTS
// =============================================================================

const QUICK_REBUY_MULTIPLIERS = [50, 100, 200, 500]

// =============================================================================
// COMPONENT
// =============================================================================

export default function RebuyModal({
  isOpen,
  onClose,
  onRebuy,
  onLeaveRoom,
  config,
  roomName,
  walletBalance = 0,
  currencySymbol = '$',
}: RebuyModalProps) {
  const [rebuyAmount, setRebuyAmount] = useState<number>(config.defaultBuyIn)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const pointsReceived = useMemo(() => {
    return Math.floor(rebuyAmount / config.pointValueUsd)
  }, [rebuyAmount, config.pointValueUsd])

  const hasSufficientBalance = useMemo(() => {
    return walletBalance >= rebuyAmount
  }, [walletBalance, rebuyAmount])

  const isValidAmount = useMemo(() => {
    if (rebuyAmount < config.minBuyIn) return false
    if (config.maxBuyIn !== null && rebuyAmount > config.maxBuyIn) return false
    return true
  }, [rebuyAmount, config.minBuyIn, config.maxBuyIn])

  const handleAmountChange = useCallback((value: string) => {
    const numValue = parseFloat(value)
    setRebuyAmount(isNaN(numValue) ? 0 : numValue)
    setError(null)
  }, [])

  const handleQuickRebuy = useCallback((multiplier: number) => {
    setRebuyAmount(config.pointValueUsd * multiplier)
    setError(null)
  }, [config.pointValueUsd])

  const handleIncrement = useCallback(() => {
    setRebuyAmount((prev) => prev + config.pointValueUsd * 10)
  }, [config.pointValueUsd])

  const handleDecrement = useCallback(() => {
    setRebuyAmount((prev) => Math.max(config.minBuyIn, prev - config.pointValueUsd * 10))
  }, [config.pointValueUsd, config.minBuyIn])

  const handleRebuy = useCallback(async () => {
    if (!isValidAmount) {
      setError(`Amount must be at least $${config.minBuyIn.toFixed(2)}`)
      return
    }
    if (!hasSufficientBalance) {
      setError('Insufficient balance. Please deposit funds first.')
      return
    }
    setIsSubmitting(true)
    setError(null)
    try {
      await onRebuy(rebuyAmount)
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Rebuy failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [isValidAmount, hasSufficientBalance, rebuyAmount, config.minBuyIn, onRebuy])

  const handleLeave = useCallback(() => {
    onLeaveRoom()
    onClose()
  }, [onLeaveRoom, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop -- NOT dismissible since this is a required action */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[#12121a] border border-red-500/30 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800 bg-red-500/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Out of Points!</h2>
                <p className="text-xs text-gray-500">{roomName}</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Alert Banner */}
            <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-red-300">Your balance is zero</p>
                <p className="text-xs text-red-400/80 mt-1">
                  You must rebuy to continue playing or leave the room.
                  The game is paused until you decide.
                </p>
              </div>
            </div>

            {/* Current Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-[#1a1a2e] rounded-xl border border-gray-800 text-center">
                <p className="text-xs text-gray-500 mb-1">Current Balance</p>
                <p className="text-2xl font-bold text-red-400">0</p>
                <p className="text-xs text-gray-500">points</p>
              </div>
              <div className="p-4 bg-[#1a1a2e] rounded-xl border border-gray-800 text-center">
                <p className="text-xs text-gray-500 mb-1">Rebuys This Session</p>
                <p className="text-2xl font-bold text-white">{config.currentRebuyCount}</p>
                <p className="text-xs text-gray-500">unlimited</p>
              </div>
            </div>

            {/* Quick Rebuy Options */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Quick Rebuy
              </label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_REBUY_MULTIPLIERS.map((multiplier) => {
                  const amount = config.pointValueUsd * multiplier
                  const isSelected = rebuyAmount === amount
                  return (
                    <button
                      key={multiplier}
                      type="button"
                      onClick={() => handleQuickRebuy(multiplier)}
                      disabled={isSubmitting}
                      className={cn(
                        'p-3 rounded-lg border text-center transition-all',
                        isSelected
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-[#1a1a2e] border-gray-700 hover:border-gray-600',
                        isSubmitting && 'opacity-50 cursor-not-allowed',
                      )}
                    >
                      <p className="text-lg font-bold text-white">{multiplier}</p>
                      <p className="text-xs text-gray-400">${amount.toFixed(2)}</p>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Custom Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Custom Amount (USD)</label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDecrement}
                  disabled={isSubmitting || rebuyAmount <= config.minBuyIn}
                  className="p-3 bg-[#1a1a2e] border border-gray-700 rounded-lg hover:border-gray-600 disabled:opacity-50"
                >
                  <Minus className="w-5 h-5 text-gray-400" />
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={rebuyAmount || ''}
                    onChange={(e) => handleAmountChange(e.target.value)}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full bg-[#1a1a2e] border rounded-lg pl-8 pr-4 py-3 text-white text-center text-xl font-bold',
                      'focus:outline-none focus:border-purple-500',
                      isValidAmount ? 'border-gray-700' : 'border-red-500',
                      isSubmitting && 'opacity-50 cursor-not-allowed',
                    )}
                    min={config.minBuyIn}
                    step={config.pointValueUsd}
                  />
                </div>
                <button
                  type="button"
                  onClick={handleIncrement}
                  disabled={isSubmitting}
                  className="p-3 bg-[#1a1a2e] border border-gray-700 rounded-lg hover:border-gray-600 disabled:opacity-50"
                >
                  <Plus className="w-5 h-5 text-gray-400" />
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500 text-center">
                Min: ${config.minBuyIn.toFixed(2)} ({Math.round(config.minBuyIn / config.pointValueUsd)} points)
              </p>
            </div>

            {/* Points Preview */}
            <div className="p-4 bg-gradient-to-r from-purple-500/10 to-cyan-500/10 rounded-xl border border-purple-500/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Coins className="w-5 h-5 text-yellow-400" />
                  <span className="text-gray-300">You will receive</span>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-white">{pointsReceived.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">points</p>
                </div>
              </div>
            </div>

            {/* Wallet Balance */}
            <div className="flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg border border-gray-800">
              <span className="text-sm text-gray-400">Wallet Balance</span>
              <span
                className={cn(
                  'font-medium',
                  hasSufficientBalance ? 'text-green-400' : 'text-red-400',
                )}
              >
                {currencySymbol}{walletBalance.toFixed(2)}
              </span>
            </div>

            {/* Insufficient Balance Warning */}
            {!hasSufficientBalance && (
              <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-300">Insufficient Funds</p>
                  <p className="text-xs text-amber-400/80 mt-1">
                    You need ${rebuyAmount.toFixed(2)} but only have {currencySymbol}{walletBalance.toFixed(2)}.
                    Deposit more funds or leave the room.
                  </p>
                </div>
              </div>
            )}

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
                onClick={handleLeave}
                disabled={isSubmitting}
                className="flex-1 py-3 text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded-xl transition-colors disabled:opacity-50"
              >
                <span className="flex items-center justify-center gap-2">
                  <LogOut className="w-4 h-4" />
                  Leave Room
                </span>
              </button>
              <button
                onClick={handleRebuy}
                disabled={!isValidAmount || !hasSufficientBalance || isSubmitting}
                className={cn(
                  'flex-1 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50',
                  'bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600',
                )}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Rebuy ${rebuyAmount.toFixed(2)}
                  </span>
                )}
              </button>
            </div>

            {/* Timer Warning */}
            <p className="text-xs text-center text-gray-500">
              You have 60 seconds to rebuy before being automatically removed from the room.
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// =============================================================================
// HELPER: Create rebuy config from room settings
// =============================================================================

export function createRebuyConfig(
  pointValueUsd: number,
  entryCurrency: string,
  currentRebuyCount: number,
  maxBuyIn?: number | null,
): RebuyConfig {
  return {
    pointValueUsd,
    minBuyIn: pointValueUsd * 50,
    defaultBuyIn: pointValueUsd * 100,
    maxBuyIn: maxBuyIn ?? null,
    entryCurrency,
    currentRebuyCount,
  }
}