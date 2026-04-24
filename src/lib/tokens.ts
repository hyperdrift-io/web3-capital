/**
 * Token addresses and metadata per chain.
 *
 * Centralised here so components never hardcode addresses.
 * Only chains supported by the wagmi config are included.
 */

export type TokenMeta = {
  address: `0x${string}`
  symbol: string
  decimals: number
  /** How to price this token in USD for capital estimation */
  priceMode: 'stablecoin' | 'eth-pegged' | 'eth-ratio'
  /** Approximate ETH-denominated ratio (for eth-ratio tokens like wstETH) */
  ethRatio?: number
}

/** ERC-20 tokens to track as "deployable capital" on each chain. */
export const DEPLOYABLE_TOKENS: Record<number, TokenMeta[]> = {
  // Ethereum mainnet
  1: [
    {
      address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      symbol: 'USDC', decimals: 6, priceMode: 'stablecoin',
    },
    {
      address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      symbol: 'USDT', decimals: 6, priceMode: 'stablecoin',
    },
    {
      address: '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
      symbol: 'wstETH', decimals: 18, priceMode: 'eth-ratio', ethRatio: 1.06,
    },
    {
      address: '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
      symbol: 'stETH', decimals: 18, priceMode: 'eth-pegged',
    },
  ],
  // Arbitrum One
  42161: [
    {
      address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      symbol: 'USDC', decimals: 6, priceMode: 'stablecoin',
    },
    {
      address: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
      symbol: 'USDT', decimals: 6, priceMode: 'stablecoin',
    },
    {
      address: '0x5979D7b546E38E414F7E9822514be443A4800529',
      symbol: 'wstETH', decimals: 18, priceMode: 'eth-ratio', ethRatio: 1.06,
    },
  ],
  // Base
  8453: [
    {
      address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      symbol: 'USDC', decimals: 6, priceMode: 'stablecoin',
    },
    {
      address: '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
      symbol: 'wstETH', decimals: 18, priceMode: 'eth-ratio', ethRatio: 1.06,
    },
  ],
  // Optimism
  10: [
    {
      address: '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
      symbol: 'USDC', decimals: 6, priceMode: 'stablecoin',
    },
    {
      address: '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
      symbol: 'USDT', decimals: 6, priceMode: 'stablecoin',
    },
    {
      address: '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
      symbol: 'wstETH', decimals: 18, priceMode: 'eth-ratio', ethRatio: 1.06,
    },
  ],
  // BNB Chain
  56: [
    {
      address: '0x55d398326f99059fF775485246999027B3197955',
      symbol: 'USDT', decimals: 18, priceMode: 'stablecoin',
    },
    {
      address: '0x8ac76a51cc950d9822d68b83fe1ad97b32cd580d',
      symbol: 'USDC', decimals: 18, priceMode: 'stablecoin',
    },
    {
      address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8',
      symbol: 'WETH', decimals: 18, priceMode: 'eth-pegged',
    },
  ],
  // Polygon
  137: [
    {
      address: '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
      symbol: 'USDC', decimals: 6, priceMode: 'stablecoin',
    },
    {
      address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      symbol: 'USDT', decimals: 6, priceMode: 'stablecoin',
    },
  ],
}

/**
 * Estimate USD value of a token amount given the current ETH/USD price.
 * Returns null if the price mode can't be resolved.
 */
export function estimateUsdValue(
  meta: TokenMeta,
  rawBalance: bigint,
  ethUsdPrice: number,
): number {
  const amount = Number(rawBalance) / Math.pow(10, meta.decimals)
  switch (meta.priceMode) {
    case 'stablecoin':  return amount
    case 'eth-pegged':  return amount * ethUsdPrice
    case 'eth-ratio':   return amount * ethUsdPrice * (meta.ethRatio ?? 1)
  }
}
