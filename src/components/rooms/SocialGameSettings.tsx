// =============================================================================
// SocialGameSettings.tsx -- packages/game-ui/src/components/rooms/SocialGameSettings.tsx
//
// Full room creation form for social games.
// Supports two modes:
//   CASH_GAME  -- rake-based, open-ended, players join/leave freely
//   TOURNAMENT -- bracket structure, entry fee, prize pool, elimination
//
// Used inside CreateRoomScreen. No bridge dependency -- pure props-in/JSX-out.
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import {
  Coins, Timer, Percent, AlertCircle, Info, ChevronDown,
  Trophy, Users, Eye, EyeOff, UserCheck, MonitorSmartphone,
  Target, Layers,
} from 'lucide-react'
import { cn } from '../../utils'

// =============================================================================
// TYPES
// =============================================================================

export type SocialGameType = 'BIG_TWO' | 'MAHJONG' | 'CHINESE_POKER_13'
export type SocialMode = 'CASH_GAME' | 'TOURNAMENT'
export type RoomVisibility = 'PUBLIC_LISTED' | 'PRIVATE_CODE'
export type HostRole = 'PLAYER' | 'MONITOR'

export interface SocialGameConfig {
  // Mode
  socialMode: SocialMode

  // Game identity
  gameType: SocialGameType
  mahjongVariant?: string // HONG_KONG, TAIWANESE, RIICHI, MCR, CANTONESE

  // Cash Game settings
  pointValueUsd: number   // Free input: $0.01 to $100.00, default $0.25
  rakePercentage: number  // Host sets 5% to 10%
  rakeCapPerRound: number
  turnTimerSeconds: number

  // Game end condition
  pointTarget: number    // Big 2/13 Card: race to X points, 0 = open-ended
                         // Mahjong: 4 = 1 wind, 8 = 2 winds, 16 = full game
  maxRounds?: number     // Optional: end after N rounds

  // Game-specific
  maxBid: number          // 1, 2, or 3 (Dou Dizhu / Big 2 style)
  springBonus: boolean    // Loser side played 0 cards pays double

  // Tournament settings (only when socialMode = TOURNAMENT)
  entryFee: number
  entryCurrency: string
  prizePool: number
  prizeDistribution: Record<string, number> // { "1": 50, "2": 30, "3": 20 }
  numberOfTables: number
  seatsPerTable: number

  // Players
  minPlayers: number
  maxPlayers: number

  // Room settings
  currency: string
  visibility: RoomVisibility
  hostRole: HostRole
}

export interface SocialGameSettingsProps {
  config: SocialGameConfig
  onChange: (config: SocialGameConfig) => void
  disabled?: boolean
  className?: string
  /** When set, hides the game type dropdown and locks to this game.
   *  Use in standalone apps: <SocialGameSettings lockedGameType="BIG_TWO" ... /> */
  lockedGameType?: SocialGameType
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SOCIAL_GAMES: { value: SocialGameType; label: string; description: string }[] = [
  { value: 'BIG_TWO', label: 'Big 2', description: 'Classic card climbing game' },
  { value: 'MAHJONG', label: 'Mahjong', description: 'Traditional tile-matching game' },
  { value: 'CHINESE_POKER_13', label: '13-Card Poker', description: 'Arrange 13 cards into 3 hands' },
]

const MAHJONG_VARIANTS = [
  { value: 'HONG_KONG', label: 'Hong Kong' },
  { value: 'TAIWANESE', label: 'Taiwanese' },
  { value: 'RIICHI', label: 'Riichi (Japanese)' },
  { value: 'MCR', label: 'MCR (Competition)' },
  { value: 'CANTONESE', label: 'Cantonese' },
]

const GAME_DEFAULTS: Record<SocialGameType, {
  pointTarget: number; minPlayers: number; maxPlayers: number;
  turnTimer: number; maxBid: number;
}> = {
  BIG_TWO:           { pointTarget: 100, minPlayers: 4, maxPlayers: 4, turnTimer: 30, maxBid: 3 },
  CHINESE_POKER_13:  { pointTarget: 52,  minPlayers: 2, maxPlayers: 4, turnTimer: 45, maxBid: 1 },
  MAHJONG:           { pointTarget: 0,   minPlayers: 4, maxPlayers: 4, turnTimer: 60, maxBid: 1 },
}

// Point value is a free input ($0.01 to $100.00), default $0.25

const POINT_TARGET_OPTIONS: Record<SocialGameType, { value: number; label: string }[]> = {
  BIG_TWO:          [
    { value: 50, label: '50 pts' },
    { value: 100, label: '100 pts' },
    { value: 200, label: '200 pts' },
    { value: 500, label: '500 pts' },
    { value: 0, label: 'Open-Ended' },
  ],
  CHINESE_POKER_13: [
    { value: 26, label: '26 pts' },
    { value: 52, label: '52 pts' },
    { value: 104, label: '104 pts' },
    { value: 0, label: 'Open-Ended' },
  ],
  MAHJONG:          [
    { value: 4, label: '1 Wind (4 rounds)' },
    { value: 8, label: '2 Winds (8 rounds)' },
    { value: 16, label: 'Full Game (16 rounds)' },
  ],
}

const RAKE_PERCENT_OPTIONS = [5, 6, 7, 8, 9, 10]
const RAKE_CAP_OPTIONS = [1, 2, 5, 10, 25, 50]

const TIMER_OPTIONS = [
  { value: 15, label: '15s' },
  { value: 30, label: '30s' },
  { value: 45, label: '45s' },
  { value: 60, label: '60s' },
  { value: 90, label: '90s' },
  { value: 120, label: '120s' },
]

const CURRENCIES = [
  { value: 'USDT_BSC', label: 'USDT (BEP-20)' },
  { value: 'USDC_BSC', label: 'USDC (BEP-20)' },
  { value: 'BNB', label: 'BNB' },
  { value: 'USDT_TRON', label: 'USDT (TRC-20)' },
  { value: 'USDC_TRON', label: 'USDC (TRC-20)' },
]

const ENTRY_FEE_OPTIONS = [1, 5, 10, 25, 50, 100]

const BRACKET_SIZES = [
  { value: 8,   label: '8 Players',   rounds: 3, tables: 2 },
  { value: 16,  label: '16 Players',  rounds: 4, tables: 4 },
  { value: 32,  label: '32 Players',  rounds: 5, tables: 8 },
  { value: 64,  label: '64 Players',  rounds: 6, tables: 16 },
  { value: 128, label: '128 Players', rounds: 7, tables: 32 },
  { value: 256, label: '256 Players', rounds: 8, tables: 64 },
  { value: 512, label: '512 Players', rounds: 9, tables: 128 },
]

// =============================================================================
// STYLES
// =============================================================================

const S = {
  section: 'space-y-2',
  label: 'flex items-center gap-2 text-sm font-medium text-gray-300',
  chipGrid: 'flex flex-wrap gap-2',
  chip: 'px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer text-center',
  chipActive: 'bg-yellow-500/20 border-yellow-500 text-white',
  chipInactive: 'bg-[#1a1a2e] border-gray-700 text-gray-300 hover:border-gray-600',
  chipDisabled: 'opacity-50 cursor-not-allowed',
  infoRow: 'flex items-center justify-between p-3 bg-[#1a1a2e] rounded-lg border border-gray-800',
  infoLabel: 'text-sm text-gray-400',
  infoValue: 'text-sm font-bold text-white',
  modeBtn: 'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
  modeBtnActive: 'border-yellow-500 bg-yellow-500/10',
  modeBtnInactive: 'border-gray-700 bg-[#1a1a2e] hover:border-gray-600',
  toggleBtn: 'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all cursor-pointer text-sm font-medium',
  toggleActive: 'bg-yellow-500/20 border-yellow-500 text-white',
  toggleInactive: 'bg-[#1a1a2e] border-gray-700 text-gray-400 hover:border-gray-600',
  select: 'w-full p-3 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm appearance-none pr-10 focus:border-yellow-500 focus:outline-none',
}

// =============================================================================
// CHIP BUTTON
// =============================================================================

function Chip({
  selected, disabled, onClick, children, className,
}: {
  selected: boolean; disabled?: boolean; onClick: () => void;
  children: React.ReactNode; className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(S.chip, selected ? S.chipActive : S.chipInactive, disabled && S.chipDisabled, className)}
    >
      {children}
    </button>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SocialGameSettings({
  config,
  onChange,
  disabled = false,
  className,
  lockedGameType,
}: SocialGameSettingsProps) {
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false)
  const isLocked = !!lockedGameType
  const isCashGame = config.socialMode === 'CASH_GAME'
  const isTournament = config.socialMode === 'TOURNAMENT'
  const showMahjongVariant = config.gameType === 'MAHJONG'

  // Lock game type if prop is set
  useEffect(() => {
    if (isLocked && config.gameType !== lockedGameType) {
      const defaults = GAME_DEFAULTS[lockedGameType] || GAME_DEFAULTS.BIG_TWO
      onChange({
        ...config,
        gameType: lockedGameType,
        pointTarget: defaults.pointTarget,
        minPlayers: defaults.minPlayers,
        maxPlayers: defaults.maxPlayers,
        turnTimerSeconds: defaults.turnTimer,
        maxBid: defaults.maxBid,
        seatsPerTable: defaults.maxPlayers,
      })
    }
  }, [isLocked, lockedGameType])

  const update = useCallback(
    (partial: Partial<SocialGameConfig>) => onChange({ ...config, ...partial }),
    [config, onChange],
  )

  const handleGameTypeChange = useCallback(
    (gameType: SocialGameType) => {
      const defaults = GAME_DEFAULTS[gameType] || GAME_DEFAULTS.BIG_TWO
      onChange({
        ...config,
        gameType,
        pointTarget: defaults.pointTarget,
        minPlayers: defaults.minPlayers,
        maxPlayers: defaults.maxPlayers,
        turnTimerSeconds: defaults.turnTimer,
        maxBid: defaults.maxBid,
        seatsPerTable: defaults.maxPlayers,
        mahjongVariant: gameType === 'MAHJONG' ? 'HONG_KONG' : undefined,
      })
      setGameDropdownOpen(false)
    },
    [config, onChange],
  )

  // Computed
  const minBuyIn = config.pointValueUsd * 50
  const pointTargetOptions = POINT_TARGET_OPTIONS[config.gameType] || POINT_TARGET_OPTIONS.BIG_TWO

  return (
    <div className={cn('space-y-6', className)}>

      {/* ── MODE TOGGLE: Cash Game vs Tournament ── */}
      <div className={S.section}>
        <label className={S.label}>
          <Layers className="w-4 h-4 text-yellow-400" />
          Room Type
        </label>
        <div className="flex gap-3">
          <button
            type="button"
            disabled={disabled}
            onClick={() => update({ socialMode: 'CASH_GAME' })}
            className={cn(S.modeBtn, isCashGame ? S.modeBtnActive : S.modeBtnInactive, disabled && S.chipDisabled)}
          >
            <Coins className={cn('w-6 h-6', isCashGame ? 'text-yellow-400' : 'text-gray-500')} />
            <span className="font-bold text-white text-sm">Cash Game</span>
            <span className="text-xs text-gray-500 text-center">Rake-based, open-ended, join/leave freely</span>
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => update({ socialMode: 'TOURNAMENT' })}
            className={cn(S.modeBtn, isTournament ? S.modeBtnActive : S.modeBtnInactive, disabled && S.chipDisabled)}
          >
            <Trophy className={cn('w-6 h-6', isTournament ? 'text-yellow-400' : 'text-gray-500')} />
            <span className="font-bold text-white text-sm">Tournament</span>
            <span className="text-xs text-gray-500 text-center">Bracket, entry fee, prize pool</span>
          </button>
        </div>
      </div>

      {/* ── GAME TYPE (hidden when locked) ── */}
      {!isLocked && (
        <div className={S.section}>
          <label className={S.label}>Game Type</label>
          <div className="relative">
            <button
              type="button"
              onClick={() => !disabled && setGameDropdownOpen(!gameDropdownOpen)}
              disabled={disabled}
              className={cn(
                'w-full flex items-center justify-between p-3 rounded-lg border transition-all',
                'bg-[#1a1a2e] border-gray-700 hover:border-gray-600',
                disabled && S.chipDisabled,
                gameDropdownOpen && 'border-yellow-500',
              )}
            >
              <span className="text-white font-medium">
                {SOCIAL_GAMES.find((g) => g.value === config.gameType)?.label || config.gameType}
              </span>
              <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', gameDropdownOpen && 'rotate-180')} />
            </button>
            {gameDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-[#1a1a2e] border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                {SOCIAL_GAMES.map((game) => (
                  <button
                    key={game.value}
                    type="button"
                    onClick={() => handleGameTypeChange(game.value)}
                    className={cn(
                      'w-full text-left p-3 transition-colors hover:bg-yellow-500/10',
                      config.gameType === game.value && 'bg-yellow-500/20',
                    )}
                  >
                    <p className="font-medium text-white">{game.label}</p>
                    <p className="text-xs text-gray-500">{game.description}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MAHJONG VARIANT ── */}
      {showMahjongVariant && (
        <div className={S.section}>
          <label className={S.label}>Mahjong Variant</label>
          <div className="relative">
            <select
              value={config.mahjongVariant || 'HONG_KONG'}
              onChange={(e) => update({ mahjongVariant: e.target.value })}
              disabled={disabled}
              className={S.select}
            >
              {MAHJONG_VARIANTS.map((v) => (
                <option key={v.value} value={v.value}>{v.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CASH GAME SETTINGS                                               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isCashGame && (
        <>
          {/* Point Value — Free Input */}
          <div className={S.section}>
            <label className={S.label}>
              <Coins className="w-4 h-4 text-yellow-400" />
              Point Value (USD per point)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
              <input
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                value={config.pointValueUsd}
                onChange={(e) => {
                  const val = parseFloat(e.target.value)
                  if (!isNaN(val) && val >= 0.01 && val <= 100) {
                    update({ pointValueUsd: val })
                  }
                }}
                disabled={disabled}
                className={cn(
                  'w-full pl-7 pr-4 py-3 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm',
                  'focus:border-yellow-500 focus:outline-none',
                  disabled && 'opacity-50 cursor-not-allowed',
                )}
                placeholder="0.25"
              />
            </div>
            <p className="text-xs text-gray-500">
              Range: $0.01 to $100.00 per point. Min buy-in: ${minBuyIn.toFixed(2)}
            </p>
          </div>

          {/* Rake — Host configurable 5% to 10% */}
          <div className={S.section}>
            <label className={S.label}>
              <Percent className="w-4 h-4 text-pink-400" />
              Rake Percentage
            </label>
            <div className={S.chipGrid}>
              {RAKE_PERCENT_OPTIONS.map((pct) => (
                <Chip
                  key={pct}
                  selected={config.rakePercentage === pct}
                  disabled={disabled}
                  onClick={() => update({ rakePercentage: pct })}
                >
                  {pct}%
                </Chip>
              ))}
            </div>
          </div>

          {/* Rake Cap */}
          <div className={S.section}>
            <label className={S.label}>
              <Coins className="w-4 h-4 text-pink-400" />
              Rake Cap (Max per round)
            </label>
            <div className={S.chipGrid}>
              {RAKE_CAP_OPTIONS.map((cap) => (
                <Chip
                  key={cap}
                  selected={config.rakeCapPerRound === cap}
                  disabled={disabled}
                  onClick={() => update({ rakeCapPerRound: cap })}
                >
                  ${cap}
                </Chip>
              ))}
            </div>
          </div>

          {/* Game End Condition */}
          <div className={S.section}>
            <label className={S.label}>
              <Target className="w-4 h-4 text-cyan-400" />
              {config.gameType === 'MAHJONG' ? 'Game Length' : 'Game Ends At'}
            </label>
            <div className={S.chipGrid}>
              {pointTargetOptions.map((opt) => (
                <Chip
                  key={opt.value}
                  selected={config.pointTarget === opt.value}
                  disabled={disabled}
                  onClick={() => update({ pointTarget: opt.value })}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              {config.gameType === 'MAHJONG'
                ? config.pointTarget === 4 ? 'East wind only (4 hands).'
                  : config.pointTarget === 8 ? 'East + South winds (8 hands).'
                  : 'All 4 winds — East, South, West, North (16 hands).'
                : config.pointTarget === 0
                  ? 'Game continues until all players cash out.'
                  : `First player to reach ${config.pointTarget} points wins.`}
            </p>
          </div>

        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* TOURNAMENT SETTINGS                                              */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isTournament && (
        <>
          {/* Entry Fee */}
          <div className={S.section}>
            <label className={S.label}>
              <Coins className="w-4 h-4 text-yellow-400" />
              Entry Fee
            </label>
            <div className={S.chipGrid}>
              {ENTRY_FEE_OPTIONS.map((fee) => (
                <Chip
                  key={fee}
                  selected={config.entryFee === fee}
                  disabled={disabled}
                  onClick={() => update({ entryFee: fee })}
                >
                  ${fee}
                </Chip>
              ))}
            </div>
          </div>

          {/* Prize Distribution — dynamic builder */}
          <div className={S.section}>
            <label className={S.label}>
              <Trophy className="w-4 h-4 text-green-400" />
              Prize Split
            </label>

            {/* Quick presets */}
            <div className={cn(S.chipGrid, 'mb-3')}>
              {[
                { label: 'Top 1', dist: { '1': 100 } as Record<string, number> },
                { label: 'Top 2', dist: { '1': 70, '2': 30 } as Record<string, number> },
                { label: 'Top 3', dist: { '1': 50, '2': 30, '3': 20 } as Record<string, number> },
                { label: 'Top 5', dist: { '1': 40, '2': 25, '3': 15, '4': 12, '5': 8 } as Record<string, number> },
                { label: 'Top 10', dist: { '1': 30, '2': 18, '3': 12, '4': 9, '5': 7, '6': 6, '7': 5, '8': 5, '9': 4, '10': 4 } as Record<string, number> },
              ].map((preset) => {
                const isSelected = JSON.stringify(config.prizeDistribution) === JSON.stringify(preset.dist)
                return (
                  <Chip
                    key={preset.label}
                    selected={isSelected}
                    disabled={disabled}
                    onClick={() => update({ prizeDistribution: preset.dist })}
                  >
                    {preset.label}
                  </Chip>
                )
              })}
            </div>

            {/* Editable positions */}
            <div className="space-y-2">
              {Object.entries(config.prizeDistribution || {}).map(([pos, pct]) => (
                <div key={pos} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8 text-right">#{pos}</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={pct}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 0
                      const newDist = { ...config.prizeDistribution, [pos]: val }
                      update({ prizeDistribution: newDist })
                    }}
                    disabled={disabled}
                    className="flex-1 px-3 py-1.5 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none w-20"
                  />
                  <span className="text-xs text-gray-500">%</span>
                  {Object.keys(config.prizeDistribution || {}).length > 1 && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        const newDist = { ...config.prizeDistribution }
                        delete newDist[pos]
                        update({ prizeDistribution: newDist })
                      }}
                      className="text-red-400 hover:text-red-300 text-xs px-1"
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Add position button */}
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                const positions = Object.keys(config.prizeDistribution || {})
                const nextPos = positions.length > 0
                  ? String(Math.max(...positions.map(Number)) + 1)
                  : '1'
                update({ prizeDistribution: { ...config.prizeDistribution, [nextPos]: 0 } })
              }}
              className={cn(
                'mt-2 px-4 py-1.5 rounded-lg border text-xs font-medium transition-all',
                'bg-[#1a1a2e] border-gray-700 text-gray-400 hover:border-green-500 hover:text-green-400',
                disabled && 'opacity-50 cursor-not-allowed',
              )}
            >
              + Add Position
            </button>

            {/* Total validation */}
            {(() => {
              const total = Object.values(config.prizeDistribution || {}).reduce((sum, v) => sum + v, 0)
              return total !== 100 ? (
                <p className="text-xs text-red-400 mt-1">
                  Total must equal 100% (currently {total}%)
                </p>
              ) : (
                <p className="text-xs text-green-400 mt-1">Total: 100%</p>
              )
            })()}
          </div>

          {/* Bracket Size (single elimination) */}
          <div className={S.section}>
            <label className={S.label}>
              <Layers className="w-4 h-4 text-purple-400" />
              Tournament Size (Single Elimination)
            </label>
            <div className={S.chipGrid}>
              {BRACKET_SIZES.map((b) => (
                <Chip
                  key={b.value}
                  selected={config.maxPlayers === b.value}
                  disabled={disabled}
                  onClick={() => update({
                    maxPlayers: b.value,
                    minPlayers: b.value,
                    numberOfTables: b.tables,
                    seatsPerTable: config.seatsPerTable || 4,
                  })}
                >
                  {b.label}
                </Chip>
              ))}
            </div>
            {(() => {
              const bracket = BRACKET_SIZES.find((b) => b.value === config.maxPlayers)
              return bracket ? (
                <p className="text-xs text-gray-500">
                  {bracket.rounds} rounds, {bracket.tables} tables of {config.seatsPerTable || 4} players each. Single elimination — lose once, you are out.
                </p>
              ) : null
            })()}
          </div>

          {/* Point Target (tournament can also have a point target) */}
          {pointTargetOptions.length > 1 && (
            <div className={S.section}>
              <label className={S.label}>
                <Target className="w-4 h-4 text-cyan-400" />
                {config.gameType === 'MAHJONG' ? 'Game Length' : 'Race To'}
              </label>
              <div className={S.chipGrid}>
                {pointTargetOptions.filter((opt) => opt.value > 0).map((opt) => (
                  <Chip
                    key={opt.value}
                    selected={config.pointTarget === opt.value}
                    disabled={disabled}
                    onClick={() => update({ pointTarget: opt.value })}
                  >
                    {opt.label}
                  </Chip>
                ))}
              </div>
            </div>
          )}

          {/* Turn Timer (tournament also needs it) */}
          <div className={S.section}>
            <label className={S.label}>
              <Timer className="w-4 h-4 text-cyan-400" />
              Turn Timer
            </label>
            <div className={S.chipGrid}>
              {TIMER_OPTIONS.map((opt) => (
                <Chip
                  key={opt.value}
                  selected={config.turnTimerSeconds === opt.value}
                  disabled={disabled}
                  onClick={() => update({ turnTimerSeconds: opt.value })}
                >
                  {opt.label}
                </Chip>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* COMMON SETTINGS (both modes)                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {/* Currency */}
      <div className={S.section}>
        <label className={S.label}>Currency</label>
        <div className={S.chipGrid}>
          {CURRENCIES.map((c) => (
            <Chip
              key={c.value}
              selected={config.currency === c.value}
              disabled={disabled}
              onClick={() => update({
                currency: c.value,
                entryCurrency: c.value,
              })}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </div>

      {/* Turn Timer (cash game — tournament has it above) */}
      {isCashGame && (
        <div className={S.section}>
          <label className={S.label}>
            <Timer className="w-4 h-4 text-cyan-400" />
            Turn Timer
          </label>
          <div className={S.chipGrid}>
            {TIMER_OPTIONS.map((opt) => (
              <Chip
                key={opt.value}
                selected={config.turnTimerSeconds === opt.value}
                disabled={disabled}
                onClick={() => update({ turnTimerSeconds: opt.value })}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </div>
      )}

      {/* Visibility */}
      <div className={S.section}>
        <label className={S.label}>Visibility</label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => update({ visibility: 'PRIVATE_CODE' })}
            className={cn(S.toggleBtn, config.visibility === 'PRIVATE_CODE' ? S.toggleActive : S.toggleInactive, disabled && S.chipDisabled)}
          >
            <EyeOff className="w-4 h-4" /> Private (Code)
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => update({ visibility: 'PUBLIC_LISTED' })}
            className={cn(S.toggleBtn, config.visibility === 'PUBLIC_LISTED' ? S.toggleActive : S.toggleInactive, disabled && S.chipDisabled)}
          >
            <Eye className="w-4 h-4" /> Public (Listed)
          </button>
        </div>
      </div>

      {/* Host Role */}
      <div className={S.section}>
        <label className={S.label}>Host Role</label>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => update({ hostRole: 'PLAYER' })}
            className={cn(S.toggleBtn, config.hostRole === 'PLAYER' ? S.toggleActive : S.toggleInactive, disabled && S.chipDisabled)}
          >
            <UserCheck className="w-4 h-4" /> Play in Room
          </button>
          <button
            type="button"
            disabled={disabled}
            onClick={() => update({ hostRole: 'MONITOR' })}
            className={cn(S.toggleBtn, config.hostRole === 'MONITOR' ? S.toggleActive : S.toggleInactive, disabled && S.chipDisabled)}
          >
            <MonitorSmartphone className="w-4 h-4" /> Monitor Only
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {config.hostRole === 'PLAYER'
            ? 'You will join the room as a player.'
            : 'You can see board and scores but NOT player hands (anti-cheat).'}
        </p>
      </div>

      {/* ── Summary Info ── */}
      {isCashGame && (
        <div className="flex items-start gap-3 p-3 bg-[#1a1a2e] rounded-lg">
          <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">
            A {config.rakePercentage}% rake is taken from each round (capped at ${config.rakeCapPerRound.toFixed(2)}).
            Rake is split between the host, platform, and game developer based on the host's tier.
            {config.pointTarget > 0
              ? ` Game ends when a player reaches ${config.pointTarget} points.`
              : ' Game continues until all players cash out.'}
          </p>
        </div>
      )}

      {isTournament && (
        <div className="p-4 bg-gradient-to-r from-purple-500/10 to-yellow-500/10 rounded-lg border border-purple-500/20">
          <div className="flex items-center gap-2 mb-3">
            <Info className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-white">Tournament Preview</span>
          </div>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <p className="text-xs text-gray-500">Entry Fee</p>
              <p className="text-lg font-bold text-white">${config.entryFee}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Players</p>
              <p className="text-lg font-bold text-white">{config.maxPlayers}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Rounds</p>
              <p className="text-lg font-bold text-white">{BRACKET_SIZES.find((b) => b.value === config.maxPlayers)?.rounds || '—'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Prize Pool</p>
              <p className="text-lg font-bold text-green-400">
                ${(config.entryFee * config.maxPlayers * 0.9).toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// =============================================================================
// HELPER: Default config
// =============================================================================

export function createDefaultSocialGameConfig(gameType?: SocialGameType): SocialGameConfig {
  const gt = gameType || 'BIG_TWO'
  const defaults = GAME_DEFAULTS[gt] || GAME_DEFAULTS.BIG_TWO
  return {
    socialMode: 'CASH_GAME',
    gameType: gt,
    mahjongVariant: gt === 'MAHJONG' ? 'HONG_KONG' : undefined,
    pointValueUsd: 0.25,
    rakePercentage: 5,
    rakeCapPerRound: 5,
    turnTimerSeconds: defaults.turnTimer,
    pointTarget: gt === 'MAHJONG' ? 4 : defaults.pointTarget,
    maxRounds: undefined,
    maxBid: defaults.maxBid,
    springBonus: false,
    entryFee: 5,
    entryCurrency: 'USDT_BSC',
    prizePool: 0,
    prizeDistribution: { '1': 50, '2': 30, '3': 20 },
    numberOfTables: 1,
    seatsPerTable: defaults.maxPlayers,
    minPlayers: defaults.minPlayers,
    maxPlayers: defaults.maxPlayers,
    currency: 'USDT_BSC',
    visibility: 'PRIVATE_CODE',
    hostRole: 'PLAYER',
  }
}