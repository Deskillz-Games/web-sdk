// =============================================================================
// DisputeModal -- File a dispute from a match/tournament results screen
// Path: src/components/tournaments/DisputeModal.tsx
//
// Usage:
//   <DisputeModal
//     isOpen={showDispute}
//     onClose={() => setShowDispute(false)}
//     disputeType="QUICK_PLAY"
//     matchId={matchId}
//     tournamentId={tournamentId}  // optional
//   />
//
// The modal handles the full flow: reason selection, description, evidence,
// submission via bridge.fileDispute(), success/error states.
// =============================================================================

import { useState, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DisputeModalProps {
  isOpen: boolean
  onClose: () => void
  disputeType: 'TOURNAMENT' | 'QUICK_PLAY' | 'PRIVATE_ROOM'
  tournamentId?: string
  matchId?: string
  onSuccess?: (disputeId: string) => void
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function DisputeModal({
  isOpen,
  onClose,
  disputeType,
  tournamentId,
  matchId,
  onSuccess,
}: DisputeModalProps) {
  const [reason, setReason] = useState('')
  const [description, setDescription] = useState('')
  const [submitState, setSubmitState] = useState<SubmitState>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const [disputeId, setDisputeId] = useState<string | null>(null)

  const handleSubmit = useCallback(async () => {
    if (!reason || description.length < 10) return

    const bridge = (window as any).DeskillzBridge?.getInstance?.()
    if (!bridge) {
      setErrorMsg('Unable to connect. Please try again.')
      setSubmitState('error')
      return
    }

    setSubmitState('submitting')
    setErrorMsg('')

    try {
      const result = await bridge.fileDispute({
        disputeType,
        tournamentId: tournamentId || undefined,
        matchId: matchId || undefined,
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
  }, [reason, description, disputeType, tournamentId, matchId, onSuccess])

  const handleClose = () => {
    // Reset state on close
    setReason('')
    setDescription('')
    setSubmitState('idle')
    setErrorMsg('')
    setDisputeId(null)
    onClose()
  }

  if (!isOpen) return null

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    inset: 0,
    zIndex: 9999,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.7)',
    backdropFilter: 'blur(4px)',
    padding: '16px',
  }

  const modalStyle: React.CSSProperties = {
    background: 'var(--dsk-card-bg, #1a1a2e)',
    border: '1px solid var(--dsk-card-border, #2a2a4a)',
    borderRadius: '16px',
    padding: '24px',
    maxWidth: '480px',
    width: '100%',
    maxHeight: '85vh',
    overflowY: 'auto',
    color: '#fff',
    fontFamily: 'inherit',
  }

  // ── SUCCESS STATE ──
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
            }}>
              &#10003;
            </div>
            <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
              Dispute Submitted
            </h3>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
              Your dispute has been filed and our team will review it.
            </p>
            {disputeId && (
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)' }}>
                Reference: {disputeId.substring(0, 8)}...
              </p>
            )}
            <button
              onClick={handleClose}
              style={{
                marginTop: '20px', padding: '10px 32px', borderRadius: '10px',
                background: '#22c55e', color: '#fff', fontWeight: 600,
                fontSize: '14px', border: 'none', cursor: 'pointer',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    )
  }

  // ── FORM STATE ──
  return (
    <div style={overlayStyle} onClick={handleClose}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 700 }}>File a Dispute</h3>
          <button
            onClick={handleClose}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '20px' }}
          >
            &#10005;
          </button>
        </div>

        {/* Context badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          padding: '4px 12px', borderRadius: '8px', marginBottom: '16px',
          background: disputeType === 'TOURNAMENT' ? 'rgba(168, 85, 247, 0.15)' :
                      disputeType === 'QUICK_PLAY' ? 'rgba(6, 182, 212, 0.15)' :
                      'rgba(236, 72, 153, 0.15)',
          border: `1px solid ${disputeType === 'TOURNAMENT' ? 'rgba(168, 85, 247, 0.3)' :
                                disputeType === 'QUICK_PLAY' ? 'rgba(6, 182, 212, 0.3)' :
                                'rgba(236, 72, 153, 0.3)'}`,
          fontSize: '12px', fontWeight: 600,
          color: disputeType === 'TOURNAMENT' ? '#a855f7' :
                 disputeType === 'QUICK_PLAY' ? '#06b6d4' : '#ec4899',
        }}>
          {disputeType === 'TOURNAMENT' ? 'Tournament' :
           disputeType === 'QUICK_PLAY' ? 'Quick Play Match' : 'Private Room'}
        </div>

        {/* Reason selector */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
            What happened? *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {DISPUTE_REASONS.map((r) => (
              <button
                key={r.value}
                onClick={() => setReason(r.value)}
                style={{
                  padding: '10px 12px', borderRadius: '10px', textAlign: 'left',
                  border: reason === r.value ? '2px solid #a855f7' : '2px solid rgba(255,255,255,0.1)',
                  background: reason === r.value ? 'rgba(168, 85, 247, 0.1)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}
              >
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

        {/* Description */}
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

        {/* Error message */}
        {submitState === 'error' && errorMsg && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px', marginBottom: '16px',
            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)',
            fontSize: '13px', color: '#ef4444',
          }}>
            {errorMsg}
          </div>
        )}

        {/* Submit button */}
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

        {/* Info footer */}
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', textAlign: 'center', marginTop: '12px' }}>
          Disputes are reviewed within 24-48 hours. Filing false disputes may result in account restrictions.
        </p>
      </div>
    </div>
  )
}