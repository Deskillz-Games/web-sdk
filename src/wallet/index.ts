// =============================================================================
// Deskillz Web SDK - Wallet Module Barrel Export
// Path: src/wallet/index.ts
// Re-exports all wallet modules
// =============================================================================

// Service
export { WalletService } from './wallet-service';

// Chain Configuration
export {
  ChainId,
  chainMeta,
  tokenAddresses,
  ERC20_ABI,
  SUPPORTED_CHAIN_IDS,
  TESTNET_CHAIN_IDS,
  formatAddress,
  getExplorerAddressUrl,
  getExplorerTxUrl,
  getTokenAddress,
  isSupportedChain,
  getChainMeta,
  getAvailableTokens,
} from './chain-config';

export type { ChainMeta } from './chain-config';

// Types
export {
  TransactionType,
  TransactionStatus,
} from './wallet-types';

export type {
  WalletBalance,
  TotalBalanceUSD,
  SupportedCurrency,
  CryptoRate,
  Transaction,
  TransactionMetadata,
  TransactionFilters,
  DepositRequest,
  DepositAddress,
  WithdrawRequest,
} from './wallet-types';