// =============================================================================
// Deskillz Web SDK - Chain Configuration
// Path: src/wallet/chain-config.ts
// Supported chains, token addresses, and blockchain utilities
// Replicates from: wallet-config.ts (lines 26-206)
// Zero framework dependency: no wagmi, no RainbowKit
// =============================================================================

// -----------------------------------------------------------------------------
// Chain IDs (constants for type safety)
// Replicates: wagmi/chains imports from wallet-config.ts (lines 4-11)
// -----------------------------------------------------------------------------

export const ChainId = {
  ETHEREUM: 1,
  POLYGON: 137,
  BSC: 56,
  ARBITRUM: 42161,
  OPTIMISM: 10,
  BASE: 8453,
  SEPOLIA: 11155111,
  BSC_TESTNET: 97,
} as const;

export type ChainId = (typeof ChainId)[keyof typeof ChainId];

// -----------------------------------------------------------------------------
// Chain Metadata
// Replicates: wallet-config.ts chainMeta (lines 81-137)
// Using ASCII text instead of emoji to avoid encoding issues
// -----------------------------------------------------------------------------

export interface ChainMeta {
  name: string;
  shortName: string;
  icon: string;
  color: string;
  explorerUrl: string;
  nativeCurrency: string;
  nativeDecimals: number;
  rpcUrl?: string;
}

export const chainMeta: Record<number, ChainMeta> = {
  [ChainId.ETHEREUM]: {
    name: 'Ethereum',
    shortName: 'ETH',
    icon: 'ETH',
    color: '#627EEA',
    explorerUrl: 'https://etherscan.io',
    nativeCurrency: 'ETH',
    nativeDecimals: 18,
  },
  [ChainId.POLYGON]: {
    name: 'Polygon',
    shortName: 'MATIC',
    icon: 'MATIC',
    color: '#8247E5',
    explorerUrl: 'https://polygonscan.com',
    nativeCurrency: 'MATIC',
    nativeDecimals: 18,
  },
  [ChainId.BSC]: {
    name: 'BNB Chain',
    shortName: 'BSC',
    icon: 'BNB',
    color: '#F0B90B',
    explorerUrl: 'https://bscscan.com',
    nativeCurrency: 'BNB',
    nativeDecimals: 18,
  },
  [ChainId.ARBITRUM]: {
    name: 'Arbitrum',
    shortName: 'ARB',
    icon: 'ARB',
    color: '#28A0F0',
    explorerUrl: 'https://arbiscan.io',
    nativeCurrency: 'ETH',
    nativeDecimals: 18,
  },
  [ChainId.OPTIMISM]: {
    name: 'Optimism',
    shortName: 'OP',
    icon: 'OP',
    color: '#FF0420',
    explorerUrl: 'https://optimistic.etherscan.io',
    nativeCurrency: 'ETH',
    nativeDecimals: 18,
  },
  [ChainId.BASE]: {
    name: 'Base',
    shortName: 'BASE',
    icon: 'BASE',
    color: '#0052FF',
    explorerUrl: 'https://basescan.org',
    nativeCurrency: 'ETH',
    nativeDecimals: 18,
  },
  [ChainId.SEPOLIA]: {
    name: 'Sepolia',
    shortName: 'SEP',
    icon: 'ETH',
    color: '#627EEA',
    explorerUrl: 'https://sepolia.etherscan.io',
    nativeCurrency: 'ETH',
    nativeDecimals: 18,
  },
  [ChainId.BSC_TESTNET]: {
    name: 'BSC Testnet',
    shortName: 'tBSC',
    icon: 'BNB',
    color: '#F0B90B',
    explorerUrl: 'https://testnet.bscscan.com',
    nativeCurrency: 'tBNB',
    nativeDecimals: 18,
  },
};

// -----------------------------------------------------------------------------
// Token Addresses (ERC20 contract addresses per chain)
// Replicates: wallet-config.ts tokenAddresses (lines 140-164)
// -----------------------------------------------------------------------------

export const tokenAddresses: Record<number, Record<string, string>> = {
  [ChainId.ETHEREUM]: {
    USDT: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    USDC: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  },
  [ChainId.POLYGON]: {
    USDT: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    USDC: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  },
  [ChainId.BSC]: {
    USDT: '0x55d398326f99059fF775485246999027B3197955',
    USDC: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
  },
  [ChainId.ARBITRUM]: {
    USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  },
  [ChainId.OPTIMISM]: {
    USDT: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    USDC: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  },
  [ChainId.BASE]: {
    USDC: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  },
};

// -----------------------------------------------------------------------------
// ERC20 Minimal ABI (for balanceOf, decimals, symbol)
// Replicates: wallet-config.ts erc20Abi (lines 167-189)
// -----------------------------------------------------------------------------

export const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'symbol',
    outputs: [{ name: '', type: 'string' }],
    type: 'function',
  },
] as const;

// -----------------------------------------------------------------------------
// Supported Chain List
// Replicates: wallet-config.ts supportedChains (lines 26-34)
// -----------------------------------------------------------------------------

/**
 * Default supported chain IDs for the Deskillz platform.
 */
export const SUPPORTED_CHAIN_IDS: readonly ChainId[] = [
  ChainId.ETHEREUM,
  ChainId.POLYGON,
  ChainId.BSC,
  ChainId.ARBITRUM,
  ChainId.OPTIMISM,
  ChainId.BASE,
] as const;

/**
 * Testnet chain IDs (for development).
 */
export const TESTNET_CHAIN_IDS: readonly ChainId[] = [
  ChainId.SEPOLIA,
  ChainId.BSC_TESTNET,
] as const;

// -----------------------------------------------------------------------------
// Utility Functions
// Replicates: wallet-config.ts (lines 192-206), useWallet.ts formatting
// -----------------------------------------------------------------------------

/**
 * Truncate a wallet address for display.
 * Replicates: wallet-config.ts formatAddress (lines 192-194)
 *
 * @param address - Full wallet address (e.g., 0x1234...abcd).
 * @param chars - Number of characters to show on each side. Default: 4.
 * @returns Truncated address (e.g., 0x1234...abcd).
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address || address.length < chars * 2 + 4) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/**
 * Get block explorer URL for a wallet address.
 * Replicates: wallet-config.ts getExplorerAddressUrl (lines 197-200)
 *
 * @param chainId - Network chain ID.
 * @param address - Wallet address.
 * @returns Full explorer URL or '#' if chain is unsupported.
 */
export function getExplorerAddressUrl(chainId: number, address: string): string {
  const meta = chainMeta[chainId];
  return meta ? `${meta.explorerUrl}/address/${address}` : '#';
}

/**
 * Get block explorer URL for a transaction hash.
 * Replicates: wallet-config.ts getExplorerTxUrl (lines 203-206)
 *
 * @param chainId - Network chain ID.
 * @param txHash - Transaction hash.
 * @returns Full explorer URL or '#' if chain is unsupported.
 */
export function getExplorerTxUrl(chainId: number, txHash: string): string {
  const meta = chainMeta[chainId];
  return meta ? `${meta.explorerUrl}/tx/${txHash}` : '#';
}

/**
 * Get the token contract address for a currency on a specific chain.
 *
 * @param chainId - Network chain ID.
 * @param symbol - Token symbol (e.g., 'USDT', 'USDC').
 * @returns Contract address or null if not available on that chain.
 */
export function getTokenAddress(chainId: number, symbol: string): string | null {
  return tokenAddresses[chainId]?.[symbol] ?? null;
}

/**
 * Check if a chain ID is supported by the platform.
 *
 * @param chainId - Network chain ID to check.
 * @param includeTestnets - Whether to include testnet chains. Default: false.
 * @returns True if the chain is supported.
 */
export function isSupportedChain(chainId: number, includeTestnets = false): boolean {
  const mainnetSupported = (SUPPORTED_CHAIN_IDS as readonly number[]).includes(chainId);
  if (mainnetSupported) return true;
  if (includeTestnets) {
    return (TESTNET_CHAIN_IDS as readonly number[]).includes(chainId);
  }
  return false;
}

/**
 * Get chain metadata by chain ID.
 *
 * @param chainId - Network chain ID.
 * @returns Chain metadata or null if unknown.
 */
export function getChainMeta(chainId: number): ChainMeta | null {
  return chainMeta[chainId] ?? null;
}

/**
 * Get all available token symbols for a chain.
 *
 * @param chainId - Network chain ID.
 * @returns Array of token symbols available on the chain.
 */
export function getAvailableTokens(chainId: number): string[] {
  const tokens = tokenAddresses[chainId];
  return tokens ? Object.keys(tokens) : [];
}