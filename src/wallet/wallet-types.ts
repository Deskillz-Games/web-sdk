// =============================================================================
// Deskillz Web SDK - Wallet Types
// Path: src/wallet/wallet-types.ts
// All wallet interfaces, enums, and filter types
// Replicates from: wallet.ts (lines 4-78)
// =============================================================================

// -----------------------------------------------------------------------------
// Balance Types
// Replicates: wallet.ts WalletBalance (lines 4-10)
// -----------------------------------------------------------------------------

/**
 * User balance for a specific cryptocurrency.
 * Returned by GET /api/v1/wallet/balances and /balances/:currency.
 */
export interface WalletBalance {
  currency: string;
  symbol: string;
  amount: number;
  usdValue: number;
  color: string;
}

/**
 * Total portfolio value in USD.
 * Returned by GET /api/v1/wallet/total.
 */
export interface TotalBalanceUSD {
  totalUSD: number;
}

// -----------------------------------------------------------------------------
// Currency Types
// Replicates: wallet.ts SupportedCurrency (lines 12-22)
// -----------------------------------------------------------------------------

/**
 * Supported cryptocurrency configuration.
 * Returned by GET /api/v1/wallet/currencies.
 */
export interface SupportedCurrency {
  symbol: string;
  name: string;
  icon: string;
  color: string;
  decimals: number;
  minDeposit: number;
  minWithdraw: number;
  withdrawFee: number;
  isEnabled: boolean;
}

/**
 * Live cryptocurrency price data.
 * Returned by GET /api/v1/wallet/rates.
 * Replicates: wallet.ts CryptoRate (lines 24-30)
 */
export interface CryptoRate {
  symbol: string;
  name: string;
  usdPrice: number;
  change24h: number;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// Transaction Types
// Replicates: wallet.ts Transaction (lines 32-49)
// -----------------------------------------------------------------------------

/**
 * Transaction type enum.
 */
export const TransactionType = {
  DEPOSIT: 'deposit',
  WITHDRAWAL: 'withdrawal',
  ENTRY_FEE: 'entry_fee',
  PRIZE: 'prize',
  REFUND: 'refund',
  DEVELOPER_PAYOUT: 'developer_payout',
} as const;

export type TransactionType = (typeof TransactionType)[keyof typeof TransactionType];

/**
 * Transaction status enum.
 */
export const TransactionStatus = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
} as const;

export type TransactionStatus = (typeof TransactionStatus)[keyof typeof TransactionStatus];

/**
 * Wallet transaction record.
 * Replicates: wallet.ts Transaction (lines 32-49)
 */
export interface Transaction {
  id: string;
  userId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  txHash?: string;
  status: TransactionStatus;
  description?: string;
  createdAt: string;
  confirmedAt?: string;
  metadata?: TransactionMetadata;
}

/**
 * Transaction metadata linking to tournaments or games.
 * Replicates: wallet.ts Transaction.metadata (lines 43-48)
 */
export interface TransactionMetadata {
  tournamentId?: string;
  tournamentName?: string;
  gameId?: string;
  gameName?: string;
}

// -----------------------------------------------------------------------------
// Filter & Query Types
// Replicates: wallet.ts TransactionFilters (lines 51-59)
// -----------------------------------------------------------------------------

/**
 * Filters for transaction history queries.
 */
export interface TransactionFilters {
  type?: TransactionType | string;
  currency?: string;
  status?: TransactionStatus | string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

// -----------------------------------------------------------------------------
// Deposit Types
// Replicates: wallet.ts DepositRequest (lines 61-65), DepositAddress (lines 73-78)
// -----------------------------------------------------------------------------

/**
 * Deposit confirmation payload.
 * Replicates: wallet.ts DepositRequest (lines 61-65)
 */
export interface DepositRequest {
  currency: string;
  amount: number;
  txHash: string;
}

/**
 * Deposit address for receiving cryptocurrency.
 * Replicates: wallet.ts DepositAddress (lines 73-78)
 */
export interface DepositAddress {
  currency: string;
  address: string;
  network: string;
  qrCode?: string;
}

// -----------------------------------------------------------------------------
// Withdrawal Types
// Replicates: wallet.ts WithdrawRequest (lines 67-71)
// -----------------------------------------------------------------------------

/**
 * Withdrawal request payload.
 * Replicates: wallet.ts WithdrawRequest (lines 67-71)
 */
export interface WithdrawRequest {
  currency: string;
  amount: number;
  toAddress: string;
}