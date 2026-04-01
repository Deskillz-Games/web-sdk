// =============================================================================
// useEnrollmentStatus — packages/game-ui/src/hooks/useEnrollmentStatus.ts
//
// Drives TournamentCard enrollment button state machine.
// Uses DeskillzBridge for all API calls — no direct HTTP imports.
// =============================================================================

import { useState, useEffect, useRef, useCallback } from 'react'
import toast from 'react-hot-toast'

export type TournamentEnrollmentStatus =
  | 'NOT_REGISTERED'
  | 'REGISTERED'
  | 'CHECKIN_OPEN'
  | 'CHECKED_IN'
  | 'STARTING'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'DQ_NO_SHOW'
  | 'STANDBY'
  | 'CANCELLED'

export interface UseEnrollmentStatusOptions {
  enabled?: boolean
  pollIntervalMs?: number
}

export interface UseEnrollmentStatusResult {
  status: TournamentEnrollmentStatus
  dqCountdown: number | null
  loading: boolean
  error: string | null
  register: () => Promise<void>
  checkIn: () => Promise<void>
  refresh: () => Promise<void>
}

function getBridge(): any {
  try {
    // DeskillzBridge is a singleton already initialized by the game
    return (window as any).DeskillzBridge?.getInstance?.() ?? null
  } catch {
    return null
  }
}

export function useEnrollmentStatus(
  tournamentId: string,
  options: UseEnrollmentStatusOptions = {},
): UseEnrollmentStatusResult {
  const { enabled = true, pollIntervalMs = 60_000 } = options

  const [status, setStatus] = useState<TournamentEnrollmentStatus>('NOT_REGISTERED')
  const [checkinClosesAt, setCheckinClosesAt] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dqCountdown, setDqCountdown] = useState<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // DQ countdown timer
  useEffect(() => {
    if (status === 'CHECKIN_OPEN' && checkinClosesAt) {
      const tick = () => {
        const remaining = Math.max(0, Math.floor(
          (new Date(checkinClosesAt).getTime() - Date.now()) / 1000
        ))
        setDqCountdown(remaining)
        if (remaining === 0 && countdownRef.current) {
          clearInterval(countdownRef.current)
          countdownRef.current = null
        }
      }
      tick()
      countdownRef.current = setInterval(tick, 1000)
    } else {
      setDqCountdown(null)
      if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null }
    }
    return () => { if (countdownRef.current) clearInterval(countdownRef.current) }
  }, [status, checkinClosesAt])

  // Fetch status
  const fetchStatus = useCallback(async () => {
    if (!enabled || !tournamentId) return
    const bridge = getBridge()
    if (!bridge) return
    try {
      const result = await bridge.getEnrollmentStatus(tournamentId)
      setStatus(result.status ?? 'NOT_REGISTERED')
      if (result.checkinClosesAt) setCheckinClosesAt(result.checkinClosesAt)
    } catch { /* silent — NOT_REGISTERED is safe default */ }
  }, [tournamentId, enabled])

  // Polling
  useEffect(() => {
    if (!enabled) return
    fetchStatus()
    pollRef.current = setInterval(fetchStatus, pollIntervalMs)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [enabled, fetchStatus, pollIntervalMs])

  // Bridge event subscriptions
  useEffect(() => {
    if (!enabled) return
    const bridge = getBridge()
    if (!bridge?.on) return

    const onRegistered = (d: any) => { if (d?.tournamentId === tournamentId) setStatus('REGISTERED') }
    const onCheckedIn = (d: any) => { if (d?.tournamentId === tournamentId) setStatus('CHECKED_IN') }
    const onCheckinOpen = (d: any) => {
      if (d?.tournamentId !== tournamentId) return
      setStatus('CHECKIN_OPEN')
      toast('Check-in is now open! Check in before the tournament starts.', { icon: '⏰', duration: 8000 })
    }
    const onDQ = (d: any) => {
      if (d?.tournamentId !== tournamentId) return
      setStatus('DQ_NO_SHOW')
      toast.error('You missed check-in. Your entry has been forfeited.')
    }
    const onStarting = (d: any) => { if (d?.tournamentId === tournamentId) setStatus('STARTING') }

    bridge.on('tournamentRegistered', onRegistered)
    bridge.on('tournamentCheckedIn', onCheckedIn)
    bridge.on('tournamentCheckinOpen', onCheckinOpen)
    bridge.on('tournamentDQNoShow', onDQ)
    bridge.on('tournamentStarting', onStarting)

    return () => {
      bridge.off?.('tournamentRegistered', onRegistered)
      bridge.off?.('tournamentCheckedIn', onCheckedIn)
      bridge.off?.('tournamentCheckinOpen', onCheckinOpen)
      bridge.off?.('tournamentDQNoShow', onDQ)
      bridge.off?.('tournamentStarting', onStarting)
    }
  }, [tournamentId, enabled])

  const register = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const bridge = getBridge()
      if (!bridge) throw new Error('Bridge not initialized')
      await bridge.registerTournament(tournamentId)
      setStatus('REGISTERED')
      toast.success('Registered! Check in 30 minutes before the start.')
    } catch (err: any) {
      const msg = err?.message || 'Failed to register'
      setError(msg); toast.error(msg)
    } finally { setLoading(false) }
  }, [tournamentId])

  const checkIn = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const bridge = getBridge()
      if (!bridge) throw new Error('Bridge not initialized')
      await bridge.checkInTournament(tournamentId)
      setStatus('CHECKED_IN')
      toast.success('Checked in! Get ready to play.')
    } catch (err: any) {
      const msg = err?.message || 'Failed to check in'
      setError(msg); toast.error(msg)
    } finally { setLoading(false) }
  }, [tournamentId])

  return { status, dqCountdown, loading, error, register, checkIn, refresh: fetchStatus }
}