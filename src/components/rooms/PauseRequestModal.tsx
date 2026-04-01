// =============================================================================
// PauseRequestModal.tsx -- packages/game-ui/src/components/rooms/PauseRequestModal.tsx
//
// Modal for requesting and voting on game pauses in social games.
// Three states: RequestPauseModal, VoteOnPauseModal, PauseStatusModal.
// No bridge dependency -- all actions via callback props.
// =============================================================================

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Pause,
  Play,
  Clock,
  Check,
  X as XIcon,
  Loader2,
  AlertTriangle,
  Coffee,
} from 'lucide-react'
import { cn } from '../../utils'

// =============================================================================
// TYPES
// =============================================================================

export interface PlayerVote {
  odid: string
  username: string
  avatarUrl: string | null
  vote: 'pending' | 'approved' | 'rejected'
}

export interface PauseRequestState {
  isActive: boolean
  requestedBy: { odid: string; username: string } | null
  reason?: string
  votes: PlayerVote[]
  expiresAt: Date | null
  pauseDuration: number
}

export interface PauseRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onRequestPause: (reason?: string) => Promise<void>
  onVote: (approved: boolean) => Promise<void>
  onCancelRequest: () => Promise<void>
  pauseState: PauseRequestState
  currentUserOdid: string
  maxPausesPerPlayer: number
  pausesUsedByCurrentUser: number
  maxPauseDuration: number
}

// =============================================================================
// CONSTANTS
// =============================================================================

const DEFAULT_MAX_PAUSES = 3
const DEFAULT_PAUSE_DURATION = 300
const VOTE_TIMEOUT = 30

// =============================================================================
// MAIN COMPONENT (router for 3 sub-modals)
// =============================================================================

export default function PauseRequestModal({
  isOpen,
  onClose,
  onRequestPause,
  onVote,
  onCancelRequest,
  pauseState,
  currentUserOdid,
  maxPausesPerPlayer = DEFAULT_MAX_PAUSES,
  pausesUsedByCurrentUser,
  maxPauseDuration = DEFAULT_PAUSE_DURATION,
}: PauseRequestModalProps) {
  const isRequester = pauseState.requestedBy?.odid === currentUserOdid
  const hasVoted = pauseState.votes.find((v) => v.odid === currentUserOdid)?.vote !== 'pending'
  const showVoteModal = pauseState.isActive && !isRequester && !hasVoted
  const showRequestModal = !pauseState.isActive
  const showStatusModal = pauseState.isActive && (isRequester || hasVoted)

  if (!isOpen) return null

  if (showRequestModal) {
    return (
      <RequestPauseModal
        isOpen={isOpen}
        onClose={onClose}
        onSubmit={onRequestPause}
        pausesRemaining={maxPausesPerPlayer - pausesUsedByCurrentUser}
        maxPauseDuration={maxPauseDuration}
      />
    )
  }

  if (showVoteModal) {
    return (
      <VoteOnPauseModal
        isOpen={isOpen}
        onVote={onVote}
        pauseState={pauseState}
        currentUserOdid={currentUserOdid}
        timeRemaining={VOTE_TIMEOUT}
      />
    )
  }

  if (showStatusModal) {
    return (
      <PauseStatusModal
        isOpen={isOpen}
        onClose={onClose}
        onCancel={isRequester ? onCancelRequest : undefined}
        pauseState={pauseState}
        isRequester={isRequester}
      />
    )
  }

  return null
}

// =============================================================================
// REQUEST PAUSE MODAL
// =============================================================================

function RequestPauseModal({
  isOpen,
  onClose,
  onSubmit,
  pausesRemaining,
  maxPauseDuration,
}: {
  isOpen: boolean
  onClose: () => void
  onSubmit: (reason?: string) => Promise<void>
  pausesRemaining: number
  maxPauseDuration: number
}) {
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const canRequestPause = pausesRemaining > 0

  const handleSubmit = useCallback(async () => {
    if (!canRequestPause) { setError('You have no pauses remaining'); return }
    setIsSubmitting(true); setError(null)
    try {
      await onSubmit(reason.trim() || undefined)
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to request pause')
    } finally { setIsSubmitting(false) }
  }, [canRequestPause, reason, onSubmit, onClose])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    return `${mins} minute${mins !== 1 ? 's' : ''}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#12121a] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center"><Coffee className="w-5 h-5 text-purple-400" /></div>
              <div><h2 className="text-xl font-bold text-white">Request Break</h2><p className="text-xs text-gray-500">All players must agree</p></div>
            </div>
            <button onClick={onClose} disabled={isSubmitting} className="p-2 hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50"><X className="w-5 h-5 text-gray-400" /></button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between p-4 bg-[#1a1a2e] rounded-xl border border-gray-800">
              <div className="flex items-center gap-2"><Pause className="w-5 h-5 text-purple-400" /><span className="text-gray-300">Pauses Remaining</span></div>
              <span className={cn('text-xl font-bold', pausesRemaining > 0 ? 'text-green-400' : 'text-red-400')}>{pausesRemaining}</span>
            </div>

            {!canRequestPause && (
              <div className="flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div><p className="text-sm font-medium text-red-300">No Pauses Left</p><p className="text-xs text-red-400/80 mt-1">You have used all your available pauses for this session.</p></div>
              </div>
            )}

            {canRequestPause && (
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Reason (optional)</label>
                <input type="text" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Quick break, phone call..." className="w-full bg-[#1a1a2e] border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:outline-none focus:border-purple-500" maxLength={100} disabled={isSubmitting} />
              </div>
            )}

            <div className="p-4 bg-[#1a1a2e] rounded-xl border border-gray-800">
              <div className="flex items-center gap-2 mb-2"><Clock className="w-4 h-4 text-gray-500" /><span className="text-sm text-gray-400">Pause Duration</span></div>
              <p className="text-lg font-bold text-white">{formatDuration(maxPauseDuration)}</p>
              <p className="text-xs text-gray-500 mt-2">All players must approve within 30 seconds. The game will automatically resume after the pause ends.</p>
            </div>

            {error && (<div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg"><AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" /><p className="text-sm text-red-400">{error}</p></div>)}

            <div className="flex gap-3">
              <button onClick={onClose} disabled={isSubmitting} className="flex-1 py-3 text-gray-400 hover:bg-gray-800 rounded-xl transition-colors disabled:opacity-50">Cancel</button>
              <button onClick={handleSubmit} disabled={!canRequestPause || isSubmitting} className="flex-1 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-700 hover:to-cyan-600 disabled:opacity-50">
                {isSubmitting ? (<span className="flex items-center justify-center gap-2"><Loader2 className="w-4 h-4 animate-spin" />Requesting...</span>) : (<span className="flex items-center justify-center gap-2"><Pause className="w-4 h-4" />Request Pause</span>)}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// =============================================================================
// VOTE ON PAUSE MODAL
// =============================================================================

function VoteOnPauseModal({
  isOpen,
  onVote,
  pauseState,
  currentUserOdid,
  timeRemaining: initialTimeRemaining,
}: {
  isOpen: boolean
  onVote: (approved: boolean) => Promise<void>
  pauseState: PauseRequestState
  currentUserOdid: string
  timeRemaining: number
}) {
  const [isVoting, setIsVoting] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(initialTimeRemaining)

  useEffect(() => {
    if (timeRemaining <= 0) return
    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) { onVote(false); return 0 }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [timeRemaining, onVote])

  const handleVote = useCallback(async (approved: boolean) => {
    setIsVoting(true)
    try { await onVote(approved) } finally { setIsVoting(false) }
  }, [onVote])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#12121a] border border-amber-500/30 rounded-2xl shadow-2xl overflow-hidden">
          <div className="p-6 border-b border-gray-800 bg-amber-500/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center"><Pause className="w-5 h-5 text-amber-400" /></div>
                <div><h2 className="text-xl font-bold text-white">Pause Requested</h2><p className="text-xs text-gray-500">by {pauseState.requestedBy?.username}</p></div>
              </div>
              <div className="text-right"><p className="text-2xl font-bold text-amber-400">{timeRemaining}s</p><p className="text-xs text-gray-500">to vote</p></div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {pauseState.reason && (<div className="p-4 bg-[#1a1a2e] rounded-xl border border-gray-800"><p className="text-sm text-gray-400">Reason:</p><p className="text-white mt-1">{pauseState.reason}</p></div>)}

            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">Player Votes</p>
              <div className="space-y-2">
                {pauseState.votes.map((vote) => (
                  <VoteRow key={vote.odid} vote={vote} isCurrentUser={vote.odid === currentUserOdid} />
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => handleVote(false)} disabled={isVoting} className="flex-1 py-3 rounded-xl font-bold bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 disabled:opacity-50">
                {isVoting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2"><XIcon className="w-4 h-4" />Decline</span>}
              </button>
              <button onClick={() => handleVote(true)} disabled={isVoting} className="flex-1 py-3 rounded-xl font-bold bg-green-500/20 border border-green-500/50 text-green-400 hover:bg-green-500/30 disabled:opacity-50">
                {isVoting ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" />Approve</span>}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// =============================================================================
// PAUSE STATUS MODAL
// =============================================================================

function PauseStatusModal({
  isOpen,
  onClose,
  onCancel,
  pauseState,
  isRequester,
}: {
  isOpen: boolean
  onClose: () => void
  onCancel?: () => Promise<void>
  pauseState: PauseRequestState
  isRequester: boolean
}) {
  const [isCancelling, setIsCancelling] = useState(false)
  const approvedCount = pauseState.votes.filter((v) => v.vote === 'approved').length
  const totalVoters = pauseState.votes.length
  const allApproved = approvedCount === totalVoters
  const hasRejection = pauseState.votes.some((v) => v.vote === 'rejected')

  const handleCancel = useCallback(async () => {
    if (!onCancel) return
    setIsCancelling(true)
    try { await onCancel(); onClose() } finally { setIsCancelling(false) }
  }, [onCancel, onClose])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={cn('relative w-full max-w-md bg-[#12121a] rounded-2xl shadow-2xl overflow-hidden border',
            allApproved && 'border-green-500/30', hasRejection && 'border-red-500/30', !allApproved && !hasRejection && 'border-amber-500/30')}
        >
          <div className="flex items-center justify-between p-6 border-b border-gray-800">
            <div className="flex items-center gap-3">
              <div className={cn('w-10 h-10 rounded-full flex items-center justify-center',
                allApproved && 'bg-green-500/20', hasRejection && 'bg-red-500/20', !allApproved && !hasRejection && 'bg-amber-500/20')}>
                {allApproved ? <Check className="w-5 h-5 text-green-400" /> : hasRejection ? <XIcon className="w-5 h-5 text-red-400" /> : <Clock className="w-5 h-5 text-amber-400" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{allApproved ? 'Pause Approved' : hasRejection ? 'Pause Declined' : 'Waiting for Votes'}</h2>
                <p className="text-xs text-gray-500">{approvedCount}/{totalVoters} approved</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition-colors"><X className="w-5 h-5 text-gray-400" /></button>
          </div>

          <div className="p-6 space-y-6">
            <div className="space-y-2">
              {pauseState.votes.map((vote) => (<VoteRow key={vote.odid} vote={vote} />))}
            </div>

            {allApproved && (
              <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl text-center">
                <Play className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <p className="text-green-300 font-medium">Game is paused</p>
                <p className="text-xs text-green-400/80 mt-1">Will resume automatically in {Math.floor(pauseState.pauseDuration / 60)} minutes</p>
              </div>
            )}

            {hasRejection && (
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center">
                <XIcon className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <p className="text-red-300 font-medium">Pause request declined</p>
                <p className="text-xs text-red-400/80 mt-1">The game will continue</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 rounded-xl text-white font-medium transition-colors">Close</button>
              {isRequester && onCancel && !hasRejection && (
                <button onClick={handleCancel} disabled={isCancelling} className="flex-1 py-3 rounded-xl font-bold bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-500/30 disabled:opacity-50">
                  {isCancelling ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Cancel Request'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

// =============================================================================
// SHARED: Vote row component
// =============================================================================

function VoteRow({ vote, isCurrentUser }: { vote: PlayerVote; isCurrentUser?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between p-3 rounded-lg border',
        vote.vote === 'approved' && 'bg-green-500/10 border-green-500/30',
        vote.vote === 'rejected' && 'bg-red-500/10 border-red-500/30',
        vote.vote === 'pending' && 'bg-[#1a1a2e] border-gray-800',
      )}
    >
      <div className="flex items-center gap-2">
        {vote.avatarUrl ? (
          <img src={vote.avatarUrl} alt={vote.username} className="w-6 h-6 rounded-full" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
            <span className="text-xs text-gray-400">{vote.username.charAt(0).toUpperCase()}</span>
          </div>
        )}
        <span className="text-sm text-white">{isCurrentUser ? 'You' : vote.username}</span>
      </div>
      {vote.vote === 'approved' && <Check className="w-5 h-5 text-green-400" />}
      {vote.vote === 'rejected' && <XIcon className="w-5 h-5 text-red-400" />}
      {vote.vote === 'pending' && <Loader2 className="w-5 h-5 text-gray-500 animate-spin" />}
    </div>
  )
}

// =============================================================================
// EXPORTS
// =============================================================================

export { RequestPauseModal, VoteOnPauseModal, PauseStatusModal, DEFAULT_MAX_PAUSES, DEFAULT_PAUSE_DURATION, VOTE_TIMEOUT }