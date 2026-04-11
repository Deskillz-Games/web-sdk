// =============================================================================
// LobbyOverlay — packages/game-ui/src/LobbyOverlay.tsx
//
// Full React lobby shell mounted by DeskillzUI.renderLobby().
// Renders inside #dsk-lobby-overlay div in non-React games.
//
// Contains:
//   - Auth guard (shows login if not authenticated)
//   - Tab navigation: Tournaments | Quick Play
//   - Tournament list with unified TournamentCard per tournament
//   - QuickPlay page with unified QuickPlayCard
//
// The host game never needs to know what's inside here.
// It only calls renderLobby() and listens for onMatchStart().
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { Toaster } from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, Trophy, X, Loader2, AlertCircle, Filter, RefreshCw, Users, Coins } from 'lucide-react'
import TournamentCard from './components/tournaments/TournamentCard'
import QuickPlayCard from './components/tournaments/QuickPlayCard'
import { useEnrollmentStatus } from './hooks/useEnrollmentStatus'
import { useQuickPlayQueue } from './hooks/useQuickPlayQueue'
import type { Tournament } from './bridge-types'
import type { QuickPlayLaunchData } from './bridge-types'

// =============================================================================
// QUERY CLIENT — isolated per lobby instance
// =============================================================================

// =============================================================================
// TYPES
// =============================================================================

export interface LobbyConfig {
  gameId: string
  apiUrl: string
  token: string | null
  onMatchStart: (matchData: QuickPlayLaunchData) => void
  onClose?: () => void
}

type LobbyTab = 'tournaments' | 'quickplay'

// =============================================================================
// TOURNAMENT ROW — isolated so each card has its own enrollment hook
// =============================================================================

function TournamentRow({
  tournament,
  index,
}: {
  tournament: Tournament
  index: number
}) {
  const { status, dqCountdown, loading } = useEnrollmentStatus(tournament.id, {
    enabled:
      tournament.status !== 'COMPLETED' && tournament.status !== 'CANCELLED',
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.05, 0.25) }}
    >
      <TournamentCard
        tournament={tournament}
        userStatus={status}
        dqCountdown={dqCountdown}
        enrollmentLoading={loading}
        appUrl={undefined}
      />
    </motion.div>
  )
}

// =============================================================================
// TOURNAMENTS TAB
// =============================================================================

type TournamentFilter = 'ALL' | 'OPEN' | 'LIVE' | 'COMPLETED'

const TOURNAMENT_FILTERS: { id: TournamentFilter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'OPEN', label: 'Open' },
  { id: 'LIVE', label: 'Live' },
  { id: 'COMPLETED', label: 'Completed' },
]

function filterTournaments(list: Tournament[], filter: TournamentFilter): Tournament[] {
  if (filter === 'ALL') return list
  if (filter === 'OPEN') return list.filter(t => t.status === 'OPEN' || t.status === 'SCHEDULED')
  if (filter === 'LIVE') return list.filter(t => t.status === 'IN_PROGRESS')
  if (filter === 'COMPLETED') return list.filter(t => t.status === 'COMPLETED')
  return list
}

function TournamentsTab({ gameId }: { gameId: string }) {
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<TournamentFilter>('ALL')
  const [refreshing, setRefreshing] = useState(false)

  const fetchTournaments = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)
    try {
      const bridge = (window as any).DeskillzBridge?.getInstance?.()
      if (!bridge) { setLoading(false); setRefreshing(false); return }
      const data = await bridge.getTournaments({ gameId })
      setTournaments(data)
    } catch {
      if (!silent) setError('Could not load tournaments')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [gameId])

  useEffect(() => {
    fetchTournaments()
  }, [fetchTournaments])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => fetchTournaments(true), 30000)
    return () => clearInterval(interval)
  }, [fetchTournaments])

  const filtered = filterTournaments(tournaments, filter)
  const liveCount = tournaments.filter(t => t.status === 'IN_PROGRESS').length
  const openCount = tournaments.filter(t => t.status === 'OPEN' || t.status === 'SCHEDULED').length
  const totalPrize = tournaments.reduce((sum, t) => sum + (t.prizePool || 0), 0)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem', gap: '0.75rem' }}>
        <Loader2 style={{ width: 20, height: 20, color: '#06b6d4', animation: 'spin 1s linear infinite' }} />
        <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Loading tournaments...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 8, border: '1px solid rgba(239,68,68,0.2)', width: '100%' }}>
          <AlertCircle style={{ width: 18, height: 18, color: '#f87171', flexShrink: 0 }} />
          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{error}</span>
        </div>
        <button onClick={() => fetchTournaments()} style={{
          background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)',
          borderRadius: 8, padding: '0.5rem 1.25rem', color: '#06b6d4', fontSize: 13,
          fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <RefreshCw style={{ width: 14, height: 14 }} /> Retry
        </button>
      </div>
    )
  }

  if (tournaments.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {/* Preview skeleton cards */}
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              borderRadius: 12,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderLeft: '4px solid rgba(6,182,212,0.2)',
              padding: '1rem 1.25rem',
              opacity: 1 - i * 0.25,
            }}
          >
            {/* Header skeleton */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ height: 14, width: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
                <div style={{ height: 16, width: 140 + i * 30, background: 'rgba(255,255,255,0.05)', borderRadius: 4 }} />
              </div>
              <div style={{ height: 20, width: 40, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }} />
            </div>

            {/* Stats grid skeleton */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 12 }}>
              {[0, 1, 2, 3].map((j) => (
                <div key={j} style={{ height: 48, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }} />
              ))}
            </div>

            {/* Progress bar skeleton */}
            <div style={{ height: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 999, marginBottom: 12 }} />

            {/* Button skeleton */}
            <div style={{ height: 36, background: 'rgba(255,255,255,0.04)', borderRadius: 8 }} />
          </div>
        ))}

        {/* Message */}
        <div style={{
          textAlign: 'center',
          padding: '1.5rem 1rem',
          color: 'rgba(255,255,255,0.35)',
          fontSize: 13,
          lineHeight: 1.6,
        }}>
          <Trophy style={{ width: 24, height: 24, margin: '0 auto 8px', opacity: 0.3 }} />
          <p style={{ fontWeight: 600, color: 'rgba(255,255,255,0.5)', marginBottom: 4 }}>
            No tournaments scheduled yet
          </p>
          <p>
            Tournaments will appear here when the game developer or host creates them.
            Check back soon or try Quick Play for instant matches!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {/* Stats summary bar */}
      {tournaments.length > 0 && (
        <div style={{
          display: 'flex', gap: 12, padding: '0.5rem 0', marginBottom: 4,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            <Trophy style={{ width: 12, height: 12 }} />
            <span>{tournaments.length} total</span>
          </div>
          {liveCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f87171' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f87171', animation: 'pulse 2s infinite' }} />
              <span>{liveCount} live</span>
            </div>
          )}
          {openCount > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#06b6d4' }}>
              <Users style={{ width: 12, height: 12 }} />
              <span>{openCount} open</span>
            </div>
          )}
          {totalPrize > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#4ade80' }}>
              <Coins style={{ width: 12, height: 12 }} />
              <span>${totalPrize.toFixed(0)} prizes</span>
            </div>
          )}

          {/* Refresh button */}
          <button onClick={() => fetchTournaments(true)} style={{
            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
            color: refreshing ? '#06b6d4' : 'rgba(255,255,255,0.3)', padding: 2,
            display: 'flex', alignItems: 'center',
          }}>
            <RefreshCw style={{
              width: 14, height: 14,
              animation: refreshing ? 'spin 1s linear infinite' : 'none',
            }} />
          </button>
        </div>
      )}

      {/* Filter bar */}
      {tournaments.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {TOURNAMENT_FILTERS.map((f) => {
            const count = filterTournaments(tournaments, f.id).length
            const active = filter === f.id
            return (
              <button key={f.id} onClick={() => setFilter(f.id)} style={{
                padding: '0.35rem 0.75rem', borderRadius: 8, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s', border: 'none',
                background: active ? 'rgba(6,182,212,0.15)' : 'rgba(255,255,255,0.04)',
                color: active ? '#06b6d4' : 'rgba(255,255,255,0.45)',
              }}>
                {f.label}{count > 0 ? ` (${count})` : ''}
              </button>
            )
          })}
        </div>
      )}

      {/* Filtered tournament list */}
      {filtered.length > 0 ? (
        filtered.map((t, i) => (
          <TournamentRow key={t.id} tournament={t} index={i} />
        ))
      ) : tournaments.length > 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          <Filter style={{ width: 20, height: 20, margin: '0 auto 8px', opacity: 0.4 }} />
          <p>No {filter.toLowerCase()} tournaments</p>
          <button onClick={() => setFilter('ALL')} style={{
            marginTop: 8, background: 'none', border: 'none', color: '#06b6d4',
            fontSize: 12, cursor: 'pointer', textDecoration: 'underline',
          }}>
            Show all tournaments
          </button>
        </div>
      ) : null}
    </div>
  )
}

// =============================================================================
// QUICKPLAY TAB
// =============================================================================

function QuickPlayTab({
  gameId,
  onMatchStart,
}: {
  gameId: string
  onMatchStart: (matchData: QuickPlayLaunchData) => void
}) {
  const qp = useQuickPlayQueue(gameId)

  return (
    <QuickPlayCard
      qp={qp}
      onMatchStart={onMatchStart}
    />
  )
}

// =============================================================================
// LOBBY OVERLAY — main shell
// =============================================================================

function LobbyShell({ config }: { config: LobbyConfig }) {
  const [activeTab, setActiveTab] = useState<LobbyTab>('tournaments')

  const tabs: { id: LobbyTab; label: string; icon: typeof Trophy }[] = [
    { id: 'tournaments', label: 'Tournaments', icon: Trophy },
    { id: 'quickplay', label: 'Quick Play', icon: Zap },
  ]

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 1000,
      background: 'var(--dsk-card-darker, #13131f)',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'Inter, system-ui, sans-serif',
      overflowY: 'auto',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '1rem 1.25rem',
        borderBottom: '1px solid var(--dsk-card-border, #2a2a4a)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Zap style={{ width: 18, height: 18, color: '#06b6d4' }} />
          <span style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Deskillz</span>
        </div>
        {config.onClose && (
          <button
            onClick={config.onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'rgba(255,255,255,0.4)',
              padding: '0.25rem',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X style={{ width: 20, height: 20 }} />
          </button>
        )}
      </div>

      {/* Tab nav */}
      <div style={{
        display: 'flex',
        gap: '0.25rem',
        padding: '0.75rem 1.25rem 0',
        borderBottom: '1px solid var(--dsk-card-border, #2a2a4a)',
        flexShrink: 0,
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 1rem',
                background: 'none',
                border: 'none',
                borderBottom: active ? '2px solid #06b6d4' : '2px solid transparent',
                color: active ? '#06b6d4' : 'rgba(255,255,255,0.4)',
                fontWeight: active ? 600 : 400,
                fontSize: 14,
                cursor: 'pointer',
                marginBottom: -1,
                transition: 'color 0.15s, border-color 0.15s',
              }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Tab content */}
      <div style={{ flex: 1, padding: '1rem 1.25rem', overflowY: 'auto' }}>
        <AnimatePresence mode="wait">
          {activeTab === 'tournaments' && (
            <motion.div
              key="tournaments"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <TournamentsTab gameId={config.gameId} />
            </motion.div>
          )}
          {activeTab === 'quickplay' && (
            <motion.div
              key="quickplay"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <QuickPlayTab
                gameId={config.gameId}
                onMatchStart={config.onMatchStart}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid #2a2a4a',
            fontSize: 13,
          },
        }}
      />
    </div>
  )
}

// =============================================================================
// EXPORTED COMPONENT — wrapped in providers
// =============================================================================

export default function LobbyOverlay({ config }: { config: LobbyConfig }) {
  return (
    <LobbyShell config={config} />
  )
}