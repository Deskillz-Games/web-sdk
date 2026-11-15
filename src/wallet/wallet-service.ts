// =============================================================================
// Deskillz Web SDK - Wallet Service
// Path: src/wallet/wallet-service.ts
// All wallet API operations: balances, transactions, deposit, withdraw
// Replicates: wallet.ts walletApi (lines 81-148)
// =============================================================================

import type { HttpClient } from '../core/http-client';
import type { PaginatedResponse } from '../core/types';
import type {
  WalletBalance,
  TotalBalanceUSD,
  SupportedCurrency,
  CryptoRate,
  Transaction,
  TransactionFilters,
  DepositAddress,
  DepositChain,
} from './wallet-types';

/**
 * Wallet service for managing cryptocurrency balances, transactions,
 * and the deposit address (add funds and withdrawals are on deskillz.games).
 *
 * All balance and transaction data is server-managed (custodial).
 * On-chain operations (deposit confirmations, withdrawals) go through
 * the backend which handles smart contract interactions.
 */
export class WalletService {
  private http: HttpClient;
  private debug: boolean;

  constructor(http: HttpClient, debug = false) {
    this.http = http;
    this.debug = debug;
  }

  // ---------------------------------------------------------------------------
  // Currencies & Rates (public - no auth required)
  // Replicates: wallet.ts walletApi.getSupportedCurrencies (lines 83-88)
  // ---------------------------------------------------------------------------

  /**
   * Get all supported cryptocurrencies and their configuration.
   * Includes min deposit/withdraw amounts, fees, and enabled status.
   *
   * Endpoint: GET /api/v1/wallet/currencies
   */
  async getSupportedCurrencies(): Promise<SupportedCurrency[]> {
    this.log('Getting supported currencies');

    const response = await this.http.get<{ currencies: SupportedCurrency[] } | SupportedCurrency[]>(
      '/api/v1/wallet/currencies'
    );

    // Handle both { currencies: [...] } and direct array responses
    const data = response.data;
    if (Array.isArray(data)) return data;
    if (data && 'currencies' in data) return data.currencies;
    return [];
  }

  /**
   * Get live cryptocurrency price rates in USD.
   * Includes 24h price change percentage.
   *
   * Endpoint: GET /api/v1/wallet/rates
   * Replicates: wallet.ts walletApi.getCryptoRates (lines 91-94)
   */
  async getCryptoRates(): Promise<CryptoRate[]> {
    this.log('Getting crypto rates');

    const response = await this.http.get<CryptoRate[]>('/api/v1/wallet/rates');
    return Array.isArray(response.data) ? response.data : [];
  }

  // ---------------------------------------------------------------------------
  // Balances (auth required)
  // Replicates: wallet.ts walletApi.getAllBalances (lines 97-100)
  // ---------------------------------------------------------------------------

  /**
   * Get all wallet balances for the authenticated user.
   * Returns balances for each currency with USD equivalent.
   *
   * Endpoint: GET /api/v1/wallet/balances
   * Replicates: wallet.ts walletApi.getAllBalances (lines 97-100)
   */
  async getAllBalances(): Promise<WalletBalance[]> {
    this.log('Getting all balances');

    const response = await this.http.get<WalletBalance[]>('/api/v1/wallet/balances');
    return Array.isArray(response.data) ? response.data : [];
  }

  /**
   * Get balance for a specific currency.
   *
   * Endpoint: GET /api/v1/wallet/balances/:currency
   * Replicates: wallet.ts walletApi.getBalance (lines 103-106)
   *
   * @param currency - Currency symbol (e.g., 'BNB', 'USDT').
   */
  async getBalance(currency: string): Promise<WalletBalance> {
    this.log('Getting balance for:', currency);

    const response = await this.http.get<WalletBalance>(
      `/api/v1/wallet/balances/${encodeURIComponent(currency)}`
    );
    return response.data;
  }

  /**
   * Get total portfolio value in USD across all currencies.
   *
   * Endpoint: GET /api/v1/wallet/total
   * Replicates: wallet.ts walletApi.getTotalBalanceUSD (lines 144-147)
   */
  async getTotalBalanceUSD(): Promise<TotalBalanceUSD> {
    this.log('Getting total balance USD');

    const response = await this.http.get<TotalBalanceUSD>('/api/v1/wallet/total');
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Transactions (auth required)
  // Replicates: wallet.ts walletApi.getTransactions (lines 109-115)
  // ---------------------------------------------------------------------------

  /**
   * Get paginated transaction history with optional filters.
   *
   * Endpoint: GET /api/v1/wallet/transactions
   * Replicates: wallet.ts walletApi.getTransactions (lines 109-115)
   *
   * @param filters - Optional filters for type, currency, status, date range, pagination.
   */
  async getTransactions(filters?: TransactionFilters): Promise<PaginatedResponse<Transaction>> {
    this.log('Getting transactions with filters:', filters);

    const response = await this.http.get<PaginatedResponse<Transaction>>(
      '/api/v1/wallet/transactions',
      filters as Record<string, string | number | undefined>
    );
    return response.data;
  }

  /**
   * Get a single transaction by ID.
   *
   * Endpoint: GET /api/v1/wallet/transactions/:id
   * Replicates: wallet.ts walletApi.getTransaction (lines 118-121)
   *
   * @param id - Transaction ID.
   */
  async getTransaction(id: string): Promise<Transaction> {
    this.log('Getting transaction:', id);

    const response = await this.http.get<Transaction>(
      `/api/v1/wallet/transactions/${encodeURIComponent(id)}`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Deposit address (auth required) -- [N791] one address per player per chain
  // ---------------------------------------------------------------------------

  /**
   * The player's OWN deposit address on BNB Smart Chain ('bsc') or Tron
   * ('tron'). Any wallet or exchange may send a listed token there; it is
   * credited automatically after the confirmations.
   *
   * Endpoint: GET /api/v1/wallet/deposit-address/:chain
   *
   * [N815] 3.7.7: confirmDeposit (POST /wallet/deposit, removed in N791) and
   * requestWithdraw are gone. Players add funds and withdraw on deskillz.games
   * (https://deskillz.games/add-funds, https://deskillz.games/transactions).
   */
  async getDepositAddress(chain: DepositChain): Promise<DepositAddress> {
    if (chain !== 'bsc' && chain !== 'tron') {
      throw new Error('getDepositAddress takes bsc or tron.');
    }
    this.log('Getting deposit address on:', chain);

    const response = await this.http.get<DepositAddress>(
      `/api/v1/wallet/deposit-address/${chain}`
    );
    return response.data;
  }

  // ---------------------------------------------------------------------------
  // Debug Logger
  // ---------------------------------------------------------------------------

  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[DeskillzSDK:Wallet]', ...args);
    }
  }
}