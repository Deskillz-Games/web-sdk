// =============================================================================
// DisputeModal -- File a dispute with smart match context
// Path: src/components/tournaments/DisputeModal.tsx
//
// 4-layer dispute context:
//   Layer 1: Auto-attach when matchId/tournamentId passed as props (ResultsScreen)
//   Layer 2: Recent matches selector (fetched from bridge.getRecentMatchesForDispute)
//   Layer 3: localStorage last-match auto-suggestion
//   Layer 4: Manual roomCode fallback field
//
// Usage:
//   <DisputeModal
//     isOpen={showDispute}
//     onClose={() => setShowDispute(false)}
//     disputeType="QUICK_PLAY"         // or omit for auto-detect
//     matchId={matchId}                // optional -- auto-attached from ResultsScreen
//     tournamentId={tournamentId}      // optional
//     roomCode={roomCode}              // optional
//   />
// =============================================================================

import { useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  disputeType?: 'TOURNAMENT' | 'QUICK_PLAY' | 'PRIVATE_ROOM'
  tournamentId?: string
  matchId?: string
  roomCode?: string
  onSuccess?: (disputeId: string) => void
}

interface RecentMatch {
  matchId: string
  tournamentId: string | null
  matchType: string
  opponentName: string
  myScore: number | null
  isWinner: boolean
  playedAt: string
  gameName: string
}

const DISPUTE_REASONS = [
  { value: 'WRONG_SCORE', label: 'Wrong Score', description: 'My score was recorded incorrectly' },
  { value: 'CHEATING', label: 'Suspected Cheating', description: 'Another player may have cheated' },
  { value: 'DISCONNECTION', label: 'Disconnection', description: 'I was disconnected during the match' },
  { value: 'NPC_ISSUE', label: 'Opponent Issue', description: 'Something was wrong with my opponent' },
  { value: 'PAYMENT_ISSUE', label: 'Payment Issue', description: 'Entry fee or prize payout problem' },
  { value: 'UNFAIR_MATCHMAKING', label: 'Unfair Match', description: 'Skill gap was too large' },
  { value: 'OTHER', label: 'Other', description: 'Something else went wrong' },
]

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'
type MatchSource = 'props' | 'recent' | 'last' | 'manual' | 'none'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBridge(): any {
  return (window as any).DeskillzBridge?.getInstance?.()
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function inferDisputeType(matchType?: string): 'TOURNAMENT' | 'QUICK_PLAY' | 'PRIVATE_ROOM' {
  if (matchType === 'TOURNAMENT') return 'TOURNAMENT'
  if (matchType === 'PRIVATE_ROOM') return 'PRIVATE_ROOM'
  return 'QUICK_PLAY'
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DisputeModal({
  isOpen,
  onClose,
  disputeType: propDisputeType,
  tournamentId: propTournamentId,
  matchId: propMatchId,
  roomCode: propRoomCode,
  onSuccess,
}: DisputeModalProps) {
  // Form state
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [disputeId, setDisputeId] = useState<string | null>(null)

  // Match context state
  const [matchSource, setMatchSource] = useState<MatchSource>('none')
  const [selectedMatchId, setSelectedMatchId] = useState<string | undefined>(propMatchId)
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | undefined>(propTournamentId)
  const [selectedDisputeType, setSelectedDisputeType] = useState(propDisputeType || 'QUICK_PLAY')
  const [manualRoomCode, setManualRoomCode] = useState(propRoomCode || '')

  // Recent matches (Layer 2)
  const [recentMatches, setRecentMatches] = useState<RecentMatch[]>([])
  const [loadingMatches, setLoadingMatches] = useState(false)

  // Last match from localStorage (Layer 3)
  const [lastMatch, setLastMatch] = useState<any>(null)

  // Determine if we have context from props (Layer 1)
  const hasPropsContext = !!(propMatchId || propTournamentId)

  // Load recent matches and last match when modal opens without props context
  useEffect(() => {
    if (!isOpen) return
    if (hasPropsContext) {
      setMatchSource('props')
      setSelectedMatchId(propMatchId)
      setSelectedTournamentId(propTournamentId)
      setSelectedDisputeType(propDisputeType || 'QUICK_PLAY')
      setManualRoomCode(propRoomCode || '')
      return
    }

    // Layer 3: Check localStorage
    const bridge = getBridge()
    if (bridge?.getLastMatch) {
      const lm = bridge.getLastMatch()
      if (lm) setLastMatch(lm)
    }

    // Layer 2: Fetch recent matches
    if (bridge?.getRecentMatchesForDispute) {
      setLoadingMatches(true)
      bridge.getRecentMatchesForDispute()
        .then((matches: RecentMatch[]) => setRecentMatches(matches))
        .catch(() => setRecentMatches([]))
        .finally(() => setLoadingMatches(false))
    }
  }, [isOpen, hasPropsContext, propMatchId, propTournamentId, propDisputeType, propRoomCode])

  const selectRecentMatch = (match: RecentMatch) => {
    setSelectedMatchId(match.matchId)
    setSelectedTournamentId(match.tournamentId || undefined)
    setSelectedDisputeType(inferDisputeType(match.matchType))
    setMatchSource('recent')
  }

  const selectLastMatch = () => {
    if (!lastMatch) return
    setSelectedMatchId(lastMatch.matchId)
    setSelectedTournamentId(lastMatch.tournamentId)
    setSelectedDisputeType(lastMatch.disputeType || 'QUICK_PLAY')
    setManualRoomCode(lastMatch.roomCode || '')
    setMatchSource('last')
  }

  const clearMatchSelection = () => {
    setSelectedMatchId(undefined)
    setSelectedTournamentId(undefined)
    setManualRoomCode('')
    setMatchSource('none')
  }

  const handleSubmit = useCallback(async () => {
    if (!reason || description.length < 10) return

    const bridge = getBridge()
    if (!bridge) {
      setErrorMsg('Unable to connect. Please try again.')
      setSubmitState('error')
      return
    }

    setSubmitState('submitting')
    setErrorMsg('')

    try {
      const result = await bridge.fileDispute({
        disputeType: selectedDisputeType,
        tournamentId: selectedTournamentId || undefined,
        matchId: selectedMatchId || undefined,
        roomCode: manualRoomCode || undefined,
        reason,
        description,
        evidence: [],
      })

      setDisputeId(result.id)
      setSubmitState('success')
      onSuccess?.(result.id)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit dispute'
      setErrorMsg(msg)
      setSubmitState('error')
    }
  }, [reason, description, selectedDisputeType, selectedTournamentId, selectedMatchId, manualRoomCode, onSuccess])

  const handleClose = () => {
    setReason('')
    setDescription('')
    setSubmitState('idle')
    setErrorMsg('')
    setDisputeId(null)
    setSelectedMatchId(propMatchId)
    setSelectedTournamentId(propTournamentId)
    setSelectedDisputeType(propDisputeType || 'QUICK_PLAY')
    setManualRoomCode(propRoomCode || '')
    setMatchSource(hasPropsContext ? 'props' : 'none')
    setRecentMatches([])
    setLastMatch(null)
    onClose()
  }

  if (!isOpen) return null

  // -- Styles --
  const overlayStyle: React.CSSProperties = {
    position: 'fixed', inset: 0, zIndex: 9999,
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.7)', backdropFilter: 'blur(4px)', padding: '16px',
  }
  const modalStyle: React.CSSProperties = {
    background: 'var(--dsk-card-bg, #1a1a2e)',
    border: '1px solid var(--dsk-card-border, #2a2a4a)',
    borderRadius: '16px', padding: '24px', maxWidth: '480px',
    width: '100%', maxHeight: '85vh', overflowY: 'auto',
    color: '#fff', fontFamily: 'inherit',
  }
  const chipStyle = (selected: boolean): React.CSSProperties => ({
    padding: '6px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 600,
    border: selected ? '2px solid #06b6d4' : '2px solid rgba(255,255,255,0.1)',
    background: selected ? 'rgba(6, 182, 212, 0.1)' : 'rgba(255,255,255,0.03)',
    color: selected ? '#06b6d4' : 'rgba(255,255,255,0.5)',
    cursor: 'pointer', transition: 'all 0.2s',
  })

  // Context badge colour
  const badgeColors = {
    TOURNAMENT: { bg: 'rgba(168, 85, 247, 0.15)', border: 'rgba(168, 85, 247, 0.3)', text: '#a855f7', label: 'Tournament' },
    QUICK_PLAY: { bg: 'rgba(6, 182, 212, 0.15)', border: 'rgba(6, 182, 212, 0.3)', text: '#06b6d4', label: 'Quick Play Match' },
    PRIVATE_ROOM: { bg: 'rgba(236, 72, 153, 0.15)', border: 'rgba(236, 72, 153, 0.3)', text: '#ec4899', label: 'Private Room' },
  }
  const badge = badgeColors[selectedDisputeType]

  // -- SUCCESS STATE --
  if (submitState === 'success') {
    return (
      <div style={overlayStyle} onClick={handleClose}>
        <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{
              width: '56px', height: '56px', borderRadius: '50%',
              background: 'rgba(34, 197, 94, 0.15)', border: '2px solid #22c55e',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px', fontSize: '24px',
            }}>&#10003;</div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Dispute Submitted</h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
              Your dispute has been filed and our team will review it.
            </p>
            {disputeId && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                Reference: {disputeId.substring(0, 8)}...
              </p>
            )}
            <button onClick={handleClose} style={{
              marginTop: '20px', padding: '10px 32px', borderRadius: '10px',
              background: '#22c55e', color: '#fff', fontWeight: 600,
              fontSize: '14px', border: 'none', cursor: 'pointer',
            }}>Done</button>
          </div>
        </div>
      </div>
    )
  }

  // -- FORM STATE --
  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>File a Dispute</h3>
          <button onClick={handleClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}>
            &#10005;
          </button>
        </div>

        {/* ── MATCH CONTEXT SECTION ── */}
        {hasPropsContext ? (
          /* Layer 1: Auto-attached from ResultsScreen */
          <div style={{ marginBottom: '16px' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '8px',
              background: badge.bg, border: `1px solid ${badge.border}`,
              fontSize: '12px', fontWeight: 600, color: badge.text,
            }}>
              {badge.label}
            </div>
            {selectedMatchId && (
              <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginTop: '6px' }}>
                Match: {selectedMatchId.substring(0, 8)}...
              </p>
            )}
          </div>
        ) : (
          /* Layers 2-4: No props context -- show match picker */
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
              Which match is this about? *
            </label>

            {/* Layer 3: Last match suggestion */}
            {lastMatch && matchSource !== 'recent' && matchSource !== 'last' && (
              <button onClick={selectLastMatch} style={{
                width: '100%', padding: '10px 14px', borderRadius: '10px', textAlign: 'left',
                border: '2px solid rgba(34, 197, 94, 0.3)', background: 'rgba(34, 197, 94, 0.08)',
                cursor: 'pointer', marginBottom: '10px', transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#22c55e', marginBottom: '2px' }}>
                  Your last match
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                  vs {lastMatch.opponentName || 'opponent'} -- {timeAgo(lastMatch.completedAt)}
                  {lastMatch.roomCode && ` -- Code: ${lastMatch.roomCode}`}
                </div>
              </button>
            )}

            {/* Selected match indicator */}
            {(matchSource === 'recent' || matchSource === 'last') && selectedMatchId && (
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '8px 12px', borderRadius: '8px', marginBottom: '10px',
                background: 'rgba(6, 182, 212, 0.1)', border: '1px solid rgba(6, 182, 212, 0.3)',
              }}>
                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: '6px',
                    padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 600,
                    background: badge.bg, border: `1px solid ${badge.border}`, color: badge.text,
                  }}>
                    {badge.label}
                  </div>
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                    Match: {selectedMatchId.substring(0, 8)}...
                  </p>
                </div>
                <button onClick={clearMatchSelection} style={{
                  background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)',
                  cursor: 'pointer', fontSize: '14px', padding: '4px',
                }}>&#10005;</button>
              </div>
            )}

            {/* Layer 2: Recent matches grid */}
            {matchSource !== 'recent' && matchSource !== 'last' && (
              <>
                {loadingMatches ? (
                  <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginBottom: '8px' }}>Loading recent matches...</p>
                ) : recentMatches.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '10px', maxHeight: '180px', overflowY: 'auto' }}>
                    {recentMatches.map((m) => (
                      <button key={m.matchId} onClick={() => selectRecentMatch(m)} style={{
                        padding: '8px 12px', borderRadius: '8px', textAlign: 'left',
                        border: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontSize: '12px', fontWeight: 600, color: '#fff' }}>
                              vs {m.opponentName}
                            </span>
                            <span style={{
                              marginLeft: '8px', fontSize: '10px', fontWeight: 600,
                              color: m.isWinner ? '#22c55e' : '#ef4444',
                            }}>
                              {m.isWinner ? 'WIN' : 'LOSS'}
                            </span>
                          </div>
                          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)' }}>{timeAgo(m.playedAt)}</span>
                        </div>
                        <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                          {m.gameName} -- Score: {m.myScore ?? '-'}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : !loadingMatches && (
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '8px' }}>No recent matches found.</p>
                )}
              </>
            )}

            {/* Layer 4: Manual room code fallback */}
            {matchSource !== 'recent' && matchSource !== 'last' && matchSource !== 'props' && (
              <div style={{ marginTop: '6px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '4px' }}>
                  Or enter a room code manually:
                </label>
                <input
                  type="text"
                  value={manualRoomCode}
                  onChange={(e) => {
                    setManualRoomCode(e.target.value.toUpperCase())
                    if (e.target.value.length >= 4) setMatchSource('manual')
                  }}
                  placeholder="e.g. DSKZ-AB12"
                  maxLength={12}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '8px',
                    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '13px', outline: 'none', fontFamily: 'monospace',
                    letterSpacing: '1px',
                  }}
                />
              </div>
            )}

            {/* Dispute type selector (when no match selected) */}
            {matchSource === 'manual' && (
              <div style={{ marginTop: '10px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginBottom: '6px' }}>
                  What type of game was this?
                </label>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {(['TOURNAMENT', 'QUICK_PLAY', 'PRIVATE_ROOM'] as const).map((t) => (
                    <button key={t} onClick={() => setSelectedDisputeType(t)} style={chipStyle(selectedDisputeType === t)}>
                      {t === 'TOURNAMENT' ? 'Tournament' : t === 'QUICK_PLAY' ? 'Quick Play' : 'Private Room'}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── REASON SELECTOR ── */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
            What happened? *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DISPUTE_REASONS.map((r) => (
              <button key={r.value} onClick={() => setReason(r.value)} style={{
                padding: '10px 12px', borderRadius: '10px', textAlign: 'left',
                border: reason === r.value ? '2px solid #a855f7' : '2px solid rgba(255,255,255,0.1)',
                background: reason === r.value ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.03)',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: reason === r.value ? '#a855f7' : '#fff' }}>
                  {r.label}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>
                  {r.description}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── DESCRIPTION ── */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
            Describe what happened * <span style={{ color: 'rgba(255,255,255,0.25)' }}>(min 10 characters)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please provide details about the issue..."
            rows={4}
            style={{
              width: '100%', padding: '12px', borderRadius: '10px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff', fontSize: '14px', resize: 'vertical',
              outline: 'none', fontFamily: 'inherit',
            }}
          />
          <div style={{ textAlign: 'right', fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginTop: '4px' }}>
            {description.length}/2000
          </div>
        </div>

        {/* ── ERROR ── */}
        {submitState === 'error' && errorMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '13px', color: '#ef4444',
          }}>{errorMsg}</div>
        )}

        {/* ── SUBMIT ── */}
        <button
          onClick={handleSubmit}
          disabled={!reason || description.length < 10 || submitState === 'submitting'}
          style={{
            width: '100%', padding: '12px', borderRadius: '10px',
            background: !reason || description.length < 10
              ? 'rgba(255,255,255,0.1)'
              : 'linear-gradient(135deg, #a855f7, #ec4899)',
            color: !reason || description.length < 10 ? 'rgba(255,255,255,0.3)' : '#fff',
            fontWeight: 700, fontSize: '14px', border: 'none',
            cursor: !reason || description.length < 10 ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s',
            opacity: submitState === 'submitting' ? 0.7 : 1,
          }}
        >
          {submitState === 'submitting' ? 'Submitting...' : 'Submit Dispute'}
        </button>

        {/* ── FOOTER ── */}
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: '12px' }}>
          Disputes are reviewed within 24-48 hours. Filing false disputes may result in account restrictions.
        </p>
      </div>
    </div>
  )
}