// =============================================================================
// InviteNotificationBanner.tsx
// Path: src/components/rooms/InviteNotificationBanner.tsx
//
// Displays pending private room invites with Accept/Decline buttons.
// Uses DeskillzBridge for all API calls — no direct HTTP imports.
//
// Usage in standalone games:
//   import { InviteNotificationBanner } from '@deskillz/game-ui'
//   <InviteNotificationBanner onAccepted={(room) => navigate('/room/' + room.id)} />
//
// v3.5.0: Part of ROOM-2 gap fix.
// =============================================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import toast from 'react-hot-toast'

// =============================================================================
// TYPES
// =============================================================================

export interface RoomInvite {
  id: string
  roomId: string
  roomCode: string
  roomName: string
  hostUsername: string
  gameName: string
  message: string | null
  createdAt: string
}

export interface InviteNotificationBannerProps {
  /** Called when an invite is accepted and room is joined */
  onAccepted?: (room: { id: string; roomCode: string }) => void
  /** Poll interval in ms (default: 30000) */
  pollIntervalMs?: number
  /** Max invites to display (default: 3) */
  maxVisible?: number
  /** Additional CSS classes */
  className?: string
}

// =============================================================================
// BRIDGE HELPER
// =============================================================================

function getBridge(): any {
  try {
    return (window as any).DeskillzBridge?.getInstance?.() ?? null
  } catch {
    return null
  }
}

// =============================================================================
// TIME HELPER
// =============================================================================

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// =============================================================================
// COMPONENT
// =============================================================================

export default function InviteNotificationBanner({
  onAccepted,
  pollIntervalMs = 30000,
  maxVisible = 3,
  className = '',
}: InviteNotificationBannerProps) {
  const [invites, setInvites] = useState<RoomInvite[]>([])
  const [respondingId, setRespondingId] = useState<string | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchInvites = useCallback(async () => {
    const bridge = getBridge()
    if (!bridge) return
    try {
      const result = await bridge.getMyInvites()
      if (Array.isArray(result)) {
        setInvites(result)
      }
    } catch {
      // Silent — invites are non-critical
    }
  }, [])

  // Poll for new invites
  useEffect(() => {
    fetchInvites()
    pollRef.current = setInterval(fetchInvites, pollIntervalMs)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [fetchInvites, pollIntervalMs])

  // Listen for real-time invite notifications via bridge events
  useEffect(() => {
    const bridge = getBridge()
    if (!bridge?.on) return

    const onInvite = () => { fetchInvites() }
    bridge.on('notification', (data: any) => {
      if (data?.type === 'PRIVATE_ROOM_INVITE') onInvite()
    })

    return () => { bridge.off?.('notification', onInvite) }
  }, [fetchInvites])

  const handleRespond = useCallback(async (inviteId: string, accept: boolean) => {
    const bridge = getBridge()
    if (!bridge) return

    setRespondingId(inviteId)
    try {
      const result = await bridge.respondToInvite(inviteId, accept)
      setInvites(prev => prev.filter(i => i.id !== inviteId))

      if (accept) {
        toast.success('Joined room!')
        if (result && 'id' in result) {
          onAccepted?.({ id: result.id, roomCode: result.roomCode })
        }
      } else {
        toast('Invite declined', { icon: '👋' })
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to respond to invite')
    } finally {
      setRespondingId(null)
    }
  }, [onAccepted])

  if (invites.length === 0) return null

  const visible = invites.slice(0, maxVisible)
  const remaining = invites.length - maxVisible

  return (
    <div className={`space-y-2 ${className}`}>
      {visible.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center justify-between gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/30"
        >
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-purple-300 truncate">
                {invite.hostUsername}
              </span>
              <span className="text-xs text-white/40">
                invited you to
              </span>
              <span className="text-sm font-medium text-white truncate">
                {invite.roomName}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-white/40">{invite.gameName}</span>
              <span className="text-xs text-white/30">{timeAgo(invite.createdAt)}</span>
              {invite.message && (
                <span className="text-xs text-white/50 italic truncate">"{invite.message}"</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => handleRespond(invite.id, true)}
              disabled={respondingId === invite.id}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors disabled:opacity-50"
            >
              {respondingId === invite.id ? '...' : 'Accept'}
            </button>
            <button
              onClick={() => handleRespond(invite.id, false)}
              disabled={respondingId === invite.id}
              className="px-3 py-1.5 text-xs font-medium rounded-md text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              Decline
            </button>
          </div>
        </div>
      ))}

      {remaining > 0 && (
        <div className="text-xs text-white/40 text-center">
          +{remaining} more invite{remaining > 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}