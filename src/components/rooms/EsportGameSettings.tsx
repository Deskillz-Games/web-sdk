// =============================================================================
// EsportGameSettings.tsx -- packages/game-ui/src/components/rooms/EsportGameSettings.tsx
//
// Configures esport game room parameters: entry fee, currency, player count,
// game mode, match duration, rounds, prize split, visibility.
// Used inside CreateRoomScreen when creating an esport private room.
// No bridge dependency -- pure props-in/JSX-out.
// =============================================================================

import { useState, useCallback } from 'react'
import {
  DollarSign, Users, Timer, Trophy, Eye, EyeOff,
  Swords, Clock, AlertCircle, ChevronDown, Info,
} from 'lucide-react'
import { cn } from '../../utils'

// =============================================================================
// TYPES
// =============================================================================

export type GameMode = 'SYNC' | 'ASYNC'
export type RoomVisibility = 'PUBLIC_LISTED' | 'UNLISTED'

export interface PrizeDistribution {
  [position: string]: number // e.g. { '1': 60, '2': 30, '3': 10 }
}

export interface EsportGameConfig {
  entryFee: number
  entryCurrency: string
  minPlayers: number
  maxPlayers: number
  mode: GameMode
  matchDurationSeconds: number
  roundsCount: number
  prizeDistribution: PrizeDistribution
  visibility: RoomVisibility
}

export interface EsportGameSettingsProps {
  config: EsportGameConfig
  onChange: (config: EsportGameConfig) => void
  disabled?: boolean
  className?: string
  /** Available currencies from wallet */
  currencies?: string[]
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ENTRY_FEE_OPTIONS = [
  { value: 1, label: '$1', tier: 'Casual' },
  { value: 5, label: '$5', tier: 'Standard' },
  { value: 10, label: '$10', tier: 'Competitive' },
  { value: 25, label: '$25', tier: 'High Stakes' },
  { value: 50, label: '$50', tier: 'Premium' },
  { value: 100, label: '$100', tier: 'Elite' },
]

const DEFAULT_CURRENCIES = ['USDT_BSC', 'USDC_BSC', 'BNB', 'USDT_TRON', 'USDC_TRON']

const CURRENCY_LABELS: Record<string, string> = {
  BNB: 'BNB',
  USDT_BSC: 'USDT (BSC)',
  USDT_TRON: 'USDT (TRC20)',
  USDC_BSC: 'USDC (BSC)',
  USDC_TRON: 'USDC (TRC20)',
}

const PLAYER_COUNT_OPTIONS = [
  { value: 2, label: '1v1' },
  { value: 3, label: '3 Players' },
  { value: 4, label: '4 Players' },
  { value: 6, label: '6 Players' },
  { value: 8, label: '8 Players' },
  { value: 10, label: '10 Players' },
]

const DURATION_OPTIONS = [
  { value: 60, label: '1 min', description: 'Sprint' },
  { value: 120, label: '2 min', description: 'Quick' },
  { value: 180, label: '3 min', description: 'Standard' },
  { value: 300, label: '5 min', description: 'Extended' },
  { value: 600, label: '10 min', description: 'Marathon' },
]

const ROUNDS_OPTIONS = [
  { value: 1, label: '1 Round', description: 'Single elimination' },
  { value: 3, label: 'Best of 3', description: 'First to 2 wins' },
  { value: 5, label: 'Best of 5', description: 'First to 3 wins' },
]

const PRESET_PRIZE_SPLITS: { label: string; distribution: Record<string, number> }[] = [
  { label: 'Winner Takes All', distribution: { '1': 100 } as Record<string, number> },
  { label: 'Top 2 Split', distribution: { '1': 70, '2': 30 } as Record<string, number> },
  { label: 'Top 3 Split', distribution: { '1': 60, '2': 30, '3': 10 } as Record<string, number> },
  { label: 'Even Top 3', distribution: { '1': 50, '2': 30, '3': 20 } as Record<string, number> },
]

// =============================================================================
// STYLES (inline — no Tailwind config dependency in standalone games)
// =============================================================================

const S = {
  container: 'space-y-5',
  section: 'space-y-2',
  label: 'flex items-center gap-2 text-sm font-medium text-gray-300',
  chipGrid: 'grid gap-2',
  chip: 'p-3 rounded-lg border text-center transition-all cursor-pointer',
  chipActive: 'bg-cyan-500/20 border-cyan-500',
  chipInactive: 'bg-[#1a1a2e] border-gray-700 hover:border-gray-600',
  chipDisabled: 'opacity-50 cursor-not-allowed',
  selectWrapper: 'relative',
  select: 'w-full p-3 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm appearance-none pr-10 focus:border-cyan-500 focus:outline-none',
  infoBox: 'flex items-start gap-3 p-3 bg-[#1a1a2e] rounded-lg',
  infoText: 'text-xs text-gray-500',
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

function ChipButton({
  selected,
  disabled,
  onClick,
  children,
  className,
}: {
  selected: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        S.chip,
        selected ? S.chipActive : S.chipInactive,
        disabled && S.chipDisabled,
        className,
      )}
    >
      {children}
    </button>
  )
}

function SelectDropdown({
  value,
  options,
  onChange,
  disabled,
}: {
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  disabled?: boolean
}) {
  return (
    <div className={S.selectWrapper}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={S.select}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function EsportGameSettings({
  config,
  onChange,
  disabled = false,
  className,
  currencies,
}: EsportGameSettingsProps) {
  const [prizeSplitOpen, setPrizeSplitOpen] = useState(false)

  const availableCurrencies = currencies || DEFAULT_CURRENCIES

  const update = useCallback(
    (partial: Partial<EsportGameConfig>) => {
      onChange({ ...config, ...partial })
    },
    [config, onChange],
  )

  // Calculate total prize pool (entry fee * max players minus platform rake)
  const grossPool = config.entryFee * config.maxPlayers
  const platformRake = grossPool * 0.10
  const netPool = grossPool - platformRake

  // Validate prize distribution sums to 100
  const prizeTotal = Object.values(config.prizeDistribution).reduce((sum, v) => sum + v, 0)
  const isPrizeValid = Math.abs(prizeTotal - 100) < 0.01

  return (
    <div className={cn(S.container, className)}>
      {/* Entry Fee */}
      <div className={S.section}>
        <label className={S.label}>
          <DollarSign className="w-4 h-4 text-cyan-400" />
          Entry Fee
        </label>
        <div className={cn(S.chipGrid, 'grid-cols-3')}>
          {ENTRY_FEE_OPTIONS.map((opt) => (
            <ChipButton
              key={opt.value}
              selected={config.entryFee === opt.value}
              disabled={disabled}
              onClick={() => update({ entryFee: opt.value })}
            >
              <p className="text-sm font-bold text-white">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.tier}</p>
            </ChipButton>
          ))}
        </div>
      </div>

      {/* Currency */}
      <div className={S.section}>
        <label className={S.label}>
          <DollarSign className="w-4 h-4 text-green-400" />
          Currency
        </label>
        <SelectDropdown
          value={config.entryCurrency}
          options={availableCurrencies.map((c) => ({
            value: c,
            label: CURRENCY_LABELS[c] || c,
          }))}
          onChange={(v) => update({ entryCurrency: v })}
          disabled={disabled}
        />
      </div>

      {/* Player Count */}
      <div className={S.section}>
        <label className={S.label}>
          <Users className="w-4 h-4 text-purple-400" />
          Players
        </label>
        <div className={cn(S.chipGrid, 'grid-cols-3')}>
          {PLAYER_COUNT_OPTIONS.map((opt) => (
            <ChipButton
              key={opt.value}
              selected={config.maxPlayers === opt.value}
              disabled={disabled}
              onClick={() => update({ maxPlayers: opt.value, minPlayers: opt.value })}
            >
              <p className="text-sm font-bold text-white">{opt.label}</p>
            </ChipButton>
          ))}
        </div>
      </div>

      {/* Game Mode */}
      <div className={S.section}>
        <label className={S.label}>
          <Swords className="w-4 h-4 text-amber-400" />
          Game Mode
        </label>
        <div className="grid grid-cols-2 gap-2">
          <ChipButton
            selected={config.mode === 'SYNC'}
            disabled={disabled}
            onClick={() => update({ mode: 'SYNC' })}
          >
            <Swords className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">Synchronous</p>
            <p className="text-xs text-gray-500">Real-time multiplayer</p>
          </ChipButton>
          <ChipButton
            selected={config.mode === 'ASYNC'}
            disabled={disabled}
            onClick={() => update({ mode: 'ASYNC' })}
          >
            <Clock className="w-5 h-5 text-blue-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">Asynchronous</p>
            <p className="text-xs text-gray-500">Play before deadline</p>
          </ChipButton>
        </div>
      </div>

      {/* Match Duration */}
      <div className={S.section}>
        <label className={S.label}>
          <Timer className="w-4 h-4 text-cyan-400" />
          Match Duration
        </label>
        <div className={cn(S.chipGrid, 'grid-cols-5')}>
          {DURATION_OPTIONS.map((opt) => (
            <ChipButton
              key={opt.value}
              selected={config.matchDurationSeconds === opt.value}
              disabled={disabled}
              onClick={() => update({ matchDurationSeconds: opt.value })}
            >
              <p className="text-sm font-bold text-white">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.description}</p>
            </ChipButton>
          ))}
        </div>
      </div>

      {/* Rounds */}
      <div className={S.section}>
        <label className={S.label}>
          <Trophy className="w-4 h-4 text-yellow-400" />
          Rounds
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ROUNDS_OPTIONS.map((opt) => (
            <ChipButton
              key={opt.value}
              selected={config.roundsCount === opt.value}
              disabled={disabled}
              onClick={() => update({ roundsCount: opt.value })}
            >
              <p className="text-sm font-bold text-white">{opt.label}</p>
              <p className="text-xs text-gray-500">{opt.description}</p>
            </ChipButton>
          ))}
        </div>
      </div>

      {/* Prize Distribution */}
      <div className={S.section}>
        <label className={S.label}>
          <Trophy className="w-4 h-4 text-green-400" />
          Prize Split
        </label>
        <div className="grid grid-cols-2 gap-2">
          {PRESET_PRIZE_SPLITS.map((preset) => {
            const isSelected =
              JSON.stringify(config.prizeDistribution) === JSON.stringify(preset.distribution)
            return (
              <ChipButton
                key={preset.label}
                selected={isSelected}
                disabled={disabled}
                onClick={() => update({ prizeDistribution: preset.distribution })}
              >
                <p className="text-sm font-bold text-white">{preset.label}</p>
                <p className="text-xs text-gray-500">
                  {Object.entries(preset.distribution)
                    .map(([pos, pct]) => `#${pos}: ${pct}%`)
                    .join(' / ')}
                </p>
              </ChipButton>
            )
          })}
        </div>

        {!isPrizeValid && (
          <div className="flex items-center gap-2 mt-2 text-xs text-red-400">
            <AlertCircle className="w-3 h-3 flex-shrink-0" />
            Prize distribution must total 100% (currently {prizeTotal}%)
          </div>
        )}
      </div>

      {/* Visibility */}
      <div className={S.section}>
        <label className={S.label}>
          <Eye className="w-4 h-4 text-gray-400" />
          Room Visibility
        </label>
        <div className="grid grid-cols-2 gap-2">
          <ChipButton
            selected={config.visibility === 'PUBLIC_LISTED'}
            disabled={disabled}
            onClick={() => update({ visibility: 'PUBLIC_LISTED' })}
          >
            <Eye className="w-5 h-5 text-green-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">Public</p>
            <p className="text-xs text-gray-500">Listed in room browser</p>
          </ChipButton>
          <ChipButton
            selected={config.visibility === 'UNLISTED'}
            disabled={disabled}
            onClick={() => update({ visibility: 'UNLISTED' })}
          >
            <EyeOff className="w-5 h-5 text-gray-400 mx-auto mb-1" />
            <p className="text-sm font-bold text-white">Unlisted</p>
            <p className="text-xs text-gray-500">Invite code only</p>
          </ChipButton>
        </div>
      </div>

      {/* Prize Pool Preview */}
      <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">Prize Pool Preview</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xs text-gray-500">Gross Pool</p>
            <p className="text-lg font-bold text-white">${grossPool.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Platform (10%)</p>
            <p className="text-lg font-bold text-red-400">-${platformRake.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Net Prizes</p>
            <p className="text-lg font-bold text-green-400">${netPool.toFixed(2)}</p>
          </div>
        </div>
        {isPrizeValid && config.maxPlayers >= 2 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50">
            <div className="flex flex-wrap gap-3">
              {Object.entries(config.prizeDistribution).map(([pos, pct]) => (
                <div key={pos} className="text-center">
                  <p className="text-xs text-gray-500">#{pos}</p>
                  <p className="text-sm font-bold text-cyan-400">
                    ${((netPool * pct) / 100).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Platform Fee Info */}
      <div className={S.infoBox}>
        <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
        <p className={S.infoText}>
          A 10% platform fee is deducted from the prize pool. The remaining {90}% is distributed
          to winners based on the prize split above. Entry fees are held in escrow until the
          match completes.
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// HELPER: Default esport game config
// =============================================================================

export function createDefaultEsportGameConfig(): EsportGameConfig {
  return {
    entryFee: 5,
    entryCurrency: 'USDT_BSC',
    minPlayers: 2,
    maxPlayers: 2,
    mode: 'SYNC',
    matchDurationSeconds: 180,
    roundsCount: 1,
    prizeDistribution: { '1': 100 },
    visibility: 'PUBLIC_LISTED',
  }
}