// =============================================================================
// minimumStack -- packages/game-ui/src/hooks/minimumStack.ts
//
// [N688] D-N688-2 (Liam, Oct 29 2026): in a cash game (a host room or a
// persistent cash table, never Quick Play) a seat whose chips fall below the
// next hand's minimum stack tops up or leaves before that hand is dealt. The
// server says so after every hand: player:below-minimum on the room channel,
// cash-game:below-minimum on the cash-table channel, and belowMinimum[] in
// the hand response. This is the shared client side, plain DOM with inline
// styles so every game can use it (DDZ has no React):
//   - normalizeBelowMinimum / myBelowMinimum / onBelowMinimum: one shape from
//     either frame or the response, the caller's own seat only.
//   - showMinimumStackPrompt: the Top Up / Leave Table card with a countdown;
//     when it runs out the seat leaves (onLeave), so a table never waits on
//     one player. The time comes from the game's admin setting
//     (socialTopUpSeconds, sent as topUpSeconds; default 60) and the clock
//     stops while a top up is being added. One card at a time: a second call
//     while it is open returns the open card.
// The game wires the routes: host room rebuy, cash table rebuy, its own leave.
// Vendored byte-identical into each social game at src/hooks/minimumStack.ts.
// =============================================================================

export const MIN_STACK_PROMPT_SECONDS = 60

const PROMPT_ID = 'dskz-min-stack-prompt'
const OVERLAY_Z = '2147483000'
const FONT = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'

export interface BelowMinimumInfo {
  userId: string
  /** Chips at the table, USD. */
  chips: number
  /** The next hand's minimum stack, USD. */
  minimum: number
  /** What it takes to reach the minimum, USD. */
  needed: number
  /** The table's rebuy rule allows a top-up now. */
  topUpAllowed: boolean
  nextHand: number | null
  tableId: string | null
  roomId: string | null
  /** Seconds to decide (the game's socialTopUpSeconds), or null = default. */
  topUpSeconds: number | null
}

const num = (v: unknown): number => {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}

/** One shape from a below-minimum frame or a belowMinimum[] item, or null. */
export function normalizeBelowMinimum(raw: unknown): BelowMinimumInfo | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const userId = typeof r.userId === 'string' ? r.userId : typeof r.odid === 'string' ? r.odid : ''
  if (!userId) return null
  const minimum = num(r.minimum)
  if (!(minimum > 0)) return null
  const chips = num(r.chips)
  const next = r.nextHand ?? r.nextRound
  return {
    userId,
    chips,
    minimum,
    needed: r.needed != null ? num(r.needed) : Math.max(0, minimum - chips),
    topUpAllowed: r.topUpAllowed === true,
    nextHand: next != null && Number.isFinite(Number(next)) ? Number(next) : null,
    tableId: typeof r.tableId === 'string' ? r.tableId : null,
    roomId: typeof r.roomId === 'string' ? r.roomId : null,
    topUpSeconds: num(r.topUpSeconds) > 0 ? Math.floor(num(r.topUpSeconds)) : null,
  }
}

/** The caller's own entry in a hand response's belowMinimum[], or null. */
export function myBelowMinimum(list: unknown, myUserId: string): BelowMinimumInfo | null {
  if (!Array.isArray(list) || !myUserId) return null
  for (const item of list) {
    const b = normalizeBelowMinimum(item)
    if (b && b.userId === myUserId) return b
  }
  return null
}

/** The part of the bridge this needs (DeskillzBridge has both). */
export interface BelowMinimumSource {
  onRoomEvent?: (event: string, handler: (...args: unknown[]) => void) => () => void
  onRealtimeEvent?: (event: string, handler: (...args: unknown[]) => void) => () => void
}

/**
 * Calls handler when the server says the caller's own seat is below the next
 * hand's minimum (host room or cash table frame). Returns the unsubscribe.
 */
export function onBelowMinimum(
  bridge: BelowMinimumSource | null | undefined,
  myUserId: string,
  handler: (info: BelowMinimumInfo) => void,
): () => void {
  const cleanups: Array<() => void> = []
  const relay = (raw: unknown) => {
    const b = normalizeBelowMinimum(raw)
    if (!b || b.userId !== myUserId) return
    try { handler(b) } catch (err) { console.warn('[onBelowMinimum] handler failed:', err) }
  }
  try {
    if (bridge?.onRoomEvent) cleanups.push(bridge.onRoomEvent('player:below-minimum', relay))
    if (bridge?.onRealtimeEvent) cleanups.push(bridge.onRealtimeEvent('cash-game:below-minimum', relay))
  } catch (err) {
    console.warn('[onBelowMinimum] subscribe failed:', err)
  }
  return () => {
    for (const c of cleanups.splice(0)) {
      try { c() } catch { /* already gone */ }
    }
  }
}

export interface MinimumStackPromptOptions {
  chips: number
  minimum: number
  needed: number
  topUpAllowed: boolean
  /** What Top Up adds (the game picks it; at least `needed`). Default: needed. */
  topUpAmount?: number
  /** Shown after the amount, e.g. 'USDT'. */
  currency?: string
  /** Countdown before the seat leaves by itself (info.topUpSeconds). Default 60. */
  seconds?: number
  /** Adds the chips (rebuy route); resolve = done, reject = show why and stay. */
  onTopUp?: (amount: number) => Promise<unknown> | unknown
  /** The game's own leave (cash-out). Runs once: button or countdown. */
  onLeave: () => void
}

export interface MinimumStackPromptHandle {
  close: () => void
  isOpen: () => boolean
}

let openHandle: MinimumStackPromptHandle | null = null

const money = (v: number, currency?: string): string => {
  const n = Math.max(0, Number(v) || 0)
  let s = n.toFixed(2)
  if (n > 0 && s === '0.00') s = n.toFixed(4)
  return ('$' + s + (currency ? ' ' + currency : '')).trim()
}

const button = (bg: string, color: string): HTMLButtonElement => {
  const b = document.createElement('button')
  b.type = 'button'
  Object.assign(b.style, {
    flex: '1 1 140px',
    border: '0',
    borderRadius: '10px',
    padding: '10px 14px',
    fontSize: '15px',
    fontWeight: '700',
    color,
    background: bg,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    fontFamily: FONT,
  } as Partial<CSSStyleDeclaration>)
  return b
}

/**
 * The Top Up / Leave Table card. Returns a handle; close() removes it without
 * leaving (the game calls it when a top-up landed some other way).
 */
export function showMinimumStackPrompt(opts: MinimumStackPromptOptions): MinimumStackPromptHandle {
  if (openHandle && openHandle.isOpen()) return openHandle
  if (typeof document === 'undefined' || !document.body) {
    return { close: () => {}, isOpen: () => false }
  }
  document.getElementById(PROMPT_ID)?.remove()

  const shade = document.createElement('div')
  shade.id = PROMPT_ID
  shade.setAttribute('role', 'dialog')
  shade.setAttribute('aria-modal', 'true')
  Object.assign(shade.style, {
    position: 'fixed',
    inset: '0',
    zIndex: OVERLAY_Z,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px',
    boxSizing: 'border-box',
    background: 'rgba(0, 0, 0, 0.6)',
    fontFamily: FONT,
  } as Partial<CSSStyleDeclaration>)

  const card = document.createElement('div')
  Object.assign(card.style, {
    width: '100%',
    maxWidth: '380px',
    maxHeight: '100%',
    overflowY: 'auto',
    boxSizing: 'border-box',
    padding: '18px',
    borderRadius: '16px',
    border: '1px solid rgba(245, 158, 11, 0.6)',
    background: 'rgba(14, 16, 28, 0.97)',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.6)',
    color: '#ffffff',
  } as Partial<CSSStyleDeclaration>)

  const title = document.createElement('div')
  title.textContent = 'Top up to keep your seat'
  Object.assign(title.style, { fontSize: '18px', fontWeight: '800', color: '#fcd34d', marginBottom: '8px' })

  const body = document.createElement('div')
  body.textContent =
    'You have ' + money(opts.chips, opts.currency) + ' at the table. This table needs at least ' +
    money(opts.minimum, opts.currency) + ' before the next hand.'
  Object.assign(body.style, { fontSize: '14px', lineHeight: '1.45', color: '#e5e7eb' })

  const note = document.createElement('div')
  Object.assign(note.style, { fontSize: '13px', lineHeight: '1.4', color: '#9ca3af', marginTop: '8px', minHeight: '18px' })
  note.textContent = opts.topUpAllowed
    ? 'Top up from your Deskillz wallet, or leave and take your chips.'
    : 'Rebuys are not available at this table. Your chips are paid to your Deskillz wallet when you leave.'

  const row = document.createElement('div')
  Object.assign(row.style, { display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '14px' })

  const amount = Math.max(Number(opts.topUpAmount) || 0, Number(opts.needed) || 0)
  const topUp = opts.topUpAllowed && opts.onTopUp ? button('linear-gradient(90deg, #0891b2, #3b82f6)', '#ffffff') : null
  if (topUp) topUp.textContent = 'Top Up ' + money(amount, opts.currency)
  const leave = button('rgba(255, 255, 255, 0.1)', '#ffffff')
  leave.style.border = '1px solid rgba(255, 255, 255, 0.25)'

  let left = Math.max(1, Math.floor(opts.seconds ?? MIN_STACK_PROMPT_SECONDS))
  const label = () => { leave.textContent = 'Leave Table (' + left + ')' }
  label()

  let open = true
  let busy = false
  let timer: ReturnType<typeof setInterval> | null = null
  const close = () => {
    if (!open) return
    open = false
    if (timer !== null) { clearInterval(timer); timer = null }
    shade.remove()
    if (openHandle === handle) openHandle = null
  }
  const doLeave = () => {
    if (!open) return
    close()
    try { opts.onLeave() } catch (err) { console.warn('[showMinimumStackPrompt] leave failed:', err) }
  }
  leave.addEventListener('click', () => { if (!busy) doLeave() })
  if (topUp) {
    topUp.addEventListener('click', () => {
      if (busy || !open) return
      busy = true
      topUp.disabled = true
      leave.disabled = true
      topUp.style.opacity = '0.6'
      note.style.color = '#9ca3af'
      note.textContent = 'Adding chips...'
      Promise.resolve()
        .then(() => opts.onTopUp!(amount))
        .then(() => close())
        .catch((err: unknown) => {
          busy = false
          topUp.disabled = false
          leave.disabled = false
          topUp.style.opacity = '1'
          note.style.color = '#fca5a5'
          const m = err && typeof err === 'object' && 'message' in err ? String((err as { message: unknown }).message) : ''
          note.textContent = m || 'The top up did not go through. Try again or leave the table.'
        })
    })
  }
  timer = setInterval(() => {
    if (busy) return
    left -= 1
    if (left <= 0) doLeave()
    else label()
  }, 1000)

  if (topUp) row.appendChild(topUp)
  row.appendChild(leave)
  card.appendChild(title)
  card.appendChild(body)
  card.appendChild(note)
  card.appendChild(row)
  shade.appendChild(card)
  document.body.appendChild(shade)

  const handle: MinimumStackPromptHandle = { close, isOpen: () => open }
  openHandle = handle
  return handle
}
