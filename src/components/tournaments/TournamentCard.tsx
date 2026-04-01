// =============================================================================
// TournamentCard.tsx
// Path: src/components/tournaments/TournamentCard.tsx
//
// Unified card for ALL tournament types:
//   ESPORT             — cyan border, entry fee, prize pool, player count
//   SOCIAL_TOURNAMENT  — purple border, same stats
//   CASH_GAME          — pink border, buy-in range, rake %, table count
//
// v3.1.0: All custom Tailwind tokens (neon-*, gaming-*, primary-*) replaced
// with standard Tailwind utility classes. No JIT compilation required.
// =============================================================================

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  Trophy,
  Coins,
  Zap,
  Clock,
  Users,
  Calendar,
  Percent,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Table2,
  Smartphone,
  Apple,
} from 'lucide-react'
import { cn } from '../../utils'
import Button from '../ui/Button'
import Badge from '../ui/Badge'
import type { Tournament, UserEnrollmentStatus } from '../../bridge-types'

// =============================================================================
// TYPES
// =============================================================================

export interface TournamentCardProps {
  tournament: Tournament
  userStatus?: UserEnrollmentStatus
  dqCountdown?: number | null
  enrollmentLoading?: boolean
  onRegister?: (tournamentId: string) => void
  onCheckIn?: (tournamentId: string) => void
  onJoin?: (tournamentId: string) => void
  onViewResults?: (tournamentId: string) => void
  appUrl?: string
  compact?: boolean
  platforms?: string[]
  className?: string
}

// =============================================================================
// HELPERS
// =============================================================================

function formatStartTime(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMs < 0) return 'Started'
  if (diffMins < 60) return `In ${diffMins}m`
  if (diffMins < 24 * 60) return `In ${Math.floor(diffMins / 60)}h ${diffMins % 60}m`
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// =============================================================================
// MODE BADGE — standard Tailwind only
// =============================================================================

function ModeBadge({ tournament }: { tournament: Tournament }) {
  const isCashGame       = tournament.gameCategory === 'SOCIAL' && tournament.socialMode === 'CASH_GAME'
  const isSocialTournament = tournament.gameCategory === 'SOCIAL' && tournament.socialMode === 'TOURNAMENT'
  const isLiveSync       = tournament.gameCategory !== 'SOCIAL' && tournament.mode === 'SYNC'
  const isAsync          = tournament.gameCategory !== 'SOCIAL' && tournament.mode === 'ASYNC'

  if (isCashGame) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-pink-500/15 text-pink-400 border border-pink-500/20">
        <Coins className="w-3 h-3" />Cash Game
      </span>
    )
  }
  if (isSocialTournament) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/20">
        <Trophy className="w-3 h-3" />Tournament
      </span>
    )
  }
  if (isLiveSync) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
        <Zap className="w-3 h-3" />Live
      </span>
    )
  }
  if (isAsync) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold uppercase tracking-wider bg-purple-500/15 text-purple-400 border border-purple-500/20">
        <Clock className="w-3 h-3" />Async
      </span>
    )
  }
  return null
}

// =============================================================================
// ENROLLMENT BADGE
// =============================================================================

function EnrollmentBadge({ status }: { status: UserEnrollmentStatus }) {
  if (status === 'NOT_REGISTERED' || status === 'REGISTERED') return null

  const configs: Partial<Record<UserEnrollmentStatus, { label: string; variant: 'success' | 'warning' | 'danger' | 'info'; pulse?: boolean }>> = {
    CHECKIN_OPEN: { label: 'Check-in Open', variant: 'warning', pulse: true },
    CHECKED_IN:   { label: 'Checked In',    variant: 'success' },
    STARTING:     { label: 'Starting',      variant: 'warning', pulse: true },
    IN_PROGRESS:  { label: 'LIVE',          variant: 'danger',  pulse: true },
    COMPLETED:    { label: 'Completed',     variant: 'info' },
    DQ_NO_SHOW:   { label: 'DQ - No Show', variant: 'danger' },
    STANDBY:      { label: 'Standby',       variant: 'warning' },
  }

  const config = configs[status]
  if (!config) return null

  return (
    <Badge variant={config.variant} size="sm" pulse={config.pulse}>
      {config.label}
    </Badge>
  )
}

// =============================================================================
// STAT BOX — standard Tailwind only (was: bg-gaming-darker, border-gaming-border)
// =============================================================================

function StatBox({
  icon,
  label,
  value,
  valueClassName,
  borderColor = 'border-white/10',
}: {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
  valueClassName?: string
  borderColor?: string
}) {
  return (
    <div className={cn('p-3 rounded-lg bg-white/5 border', borderColor)}>
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-xs text-white/50">{label}</span>
      </div>
      <div className={cn('font-semibold text-base text-white', valueClassName)}>
        {value}
      </div>
    </div>
  )
}

// =============================================================================
// DQ WARNING BANNER
// =============================================================================

function DQWarningBanner({ status, dqCountdown }: { status: UserEnrollmentStatus; dqCountdown?: number | null }) {
  if (status === 'REGISTERED') {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-amber-300">
          Check-in opens 30 min before start.{' '}
          <span className="font-semibold">Missing check-in = disqualification.</span>
        </p>
      </div>
    )
  }
  if (status === 'CHECKIN_OPEN') {
    return (
      <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm">
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 animate-pulse" />
        <p className="text-red-300">
          Check in now or lose your spot!
          {dqCountdown != null && dqCountdown > 0 && (
            <span className="ml-1 font-bold font-mono text-red-400">
              DQ in {formatCountdown(dqCountdown)}
            </span>
          )}
        </p>
      </div>
    )
  }
  return null
}

// =============================================================================
// ENROLLMENT BUTTON
// =============================================================================

function EnrollmentButton({
  tournament, status, loading, appUrl, onRegister, onCheckIn, onJoin, onViewResults,
}: {
  tournament: Tournament
  status: UserEnrollmentStatus
  loading: boolean
  appUrl?: string
  onRegister?: (id: string) => void
  onCheckIn?: (id: string) => void
  onJoin?: (id: string) => void
  onViewResults?: (id: string) => void
}) {
  const id = tournament.id

  switch (status) {
    case 'NOT_REGISTERED':
      return (
        <Button variant="primary" size="sm" isLoading={loading} onClick={() => onRegister?.(id)} className="w-full">
          Register
        </Button>
      )
    case 'REGISTERED':
      return (
        <Button variant="secondary" size="sm" disabled className="w-full opacity-60 cursor-not-allowed">
          <CheckCircle2 className="w-4 h-4" />Registered - Waiting
        </Button>
      )
    case 'CHECKIN_OPEN':
      return (
        <motion.div animate={{ opacity: [1, 0.7, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-full">
          <Button
            variant="success" size="sm" isLoading={loading}
            onClick={() => appUrl ? window.open(appUrl, '_blank') : onCheckIn?.(id)}
            className="w-full"
          >
            {appUrl && <ExternalLink className="w-4 h-4" />}
            Check In Now
          </Button>
        </motion.div>
      )
    case 'CHECKED_IN':
      return (
        <Button variant="secondary" size="sm" disabled className="w-full opacity-60 cursor-not-allowed">
          Waiting for Start...
        </Button>
      )
    case 'STARTING':
      return (
        <Button variant="primary" size="sm" isLoading disabled className="w-full">
          Joining...
        </Button>
      )
    case 'IN_PROGRESS':
      return (
        <Button
          variant="danger" size="sm" isLoading={loading}
          onClick={() => appUrl ? window.open(appUrl, '_blank') : onJoin?.(id)}
          className="w-full"
        >
          {appUrl && <ExternalLink className="w-4 h-4" />}
          Rejoin
        </Button>
      )
    case 'COMPLETED':
      return (
        <Button variant="ghost" size="sm" onClick={() => onViewResults?.(id)} className="w-full">
          View Results
        </Button>
      )
    case 'DQ_NO_SHOW':
      return (
        <Button variant="danger" size="sm" disabled className="w-full opacity-60 cursor-not-allowed">
          Disqualified
        </Button>
      )
    case 'STANDBY':
      return (
        <Button variant="secondary" size="sm" disabled className="w-full opacity-60 cursor-not-allowed">
          On Standby
        </Button>
      )
    case 'CANCELLED':
      return (
        <Button variant="ghost" size="sm" disabled className="w-full opacity-60 cursor-not-allowed">
          Cancelled
        </Button>
      )
    default:
      return null
  }
}

// =============================================================================
// STATS GRID — standard Tailwind only
// =============================================================================

function StatsGrid({ tournament }: { tournament: Tournament }) {
  const isCashGame = tournament.gameCategory === 'SOCIAL' && tournament.socialMode === 'CASH_GAME'

  if (isCashGame) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBox
          icon={<Coins className="w-3.5 h-3.5 text-pink-400" />}
          label="Buy-in"
          value={<>${tournament.minBuyIn ?? 0}<span className="text-white/40 text-sm font-normal"> - ${tournament.maxBuyIn ?? 0}</span></>}
          borderColor="border-pink-500/20"
        />
        <StatBox
          icon={<Percent className="w-3.5 h-3.5 text-pink-400" />}
          label="Rake"
          value={`${tournament.rakePercentage ?? 5}%`}
          valueClassName="text-pink-400"
          borderColor="border-pink-500/20"
        />
        <StatBox
          icon={<Table2 className="w-3.5 h-3.5 text-cyan-400" />}
          label="Tables"
          value={
            tournament.numberOfTables
              ? <>{tournament.numberOfTables}<span className="text-white/40 text-sm font-normal"> x {tournament.minPlayersPerTable ?? 4}p</span></>
              : '-'
          }
        />
        <StatBox
          icon={<Clock className="w-3.5 h-3.5 text-white/40" />}
          label="Session"
          value="Open-ended"
          valueClassName="text-white/60 text-sm"
        />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      <StatBox
        icon={<Trophy className="w-3.5 h-3.5 text-green-400" />}
        label="Prize Pool"
        value={tournament.prizePool > 0 ? `${tournament.prizePool} ${tournament.prizeCurrency}` : 'TBD'}
        valueClassName="text-green-400"
        borderColor="border-green-500/20"
      />
      <StatBox
        icon={<Coins className="w-3.5 h-3.5 text-white/50" />}
        label="Entry"
        value={tournament.entryFee === 0 ? 'FREE' : `${tournament.entryFee} ${tournament.entryCurrency}`}
      />
      <StatBox
        icon={<Users className="w-3.5 h-3.5 text-cyan-400" />}
        label="Players"
        value={<>{tournament.currentPlayers}<span className="text-white/40 text-sm font-normal">/{tournament.maxPlayers}</span></>}
      />
      <StatBox
        icon={<Calendar className="w-3.5 h-3.5 text-purple-400" />}
        label="Starts"
        value={formatStartTime(tournament.scheduledStart)}
        valueClassName="text-sm"
      />
    </div>
  )
}

// =============================================================================
// PROGRESS BAR — standard Tailwind only (was: bg-gaming-darker, neon-green, neon-cyan)
// =============================================================================

function ProgressBar({ tournament }: { tournament: Tournament }) {
  const filled = tournament.currentPlayers
  const max    = tournament.maxPlayers
  const min    = tournament.minPlayers
  const fillPct = Math.min((filled / max) * 100, 100)
  const minThresholdPct = (min / max) * 100
  const isHeadsUp = max === 2
  const minMet = filled >= min

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-white/50 mb-1">
        <span>{filled} joined</span>
        <span className={minMet ? 'text-green-400' : ''}>
          {minMet ? '[+] Min met' : `${min - filled} more needed to start`}
        </span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden relative">
        {!isHeadsUp && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-white/20 z-10"
            style={{ left: `${minThresholdPct}%` }}
          />
        )}
        <div
          className={cn(
            'h-full transition-all duration-500',
            minMet
              ? 'bg-gradient-to-r from-green-400 to-emerald-500'
              : 'bg-gradient-to-r from-cyan-400 to-purple-500',
          )}
          style={{ width: `${fillPct}%` }}
        />
      </div>
    </div>
  )
}

// =============================================================================
// PLATFORM BUTTONS — standard Tailwind only
// =============================================================================

function PlatformButtons({ gameId, platforms }: { gameId: string; platforms: string[] }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      {platforms.includes('android') && (
        <a
          href={`/games/${gameId}?platform=android`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors text-xs font-medium"
        >
          <Smartphone className="w-3.5 h-3.5" />Android
        </a>
      )}
      {platforms.includes('ios') && (
        <a
          href={`/games/${gameId}?platform=ios`}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 border border-white/20 text-white hover:bg-white/10 transition-colors text-xs font-medium"
        >
          <Apple className="w-3.5 h-3.5" />iOS
        </a>
      )}
    </div>
  )
}

// =============================================================================
// TOURNAMENT CARD — main export
// Card background and borders use standard Tailwind only.
// Left accent border tracks card type via inline style (color value from
// tokens/colors.css variables — works without Tailwind JIT).
// =============================================================================

export default function TournamentCard({
  tournament,
  userStatus = 'NOT_REGISTERED',
  dqCountdown,
  enrollmentLoading = false,
  onRegister,
  onCheckIn,
  onJoin,
  onViewResults,
  appUrl,
  compact = false,
  platforms,
  className,
}: TournamentCardProps) {
  const isCashGame = tournament.gameCategory === 'SOCIAL' && tournament.socialMode === 'CASH_GAME'

  // Left border accent via inline style — avoids custom Tailwind token dependency
  const accentColor = useMemo(() => {
    if (isCashGame)                              return 'rgba(236,72,153,0.5)'  // pink
    if (tournament.gameCategory === 'SOCIAL')   return 'rgba(168,85,247,0.5)'  // purple
    if (tournament.mode === 'SYNC')              return 'rgba(6,182,212,0.5)'   // cyan
    return 'rgba(168,85,247,0.5)'                                               // purple fallback
  }, [isCashGame, tournament.gameCategory, tournament.mode])

  const showDQWarning = userStatus === 'REGISTERED' || userStatus === 'CHECKIN_OPEN'

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={cn(
        'rounded-xl bg-gray-900/80 border border-white/10',
        'hover:border-white/20 transition-colors duration-200',
        'border-l-4',
        compact ? 'p-3' : 'p-4 sm:p-5',
        className,
      )}
      style={{ borderLeftColor: accentColor }}
    >
      <div className="space-y-3">
        {/* HEADER */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <ModeBadge tournament={tournament} />
              <EnrollmentBadge status={userStatus} />
            </div>
            <h3 className="font-semibold text-white text-base leading-tight truncate">
              {tournament.name}
            </h3>
            {tournament.description && !compact && (
              <p className="text-xs text-white/40 line-clamp-1">{tournament.description}</p>
            )}
          </div>

          <div className="shrink-0">
            {tournament.status === 'IN_PROGRESS' && (
              <Badge variant="danger" size="sm" pulse>LIVE</Badge>
            )}
            {(tournament.status === 'SCHEDULED' || tournament.status === 'OPEN') &&
              tournament.currentPlayers < tournament.maxPlayers && (
                <Badge variant="info" size="sm">Open</Badge>
              )}
            {tournament.currentPlayers >= tournament.maxPlayers && (
              <Badge variant="default" size="sm">Full</Badge>
            )}
          </div>
        </div>

        {/* STATS */}
        {!compact && <StatsGrid tournament={tournament} />}

        {/* COMPACT SUMMARY */}
        {compact && (
          <div className="flex items-center gap-3 text-sm text-white/60">
            {isCashGame ? (
              <>
                <span className="text-pink-400">${tournament.minBuyIn}-${tournament.maxBuyIn}</span>
                <span>•</span>
                <span className="text-pink-400">{tournament.rakePercentage ?? 5}% rake</span>
              </>
            ) : (
              <>
                <span className="text-green-400">{tournament.prizePool} {tournament.prizeCurrency}</span>
                <span>•</span>
                <span>{tournament.currentPlayers}/{tournament.maxPlayers} players</span>
                <span>•</span>
                <span>{formatStartTime(tournament.scheduledStart)}</span>
              </>
            )}
          </div>
        )}

        {/* PROGRESS BAR */}
        {!compact && !isCashGame && <ProgressBar tournament={tournament} />}

        {/* PLATFORM BUTTONS */}
        {!compact && platforms && platforms.length > 0 && (
          <PlatformButtons gameId={tournament.gameId} platforms={platforms} />
        )}

        {/* DQ WARNING */}
        {showDQWarning && (
          <DQWarningBanner status={userStatus} dqCountdown={dqCountdown} />
        )}

        {/* ACTION BUTTON */}
        <EnrollmentButton
          tournament={tournament}
          status={userStatus}
          loading={enrollmentLoading}
          appUrl={appUrl}
          onRegister={onRegister}
          onCheckIn={onCheckIn}
          onJoin={onJoin}
          onViewResults={onViewResults}
        />
      </div>
    </motion.div>
  )
}