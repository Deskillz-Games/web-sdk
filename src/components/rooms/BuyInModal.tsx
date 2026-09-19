// =============================================================================
// BuyInModal.tsx -- packages/game-ui/src/components/rooms/BuyInModal.tsx
//
// Modal for initial buy-in when joining a social game room.
// Shared across all standalone social games (Big 2, Mahjong, etc.)
// Uses standard Tailwind, lucide-react, framer-motion (already in game deps).
// No bridge dependency -- pure props-in/JSX-out display component.
//
// GAP 20 (Path B, Batch 4a): This SDK file is now the single source of truth.
// Main app imports via '@sdk/components/rooms/BuyInModal' alias.
// Previous main-app copy deleted. Strict err: unknown error handling ported
// up from the main-app copy for improved TypeScript safety.
//
// N419-P1 (3.7.3): the pay-with picker is built from ENTRY_CURRENCIES (D-C1),
// merged with the caller's balance rows. Every entry currency is listed; one
// the player does not hold shows 0.00 and blocks confirm. A room created
// before D-C1 keeps its stored currency as a selectable "(legacy)" row so it
// can run to completion. With no balance rows at all the balances are
// unknown: the picker still shows and the server decides sufficiency.
// =============================================================================

import { useState, useCallback, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Coins,
  Wallet,
  AlertCircle,
  Info,
  Loader2,
  Plus,
  Minus,
  ChevronDown,
} from 'lucide-react'
import { cn } from '../../utils'
import {
  ENTRY_CURRENCIES,
  CURRENCY_LABEL,
  currencyLabel,
  isEntryCurrency,
} from '../../entry-currencies' // N419

// =============================================================================
// TYPES
// =============================================================================

export interface BuyInConfig {
  pointValueUsd: number
  minBuyIn: number       // USD (50x point value)
  defaultBuyIn: number   // USD (100x point value)
  maxBuyIn: number | null // null = unlimited
  entryCurrency: string
}

export interface WalletBalanceItem {
  currency: string
  balance: number
  symbol: string
}

export interface BuyInModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (amount: number, currency: string) => Promise<void>
  config: BuyInConfig
  roomName: string
  gameName: string
  walletBalances?: WalletBalanceItem[]
}

// =============================================================================
// CONSTANTS
// =============================================================================

const QUICK_BUY_MULTIPLIERS = [50, 100, 200, 500]

// N419: one row of the pay-with picker.
interface PayOption {
  currency: string
  label: string
  symbol: string
  balance: number
  /** false for a legacy non-stablecoin row: its balance is not in USD, so it
   *  cannot be compared with the USD buy-in amount on the client. */
  usdPegged: boolean
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function BuyInModal({
  isOpen,
  onClose,
  onConfirm,
  config,
  roomName,
  gameName,
  walletBalances = [],
}: BuyInModalProps) {
  const [buyInAmount, setBuyInAmount] = useState<number>(config.defaultBuyIn)
  const [selectedCurrency, setSelectedCurrency] = useState<string>(config.entryCurrency)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currencyDropdownOpen, setCurrencyDropdownOpen] = useState(false)

  const pointsReceived = useMemo(() => {
    return Math.floor(buyInAmount / config.pointValueUsd)
  }, [buyInAmount, config.pointValueUsd])

  // N419: no rows at all means the caller never loaded balances -- unknown,
  // not zero. Figures are hidden and the server decides sufficiency.
  const balancesKnown = walletBalances.length > 0

  const payOptions = useMemo<PayOption[]>(() => {
    const held = new Map<string, WalletBalanceItem>()
    for (const row of walletBalances) held.set(row.currency, row)

    const toOption = (currency: string, legacy: boolean): PayOption => {
      const row = held.get(currency)
      const label = currencyLabel(currency)
      return {
        currency,
        label: legacy ? `${label} (legacy)` : label,
        symbol: row?.symbol || currency.split('_')[0],
        balance: row ? Number(row.balance) || 0 : 0,
        usdPegged: !legacy,
      }
    }

    const options = ENTRY_CURRENCIES.map((currency) => toOption(currency, false))
    const stored = config.entryCurrency
    // A known platform currency only: an unknown string would be rejected by
    // the API, so it is never offered.
    if (
      stored &&
      !isEntryCurrency(stored) &&
      Object.prototype.hasOwnProperty.call(CURRENCY_LABEL, stored)
    ) {
      options.push(toOption(stored, true))
    }
    return options
  }, [walletBalances, config.entryCurrency])

  // Always a member of payOptions, whatever the stored state holds.
  const activeCurrency = useMemo(() => {
    return payOptions.some((o) => o.currency === selectedCurrency)
      ? selectedCurrency
      : ENTRY_CURRENCIES[0]
  }, [payOptions, selectedCurrency])

  const selectedOption = useMemo(() => {
    return payOptions.find((o) => o.currency === activeCurrency)
  }, [payOptions, activeCurrency])

  const hasSufficientBalance = useMemo(() => {
    if (!balancesKnown || !selectedOption || !selectedOption.usdPegged) return true
    return selectedOption.balance >= buyInAmount
  }, [balancesKnown, selectedOption, buyInAmount])

  // The component stays mounted while closed, so re-sync to the room's
  // currency each time it opens (or the room changes underneath it).
  useEffect(() => {
    if (!isOpen) return
    setSelectedCurrency(config.entryCurrency)
    setCurrencyDropdownOpen(false)
  }, [isOpen, config.entryCurrency])

  const isValidAmount = useMemo(() => {
    if (buyInAmount < config.minBuyIn) return false
    if (config.maxBuyIn !== null && buyInAmount > config.maxBuyIn) return false
    return true
  }, [buyInAmount, config.minBuyIn, config.maxBuyIn])

  const handleAmountChange = useCallback((value: string) => {
    const numValue = parseFloat(value)
    setBuyInAmount(isNaN(numValue) ? 0 : numValue)
    setError(null)
  }, [])

  const handleQuickBuy = useCallback((multiplier: number) => {
    setBuyInAmount(config.pointValueUsd * multiplier)
    setError(null)
  }, [config.pointValueUsd])

  const handleIncrement = useCallback(() => {
    setBuyInAmount((prev) => prev + config.pointValueUsd * 10)
  }, [config.pointValueUsd])

  const handleDecrement = useCallback(() => {
    setBuyInAmount((prev) => Math.max(config.minBuyIn, prev - config.pointValueUsd * 10))
  }, [config.pointValueUsd, config.minBuyIn])

  const handleConfirm = useCallback(async () => {
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
      await onConfirm(buyInAmount, activeCurrency)
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } }; message?: string }
      setError(error.response?.data?.message || error.message || 'Buy-in failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }, [isValidAmount, hasSufficientBalance, buyInAmount, activeCurrency, config.minBuyIn, onConfirm])

  const handleClose = useCallback(() => {
    if (!isSubmitting) {
      setBuyInAmount(config.defaultBuyIn)
      setError(null)
      onClose()
    }
  }, [isSubmitting, config.defaultBuyIn, onClose])

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
          className="relative w-full max-w-md bg-[#12121a] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Coins className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Buy-In</h2>
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
            {/* Game Info */}
            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-xl border border-gray-800">
              <div>
                <p className="text-sm text-gray-400">Game</p>
                <p className="text-white font-medium">{gameName}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-400">Point Value</p>
                <p className="text-white font-medium">${config.pointValueUsd.toFixed(2)}/pt</p>
              </div>
            </div>

            {/* Quick Buy Options */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Quick Select</label>
              <div className="grid grid-cols-4 gap-2">
                {QUICK_BUY_MULTIPLIERS.map((multiplier) => {
                  const amount = config.pointValueUsd * multiplier
                  const isSelected = buyInAmount === amount
                  return (
                    <button
                      key={multiplier}
                      type="button"
                      onClick={() => handleQuickBuy(multiplier)}
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
                  disabled={isSubmitting || buyInAmount <= config.minBuyIn}
                  className="p-3 bg-[#1a1a2e] border border-gray-700 rounded-lg hover:border-gray-600 disabled:opacity-50"
                >
                  <Minus className="w-5 h-5 text-gray-400" />
                </button>
                <div className="flex-1 relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                  <input
                    type="number"
                    value={buyInAmount || ''}
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
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Min: ${config.minBuyIn.toFixed(2)}</span>
                <span>{config.maxBuyIn ? `Max: $${config.maxBuyIn.toFixed(2)}` : 'No maximum'}</span>
              </div>
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

            {/* Currency Selection */}
            {payOptions.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <Wallet className="w-4 h-4 inline mr-1" />
                  Pay with
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => !isSubmitting && setCurrencyDropdownOpen(!currencyDropdownOpen)}
                    disabled={isSubmitting}
                    className={cn(
                      'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
                      'bg-[#1a1a2e] border-gray-700 hover:border-gray-600',
                      isSubmitting && 'opacity-50 cursor-not-allowed',
                      currencyDropdownOpen && 'border-purple-500',
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-white">
                        {selectedOption?.label ?? activeCurrency}
                      </span>
                      {balancesKnown && selectedOption && (
                        <span className="text-sm text-gray-400">
                          Balance: {selectedOption.symbol}{selectedOption.balance.toFixed(2)}
                        </span>
                      )}
                    </div>
                    <ChevronDown
                      className={cn(
                        'w-5 h-5 text-gray-400 transition-transform',
                        currencyDropdownOpen && 'rotate-180',
                      )}
                    />
                  </button>

                  {currencyDropdownOpen && (
                    <div className="absolute z-20 w-full mt-2 bg-[#1a1a2e] border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                      {payOptions.map((option) => (
                        <button
                          key={option.currency}
                          type="button"
                          onClick={() => {
                            setSelectedCurrency(option.currency)
                            setCurrencyDropdownOpen(false)
                            setError(null)
                          }}
                          className={cn(
                            'w-full flex items-center justify-between p-4 transition-colors',
                            'hover:bg-purple-500/10',
                            activeCurrency === option.currency && 'bg-purple-500/20',
                          )}
                        >
                          <span className="font-medium text-white">{option.label}</span>
                          {balancesKnown && (
                            <span className="text-sm text-gray-400">
                              {option.symbol}{option.balance.toFixed(2)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Insufficient Balance Warning */}
            {!hasSufficientBalance && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-300">Insufficient Balance</p>
                  <p className="text-xs text-red-400/80 mt-1">
                    You need ${buyInAmount.toFixed(2)} but only have{' '}
                    {selectedOption?.symbol}{(selectedOption?.balance ?? 0).toFixed(2)}{' '}
                    in {selectedOption?.label ?? activeCurrency}.
                    Please deposit more funds.
                  </p>
                </div>
              </div>
            )}

            {/* Info Note */}
            <div className="flex items-start gap-3 p-3 bg-[#1a1a2e] rounded-lg">
              <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-500">
                Points can be cashed out at any time between rounds.
                A rake is deducted from each round winner per room settings.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
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
                Cancel
              </button>
              <button
                onClick={handleConfirm}
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
                  `Buy-In $${buyInAmount.toFixed(2)}`
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
// HELPER: Create buy-in config from room settings
// =============================================================================

export function createBuyInConfig(
  pointValueUsd: number,
  entryCurrency: string,
  maxBuyIn?: number | null,
): BuyInConfig {
  return {
    pointValueUsd,
    minBuyIn: pointValueUsd * 50,
    defaultBuyIn: pointValueUsd * 100,
    maxBuyIn: maxBuyIn ?? null,
    entryCurrency,
  }
}