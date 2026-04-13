// =============================================================================
// QuickPlayCard — packages/game-ui/src/components/tournaments/QuickPlayCard.tsx
//
// Unified Quick Play card for ESPORTS and SOCIAL game types.
//
// ESPORTS — 5 states:
//   idle      Dropdown selectors (entry fee, player mode, currency) + Play Now
//   searching Animated queue banner + Cancel
//   filling   "Filling match..."
//   found     "Match Found!" + auto-navigate via onMatchStart
//   error     Error message + Try Again
//
// SOCIAL — 6 states:
//   idle      Dropdown selectors (point value, currency) + live Available
//             Games board + Create Game button
//   waiting   Created a game — seat fill dots + Cancel
//   filling   "Filling match..."
//   found     "Match Found!" + auto-navigate via onMatchStart
//   error     Error message + Try Again
//
// KEY DESIGN RULE:
//   ALL selectable options (point values, entry fees, player modes, currencies)
//   come from QuickPlayConfig which is set by the admin/developer.
//   Adding a new tier or currency in the admin panel populates here automatically.
//   Nothing is hardcoded in this component.
//
// v3.2.0:
//   Point value and currency are <select> dropdowns (scalable, clean)
//   Social: AvailableGamesBoard shows live open games from socket
//   Social: "Create Game" creates a game others can join
//   Social: "waiting" state shows seat fill progress
//   Esport: entry fee + mode stay as chips (few options, faster to scan)
//   No useNavigate — navigation via onMatchStart callback only
//   No custom Tailwind tokens (neon-*, gaming-*)
// =============================================================================

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Zap, X, Loader2, AlertCircle, Trophy,
  Users, Timer, CircleDollarSign, Coins,
  ChevronRight, Plus, Clock,
} from 'lucide-react'
import { cn } from '../../utils'
import Badge from '../ui/Badge'
import { Card, CardContent } from '../ui/Card'
import {
  QuickPlayConfig,
  CryptoCurrency,
  SocialGameType,
  CURRENCY_LABELS,
  SOCIAL_GAME_LABELS,
  formatPlayerMode,
} from '../../bridge-types'
import {
  QuickPlayQueueState,
  AvailableGame,
} from '../../hooks/useQuickPlayQueue'

// =============================================================================
// HELPERS
// =============================================================================

function safeArray<T>(val: T[] | string | null | undefined, fallback: T[] = []): T[] {
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    try { const p = JSON.parse(val); return Array.isArray(p) ? p : fallback }
    catch { return fallback }
  }
  return fallback
}

function formatElapsed(secs: number): string {
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${s}s`
}

function calcPrize(fee: number, playerCount: number, platformFee: number): string {
  if (fee === 0) return 'FREE'
  const prize = fee * playerCount * (1 - platformFee / 100)
  return `+$${prize.toFixed(2)}`
}

function timerColor(secs: number): string {
  if (secs > 30) return 'text-green-400'
  if (secs > 15) return 'text-yellow-400'
  return 'text-red-400 animate-pulse'
}

// =============================================================================
// SHARED: CURRENCY DROPDOWN
// Single currency → read-only badge. Multiple → <select> populated from config.
// =============================================================================

function CurrencyDropdown({
  currencies, selected, onChange,
}: {
  currencies: string[]
  selected: string
  onChange: (v: string) => void
}) {
  if (currencies.length === 0) return null

  if (currencies.length === 1) {
    return (
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
          Currency
        </label>
        <div className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white/70">
          {CURRENCY_LABELS[currencies[0]] ?? currencies[0]}
        </div>
      </div>
    )
  }

  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
        Currency
      </label>
      <select
        value={selected}
        onChange={e => onChange(e.target.value)}
        className={cn(
          'w-full px-3 py-2 rounded-lg text-sm font-medium',
          'bg-gray-900 border border-white/15 text-white',
          'focus:outline-none focus:border-cyan-500/50 cursor-pointer',
        )}
      >
        {currencies.map(c => (
          <option key={c} value={c} className="bg-gray-900 text-white">
            {CURRENCY_LABELS[c] ?? c}
          </option>
        ))}
      </select>
    </div>
  )
}

// =============================================================================
// ESPORT: ENTRY FEE CHIPS
// Few options — chips are faster to tap than a dropdown on mobile
// =============================================================================

function TierChip({
  value, label, selected, onClick, isFree,
}: {
  value: number; label: string; selected: boolean; onClick: () => void; isFree?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-2 rounded-lg text-sm font-bold transition-all border text-center',
        selected && isFree
          ? 'bg-green-500/20 border-green-400/60 text-green-300'
          : selected
          ? 'bg-cyan-500/20 border-cyan-400/60 text-cyan-300'
          : isFree
          ? 'bg-green-500/5 border-green-500/20 text-green-400/60 hover:border-green-500/40'
          : 'bg-white/5 border-white/10 text-white/60 hover:border-white/25 hover:text-white/80',
      )}
    >
      {label}
    </button>
  )
}

// =============================================================================
// SOCIAL: POINT VALUE DROPDOWN
// Populated entirely from config.socialPointValueTiers
// Admin adds a tier → it appears here automatically
// =============================================================================

function PointValueDropdown({
  tiers, selected, onChange,
}: {
  tiers: number[]
  selected: number
  onChange: (v: number) => void
}) {
  return (
    <div>
      <label className="block text-xs text-white/40 uppercase tracking-wider mb-1.5">
        Point Value <span className="normal-case text-white/30">(USD per point)</span>
      </label>
      <select
        value={selected}
        onChange={e => onChange(Number(e.target.value))}
        className={cn(
          'w-full px-3 py-2 rounded-lg text-sm font-medium',
          'bg-gray-900 border border-white/15 text-white',
          'focus:outline-none focus:border-purple-500/50 cursor-pointer',
        )}
      >
        {tiers.map(tier => (
          <option key={tier} value={tier} className="bg-gray-900 text-white">
            {tier === 0 ? 'FREE' : `$${tier}/pt`}
          </option>
        ))}
      </select>
    </div>
  )
}

// =============================================================================
// SOCIAL: AVAILABLE GAMES BOARD
// Live list updated via quick-play:lobby-update socket
// =============================================================================

function AvailableGamesBoard({
  games, onJoin,
}: {
  games: AvailableGame[]
  onJoin: (queueKey: string) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs text-white/40 uppercase tracking-wider">
        Open Games
      </label>

      {games.length === 0 ? (
        <div className="text-center py-3 text-xs text-white/30 border border-white/5 rounded-lg">
          No open games — create one below
        </div>
      ) : (
        games.map(game => {
          const fillPct = Math.min((game.currentPlayers / game.maxPlayers) * 100, 100)
          return (
            <div
              key={game.queueKey}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 transition-colors"
            >
              {/* Point value */}
              <div className="shrink-0 text-left">
                <span className="text-sm font-bold text-white">${game.pointValue}</span>
                <span className="text-xs text-white/40">/pt</span>
              </div>

              {/* Fill bar + meta */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs text-white/50 mb-1">
                  <span className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    {game.currentPlayers}/{game.maxPlayers}
                  </span>
                  <span className={cn('flex items-center gap-0.5', timerColor(game.secondsRemaining))}>
                    <Clock className="w-3 h-3" />
                    {formatElapsed(game.secondsRemaining)}
                  </span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-400 transition-all duration-500"
                    style={{ width: `${fillPct}%` }}
                  />
                </div>
              </div>

              {/* Currency */}
              <span className="text-xs text-white/30 shrink-0">
                {CURRENCY_LABELS[game.currency] ?? game.currency}
              </span>

              {/* Join */}
              <button
                type="button"
                onClick={() => onJoin(game.queueKey)}
                className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-500/20 border border-purple-500/40 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                JOIN
              </button>
            </div>
          )
        })
      )}
    </div>
  )
}

// =============================================================================
// IDLE: ESPORT
// Chip selectors for entry fee + mode (few options), dropdown for currency
// =============================================================================

function EsportIdleState({ config, qp }: { config: QuickPlayConfig; qp: QuickPlayQueueState }) {
  const playerModes   = safeArray<number>(config.esportPlayerModes, [2])
  const entryFeeTiers = safeArray<number>(config.esportEntryFeeTiers, [1])
  const currencies    = safeArray<string>(config.esportCurrencies as any, ['USDT_BSC'])

  const prize = calcPrize(qp.selectedFee, qp.selectedMode, config.esportPlatformFee ?? 10)

  return (
    <motion.div key="esport-idle" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">

      {/* Player mode chips (only if admin configured multiple) */}
      {playerModes.length > 1 && (
        <div>
          <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Mode</label>
          <div className="flex gap-2">
            {playerModes.map(mode => (
              <button key={mode} type="button" onClick={() => qp.setSelectedMode(mode)}
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all border',
                  qp.selectedMode === mode
                    ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                    : 'bg-white/5 border-white/10 text-white/50 hover:border-white/20',
                )}
              >
                {formatPlayerMode(mode)}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Entry fee chips */}
      <div>
        <label className="block text-xs text-white/40 uppercase tracking-wider mb-2">Entry Fee</label>
        <div className="grid grid-cols-4 gap-2">
          {entryFeeTiers.map(tier => (
            <TierChip key={tier} value={tier}
              label={tier === 0 ? 'FREE' : `$${tier}`}
              selected={qp.selectedFee === tier}
              onClick={() => qp.setSelectedFee(tier)}
              isFree={tier === 0}
            />
          ))}
        </div>
      </div>

      {/* Currency dropdown -- hidden when FREE selected */}
      {qp.selectedFee > 0 ? (
        <CurrencyDropdown currencies={currencies} selected={qp.selectedCurrency} onChange={qp.setSelectedCurrency} />
      ) : (
        <div className="px-3 py-2.5 rounded-lg bg-white/5 border border-green-500/20 text-green-400 text-sm font-medium text-center">
          Free Entry -- No wallet required
        </div>
      )}

      {/* Info row -- adjusted for free */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div className="flex items-center gap-1.5 text-green-400">
          <Trophy className="w-3.5 h-3.5" />
          <span className="font-semibold">{qp.selectedFee === 0 ? 'For fun' : `Win: ${prize}`}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/40">
          <CircleDollarSign className="w-3.5 h-3.5" />
          <span>{qp.selectedFee === 0 ? 'No rake' : `${config.esportPlatformFee ?? 10}% rake`}</span>
        </div>
        <div className="flex items-center gap-1.5 text-white/40">
          <Timer className="w-3.5 h-3.5" />
          <span>{config.matchDurationSecs ? `${Math.round(config.matchDurationSecs / 60)}min` : 'Game-defined'}</span>
        </div>
      </div>

      {/* Play Now */}
      <button type="button" onClick={qp.joinQueue}
        className={cn(
          'w-full rounded-xl py-3.5 font-sans font-bold text-base uppercase tracking-wider',
          'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500',
          'hover:from-cyan-400 hover:via-purple-400 hover:to-pink-400',
          'text-white shadow-lg shadow-purple-500/25',
          'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
          'flex items-center justify-center gap-2',
        )}
      >
        <Zap className="w-5 h-5" /> Play Now <ChevronRight className="w-4 h-4 ml-1" />
      </button>
    </motion.div>
  )
}

// =============================================================================
// IDLE: SOCIAL
// Dropdown for point value + currency + live games board + Create Game button
// =============================================================================

function SocialIdleState({ config, qp }: { config: QuickPlayConfig; qp: QuickPlayQueueState }) {
  const pointValueTiers = safeArray<number>(config.socialPointValueTiers, [0.25])
  const currencies      = safeArray<string>(config.socialCurrencies as any, ['USDT_BSC'])

  const buyInMin = `$${(qp.selectedFee * (config.socialMinBuyInMultiplier ?? 20)).toFixed(2)}`
  const buyInMax = `$${(qp.selectedFee * (config.socialDefaultBuyInMultiplier ?? 100)).toFixed(2)}`

  return (
    <motion.div key="social-idle" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="space-y-4">

      {/* Game type label */}
      {config.socialGameType && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <Coins className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-medium text-purple-300">
            {SOCIAL_GAME_LABELS[config.socialGameType as SocialGameType] ?? config.socialGameType}
          </span>
          <span className="text-xs text-white/40 ml-auto">
            {config.socialMinPlayers} players
          </span>
        </div>
      )}

      {/* Point value dropdown — admin controls what tiers appear */}
      <PointValueDropdown
        tiers={pointValueTiers}
        selected={qp.selectedFee}
        onChange={qp.setSelectedFee}
      />

      {/* Currency dropdown — admin controls what currencies appear */}
      <CurrencyDropdown
        currencies={currencies}
        selected={qp.selectedCurrency}
        onChange={qp.setSelectedCurrency}
      />

      {/* Buy-in preview + rake info */}
      <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-xs space-y-1.5">
        <div className="flex justify-between text-white/60">
          <span>Buy-in range</span>
          <span className="text-white font-medium">{buyInMin} – {buyInMax}</span>
        </div>
        <div className="flex justify-between text-white/60">
          <span>Rake</span>
          <span>
            {config.socialRakePercent ?? 5}%
            {config.socialRakeCapUsd ? ` · cap $${config.socialRakeCapUsd}` : ''}
          </span>
        </div>
        {config.socialAutoCashout && (
          <div className="flex justify-between text-white/60">
            <span>Auto cash-out</span>
            <span className="text-green-400">Enabled</span>
          </div>
        )}
      </div>

      {/* Live games board */}
      <AvailableGamesBoard games={qp.availableGames} onJoin={qp.joinGame} />

      {/* Create Game */}
      <button type="button" onClick={qp.createGame}
        className={cn(
          'w-full rounded-xl py-3.5 font-sans font-bold text-sm uppercase tracking-wider',
          'bg-gradient-to-r from-purple-500 to-pink-500',
          'hover:from-purple-400 hover:to-pink-400',
          'text-white shadow-lg shadow-purple-500/20',
          'transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]',
          'flex items-center justify-center gap-2',
        )}
      >
        <Plus className="w-5 h-5" />
        Create ${qp.selectedFee}/pt Game
      </button>
    </motion.div>
  )
}

// =============================================================================
// SEARCHING (esport queue)
// =============================================================================

function SearchingState({ config, qp }: { config: QuickPlayConfig; qp: QuickPlayQueueState }) {
  const timeout     = config.matchmakingTimeoutSecs ?? 60
  const remaining   = Math.max(0, timeout - qp.searchTimer)
  const fillingSoon = remaining > 0 && remaining <= 15
  const progressPct = Math.min((qp.searchTimer / timeout) * 100, 100)

  return (
    <motion.div key="searching" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 border border-cyan-500/20 p-4">
        <div className="absolute top-0 left-0 h-1 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 transition-all duration-500"
          style={{ width: `${progressPct}%` }} />
        <div className="flex items-center gap-3 mb-3">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Searching for opponents...</p>
            <p className="text-xs text-white/40">
              {formatElapsed(qp.searchTimer)} elapsed
              {remaining > 0 && <span className={cn('ml-2', fillingSoon && 'text-amber-400')}>· filling in {remaining}s</span>}
            </p>
          </div>
          <span className="font-mono text-lg font-bold text-cyan-400 shrink-0">{formatElapsed(qp.searchTimer)}</span>
        </div>
        <div className="flex justify-between text-xs text-white/50">
          <span>{qp.playersInQueue}/{qp.totalRequired} players</span>
          <span>${qp.selectedFee} {CURRENCY_LABELS[qp.selectedCurrency] ?? qp.selectedCurrency}</span>
        </div>
      </div>
      <CancelButton onCancel={qp.leaveQueue} />
    </motion.div>
  )
}

// =============================================================================
// WAITING (social — created a game, waiting for others)
// =============================================================================

function WaitingState({ qp }: { qp: QuickPlayQueueState }) {
  return (
    <motion.div key="waiting" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="space-y-3">
      <div className="rounded-xl bg-purple-500/10 border border-purple-500/20 p-4">
        <div className="flex items-center gap-3 mb-3">
          <Users className="w-5 h-5 text-purple-400 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Waiting for players...</p>
            <p className="text-xs text-white/40">Your game is visible · {formatElapsed(qp.searchTimer)} elapsed</p>
          </div>
          <span className="font-mono text-lg font-bold text-purple-400 shrink-0">
            {qp.playersInQueue}/{qp.totalRequired}
          </span>
        </div>
        {/* Seat dots */}
        <div className="flex items-center gap-2 mb-2">
          {Array.from({ length: qp.totalRequired }).map((_, i) => (
            <div key={i} className={cn('h-2 flex-1 rounded-full transition-colors duration-300',
              i < qp.playersInQueue ? 'bg-purple-400' : 'bg-white/10')} />
          ))}
        </div>
        <p className="text-xs text-white/30 text-center">
          Other players can see your game and join it
        </p>
      </div>
      <CancelButton onCancel={qp.leaveQueue} />
    </motion.div>
  )
}

// =============================================================================
// FILLING
// =============================================================================

function FillingState({ qp }: { qp: QuickPlayQueueState }) {
  return (
    <motion.div key="filling" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="space-y-3">
      <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 p-4">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 animate-pulse" />
        <div className="flex items-center gap-3 mb-3">
          <Loader2 className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Filling match...</p>
            <p className="text-xs text-white/40">Starting shortly</p>
          </div>
          <span className="font-mono text-lg font-bold text-amber-400 shrink-0">{formatElapsed(qp.searchTimer)}</span>
        </div>
        <div className="flex items-center gap-2">
          {Array.from({ length: qp.totalRequired }).map((_, i) => (
            <div key={i} className={cn('h-2 flex-1 rounded-full transition-colors duration-300',
              i < qp.playersInQueue ? 'bg-amber-400' : 'bg-white/10')} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// FOUND
// =============================================================================

function FoundState({ onNavigate }: { qp: QuickPlayQueueState; onNavigate: () => void }) {
  useEffect(() => {
    const t = setTimeout(onNavigate, 2500)
    return () => clearTimeout(t)
  }, [onNavigate])

  return (
    <motion.div key="found" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-xl bg-green-500/10 border border-green-500/30 p-5 text-center space-y-2">
      <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 0.6, repeat: 2 }}
        className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/20 mx-auto">
        <Trophy className="w-6 h-6 text-green-400" />
      </motion.div>
      <p className="text-base font-bold text-white">Match Found!</p>
      <p className="text-xs text-white/50">Preparing your game...</p>
      <Loader2 className="w-4 h-4 text-green-400/60 animate-spin mx-auto" />
    </motion.div>
  )
}

// =============================================================================
// ERROR
// =============================================================================

function ErrorState({ qp }: { qp: QuickPlayQueueState }) {
  return (
    <motion.div key="error" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }} className="space-y-3">
      <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-semibold text-white">Could not start a match</p>
          <p className="text-xs text-white/50 mt-0.5">{qp.error}</p>
        </div>
      </div>
      <button type="button" onClick={qp.resetError}
        className={cn('w-full rounded-xl py-3 font-sans font-bold text-sm uppercase tracking-wider',
          'bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500',
          'text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity')}>
        <Zap className="w-4 h-4" /> Try Again
      </button>
    </motion.div>
  )
}

// =============================================================================
// SHARED: CANCEL BUTTON
// =============================================================================

function CancelButton({ onCancel }: { onCancel: () => void }) {
  return (
    <button type="button" onClick={onCancel}
      className={cn('w-full rounded-xl py-3 font-sans font-bold text-sm uppercase tracking-wider',
        'bg-white/5 border border-white/10 text-white/60',
        'hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400',
        'transition-all duration-200 flex items-center justify-center gap-2')}>
      <X className="w-4 h-4" /> Cancel
    </button>
  )
}

// =============================================================================
// MAIN EXPORT
// =============================================================================

export interface QuickPlayCardProps {
  qp: QuickPlayQueueState
  /**
   * Called when a match is found. The CALLER handles navigation — this
   * component has no router dependency.
   *   navigate('/game', { state: { matchData } })  // react-router-dom
   *   setScreen('game')                             // custom state router
   */
  onMatchStart?: (matchData: NonNullable<QuickPlayQueueState['matchData']>) => void
  className?: string
}

export default function QuickPlayCard({ qp, onMatchStart, className }: QuickPlayCardProps) {
  const handleNavigate = () => { if (qp.matchData) onMatchStart?.(qp.matchData) }
  const { config, configLoading, status } = qp

  if (configLoading) {
    return (
      <Card className={cn('border-cyan-500/20', className)}>
        <CardContent className="p-6 flex items-center justify-center gap-3">
          <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />
          <span className="text-sm text-white/50">Loading Quick Play...</span>
        </CardContent>
      </Card>
    )
  }

  if (!config) {
    return (
      <Card className={cn(
        'bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5',
        'border-l-4 border-l-cyan-500/30 overflow-hidden',
        className,
      )}>
        <CardContent className="p-0">
          {/* Header */}
          <div className="px-5 pt-5 pb-4 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br from-cyan-500/15 to-purple-500/15">
                <Zap className="w-5 h-5 text-cyan-400/50" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-white">Quick Play</h3>
                <p className="text-xs text-white/50">Instant matchmaking · No scheduling</p>
              </div>
              <Badge variant="default" size="sm" className="bg-white/5 text-white/30 border-white/10">
                Coming Soon
              </Badge>
            </div>
          </div>

          {/* Preview skeleton */}
          <div className="px-5 py-4 space-y-4">
            {/* Mode selector skeleton */}
            <div>
              <div className="h-3 w-12 bg-white/5 rounded mb-2" />
              <div className="flex gap-2">
                <div className="flex-1 h-10 bg-white/5 border border-white/8 rounded-lg" />
                <div className="flex-1 h-10 bg-white/5 border border-white/8 rounded-lg" />
              </div>
            </div>

            {/* Entry fee chips skeleton */}
            <div>
              <div className="h-3 w-16 bg-white/5 rounded mb-2" />
              <div className="grid grid-cols-4 gap-2">
                {[0,1,2,3].map(i => (
                  <div key={i} className="h-10 bg-white/5 border border-white/8 rounded-lg" />
                ))}
              </div>
            </div>

            {/* Currency skeleton */}
            <div>
              <div className="h-3 w-16 bg-white/5 rounded mb-2" />
              <div className="h-10 bg-white/5 border border-white/8 rounded-lg" />
            </div>

            {/* Info row skeleton */}
            <div className="grid grid-cols-3 gap-2">
              {[0,1,2].map(i => (
                <div key={i} className="h-5 bg-white/5 rounded" />
              ))}
            </div>

            {/* Play button — disabled state */}
            <div className="w-full rounded-xl py-3.5 bg-white/5 border border-white/10 flex items-center justify-center gap-2">
              <Zap className="w-5 h-5 text-white/20" />
              <span className="font-bold text-sm uppercase tracking-wider text-white/20">
                Not Available Yet
              </span>
            </div>

            {/* Helpful message */}
            <p className="text-xs text-center text-white/30 leading-relaxed">
              Quick Play will be available once the game developer enables instant matchmaking.
              Check back soon!
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const isEsport = config.gameCategory === 'ESPORTS'

  return (
    <Card className={cn(
      'bg-gradient-to-br from-cyan-500/5 via-purple-500/5 to-pink-500/5',
      'border-l-4 overflow-hidden',
      isEsport ? 'border-l-cyan-500/50' : 'border-l-purple-500/50',
      className,
    )}>
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              isEsport ? 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20'
                       : 'bg-gradient-to-br from-purple-500/20 to-pink-500/20')}>
              <Zap className={cn('w-5 h-5', isEsport ? 'text-cyan-400' : 'text-purple-400')} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-white">Quick Play</h3>
              <p className="text-xs text-white/50">
                {isEsport ? 'Instant matchmaking · No scheduling' : 'Join or create a game instantly'}
              </p>
            </div>
            <Badge
              variant={isEsport ? 'info' : 'default'}
              size="sm"
              className={!isEsport ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : ''}
            >
              {isEsport ? 'Esport' : 'Social'}
            </Badge>
          </div>
        </div>

        {/* Body — state machine */}
        <div className="px-5 py-4">
          <AnimatePresence mode="wait">
            {status === 'idle'      && isEsport  && <EsportIdleState  key="e-idle"    config={config} qp={qp} />}
            {status === 'idle'      && !isEsport && <SocialIdleState  key="s-idle"    config={config} qp={qp} />}
            {status === 'searching'              && <SearchingState   key="searching" config={config} qp={qp} />}
            {status === 'waiting'                && <WaitingState     key="waiting"   qp={qp} />}
            {status === 'filling'                && <FillingState     key="filling"   qp={qp} />}
            {status === 'found'                  && <FoundState       key="found"     qp={qp} onNavigate={handleNavigate} />}
            {status === 'error'                  && <ErrorState       key="error"     qp={qp} />}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  )
}