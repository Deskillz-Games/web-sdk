// =============================================================================
// ENTRY CURRENCIES - src/entry-currencies.ts
// D-C1: an ENTRY FEE may be paid only in a stablecoin -- USDT or USDC, on BNB
// Smart Chain or Tron. Mirror of the backend constant
// (deskillz-backend/src/common/constants/entry-currencies.ts), which is the
// authority: it validates every create path, so a picker that offers anything
// else just produces a 400.
//
// This does NOT remove BNB from the platform. Wallet balances, deposits and gas
// are unchanged, and rooms created before D-C1 keep their currency -- which is
// why currencyOptionsWithLegacy() and filterEntryCurrencies() exist.
//
// Exported from the package barrel so a game can build its own currency UI
// against the same list the platform enforces.
// =============================================================================

// [N535] N488 (D-W11): Circle ended USDC on Tron -- Tron is USDT only, as in
// the backend and the site. USDC_TRON keeps its label below so a legacy row
// still displays (currencyOptionsWithLegacy shows it disabled).
export const ENTRY_CURRENCIES = [
  'USDT_BSC',
  'USDC_BSC',
  'USDT_TRON',
] as const

export type EntryCurrency = (typeof ENTRY_CURRENCIES)[number]

export interface CurrencyOption {
  value: string
  label: string
  /** true for a stored value that is no longer selectable (legacy BNB room) */
  disabled?: boolean
}

/** Labels for every currency the platform has ever accepted, BNB included, so
 *  an existing room can still be displayed correctly. */
export const CURRENCY_LABEL: Record<string, string> = {
  USDT_BSC: 'USDT (BEP-20)',
  USDC_BSC: 'USDC (BEP-20)',
  USDT_TRON: 'USDT (TRC-20)',
  USDC_TRON: 'USDC (TRC-20)',
  BNB: 'BNB',
}

export function isEntryCurrency(value: unknown): value is EntryCurrency {
  return (
    typeof value === 'string' && (ENTRY_CURRENCIES as readonly string[]).includes(value)
  )
}

export function currencyLabel(value: string): string {
  return CURRENCY_LABEL[value] || value
}

/** The selectable options, in display order. */
export const ENTRY_CURRENCY_OPTIONS: CurrencyOption[] = ENTRY_CURRENCIES.map((value) => ({
  value,
  label: CURRENCY_LABEL[value],
}))

/**
 * Options for a control whose stored value may predate D-C1. A value that is no
 * longer an entry currency is appended as a DISABLED "... (legacy)" option, so
 * the control shows the real stored value instead of rendering blank -- and
 * cannot be chosen again.
 */
export function currencyOptionsWithLegacy(selected?: string | null): CurrencyOption[] {
  if (!selected || isEntryCurrency(selected)) return ENTRY_CURRENCY_OPTIONS
  return [
    ...ENTRY_CURRENCY_OPTIONS,
    { value: selected, label: `${currencyLabel(selected)} (legacy)`, disabled: true },
  ]
}

/**
 * Keeps only values that are still entry currencies. Used on a per-game
 * allow-list (QuickPlayConfig esportCurrencies / socialCurrencies), which for a
 * game configured before D-C1 can still contain BNB. Falls back to the full set
 * rather than returning an empty list, since an empty picker is useless.
 */
export function filterEntryCurrencies(values?: readonly unknown[] | null): EntryCurrency[] {
  const kept = (values ?? []).filter(isEntryCurrency)
  return kept.length > 0 ? kept : [...ENTRY_CURRENCIES]
}
