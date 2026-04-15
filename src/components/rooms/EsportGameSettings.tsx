// =============================================================================
// EsportGameSettings.tsx -- packages/game-ui/src/components/rooms/EsportGameSettings.tsx
//
// v3.3.3 changes:
//   - Added GameCapabilities prop -- hides/disables unsupported options
//   - Single Elimination card hidden if !capabilities.supportsSingleElimination
//   - FFA card hidden if !capabilities.supportsFFA
//   - Sync mode hidden if !capabilities.supportsSync
//   - Async mode hidden if !capabilities.supportsAsync
//   - Duration clamped to capabilities.min/maxMatchDurationSeconds
//   - Player count clamped to capabilities.min/maxPlayers
//   - createDefaultEsportGameConfig accepts capabilities for valid defaults
// =============================================================================

import { useState, useCallback } from 'react'
import {
  DollarSign, Users, Timer, Trophy, Eye, EyeOff,
  Swords, Clock, AlertCircle, ChevronDown, Info,
  HelpCircle, Lock, Zap,
} from 'lucide-react'
import { cn } from '../../utils'
import { GameCapabilities, DEFAULT_CAPABILITIES } from '../../types/GameCapabilities'

// =============================================================================
// TYPES
// =============================================================================

export type GameMode =
  | 'SYNC'              // Real-time multiplayer (all players play simultaneously)
  | 'ASYNC'             // Score-attack (play before deadline, scores compared at end)
  | 'BLITZ_1V1'         // Short real-time 1v1 (e.g. Candy Duel 60s rounds)
  | 'DUEL_1V1'          // Full real-time 1v1 (e.g. Bubble Battle full match)
  | 'SINGLE_PLAYER'     // Solo score attack (async, no opponent, ranked by score)
  | 'TURN_BASED'        // Turn-based multiplayer (players take turns, not real-time)
export type RoomVisibility = 'PUBLIC_LISTED' | 'UNLISTED'
export type TournamentFormat = 'SINGLE_ELIMINATION' | 'FFA'

export interface PrizeDistribution {
  [position: string]: number
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
  tournamentFormat: TournamentFormat
  /** Platform fee percentage (default 10). Host tier may reduce this. */
  platformFeePercent: number
}

export interface EsportGameSettingsProps {
  config: EsportGameConfig
  onChange: (config: EsportGameConfig) => void
  /** Game capabilities from GET /api/v1/games/:gameId -- filters available options */
  capabilities?: GameCapabilities
  disabled?: boolean
  className?: string
  currencies?: string[]
}

// =============================================================================
// CONSTANTS
// =============================================================================

const ENTRY_FEE_PRESETS = [0, 1, 5, 10, 25, 50, 100, 250, 500]
const DURATION_PRESETS = [60, 120, 180, 300, 600, 900, 1800]
const ROUNDS_PRESETS = [1, 3, 5, 7]
const FFA_PLAYER_PRESETS    = [2, 3, 4, 6, 8, 10, 16, 32, 64]
const DEFAULT_CURRENCIES    = ['USDT_BSC', 'USDC_BSC', 'BNB', 'USDT_TRON', 'USDC_TRON']
const CURRENCY_LABELS: Record<string, string> = {
  BNB: 'BNB', USDT_BSC: 'USDT (BSC)', USDT_TRON: 'USDT (TRC20)',
  USDC_BSC: 'USDC (BSC)', USDC_TRON: 'USDC (TRC20)',
}
const PRESET_PRIZE_SPLITS: { label: string; distribution: PrizeDistribution }[] = [
  { label: 'Winner Takes All', distribution: { '1': 100 } },
  { label: 'Top 2 Split',      distribution: { '1': 70, '2': 30 } },
  { label: 'Top 3 Split',      distribution: { '1': 60, '2': 30, '3': 10 } },
  { label: 'Even Top 3',       distribution: { '1': 50, '2': 30, '3': 20 } },
  { label: 'Top 5',            distribution: { '1': 40, '2': 25, '3': 15, '4': 12, '5': 8 } },
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
function deriveSEMeta(players: number) {
  const safeP = isPowerOf2(players) ? players : nextPowerOf2(players)
  return { players: safeP, rounds: Math.log2(safeP) }
}

// =============================================================================
// STYLES
// =============================================================================

const S = {
  container:    'space-y-5',
  section:      'space-y-2',
  label:        'flex items-center gap-2 text-sm font-medium text-gray-300',
  chipGrid:     'flex flex-wrap gap-2',
  chip:         'px-4 py-2 rounded-lg border text-center transition-all cursor-pointer text-sm font-medium',
  chipActive:   'bg-cyan-500/20 border-cyan-500 text-white',
  chipInactive: 'bg-[#1a1a2e] border-gray-700 text-gray-300 hover:border-gray-600',
  chipDisabled: 'opacity-50 cursor-not-allowed',
  selectWrap:   'relative',
  select:       'w-full p-3 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm appearance-none pr-10 focus:border-cyan-500 focus:outline-none',
  freeInput:    'px-3 py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg text-white text-sm focus:border-cyan-500 focus:outline-none',
  infoBox:      'flex items-start gap-3 p-3 bg-[#1a1a2e] rounded-lg',
  infoText:     'text-xs text-gray-500',
  stepBtn:      'w-10 h-10 rounded-lg border text-lg font-bold transition-all bg-[#1a1a2e] border-gray-700 text-white hover:border-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed',
  readOnly:     'flex items-center gap-2 px-3 py-2 bg-gray-900/50 border border-gray-800 rounded-lg text-gray-400 text-sm',
  unavailable:  'opacity-30 cursor-not-allowed pointer-events-none',
}

// =============================================================================
// TOOLTIP
// =============================================================================

function Tooltip({ children, content }: { children: React.ReactNode; content: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
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
// ORDINAL HELPER
const ordinal = (n: number) => {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

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

function ChipPlusFreeInput({ presets, value, disabled, onSelect, inputMin, inputMax,
  inputStep, inputPrefix, inputSuffix, placeholder, formatPreset }: {
  presets: number[]; value: number; disabled?: boolean; onSelect: (v: number) => void
  inputMin?: number; inputMax?: number; inputStep?: number
  inputPrefix?: string; inputSuffix?: string; placeholder?: string
  formatPreset?: (v: number) => string
}) {
  const validPresets = presets.filter((p) =>
    (inputMin === undefined || p >= inputMin) &&
    (inputMax === undefined || inputMax === 0 || p <= inputMax)
  )
  const isCustom = !validPresets.includes(value)
  return (
    <div className="space-y-2">
      <div className={S.chipGrid}>
        {validPresets.map((p) => (
          <Chip key={p} selected={value === p} disabled={disabled} onClick={() => onSelect(p)}>
            {formatPreset ? formatPreset(p) : String(p)}
          </Chip>
        ))}
        <Chip selected={isCustom} disabled={disabled} onClick={() => {
  if (!isCustom) { onSelect(inputMin ?? 0); }
}}>Custom</Chip>
      </div>
      {isCustom && (
        <div className="flex items-center gap-2">
          {inputPrefix && <span className="text-gray-500 text-sm">{inputPrefix}</span>}
          <input type="number" min={inputMin ?? 0} max={inputMax || undefined}
            step={inputStep ?? 1} value={value}
            onChange={(e) => {
              let v = parseFloat(e.target.value)
              if (isNaN(v)) return
              if (inputMin !== undefined) v = Math.max(inputMin, v)
              if (inputMax !== undefined && inputMax > 0) v = Math.min(inputMax, v)
              onSelect(v)
            }}
            disabled={disabled} placeholder={placeholder}
            className={cn(S.freeInput, 'w-32')}
          />
          {inputSuffix && <span className="text-gray-500 text-sm">{inputSuffix}</span>}
        </div>
      )}
    </div>
  )
}

// =============================================================================
// SE PLAYER STEPPER
// =============================================================================

function SEPlayerStepper({ value, disabled, onChange, capMin, capMax }: {
  value: number; disabled?: boolean
  onChange: (players: number, rounds: number) => void
  capMin: number; capMax: number
}) {
  const meta   = deriveSEMeta(Math.max(value, capMin))
  const canDec = meta.players > Math.max(MIN_SE_SIZE, capMin)
  const canInc = capMax === 0 || meta.players * 2 <= capMax

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <button type="button" disabled={disabled || !canDec}
          onClick={() => { const n = prevPowerOf2(meta.players); const m = deriveSEMeta(n); onChange(m.players, m.rounds) }}
          className={S.stepBtn}>−</button>
        <div className="flex-1 text-center py-2 bg-[#1a1a2e] border border-gray-700 rounded-lg">
          <span className="text-white text-xl font-bold">{meta.players}</span>
          <span className="text-gray-500 text-sm ml-2">players</span>
        </div>
        <button type="button" disabled={disabled || !canInc}
          onClick={() => { const n = meta.players * 2; const m = deriveSEMeta(n); onChange(m.players, m.rounds) }}
          className={S.stepBtn}>+</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className={S.readOnly}><Lock className="w-3 h-3 flex-shrink-0" /><span className="text-xs">{meta.rounds} rounds (auto)</span></div>
        <div className={S.readOnly}><Lock className="w-3 h-3 flex-shrink-0" /><span className="text-xs">{meta.players} → {meta.players / 2} → 1 winner</span></div>
      </div>
      <p className="text-xs text-gray-500">
        Must be a power of 2. Steps: {meta.players} → {canInc ? meta.players * 2 : '—'}
      </p>
    </div>
  )
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function EsportGameSettings({
  config, onChange, capabilities, disabled = false, className, currencies,
}: EsportGameSettingsProps) {
  const cap  = capabilities || DEFAULT_CAPABILITIES
  const isSE = config.tournamentFormat === 'SINGLE_ELIMINATION'
  const isFFA = config.tournamentFormat === 'FFA'
  const availableCurrencies = currencies || DEFAULT_CURRENCIES

  // How many format options are available
  const formatCount = [cap.supportsSingleElimination, cap.supportsFFA].filter(Boolean).length

  // Build available game modes from capabilities
  type ModeOption = { mode: GameMode; icon: typeof Swords; iconClass: string; title: string; subtitle: string }
  const availableModes: ModeOption[] = [
    ...(cap.supportsSync ? [{
      mode: 'SYNC' as GameMode, icon: Swords, iconClass: 'text-amber-400',
      title: 'Synchronous', subtitle: 'Real-time multiplayer',
    }] : []),
    ...(cap.supportsAsync ? [{
      mode: 'ASYNC' as GameMode, icon: Clock, iconClass: 'text-blue-400',
      title: 'Asynchronous', subtitle: 'Play before deadline',
    }] : []),
    ...(cap.supportsBlitz1v1 ? [{
      mode: 'BLITZ_1V1' as GameMode, icon: Zap, iconClass: 'text-pink-400',
      title: 'Blitz 1v1', subtitle: 'Short burst duel',
    }] : []),
    ...(cap.supportsDuel1v1 ? [{
      mode: 'DUEL_1V1' as GameMode, icon: Swords, iconClass: 'text-red-400',
      title: 'Duel 1v1', subtitle: 'Full match head-to-head',
    }] : []),
    ...(cap.supportsSinglePlayerMode ? [{
      mode: 'SINGLE_PLAYER' as GameMode, icon: Trophy, iconClass: 'text-emerald-400',
      title: 'Single Player', subtitle: 'Solo score attack',
    }] : []),
    ...(cap.supportsTurnBased ? [{
      mode: 'TURN_BASED' as GameMode, icon: Clock, iconClass: 'text-violet-400',
      title: 'Turn-Based', subtitle: 'Players take turns',
    }] : []),
  ]

  const update = useCallback(
    (partial: Partial<EsportGameConfig>) => onChange({ ...config, ...partial }),
    [config, onChange],
  )

  const grossPool    = config.entryFee * config.maxPlayers
  const platformFee  = config.platformFeePercent ?? 10
  const platformRake = grossPool * (platformFee / 100)
  const netPool      = grossPool - platformRake
  const prizeTotal   = Object.values(config.prizeDistribution).reduce((s, v) => s + v, 0)
  const isPrizeValid = Math.abs(prizeTotal - 100) < 0.01

  const formatDuration = (secs: number) => {
    if (secs < 60) return `${secs}s`
    const m = Math.floor(secs / 60); const s = secs % 60
    return s > 0 ? `${m}m ${s}s` : `${m} min`
  }

  // Duration presets filtered by capabilities
  // Filter duration presets by capabilities
  const validDurations = DURATION_PRESETS.filter((d) =>
    (cap.minMatchDurationSeconds === 0 || d >= cap.minMatchDurationSeconds) &&
    (cap.maxMatchDurationSeconds === 0 || d <= cap.maxMatchDurationSeconds)
  )

  return (
    <div className={cn(S.container, className)}>

      {/* ── TOURNAMENT FORMAT ── */}
      {formatCount > 0 && (
        <div className={S.section}>
          <LabelWithTooltip icon={Trophy} iconClass="text-yellow-400" label="Tournament Format"
            tooltip="Choose how players compete. Single Elimination pairs players head-to-head — lose once and you're out. FFA puts all players in one session simultaneously and ranks them by score." />
          <div className={cn('grid gap-3', formatCount === 2 ? 'grid-cols-2' : 'grid-cols-1')}>

            {/* Single Elimination */}
            {cap.supportsSingleElimination && (
              <button type="button" disabled={disabled}
                onClick={() => {
                  const safe = isPowerOf2(config.maxPlayers) ? config.maxPlayers : nextPowerOf2(Math.max(config.maxPlayers, cap.minPlayers))
                  const m = deriveSEMeta(safe)
                  update({ tournamentFormat: 'SINGLE_ELIMINATION', maxPlayers: m.players, minPlayers: m.players, roundsCount: 1 })
                }}
                className={cn('w-full p-4 rounded-xl border-2 transition-all text-left',
                  isSE ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 bg-[#1a1a2e] hover:border-gray-600',
                  disabled && S.chipDisabled)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Swords className={cn('w-5 h-5', isSE ? 'text-cyan-400' : 'text-gray-500')} />
                  <span className="font-bold text-white text-sm">Single Elimination</span>
                  <Tooltip content="Players are paired 1v1 each round. Winner advances, loser is eliminated. Continues until one player remains. Requires power-of-2 player count (8, 16, 32...) for a balanced bracket.">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-xs text-gray-500">1v1 per round. Lose once = eliminated.</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">Bracket</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">Power of 2</span>
                </div>
              </button>
            )}

            {/* FFA */}
            {cap.supportsFFA && (
              <button type="button" disabled={disabled}
                onClick={() => update({ tournamentFormat: 'FFA', roundsCount: 1 })}
                className={cn('w-full p-4 rounded-xl border-2 transition-all text-left',
                  isFFA ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 bg-[#1a1a2e] hover:border-gray-600',
                  disabled && S.chipDisabled)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Zap className={cn('w-5 h-5', isFFA ? 'text-yellow-400' : 'text-gray-500')} />
                  <span className="font-bold text-white text-sm">FFA</span>
                  <Tooltip content="Free For All — all players compete in the same session simultaneously. No head-to-head pairing. Players are ranked by score at the end. FFA-3 means 3 players, FFA-4 means 4 players, etc.">
                    <HelpCircle className="w-3.5 h-3.5 text-gray-600 hover:text-gray-400 cursor-help" />
                  </Tooltip>
                </div>
                <p className="text-xs text-gray-500">All players compete simultaneously. Ranked by score.</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">Score-based</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500 border border-gray-700">
                    {cap.minPlayers === cap.maxPlayers ? `${cap.minPlayers} players` : `${cap.minPlayers}-${cap.maxPlayers || '∞'} players`}
                  </span>
                </div>
              </button>
            )}
          </div>

          {/* Warning if game doesn't support any format */}
          {formatCount === 0 && (
            <div className={S.infoBox}>
              <AlertCircle className="w-4 h-4 text-yellow-500 flex-shrink-0" />
              <p className="text-xs text-yellow-400">This game does not support any tournament format. Contact the developer to update game capabilities.</p>
            </div>
          )}
        </div>
      )}

      {/* ── ENTRY FEE ── */}
      <div className={S.section}>
        <LabelWithTooltip icon={DollarSign} iconClass="text-cyan-400" label="Entry Fee"
          tooltip="Amount each player pays to enter. All fees go into the prize pool. 10% platform fee is deducted before prize distribution." />
        <ChipPlusFreeInput
          presets={ENTRY_FEE_PRESETS} value={config.entryFee} disabled={disabled}
          onSelect={(v) => update({ entryFee: v })}
          inputMin={0} inputStep={0.01} inputPrefix="$" placeholder="5.00"
          formatPreset={(v) => v === 0 ? 'FREE' : `$${v}`}
        />
        {config.entryFee === 0 && (
          <p className="text-xs text-green-400/70 mt-1">Free entry -- no wallet required. No platform fee collected.</p>
        )}
      </div>

      {/* -- CURRENCY -- */}
      <div className={S.section} style={config.entryFee === 0 ? { opacity: 0.3, pointerEvents: 'none' } : undefined}>
        <label className={S.label}><DollarSign className="w-4 h-4 text-green-400" />Currency</label>
        <div className={S.selectWrap}>
          <select value={config.entryCurrency} onChange={(e) => update({ entryCurrency: e.target.value })}
            disabled={disabled} className={S.select}>
            {availableCurrencies.map((c) => (
              <option key={c} value={c}>{CURRENCY_LABELS[c] || c}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
        </div>
      </div>

      {/* ── PLAYER COUNT ── */}
      <div className={S.section}>
        <LabelWithTooltip icon={Users} iconClass="text-purple-400"
          label={isSE ? 'Bracket Size' : 'Player Count'}
          tooltip={isSE
            ? `Single Elimination requires a power of 2 for a balanced bracket. Min: ${cap.minPlayers}${cap.maxPlayers ? `, max: ${cap.maxPlayers}` : ''}.`
            : `FFA supports ${cap.minPlayers === cap.maxPlayers ? `exactly ${cap.minPlayers}` : `${cap.minPlayers} to ${cap.maxPlayers || '∞'}`} players. All compete simultaneously.`
          }
        />
        {isSE ? (
          <SEPlayerStepper
            value={config.maxPlayers} disabled={disabled}
            capMin={Math.max(cap.minPlayers, MIN_SE_SIZE)}
            capMax={cap.maxTournamentSize || cap.maxPlayers || 256}
            onChange={(players, rounds) => update({ maxPlayers: players, minPlayers: players })}
          />
        ) : (
          <ChipPlusFreeInput
            presets={FFA_PLAYER_PRESETS} value={config.maxPlayers} disabled={disabled}
            onSelect={(v) => update({ maxPlayers: v, minPlayers: v })}
            inputMin={cap.minPlayers} inputMax={cap.maxPlayers}
            inputStep={1} placeholder={String(cap.minPlayers)}
            formatPreset={(v) => v === 2 ? '1v1' : `FFA-${v}`}
          />
        )}
      </div>

      {/* ── GAME MODE ── */}
      {availableModes.length > 0 && (
        <div className={S.section}>
          <LabelWithTooltip icon={Swords} iconClass="text-amber-400" label="Game Mode"
            tooltip="How players interact. Sync = all play at once. Async = play before deadline. Blitz = short 1v1. Duel = full 1v1. Single Player = solo score attack. Turn-Based = take turns." />
          <div className={cn('grid gap-2', availableModes.length >= 4 ? 'grid-cols-3' : availableModes.length >= 2 ? 'grid-cols-2' : 'grid-cols-1')}>
            {availableModes.map(({ mode, icon: ModeIcon, iconClass, title, subtitle }) => (
              <button key={mode} type="button" disabled={disabled} onClick={() => update({ mode })}
                className={cn('p-3 rounded-lg border-2 transition-all text-center',
                  config.mode === mode ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 bg-[#1a1a2e] hover:border-gray-600',
                  disabled && S.chipDisabled)}>
                <ModeIcon className={cn('w-5 h-5 mx-auto mb-1', iconClass)} />
                <p className="text-sm font-bold text-white">{title}</p>
                <p className="text-xs text-gray-500">{subtitle}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MATCH DURATION ── */}
      <div className={S.section}>
        <LabelWithTooltip icon={Timer} iconClass="text-cyan-400" label="Match Duration"
          tooltip={`How long each individual match lasts.${cap.minMatchDurationSeconds > 0 ? ` Min: ${formatDuration(cap.minMatchDurationSeconds)}.` : ''}${cap.maxMatchDurationSeconds > 0 ? ` Max: ${formatDuration(cap.maxMatchDurationSeconds)}.` : ''}`}
        />
        <ChipPlusFreeInput
          presets={validDurations} value={config.matchDurationSeconds} disabled={disabled}
          onSelect={(v) => update({ matchDurationSeconds: v })}
          inputMin={cap.minMatchDurationSeconds || 10}
          inputMax={cap.maxMatchDurationSeconds || undefined}
          inputStep={10} inputSuffix="seconds"
          placeholder="180"
          formatPreset={(v) => formatDuration(v)}
        />
      </div>

      {/* ── ROUNDS PER MATCH (SE only) ── */}
      {isSE && (
        <div className={S.section}>
          <LabelWithTooltip icon={Trophy} iconClass="text-yellow-400" label="Rounds Per Match"
            tooltip="How many games are played within each 1v1 matchup. Best of 3 = first to win 2 games advances. Always odd so there is always a winner." />
          <ChipPlusFreeInput
            presets={ROUNDS_PRESETS} value={config.roundsCount} disabled={disabled}
            onSelect={(v) => {
              let r = Math.max(1, Math.round(v))
              if (r % 2 === 0) r = r + 1
              update({ roundsCount: r })
            }}
            inputMin={1} inputStep={2}
            inputSuffix={`rounds (first to ${Math.ceil(config.roundsCount / 2)} wins)`}
            placeholder="3"
            formatPreset={(v) => v === 1 ? '1 Round' : `Bo${v}`}
          />
        </div>
      )}

      {/* ── PRIZE DISTRIBUTION / PLACEMENT RANKING ── */}
      <div className={S.section}>
        <LabelWithTooltip icon={Trophy} iconClass="text-green-400"
          label={config.entryFee === 0 ? 'Placement Ranking' : 'Prize Split'}
          tooltip={config.entryFee === 0
            ? 'Free event -- select how many positions to rank. Placement is determined by score.'
            : 'How the net prize pool is distributed. Must total 100%. For FFA you can pay multiple positions. For Single Elimination, Winner Takes All is most common.'} />
        {config.entryFee === 0 && (
          <p className="text-xs text-green-400/70 mb-2">Free event -- placement is ranked by score. Select how many positions to rank.</p>
        )}
        <div className={S.chipGrid}>
          {PRESET_PRIZE_SPLITS.map((preset) => {
            const isSelected = JSON.stringify(config.prizeDistribution) === JSON.stringify(preset.distribution)
            return (
              <Chip key={preset.label} selected={isSelected} disabled={disabled}
                onClick={() => update({ prizeDistribution: preset.distribution })}>
                {preset.label}
              </Chip>
            )
          })}
        </div>
        {config.entryFee === 0 ? (
          /* FREE MODE: show placement order */
          <div className="space-y-2 mt-2">
            {Object.keys(config.prizeDistribution).map((pos) => (
              <div key={pos} className="flex items-center gap-2 p-2 bg-[#1a1a2e] border border-gray-700 rounded-lg">
                <span className="text-sm font-bold text-cyan-400 w-12 text-center">{ordinal(Number(pos))}</span>
                <span className="text-xs text-gray-400">Place</span>
                {Object.keys(config.prizeDistribution).length > 1 && (
                  <button type="button" disabled={disabled}
                    onClick={() => { const d = { ...config.prizeDistribution }; delete d[pos]; update({ prizeDistribution: d }) }}
                    className="ml-auto text-red-400 hover:text-red-300 text-xs px-1">✕</button>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* PAID MODE: normal % inputs */
          <div className="space-y-2 mt-2">
            {Object.entries(config.prizeDistribution).map(([pos, pct]) => (
              <div key={pos} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-8 text-right">#{pos}</span>
                <input type="number" min={0} max={100} step={0.1} value={pct}
                  onChange={(e) => update({ prizeDistribution: { ...config.prizeDistribution, [pos]: parseFloat(e.target.value) || 0 } })}
                  disabled={disabled} className={cn(S.freeInput, 'w-20')} />
                <span className="text-xs text-gray-500">%</span>
                {Object.keys(config.prizeDistribution).length > 1 && (
                  <button type="button" disabled={disabled}
                    onClick={() => { const d = { ...config.prizeDistribution }; delete d[pos]; update({ prizeDistribution: d }) }}
                    className="text-red-400 hover:text-red-300 text-xs px-1">✕</button>
                )}
              </div>
            ))}
          </div>
        )}
        <button type="button" disabled={disabled}
          onClick={() => {
            const positions = Object.keys(config.prizeDistribution)
            const nextPos = positions.length > 0 ? String(Math.max(...positions.map(Number)) + 1) : '1'
            update({ prizeDistribution: { ...config.prizeDistribution, [nextPos]: 0 } })
          }}
          className={cn('mt-2 px-4 py-1.5 rounded-lg border text-xs font-medium transition-all bg-[#1a1a2e] border-gray-700 text-gray-400 hover:border-green-500 hover:text-green-400', disabled && 'opacity-50 cursor-not-allowed')}>
          + Add Position
        </button>
        {config.entryFee === 0 ? (
          <p className="text-xs text-green-400 mt-1">{Object.keys(config.prizeDistribution).length} position(s) ranked</p>
        ) : (
          <>
            {!isPrizeValid && (
              <div className="flex items-center gap-2 mt-1 text-xs text-red-400">
                <AlertCircle className="w-3 h-3 flex-shrink-0" />
                Prize split must total 100% (currently {prizeTotal.toFixed(1)}%)
              </div>
            )}
            {isPrizeValid && <p className="text-xs text-green-400 mt-1">Total: 100% ✓</p>}
          </>
        )}
      </div>

      {/* ── VISIBILITY ── */}
      <div className={S.section}>
        <LabelWithTooltip icon={Eye} iconClass="text-gray-400" label="Room Visibility"
          tooltip="Public rooms appear in the room browser. Unlisted rooms require an invite code to join." />
        <div className="grid grid-cols-2 gap-2">
          {([
            { vis: 'PUBLIC_LISTED' as RoomVisibility, icon: Eye,    color: 'text-green-400', title: 'Public',   sub: 'Listed in room browser' },
            { vis: 'UNLISTED' as RoomVisibility,      icon: EyeOff, color: 'text-gray-400',  title: 'Unlisted', sub: 'Invite code only' },
          ]).map(({ vis, icon: Icon, color, title, sub }) => (
            <button key={vis} type="button" disabled={disabled} onClick={() => update({ visibility: vis })}
              className={cn('p-3 rounded-lg border-2 transition-all text-center',
                config.visibility === vis ? 'border-cyan-500 bg-cyan-500/10' : 'border-gray-700 bg-[#1a1a2e] hover:border-gray-600',
                disabled && S.chipDisabled)}>
              <Icon className={cn('w-5 h-5 mx-auto mb-1', color)} />
              <p className="text-sm font-bold text-white">{title}</p>
              <p className="text-xs text-gray-500">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── PRIZE POOL PREVIEW ── */}
      <div className="p-4 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 rounded-lg border border-cyan-500/20">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-white">{isSE ? 'Bracket Preview' : 'FFA Preview'}</span>
        </div>
        <div className="grid grid-cols-4 gap-3 text-center">
          <div><p className="text-xs text-gray-500">Entry Fee</p><p className="text-lg font-bold text-white">{config.entryFee === 0 ? <span className="text-green-400">FREE</span> : `$${config.entryFee}`}</p></div>
          <div><p className="text-xs text-gray-500">Players</p><p className="text-lg font-bold text-white">{config.maxPlayers}</p></div>
          <div>
            <p className="text-xs text-gray-500">{isSE ? 'Bracket Rounds' : 'Session'}</p>
            <p className="text-lg font-bold text-white">{isSE ? deriveSEMeta(config.maxPlayers).rounds : '1'}</p>
          </div>
          <div><p className="text-xs text-gray-500">Net Prize</p><p className="text-lg font-bold text-green-400">{config.entryFee === 0 ? 'For fun' : `$${netPool.toFixed(2)}`}</p></div>
        </div>
        {isPrizeValid && config.maxPlayers >= 2 && (
          <div className="mt-3 pt-3 border-t border-gray-700/50 flex flex-wrap gap-3">
            {Object.entries(config.prizeDistribution).map(([pos, pct]) => (
              <div key={pos} className="text-center">
                <p className="text-xs text-gray-500">{ordinal(Number(pos))}</p>
                <p className="text-sm font-bold text-cyan-400">{config.entryFee === 0 ? 'Place' : `$${((netPool * pct) / 100).toFixed(2)}`}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── INFO ── */}
      <div className={S.infoBox}>
        <AlertCircle className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
        <p className={S.infoText}>
          {isSE
            ? `Single Elimination bracket — ${config.maxPlayers} players, ${deriveSEMeta(config.maxPlayers).rounds} bracket rounds, Best of ${config.roundsCount} per match. `
            : `FFA — all ${config.maxPlayers} players compete simultaneously, ranked by score. `}
          {platformFee}% platform fee deducted from gross pool. Entry fees held in escrow until match completes.
        </p>
      </div>
    </div>
  )
}

// =============================================================================
// DEFAULT CONFIG -- accepts capabilities for valid defaults
// =============================================================================

export function createDefaultEsportGameConfig(
  capabilities?: GameCapabilities,
): EsportGameConfig {
  const cap    = capabilities || DEFAULT_CAPABILITIES
  const format: TournamentFormat = cap.supportsSingleElimination
    ? 'SINGLE_ELIMINATION'
    : cap.supportsFFA ? 'FFA' : 'SINGLE_ELIMINATION'
  const players = format === 'SINGLE_ELIMINATION'
    ? Math.max(MIN_SE_SIZE, isPowerOf2(cap.minPlayers) ? cap.minPlayers : nextPowerOf2(cap.minPlayers))
    : cap.minPlayers
  const mode: GameMode = cap.supportsSync ? 'SYNC'
    : cap.supportsAsync ? 'ASYNC'
    : cap.supportsBlitz1v1 ? 'BLITZ_1V1'
    : cap.supportsDuel1v1 ? 'DUEL_1V1'
    : cap.supportsSinglePlayerMode ? 'SINGLE_PLAYER'
    : cap.supportsTurnBased ? 'TURN_BASED'
    : 'SYNC'
  const duration = cap.minMatchDurationSeconds > 0 ? cap.minMatchDurationSeconds : 180

  return {
    entryFee:             5,
    entryCurrency:        'USDT_BSC',
    minPlayers:           players,
    maxPlayers:           players,
    mode,
    matchDurationSeconds: duration,
    roundsCount:          1,
    prizeDistribution:    { '1': 100 },
    visibility:           'PUBLIC_LISTED',
    tournamentFormat:     format,
    platformFeePercent:   10,
  }
}