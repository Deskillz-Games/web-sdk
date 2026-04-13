// =============================================================================
// TournamentLobbyCard -- Tournament post-check-in lifecycle UI
// Path: src/components/tournaments/TournamentLobbyCard.tsx
//
// Renders the waiting room / table assignment / match transition / bracket
// progress UI for tournaments AFTER a player has checked in.
//
// States:
//   LOADING           -> Skeleton placeholder
//   NOT_CHECKED_IN    -> Hidden (parent should show TournamentCard instead)
//   WAITING_FOR_START -> Countdown + checked-in players + bracket preview
//   TABLE_ASSIGNED    -> Table number + seat dots filling in real-time
//   MATCH_READY       -> "Match starting..." with countdown pulse
//   PLAYING           -> Compact "In game" indicator (game screen is primary)
//   BETWEEN_ROUNDS    -> Round results + "Advancing to Round X" + bracket
//   ELIMINATED        -> Final placement + prize info
//   CHAMPION          -> Celebration + prize
//   ERROR             -> Error + retry
//
// Uses Deskillz design tokens (CSS vars from DeskillzUI.css).
// No external dependencies beyond React + lucide-react.
// =============================================================================

import { useEffect, useState } from 'react'
import type { TournamentLobbyState, CurrentTableInfo, TablePlayer } from '../../hooks/useTournamentLobby'

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface TournamentLobbyCardProps {
  lobby: TournamentLobbyState
  onMatchStart?: (tableInfo: CurrentTableInfo) => void
  onRetry?: () => void
  className?: string
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0:00'
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  return `${m}:${s.toString().padStart(2, '0')}`
}

function pluralize(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`
}

// ---------------------------------------------------------------------------
// Seat Dots
// ---------------------------------------------------------------------------

function SeatDots({
  total,
  filled,
  players,
  mySeatNumber,
}: {
  total: number
  filled: number
  players: TablePlayer[]
  mySeatNumber: number
}) {
  const seats = Array.from({ length: total }, (_, i) => {
    const player = players.find((p) => p.seatNumber === i + 1)
    const isMe = i + 1 === mySeatNumber
    const isFilled = player && player.status !== 'EMPTY'
    return { index: i, player, isMe, isFilled }
  })

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
      {seats.map((seat) => (
        <div
          key={seat.index}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            minWidth: '48px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              border: seat.isMe
                ? '2px solid #06b6d4'
                : seat.isFilled
                  ? '2px solid #22c55e'
                  : '2px dashed rgba(255,255,255,0.2)',
              background: seat.isFilled
                ? seat.isMe
                  ? 'rgba(6, 182, 212, 0.2)'
                  : 'rgba(34, 197, 94, 0.15)'
                : 'rgba(255,255,255,0.05)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.3s ease',
              animation: !seat.isFilled ? 'dsk-seat-pulse 2s ease-in-out infinite' : undefined,
            }}
          >
            {seat.isFilled && seat.player ? (
              seat.player.avatarUrl ? (
                <img
                  src={seat.player.avatarUrl}
                  alt=""
                  style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <span style={{ fontSize: '14px', fontWeight: 600, color: seat.isMe ? '#06b6d4' : '#22c55e' }}>
                  {seat.player.username.charAt(0).toUpperCase()}
                </span>
              )
            ) : (
              <span style={{ fontSize: '18px', color: 'rgba(255,255,255,0.15)' }}>?</span>
            )}
          </div>
          <span
            style={{
              fontSize: '11px',
              color: seat.isMe ? '#06b6d4' : seat.isFilled ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.25)',
              fontWeight: seat.isMe ? 600 : 400,
              maxWidth: '56px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textAlign: 'center',
            }}
          >
            {seat.isMe ? 'You' : seat.isFilled && seat.player ? seat.player.username : `Seat ${seat.index + 1}`}
          </span>
        </div>
      ))}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Bracket Mini
// ---------------------------------------------------------------------------

function BracketMini({
  rounds,
  currentRound,
}: {
  rounds: Array<{ roundNumber: number; totalTables: number; playersRemaining: number; status: string }>
  currentRound: number
}) {
  if (rounds.length === 0) return null

  return (
    <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'center', padding: '12px 0' }}>
      {rounds.map((r) => {
        const isActive = r.roundNumber === currentRound
        const isCompleted = r.status === 'COMPLETED'
        const isFuture = r.roundNumber > currentRound

        return (
          <div key={r.roundNumber} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div
              style={{
                width: isActive ? '32px' : '24px',
                height: isActive ? '32px' : '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isActive ? '13px' : '11px',
                fontWeight: 700,
                transition: 'all 0.3s ease',
                background: isCompleted
                  ? '#22c55e'
                  : isActive
                    ? '#06b6d4'
                    : 'rgba(255,255,255,0.1)',
                color: isCompleted || isActive ? '#fff' : 'rgba(255,255,255,0.4)',
                border: isActive ? '2px solid rgba(6, 182, 212, 0.5)' : 'none',
                boxShadow: isActive ? '0 0 12px rgba(6, 182, 212, 0.3)' : 'none',
              }}
            >
              {r.roundNumber}
            </div>
            {r.roundNumber < rounds.length && (
              <div
                style={{
                  width: '16px',
                  height: '2px',
                  background: isCompleted
                    ? '#22c55e'
                    : isFuture
                      ? 'rgba(255,255,255,0.1)'
                      : '#06b6d4',
                  borderRadius: '1px',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function TournamentLobbyCard({
  lobby,
  onMatchStart,
  onRetry,
  className,
}: TournamentLobbyCardProps) {
  const [matchCountdown, setMatchCountdown] = useState(3)
  const [hasTriggeredStart, setHasTriggeredStart] = useState(false)

  // MATCH_READY auto-countdown and navigate
  useEffect(() => {
    if (lobby.status !== 'MATCH_READY') {
      setMatchCountdown(3)
      setHasTriggeredStart(false)
      return
    }

    const timer = setInterval(() => {
      setMatchCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [lobby.status])

  // Fire onMatchStart when countdown reaches 0
  useEffect(() => {
    if (lobby.status === 'MATCH_READY' && matchCountdown === 0 && !hasTriggeredStart && lobby.currentTable) {
      setHasTriggeredStart(true)
      onMatchStart?.(lobby.currentTable)
    }
  }, [lobby.status, matchCountdown, hasTriggeredStart, lobby.currentTable, onMatchStart])

  // Don't render if not checked in (parent should show TournamentCard)
  if (lobby.status === 'NOT_CHECKED_IN') return null

  const cardStyle: React.CSSProperties = {
    background: 'var(--dsk-card-bg, #1a1a2e)',
    border: '1px solid var(--dsk-card-border, #2a2a4a)',
    borderRadius: 'var(--dsk-card-radius, 0.75rem)',
    padding: 'var(--dsk-card-padding, 1.25rem)',
    color: 'var(--dsk-text-primary, #fff)',
    fontFamily: 'inherit',
    position: 'relative',
    overflow: 'hidden',
  }

  // Status-specific glow borders
  if (lobby.status === 'MATCH_READY') {
    cardStyle.borderColor = '#22c55e'
    cardStyle.boxShadow = '0 0 20px rgba(34, 197, 94, 0.15)'
  } else if (lobby.status === 'TABLE_ASSIGNED') {
    cardStyle.borderColor = 'rgba(6, 182, 212, 0.4)'
  } else if (lobby.status === 'CHAMPION') {
    cardStyle.borderColor = '#eab308'
    cardStyle.boxShadow = '0 0 24px rgba(234, 179, 8, 0.2)'
  } else if (lobby.status === 'ELIMINATED') {
    cardStyle.borderColor = 'rgba(239, 68, 68, 0.3)'
  }

  return (
    <div style={cardStyle} className={className}>
      {/* Inline keyframes for animations */}
      <style>{`
        @keyframes dsk-seat-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes dsk-match-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.05); opacity: 0.8; }
        }
        @keyframes dsk-champion-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(234, 179, 8, 0.2); }
          50% { box-shadow: 0 0 40px rgba(234, 179, 8, 0.4); }
        }
      `}</style>

      {/* ── LOADING ── */}
      {lobby.status === 'LOADING' && (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: '#06b6d4', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
          <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px' }}>Loading tournament...</p>
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* ── WAITING FOR START ── */}
      {lobby.status === 'WAITING_FOR_START' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Tournament Lobby
          </div>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            {lobby.tournamentName || 'Tournament'}
          </div>

          {lobby.secondsUntilStart > 0 ? (
            <>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>
                Starting in
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, color: '#06b6d4', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {formatTime(lobby.secondsUntilStart)}
              </div>
            </>
          ) : (
            <div style={{ fontSize: '15px', color: '#22c55e', fontWeight: 600 }}>
              Starting soon...
            </div>
          )}

          {lobby.bracketRounds.length > 0 && (
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px' }}>
                {pluralize(lobby.totalRounds, 'Round')} -- {lobby.seatsPerTable} players per table
              </div>
              <BracketMini rounds={lobby.bracketRounds} currentRound={lobby.currentRound} />
            </div>
          )}

          <div style={{
            marginTop: '16px', padding: '8px 12px', borderRadius: '8px',
            background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.2)',
            fontSize: '13px', color: '#06b6d4',
          }}>
            You are checked in. Please stay on this screen.
          </div>
        </div>
      )}

      {/* ── TABLE ASSIGNED ── */}
      {lobby.status === 'TABLE_ASSIGNED' && lobby.currentTable && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
            Table Assigned
          </div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#06b6d4', marginBottom: '4px' }}>
            Table {lobby.currentTable.tableNumber}
          </div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '16px' }}>
            Seat {lobby.currentTable.seatNumber} -- Waiting for players
          </div>

          <SeatDots
            total={lobby.seatsPerTable}
            filled={lobby.currentTable.filledSeats}
            players={lobby.currentTable.players}
            mySeatNumber={lobby.currentTable.seatNumber}
          />

          <div style={{
            marginTop: '16px', fontSize: '13px', color: 'rgba(255,255,255,0.4)',
          }}>
            {lobby.currentTable.filledSeats} of {lobby.seatsPerTable} seats filled
          </div>

          {lobby.currentTable.filledSeats < lobby.seatsPerTable && (
            <div style={{
              marginTop: '8px', fontSize: '12px', color: 'rgba(255,255,255,0.3)',
            }}>
              Filling match...
            </div>
          )}
        </div>
      )}

      {/* ── MATCH READY ── */}
      {lobby.status === 'MATCH_READY' && lobby.currentTable && (
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: '20px', fontWeight: 800, color: '#22c55e', marginBottom: '12px',
              animation: 'dsk-match-pulse 1s ease-in-out infinite',
            }}
          >
            Match Starting!
          </div>

          <SeatDots
            total={lobby.seatsPerTable}
            filled={lobby.currentTable.filledSeats}
            players={lobby.currentTable.players}
            mySeatNumber={lobby.currentTable.seatNumber}
          />

          <div style={{
            marginTop: '16px', width: '56px', height: '56px', borderRadius: '50%',
            background: 'rgba(34, 197, 94, 0.15)', border: '2px solid #22c55e',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '16px auto 0',
            fontSize: '24px', fontWeight: 800, color: '#22c55e',
            animation: 'dsk-match-pulse 0.8s ease-in-out infinite',
          }}>
            {matchCountdown > 0 ? matchCountdown : 'GO'}
          </div>
        </div>
      )}

      {/* ── PLAYING ── */}
      {lobby.status === 'PLAYING' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
          <div style={{
            width: '10px', height: '10px', borderRadius: '50%', background: '#22c55e',
            animation: 'dsk-match-pulse 1.5s ease-in-out infinite',
          }} />
          <div>
            <div style={{ fontSize: '14px', fontWeight: 600 }}>
              Round {lobby.currentRound} -- Table {lobby.currentTable?.tableNumber ?? '?'}
            </div>
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
              Match in progress
            </div>
          </div>
        </div>
      )}

      {/* ── BETWEEN ROUNDS ── */}
      {lobby.status === 'BETWEEN_ROUNDS' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: 600, marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Round {lobby.currentRound} Complete
          </div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '12px' }}>
            You Advanced!
          </div>

          {lobby.bracketRounds.length > 0 && (
            <BracketMini rounds={lobby.bracketRounds} currentRound={lobby.currentRound + 1} />
          )}

          <div style={{
            marginTop: '12px', fontSize: '13px', color: 'rgba(255,255,255,0.4)',
          }}>
            Waiting for Round {lobby.currentRound + 1} to begin...
          </div>
        </div>
      )}

      {/* ── ELIMINATED ── */}
      {lobby.status === 'ELIMINATED' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '36px', marginBottom: '8px' }}>GG</div>
          <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '4px' }}>
            Eliminated
          </div>
          {lobby.eliminatedInRound != null && (
            <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
              Knocked out in Round {lobby.eliminatedInRound} of {lobby.totalRounds}
            </div>
          )}

          {lobby.bracketRounds.length > 0 && (
            <div style={{ marginTop: '12px' }}>
              <BracketMini rounds={lobby.bracketRounds} currentRound={lobby.currentRound} />
            </div>
          )}
        </div>
      )}

      {/* ── CHAMPION ── */}
      {lobby.status === 'CHAMPION' && (
        <div style={{ textAlign: 'center', animation: 'dsk-champion-glow 2s ease-in-out infinite' }}>
          <div style={{ fontSize: '48px', marginBottom: '8px' }}>&#127942;</div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: '#eab308', marginBottom: '4px' }}>
            Champion!
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
            You won {lobby.tournamentName}
          </div>
        </div>
      )}

      {/* ── ERROR ── */}
      {lobby.status === 'ERROR' && (
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '14px', color: '#ef4444', marginBottom: '12px' }}>
            {lobby.error || 'Something went wrong'}
          </div>
          <button
            onClick={onRetry ?? lobby.refresh}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', fontSize: '13px',
              fontWeight: 600, cursor: 'pointer',
            }}
          >
            Try Again
          </button>
        </div>
      )}

      {/* ── Round indicator (for states that show it) ── */}
      {['TABLE_ASSIGNED', 'MATCH_READY', 'PLAYING'].includes(lobby.status) && lobby.totalRounds > 1 && (
        <div style={{
          marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '12px', color: 'rgba(255,255,255,0.35)',
        }}>
          <span>Round {lobby.currentRound} of {lobby.totalRounds}</span>
          <span>{lobby.tournamentName}</span>
        </div>
      )}
    </div>
  )
}