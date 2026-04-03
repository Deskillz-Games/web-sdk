// =============================================================================
// SocialGameSettings.tsx -- packages/game-ui/src/components/rooms/SocialGameSettings.tsx
//
// v3.3.3 changes:
//   - Added playersAdvancePerTable: 1 | 2 to SocialGameConfig
//   - Added tiebreakRule: 'MOST_ROUNDS_WON' | 'SUDDEN_DEATH' | 'RANDOM_DRAW'
//   - SUDDEN_DEATH hidden when capabilities.minPlayers > 2
//     (e.g. Big 2 / Mahjong require 4 players -- no 1v1 sudden death possible)
//   - Added capabilities prop to SocialGameSettingsProps
//   - Tournament section shows advancement + tiebreak config
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import {
  Coins, Timer, Percent, AlertCircle, Info, ChevronDown,
  Trophy, Users, Eye, EyeOff, UserCheck, MonitorSmartphone,
  Target, Layers, Grid3X3, Lock, HelpCircle, Zap,
} from 'lucide-react'
import { cn } from '../../utils'
import { GameCapabilities, DEFAULT_CAPABILITIES } from '../../types/GameCapabilities'

// =============================================================================
// TYPES
// =============================================================================

export type SocialGameType    = 'BIG_TWO' | 'MAHJONG' | 'CHINESE_POKER_13'
export type SocialMode        = 'CASH_GAME' | 'TOURNAMENT'
export type RoomVisibility    = 'PUBLIC_LISTED' | 'PRIVATE_CODE'
export type HostRole          = 'PLAYER' | 'MONITOR'
export type TableBreakRule    = 'REBALANCE' | 'CLOSE'
export type TiebreakRule      = 'MOST_ROUNDS_WON' | 'SUDDEN_DEATH' | 'RANDOM_DRAW'

export interface SocialGameConfig {
  socialMode: SocialMode
  gameType: SocialGameType
  mahjongVariant?: string
  pointValueUsd: number
  rakePercentage: number
  rakeCapPerRound: number
  turnTimerSeconds: number
  pointTarget: number
  maxRounds?: number
  maxBid: number
  springBonus: boolean
  // Multi-table cash game (v3.3)
  numberOfTables: number
  minPlayersPerTable: number
  tableBreakRule: TableBreakRule
  // Tournament settings
  entryFee: number
  entryCurrency: string
  prizePool: number
  prizeDistribution: Record<string, number>
  seatsPerTable: number
  // Tournament advancement (v3.3.3)
  playersAdvancePerTable: 1 | 2
  tiebreakRule: TiebreakRule
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
  /** Game capabilities -- filters tiebreak options based on minPlayers */
  capabilities?: GameCapabilities
  disabled?: boolean
  className?: string
  lockedGameType?: SocialGameType
}

// =============================================================================
// CONSTANTS
// =============================================================================

const SOCIAL_GAMES: { value: SocialGameType; label: string; description: string }[] = [
  { value: 'BIG_TWO',          label: 'Big 2',        description: 'Classic card climbing game' },
  { value: 'MAHJONG',          label: 'Mahjong',       description: 'Traditional tile-matching game' },
  { value: 'CHINESE_POKER_13', label: '13-Card Poker', description: 'Arrange 13 cards into 3 hands' },
]

const MAHJONG_VARIANTS = [
  { value: 'HONG_KONG', label: 'Hong Kong' },
  { value: 'TAIWANESE', label: 'Taiwanese' },
  { value: 'RIICHI',    label: 'Riichi (Japanese)' },
  { value: 'MCR',       label: 'MCR (Competition)' },
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

const POINT_TARGET_OPTIONS: Record<SocialGameType, { value: number; label: string }[]> = {
  BIG_TWO: [
    { value: 50,  label: '50 pts' },
    { value: 100, label: '100 pts' },
    { value: 200, label: '200 pts' },
    { value: 500, label: '500 pts' },
    { value: 0,   label: 'Open-Ended' },
  ],
  CHINESE_POKER_13: [
    { value: 26,  label: '26 pts' },
    { value: 52,  label: '52 pts' },
    { value: 104, label: '104 pts' },
    { value: 0,   label: 'Open-Ended' },
  ],
  MAHJONG: [
    { value: 4,  label: '1 Wind (4 rounds)' },
    { value: 8,  label: '2 Winds (8 rounds)' },
    { value: 16, label: 'Full Game (16 rounds)' },
  ],
}

const RAKE_PERCENT_OPTIONS = [5, 6, 7, 8, 9, 10]
const RAKE_CAP_PRESETS     = [1, 2, 5, 10, 25, 50]
const POINT_VALUE_PRESETS  = [0.01, 0.05, 0.10, 0.25, 0.50, 1.00]
const ENTRY_FEE_PRESETS    = [1, 5, 10, 25, 50, 100]

const TIMER_OPTIONS = [
  { value: 15,  label: '15s' },
  { value: 30,  label: '30s' },
  { value: 45,  label: '45s' },
  { value: 60,  label: '60s' },
  { value: 90,  label: '90s' },
  { value: 120, label: '120s' },
]

const CURRENCIES = [
  { value: 'USDT_BSC',  label: 'USDT (BEP-20)' },
  { value: 'USDC_BSC',  label: 'USDC (BEP-20)' },
  { value: 'BNB',       label: 'BNB' },
  { value: 'USDT_TRON', label: 'USDT (TRC-20)' },
  { value: 'USDC_TRON', label: 'USDC (TRC-20)' },
]

const TABLE_BREAK_RULES: { value: TableBreakRule; label: string; description: string }[] = [
  { value: 'REBALANCE', label: 'Rebalance',    description: 'Move players to other tables when one drops below minimum.' },
  { value: 'CLOSE',     label: 'Close Table',  description: 'Cash out all players at the under-minimum table and close it.' },
]

const MIN_SE_SIZE = 8

// =============================================================================
// POWER-OF-2 HELPERS
// =============================================================================

function isPowerOf2(n: number): boolean { return n > 0 && (n & (n - 1)) === 0 }
function nextPowerOf2(n: number): number {
  if (n <= MIN_SE_SIZE) return MIN_SE_SIZE
  let p = MIN_SE_SIZE; while (p < n) p *= 2; return p
}
function prevPowerOf2(n: number): number {
  if (n <= MIN_SE_SIZE) return MIN_SE_SIZE
  const safe = isPowerOf2(n) ? n : nextPowerOf2(n)
  return Math.max(MIN_SE_SIZE, safe / 2)
}
function deriveTournamentMeta(players: number, seatsPerTable: number) {
  const safeP  = isPowerOf2(players) ? players : nextPowerOf2(players)
  const rounds = Math.log2(safeP)
  const tables = Math.ceil(safeP / Math.max(1, seatsPerTable))
  return { players: safeP, rounds, tables }
}

// =============================================================================
// STYLES
// =============================================================================

const S = {
  section:      'space-y-2',
  label:        'flex items-center gap-2 text-sm font-medium text-gray-300',
  chipGrid:     'flex flex-wrap gap-2',
  chip:         'px-4 py-2 rounded-lg border text-sm font-medium transition-all cursor-pointer text-center',
  chipActive:   'bg-yellow-500/20 border-yellow-500 text-white',
  chipInactive: 'bg-[#1a1a2e] border-gray-700 text-gray-300 hover:border-gray-600',
  chipDisabled: 'opacity-50 cursor-not-allowed',
  modeBtn:      'flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all cursor-pointer',
  modeBtnActive:'border-yellow-500 bg-yellow-500/10',
  modeBtnInact: 'border-gray-700 bg-[#1a1a2e] hover:border-gray-600',
  toggleBtn:    'flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border transition-all cursor-pointer text-sm font-medium',
  toggleActive: 'bg-yellow-500/20 border-yellow-500 text-white',
  toggleInact:  'bg-[#1a1a2e] border-gray-700 text-gray-400 hover:border-gray-600',
  select:       'w-full p-3 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm appearance-none pr-10 focus:border-yellow-500 focus:outline-none',
  freeInput:    'px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none',
  stepBtn:      'w-10 h-10 rounded-lg border text-lg font-bold transition-all bg-[#1a1a2e] border-gray-700 text-white hover:border-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed',
  readOnly:     'flex items-center gap-2 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-400 text-sm',
}

// =============================================================================
// TOOLTIP
// =============================================================================

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)} onMouseLeave={() => setVisible(false)}>
      {children}
      {visible && (
        <div className="absolute z-30 bottom-full left-0 mb-2 w-64 p-3 bg-gray-900 border border-gray-700 rounded-lg shadow-xl text-xs text-gray-300 leading-relaxed">
          {content}
        </div>
      )}
    </div>
  )
}

function LabelWithTooltip({ icon: Icon, iconClass, label, tooltip }: {
  icon: React.ElementType; iconClass: string; label: string; tooltip: string
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className={cn('w-4 h-4', iconClass)} />
      <span className="text-sm font-medium text-gray-300">{label}</span>
      <Tooltip content={tooltip}>
        <HelpCircle className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400 cursor-help transition-colors" />
      </Tooltip>
    </div>
  )
}

// =============================================================================
// CHIP + FREE INPUT
// =============================================================================

function Chip({ selected, disabled, onClick, children, className }: {
  selected: boolean; disabled?: boolean; onClick: () => void;
  children: React.ReactNode; className?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      className={cn(S.chip, selected ? S.chipActive : S.chipInactive, disabled && S.chipDisabled, className)}>
      {children}
    </button>
  )
}

function ChipPlusFreeInput({ presets, value, disabled, onSelect, inputMin, inputStep,
  inputPrefix, inputSuffix, placeholder, formatPreset }: {
  presets: number[]; value: number; disabled?: boolean; onSelect: (v: number) => void
  inputMin?: number; inputStep?: number; inputPrefix?: string
  inputSuffix?: string; placeholder?: string; formatPreset?: (v: number) => string
}) {
  const isCustom = !presets.includes(value)
  return (
    <div className="space-y-2">
      <div className={S.chipGrid}>
        {presets.map((p) => (
          <Chip key={p} selected={value === p} disabled={disabled} onClick={() => onSelect(p)}>
            {formatPreset ? formatPreset(p) : String(p)}
          </Chip>
        ))}
        <Chip selected={isCustom} disabled={disabled} onClick={() => {}}>Custom</Chip>
      </div>
      {isCustom && (
        <div className="flex items-center gap-2">
          {inputPrefix && <span className="text-gray-500 text-sm">{inputPrefix}</span>}
          <input type="number" min={inputMin ?? 0} step={inputStep ?? 1} value={value}
            onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= (inputMin ?? 0)) onSelect(v) }}
            disabled={disabled} placeholder={placeholder}
            className={cn(S.freeInput, 'w-32')} />
          {inputSuffix && <span className="text-gray-500 text-sm">{inputSuffix}</span>}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// POWER-OF-2 STEPPER (Tournament Size)
// =============================================================================

function PowerOf2Stepper({ value, seatsPerTable, disabled, capMax, onChange }: {
  value: number; seatsPerTable: number; disabled?: boolean
  capMax: number; onChange: (players: number, rounds: number, tables: number) => void
}) {
  const meta   = deriveTournamentMeta(value, seatsPerTable)
  const canDec = meta.players > MIN_SE_SIZE
  const canInc = capMax === 0 || meta.players * 2 <= capMax

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button type="button" disabled={disabled || !canDec}
          onClick={() => { const n = prevPowerOf2(meta.players); const m = deriveTournamentMeta(n, seatsPerTable); onChange(m.players, m.rounds, m.tables) }}
          className={S.stepBtn}>−</button>
        <div className="flex-1 text-center py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg">
          <span className="text-white text-xl font-bold">{meta.players}</span>
          <span className="text-gray-500 text-sm ml-2">players</span>
        </div>
        <button type="button" disabled={disabled || !canInc}
          onClick={() => { const n = meta.players * 2; const m = deriveTournamentMeta(n, seatsPerTable); onChange(m.players, m.rounds, m.tables) }}
          className={S.stepBtn}>+</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={S.readOnly}><Lock className="w-3 h-3 flex-shrink-0" /><span className="text-xs">{meta.rounds} bracket rounds (auto)</span></div>
        <div className={S.readOnly}><Lock className="w-3 h-3 flex-shrink-0" /><span className="text-xs">{meta.tables} tables (auto)</span></div>
      </div>
      <p className="text-xs text-gray-500">
        Single elimination. Must be power of 2. Steps: {meta.players} → {canInc ? meta.players * 2 : '—'}
      </p>
    </div>
  )
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export default function SocialGameSettings({
  config, onChange, capabilities, disabled = false, className, lockedGameType,
}: SocialGameSettingsProps) {
  const cap         = capabilities || DEFAULT_CAPABILITIES
  const [gameDropdownOpen, setGameDropdownOpen] = useState(false)
  const isLocked       = !!lockedGameType
  const isCashGame     = config.socialMode === 'CASH_GAME'
  const isTournament   = config.socialMode === 'TOURNAMENT'
  const showMahjong    = config.gameType === 'MAHJONG'
  const showMultiTable = isCashGame && config.numberOfTables > 1

  // Sudden death only available when game supports 2-player matches
  // Big 2 (min 4) and Mahjong (min 4) cannot do sudden death
  const effectiveMinPlayers = cap.minPlayers || GAME_DEFAULTS[config.gameType]?.minPlayers || 2
  const supportsSuddenDeath = effectiveMinPlayers <= 2

  useEffect(() => {
    if (isLocked && config.gameType !== lockedGameType) {
      const d = GAME_DEFAULTS[lockedGameType] || GAME_DEFAULTS.BIG_TWO
      onChange({ ...config, gameType: lockedGameType, pointTarget: d.pointTarget,
        minPlayers: d.minPlayers, maxPlayers: d.maxPlayers, turnTimerSeconds: d.turnTimer,
        maxBid: d.maxBid, seatsPerTable: d.maxPlayers, minPlayersPerTable: d.minPlayers })
    }
  }, [isLocked, lockedGameType])

  // If sudden death is not supported and currently selected, reset to MOST_ROUNDS_WON
  useEffect(() => {
    if (!supportsSuddenDeath && config.tiebreakRule === 'SUDDEN_DEATH') {
      onChange({ ...config, tiebreakRule: 'MOST_ROUNDS_WON' })
    }
  }, [supportsSuddenDeath, config.tiebreakRule])

  // Ensure tournament size is always valid power of 2
  useEffect(() => {
    if (isTournament && !isPowerOf2(config.maxPlayers)) {
      const safe = nextPowerOf2(config.maxPlayers)
      const m = deriveTournamentMeta(safe, seatsPerTable)
      update({ maxPlayers: m.players, minPlayers: m.players, numberOfTables: m.tables })
    }
  }, [isTournament])

  const update = useCallback(
    (partial: Partial<SocialGameConfig>) => onChange({ ...config, ...partial }),
    [config, onChange],
  )

  const handleGameTypeChange = useCallback((gameType: SocialGameType) => {
    const d = GAME_DEFAULTS[gameType] || GAME_DEFAULTS.BIG_TWO
    onChange({ ...config, gameType, pointTarget: d.pointTarget, minPlayers: d.minPlayers,
      maxPlayers: d.maxPlayers, turnTimerSeconds: d.turnTimer, maxBid: d.maxBid,
      seatsPerTable: d.maxPlayers, minPlayersPerTable: d.minPlayers,
      mahjongVariant: gameType === 'MAHJONG' ? 'HONG_KONG' : undefined })
    setGameDropdownOpen(false)
  }, [config, onChange])

  const seatsPerTable        = config.seatsPerTable || (GAME_DEFAULTS[config.gameType]?.maxPlayers ?? 4)
  const totalCashGamePlayers = isCashGame ? config.numberOfTables * seatsPerTable : config.maxPlayers
  const pointTargetOptions   = POINT_TARGET_OPTIONS[config.gameType] || POINT_TARGET_OPTIONS.BIG_TWO
  const minBuyIn             = config.pointValueUsd * 50

  return (
    <div className={cn('space-y-6', className)}>

      {/* ── MODE TOGGLE ── */}
      <div className={S.section}>
        <label className={S.label}><Layers className="w-4 h-4 text-yellow-400" />Room Type</label>
        <div className="flex gap-3">
          {([
            { mode: 'CASH_GAME' as SocialMode,  icon: Coins,  title: 'Cash Game',  sub: 'Rake-based, open-ended' },
            { mode: 'TOURNAMENT' as SocialMode, icon: Trophy, title: 'Tournament', sub: 'Bracket, entry fee, prizes' },
          ]).map(({ mode, icon: Icon, title, sub }) => (
            <button key={mode} type="button" disabled={disabled}
              onClick={() => update({ socialMode: mode })}
              className={cn(S.modeBtn, config.socialMode === mode ? S.modeBtnActive : S.modeBtnInact, disabled && S.chipDisabled)}>
              <Icon className={cn('w-6 h-6', config.socialMode === mode ? 'text-yellow-400' : 'text-gray-500')} />
              <span className="font-bold text-white text-sm">{title}</span>
              <span className="text-xs text-gray-500 text-center">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── GAME TYPE ── */}
      {!isLocked && (
        <div className={S.section}>
          <label className={S.label}>Game Type</label>
          <div className="relative">
            <button type="button" onClick={() => !disabled && setGameDropdownOpen(!gameDropdownOpen)}
              disabled={disabled}
              className={cn('w-full flex items-center justify-between p-3 rounded-lg border transition-all bg-[#1a1a2e] border-gray-700 hover:border-gray-600',
                disabled && S.chipDisabled, gameDropdownOpen && 'border-yellow-500')}>
              <span className="text-white font-medium">
                {SOCIAL_GAMES.find((g) => g.value === config.gameType)?.label || config.gameType}
              </span>
              <ChevronDown className={cn('w-4 h-4 text-gray-400 transition-transform', gameDropdownOpen && 'rotate-180')} />
            </button>
            {gameDropdownOpen && (
              <div className="absolute z-20 w-full mt-1 bg-[#1a1a2e] border border-gray-700 rounded-lg shadow-xl overflow-hidden">
                {SOCIAL_GAMES.map((game) => (
                  <button key={game.value} type="button" onClick={() => handleGameTypeChange(game.value)}
                    className={cn('w-full text-left p-3 transition-colors hover:bg-yellow-500/10', config.gameType === game.value && 'bg-yellow-500/20')}>
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
      {showMahjong && (
        <div className={S.section}>
          <label className={S.label}>Mahjong Variant</label>
          <div className="relative">
            <select value={config.mahjongVariant || 'HONG_KONG'} onChange={(e) => update({ mahjongVariant: e.target.value })}
              disabled={disabled} className={S.select}>
              {MAHJONG_VARIANTS.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      )}

      {/* ══════════ CASH GAME SETTINGS ══════════ */}
      {isCashGame && (
        <>
          {/* Number of Tables */}
          <div className={S.section}>
            <label className={S.label}><Grid3X3 className="w-4 h-4 text-purple-400" />Number of Tables</label>
            <div className="flex items-center gap-3">
              <button type="button" disabled={disabled || config.numberOfTables <= 1}
                onClick={() => { const n = Math.max(1, config.numberOfTables - 1); update({ numberOfTables: n, tableBreakRule: n === 1 ? 'REBALANCE' : config.tableBreakRule, maxPlayers: n * seatsPerTable }) }}
                className={S.stepBtn}>−</button>
              <input type="number" min={1} step={1} value={config.numberOfTables}
                onChange={(e) => { const v = Math.max(1, parseInt(e.target.value) || 1); update({ numberOfTables: v, tableBreakRule: v === 1 ? 'REBALANCE' : config.tableBreakRule, maxPlayers: v * seatsPerTable }) }}
                disabled={disabled}
                className={cn('w-20 text-center py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-lg font-bold focus:border-yellow-500 focus:outline-none', disabled && 'opacity-50 cursor-not-allowed')} />
              <button type="button" disabled={disabled}
                onClick={() => { const n = config.numberOfTables + 1; update({ numberOfTables: n, maxPlayers: n * seatsPerTable }) }}
                className={S.stepBtn}>+</button>
            </div>
            <p className="text-xs text-gray-500">
              {config.numberOfTables} table{config.numberOfTables > 1 ? 's' : ''} × {seatsPerTable} seats = {totalCashGamePlayers} players max
            </p>
          </div>

          {/* Table Break Rule */}
          {showMultiTable && (
            <div className={S.section}>
              <label className={S.label}><Users className="w-4 h-4 text-orange-400" />Table Break Rule</label>
              <div className="space-y-2">
                {TABLE_BREAK_RULES.map((rule) => (
                  <button key={rule.value} type="button" disabled={disabled} onClick={() => update({ tableBreakRule: rule.value })}
                    className={cn('w-full text-left p-3 rounded-lg border-2 transition-all',
                      config.tableBreakRule === rule.value ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-[#1a1a2e] hover:border-gray-600',
                      disabled && S.chipDisabled)}>
                    <p className={cn('font-medium text-sm', config.tableBreakRule === rule.value ? 'text-white' : 'text-gray-300')}>{rule.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rule.description}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Point Value */}
          <div className={S.section}>
            <label className={S.label}><Coins className="w-4 h-4 text-yellow-400" />Point Value (USD per point)</label>
            <ChipPlusFreeInput presets={POINT_VALUE_PRESETS} value={config.pointValueUsd} disabled={disabled}
              onSelect={(v) => update({ pointValueUsd: v })} inputMin={0.001} inputStep={0.01}
              inputPrefix="$" placeholder="0.25" formatPreset={(v) => `$${v.toFixed(2)}`} />
            <p className="text-xs text-gray-500">Min buy-in: ${minBuyIn.toFixed(2)}</p>
          </div>

          {/* Rake Percentage */}
          <div className={S.section}>
            <label className={S.label}><Percent className="w-4 h-4 text-pink-400" />Rake Percentage</label>
            <div className={S.chipGrid}>
              {RAKE_PERCENT_OPTIONS.map((pct) => (
                <Chip key={pct} selected={config.rakePercentage === pct} disabled={disabled} onClick={() => update({ rakePercentage: pct })}>{pct}%</Chip>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <input type="number" min={1} max={50} step={0.5} value={config.rakePercentage}
                onChange={(e) => { const v = parseFloat(e.target.value); if (!isNaN(v) && v >= 1) update({ rakePercentage: v }) }}
                disabled={disabled} className={cn(S.freeInput, 'w-24')} />
              <span className="text-gray-500 text-sm">% custom</span>
            </div>
          </div>

          {/* Rake Cap */}
          <div className={S.section}>
            <label className={S.label}><Coins className="w-4 h-4 text-pink-400" />Rake Cap (max per round)</label>
            <ChipPlusFreeInput presets={RAKE_CAP_PRESETS} value={config.rakeCapPerRound} disabled={disabled}
              onSelect={(v) => update({ rakeCapPerRound: v })} inputMin={0.01} inputStep={0.01}
              inputPrefix="$" placeholder="5.00" formatPreset={(v) => `$${v}`} />
          </div>

          {/* Game End Condition */}
          <div className={S.section}>
            <label className={S.label}><Target className="w-4 h-4 text-cyan-400" />{config.gameType === 'MAHJONG' ? 'Game Length' : 'Game Ends At'}</label>
            <div className={S.chipGrid}>
              {pointTargetOptions.map((opt) => (
                <Chip key={opt.value} selected={config.pointTarget === opt.value} disabled={disabled} onClick={() => update({ pointTarget: opt.value })}>{opt.label}</Chip>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════ TOURNAMENT SETTINGS ══════════ */}
      {isTournament && (
        <>
          {/* Entry Fee */}
          <div className={S.section}>
            <label className={S.label}><Coins className="w-4 h-4 text-yellow-400" />Entry Fee</label>
            <ChipPlusFreeInput presets={ENTRY_FEE_PRESETS} value={config.entryFee} disabled={disabled}
              onSelect={(v) => update({ entryFee: v })} inputMin={0.01} inputStep={0.01}
              inputPrefix="$" placeholder="5.00" formatPreset={(v) => `$${v}`} />
          </div>

          {/* Tournament Size */}
          <div className={S.section}>
            <LabelWithTooltip icon={Layers} iconClass="text-purple-400" label="Tournament Size (Single Elimination)"
              tooltip="Must be a power of 2 for a balanced bracket. Bracket rounds and tables are auto-calculated. Each table plays until one winner advances." />
            <PowerOf2Stepper
              value={config.maxPlayers} seatsPerTable={seatsPerTable} disabled={disabled}
              capMax={cap.maxPlayers || 0}
              onChange={(players, rounds, tables) => update({ maxPlayers: players, minPlayers: players, numberOfTables: tables })}
            />
          </div>

          {/* Players Advance Per Table */}
          <div className={S.section}>
            <LabelWithTooltip icon={Users} iconClass="text-cyan-400" label="Players Advance Per Table"
              tooltip="How many players from each table move on to the next round. 1 = only the table winner advances (strictest). 2 = top 2 advance (more forgiving, fills next round faster)." />
            <div className="grid grid-cols-2 gap-2">
              {([
                { value: 1 as const, label: '1 Advances', sub: 'Table winner only. Strictest format.' },
                { value: 2 as const, label: '2 Advance',  sub: 'Top 2 from each table move on.' },
              ]).map(({ value, label, sub }) => (
                <button key={value} type="button" disabled={disabled}
                  onClick={() => update({ playersAdvancePerTable: value })}
                  className={cn('p-3 rounded-lg border-2 transition-all text-left',
                    config.playersAdvancePerTable === value ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-[#1a1a2e] hover:border-gray-600',
                    disabled && S.chipDisabled)}>
                  <p className={cn('font-bold text-sm', config.playersAdvancePerTable === value ? 'text-white' : 'text-gray-300')}>{label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{sub}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Tiebreak Rule */}
          <div className={S.section}>
            <LabelWithTooltip icon={Zap} iconClass="text-orange-400" label="Tiebreak Rule"
              tooltip={`How to resolve ties when multiple players have the same score. ${!supportsSuddenDeath ? `Sudden Death is not available for ${config.gameType === 'BIG_TWO' ? 'Big 2' : config.gameType === 'MAHJONG' ? 'Mahjong' : 'this game'} because it requires at least ${effectiveMinPlayers} players per match.` : ''}`} />
            <div className="space-y-2">
              {([
                {
                  value: 'MOST_ROUNDS_WON' as TiebreakRule,
                  label: 'Most Rounds Won',
                  description: 'The tied player who won more individual rounds at the table advances. No extra play needed — uses existing data.',
                  available: true,
                },
                {
                  value: 'SUDDEN_DEATH' as TiebreakRule,
                  label: 'Sudden Death',
                  description: `Play one extra round between tied players only. Most exciting but requires a full ${effectiveMinPlayers}-player table.`,
                  available: supportsSuddenDeath,
                  unavailableReason: `Requires 2-player match. ${config.gameType === 'BIG_TWO' ? 'Big 2' : config.gameType === 'MAHJONG' ? 'Mahjong' : 'This game'} needs ${effectiveMinPlayers} players minimum.`,
                },
                {
                  value: 'RANDOM_DRAW' as TiebreakRule,
                  label: 'Random Draw',
                  description: 'Coin flip between tied players. Fair but unpredictable. Use as last resort.',
                  available: true,
                },
              ]).map(({ value, label, description, available, unavailableReason }) => (
                <button key={value} type="button"
                  disabled={disabled || !available}
                  onClick={() => available && update({ tiebreakRule: value })}
                  className={cn('w-full text-left p-3 rounded-lg border-2 transition-all',
                    config.tiebreakRule === value && available ? 'border-yellow-500 bg-yellow-500/10' : 'border-gray-700 bg-[#1a1a2e]',
                    available && !disabled && 'hover:border-gray-600',
                    (!available || disabled) && 'opacity-40 cursor-not-allowed')}>
                  <div className="flex items-center justify-between">
                    <p className={cn('font-medium text-sm', config.tiebreakRule === value && available ? 'text-white' : 'text-gray-300')}>
                      {label}
                    </p>
                    {!available && <span className="text-xs text-red-400 px-2 py-0.5 rounded-full border border-red-500/30 bg-red-500/10">Not Available</span>}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {!available ? unavailableReason : description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Prize Distribution */}
          <div className={S.section}>
            <label className={S.label}><Trophy className="w-4 h-4 text-green-400" />Prize Split</label>
            <div className={cn(S.chipGrid, 'mb-3')}>
              {[
                { label: 'Top 1',  dist: { '1': 100 } as Record<string, number> },
                { label: 'Top 2',  dist: { '1': 70, '2': 30 } as Record<string, number> },
                { label: 'Top 3',  dist: { '1': 50, '2': 30, '3': 20 } as Record<string, number> },
                { label: 'Top 5',  dist: { '1': 40, '2': 25, '3': 15, '4': 12, '5': 8 } as Record<string, number> },
                { label: 'Top 10', dist: { '1': 30, '2': 18, '3': 12, '4': 9, '5': 7, '6': 6, '7': 5, '8': 5, '9': 4, '10': 4 } as Record<string, number> },
              ].map((preset) => {
                const isSelected = JSON.stringify(config.prizeDistribution) === JSON.stringify(preset.dist)
                return (
                  <Chip key={preset.label} selected={isSelected} disabled={disabled} onClick={() => update({ prizeDistribution: preset.dist })}>{preset.label}</Chip>
                )
              })}
            </div>
            <div className="space-y-2">
              {Object.entries(config.prizeDistribution || {}).map(([pos, pct]) => (
                <div key={pos} className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 w-8 text-right">#{pos}</span>
                  <input type="number" min={0} max={100} value={pct}
                    onChange={(e) => update({ prizeDistribution: { ...config.prizeDistribution, [pos]: parseInt(e.target.value) || 0 } })}
                    disabled={disabled} className="flex-1 px-3 py-1.5 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm focus:border-yellow-500 focus:outline-none w-20" />
                  <span className="text-xs text-gray-500">%</span>
                  {Object.keys(config.prizeDistribution || {}).length > 1 && (
                    <button type="button" disabled={disabled}
                      onClick={() => { const d = { ...config.prizeDistribution }; delete d[pos]; update({ prizeDistribution: d }) }}
                      className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
                  )}
                </div>
              ))}
            </div>
            <button type="button" disabled={disabled}
              onClick={() => {
                const positions = Object.keys(config.prizeDistribution || {})
                const nextPos = positions.length > 0 ? String(Math.max(...positions.map(Number)) + 1) : '1'
                update({ prizeDistribution: { ...config.prizeDistribution, [nextPos]: 0 } })
              }}
              className={cn('mt-2 px-4 py-1.5 rounded-lg border text-xs font-medium transition-all bg-[#1a1a2e] border-gray-700 text-gray-400 hover:border-green-500 hover:text-green-400', disabled && 'opacity-50 cursor-not-allowed')}>
              + Add Position
            </button>
            {(() => {
              const total = Object.values(config.prizeDistribution || {}).reduce((s, v) => s + v, 0)
              return total !== 100
                ? <p className="text-xs text-red-400 mt-1">Total must equal 100% (currently {total}%)</p>
                : <p className="text-xs text-green-400 mt-1">Total: 100% ✓</p>
            })()}
          </div>

          {/* Point Target */}
          {pointTargetOptions.length > 1 && (
            <div className={S.section}>
              <label className={S.label}><Target className="w-4 h-4 text-cyan-400" />{config.gameType === 'MAHJONG' ? 'Game Length' : 'Race To'}</label>
              <div className={S.chipGrid}>
                {pointTargetOptions.filter((opt) => opt.value > 0).map((opt) => (
                  <Chip key={opt.value} selected={config.pointTarget === opt.value} disabled={disabled} onClick={() => update({ pointTarget: opt.value })}>{opt.label}</Chip>
                ))}
              </div>
            </div>
          )}

          {/* Turn Timer */}
          <div className={S.section}>
            <label className={S.label}><Timer className="w-4 h-4 text-cyan-400" />Turn Timer</label>
            <div className={S.chipGrid}>
              {TIMER_OPTIONS.map((opt) => (
                <Chip key={opt.value} selected={config.turnTimerSeconds === opt.value} disabled={disabled} onClick={() => update({ turnTimerSeconds: opt.value })}>{opt.label}</Chip>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ══════════ COMMON SETTINGS ══════════ */}

      {/* Currency */}
      <div className={S.section}>
        <label className={S.label}>Currency</label>
        <div className={S.chipGrid}>
          {CURRENCIES.map((c) => (
            <Chip key={c.value} selected={config.currency === c.value} disabled={disabled} onClick={() => update({ currency: c.value, entryCurrency: c.value })}>{c.label}</Chip>
          ))}
        </div>
      </div>

      {/* Turn Timer (cash game) */}
      {isCashGame && (
        <div className={S.section}>
          <label className={S.label}><Timer className="w-4 h-4 text-cyan-400" />Turn Timer</label>
          <div className={S.chipGrid}>
            {TIMER_OPTIONS.map((opt) => (
              <Chip key={opt.value} selected={config.turnTimerSeconds === opt.value} disabled={disabled} onClick={() => update({ turnTimerSeconds: opt.value })}>{opt.label}</Chip>
            ))}
          </div>
        </div>
      )}

      {/* Visibility */}
      <div className={S.section}>
        <label className={S.label}>Visibility</label>
        <div className="flex gap-2">
          <button type="button" disabled={disabled} onClick={() => update({ visibility: 'PRIVATE_CODE' })}
            className={cn(S.toggleBtn, config.visibility === 'PRIVATE_CODE' ? S.toggleActive : S.toggleInact, disabled && S.chipDisabled)}>
            <EyeOff className="w-4 h-4" /> Private (Code)
          </button>
          <button type="button" disabled={disabled} onClick={() => update({ visibility: 'PUBLIC_LISTED' })}
            className={cn(S.toggleBtn, config.visibility === 'PUBLIC_LISTED' ? S.toggleActive : S.toggleInact, disabled && S.chipDisabled)}>
            <Eye className="w-4 h-4" /> Public (Listed)
          </button>
        </div>
      </div>

      {/* Host Role */}
      <div className={S.section}>
        <label className={S.label}>Host Role</label>
        <div className="flex gap-2">
          <button type="button" disabled={disabled} onClick={() => update({ hostRole: 'PLAYER' })}
            className={cn(S.toggleBtn, config.hostRole === 'PLAYER' ? S.toggleActive : S.toggleInact, disabled && S.chipDisabled)}>
            <UserCheck className="w-4 h-4" /> Play in Room
          </button>
          <button type="button" disabled={disabled} onClick={() => update({ hostRole: 'MONITOR' })}
            className={cn(S.toggleBtn, config.hostRole === 'MONITOR' ? S.toggleActive : S.toggleInact, disabled && S.chipDisabled)}>
            <MonitorSmartphone className="w-4 h-4" /> Monitor Only
          </button>
        </div>
        <p className="text-xs text-gray-500">
          {config.hostRole === 'PLAYER' ? 'You will join the room as a player.' : 'You can see board and scores but NOT player hands (anti-cheat).'}
        </p>
      </div>

      {/* ── Summary ── */}
      {isCashGame && (
        <div className="flex items-start gap-3 p-3 bg-[#1a1a2e] rounded-lg">
          <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-500">
            {config.numberOfTables > 1 ? `${config.numberOfTables} tables × ${seatsPerTable} seats = ${totalCashGamePlayers} players max. ` : ''}
            {config.rakePercentage}% rake per round (cap: ${typeof config.rakeCapPerRound === 'number' ? config.rakeCapPerRound.toFixed(2) : config.rakeCapPerRound}).
            {config.pointTarget > 0 ? ` Game ends at ${config.pointTarget} points.` : ' Game runs until all players cash out.'}
            {showMultiTable ? ` When a table drops below ${config.minPlayersPerTable} players, ${config.tableBreakRule === 'REBALANCE' ? 'players are moved to other tables' : 'the table closes and players are cashed out'}.` : ''}
          </p>
        </div>
      )}

      {isTournament && (() => {
        const meta = deriveTournamentMeta(config.maxPlayers, seatsPerTable)
        return (
          <div className="p-4 bg-gradient-to-r from-purple-500/10 to-yellow-500/10 rounded-lg border border-purple-500/20">
            <div className="flex items-center gap-2 mb-3">
              <Info className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium text-white">Tournament Preview</span>
            </div>
            <div className="grid grid-cols-4 gap-3 text-center">
              <div><p className="text-xs text-gray-500">Entry Fee</p><p className="text-lg font-bold text-white">${config.entryFee}</p></div>
              <div><p className="text-xs text-gray-500">Players</p><p className="text-lg font-bold text-white">{meta.players}</p></div>
              <div><p className="text-xs text-gray-500">Rounds</p><p className="text-lg font-bold text-white">{meta.rounds}</p></div>
              <div><p className="text-xs text-gray-500">Prize Pool</p><p className="text-lg font-bold text-green-400">${(config.entryFee * meta.players * 0.9).toFixed(2)}</p></div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-700/50 grid grid-cols-2 gap-2 text-xs text-gray-500">
              <span>Advance per table: <span className="text-white font-medium">{config.playersAdvancePerTable}</span></span>
              <span>Tiebreak: <span className="text-white font-medium">{config.tiebreakRule.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())}</span></span>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

// =============================================================================
// DEFAULT CONFIG
// =============================================================================

export function createDefaultSocialGameConfig(
  gameType?: SocialGameType,
  capabilities?: GameCapabilities,
): SocialGameConfig {
  const gt  = gameType || 'BIG_TWO'
  const d   = GAME_DEFAULTS[gt] || GAME_DEFAULTS.BIG_TWO
  const cap = capabilities || DEFAULT_CAPABILITIES
  const supportsSuddenDeath = (cap.minPlayers || d.minPlayers) <= 2

  return {
    socialMode:             'CASH_GAME',
    gameType:               gt,
    mahjongVariant:         gt === 'MAHJONG' ? 'HONG_KONG' : undefined,
    pointValueUsd:          0.25,
    rakePercentage:         5,
    rakeCapPerRound:        5,
    turnTimerSeconds:       d.turnTimer,
    pointTarget:            gt === 'MAHJONG' ? 4 : d.pointTarget,
    maxRounds:              undefined,
    maxBid:                 d.maxBid,
    springBonus:            false,
    entryFee:               5,
    entryCurrency:          'USDT_BSC',
    prizePool:              0,
    prizeDistribution:      { '1': 50, '2': 30, '3': 20 },
    numberOfTables:         1,
    minPlayersPerTable:     d.minPlayers,
    tableBreakRule:         'REBALANCE',
    seatsPerTable:          d.maxPlayers,
    playersAdvancePerTable: 1,
    tiebreakRule:           'MOST_ROUNDS_WON',
    minPlayers:             d.minPlayers,
    maxPlayers:             d.maxPlayers,
    currency:               'USDT_BSC',
    visibility:             'PRIVATE_CODE',
    hostRole:               'PLAYER',
  }
}