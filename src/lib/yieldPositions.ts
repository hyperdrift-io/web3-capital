/**
 * Yield-bearing token registry for position detection.
 *
 * Tracks aTokens (Aave v3) and cTokens (Compound v3) across supported chains.
 * These are all ERC-20 compatible — balanceOf(user) returns the live balance
 * including accrued interest on every block.
 *
 * Architecture choice: we read aToken balances directly rather than using
 * Aave's UiPoolDataProviderV3. Both are correct; direct aToken reads are
 * simpler, need no intermediary ABI, and are easily batched with
 * useReadContracts. UiPoolDataProviderV3 is preferable if you also need
 * borrow positions, health factor, or e-mode data.
 *
 * Addresses sourced from:
 * - Aave: https://docs.aave.com/developers/deployed-contracts/v3-mainnet
 * - Compound: https://docs.compound.finance/#networks
 *
 * NOTE: always verify addresses against official deployments before executing
 * transactions. These are read-only calls so wrong addresses return 0n (safe).
 */

export type YieldToken = {
  address:      `0x${string}`
  symbol:       string         // display symbol, e.g. "aUSDC"
  underlying:   string         // underlying asset symbol, e.g. "USDC"
  decimals:     number
  protocol:     'aave-v3' | 'compound-v3' | 'lido'
  /** DeFi Llama project slug for APY matching */
  llamaProject: string
  /** DeFi Llama chain name for APY matching */
  llamaChain:   string
}

/** Known yield-bearing tokens per chain, used for position detection. */
export const YIELD_TOKENS: Record<number, YieldToken[]> = {

  // ── Ethereum mainnet ────────────────────────────────────────────────────────
  1: [
    {
      address:      '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',
      symbol:       'aWETH',
      underlying:   'WETH',
      decimals:     18,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Ethereum',
    },
    {
      address:      '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',
      symbol:       'aUSDC',
      underlying:   'USDC',
      decimals:     6,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Ethereum',
    },
    {
      address:      '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a',
      symbol:       'aUSDT',
      underlying:   'USDT',
      decimals:     6,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Ethereum',
    },
    {
      address:      '0x0B925eD163218f6662a35e0f0371Ac234f9E9371',
      symbol:       'awstETH',
      underlying:   'wstETH',
      decimals:     18,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Ethereum',
    },
    // Compound v3 USDC (cUSDCv3) — ERC-20 compatible, balanceOf returns supply
    {
      address:      '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
      symbol:       'cUSDCv3',
      underlying:   'USDC',
      decimals:     6,
      protocol:     'compound-v3',
      llamaProject: 'compound-v3',
      llamaChain:   'Ethereum',
    },
  ],

  // ── Arbitrum One ─────────────────────────────────────────────────────────────
  42161: [
    {
      address:      '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
      symbol:       'aWETH',
      underlying:   'WETH',
      decimals:     18,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Arbitrum',
    },
    {
      address:      '0x724dc807b04555b71ed48a6896b6F41593b8C637',
      symbol:       'aUSDC',
      underlying:   'USDC',
      decimals:     6,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Arbitrum',
    },
    {
      address:      '0x513c7E3a9c69cA3e22550eF58AC1C0088e918FFf',
      symbol:       'awstETH',
      underlying:   'wstETH',
      decimals:     18,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Arbitrum',
    },
    {
      address:      '0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf',
      symbol:       'cUSDCv3',
      underlying:   'USDC',
      decimals:     6,
      protocol:     'compound-v3',
      llamaProject: 'compound-v3',
      llamaChain:   'Arbitrum',
    },
  ],

  // ── Base ──────────────────────────────────────────────────────────────────────
  8453: [
    {
      address:      '0xD4a0e0b9149BCee3C920d2E00b5dE09138fd8bb7',
      symbol:       'aWETH',
      underlying:   'WETH',
      decimals:     18,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Base',
    },
    {
      address:      '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB',
      symbol:       'aUSDC',
      underlying:   'USDC',
      decimals:     6,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Base',
    },
    {
      address:      '0xb125E6687d4313864e53df431d5425969c15Eb2',
      symbol:       'cUSDCv3',
      underlying:   'USDC',
      decimals:     6,
      protocol:     'compound-v3',
      llamaProject: 'compound-v3',
      llamaChain:   'Base',
    },
  ],

  // ── Optimism ──────────────────────────────────────────────────────────────────
  10: [
    {
      address:      '0xe50fA9b3c56FfB159cB0FCA61F5c9D750e8128c8',
      symbol:       'aWETH',
      underlying:   'WETH',
      decimals:     18,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Optimism',
    },
    {
      address:      '0x38d693cE1dF5AaDF7bC62595A37D667aD57922e5',
      symbol:       'aUSDC',
      underlying:   'USDC',
      decimals:     6,
      protocol:     'aave-v3',
      llamaProject: 'aave-v3',
      llamaChain:   'Optimism',
    },
    {
      address:      '0x2e44e174f7D53F0212823acC11C01A11d58c5bCb',
      symbol:       'cUSDCv3',
      underlying:   'USDC',
      decimals:     6,
      protocol:     'compound-v3',
      llamaProject: 'compound-v3',
      llamaChain:   'Optimism',
    },
  ],
}

export const SUPPORTED_CHAIN_IDS = [1, 42161, 8453, 10] as const
export type SupportedChainId = typeof SUPPORTED_CHAIN_IDS[number]

export const CHAIN_NAMES: Record<SupportedChainId, string> = {
  1:     'Ethereum',
  42161: 'Arbitrum',
  8453:  'Base',
  10:    'Optimism',
}

// ── Pool matching ──────────────────────────────────────────────────────────────

import type { Pool } from '@/types/protocol'

/**
 * Find the DeFi Llama pool that best matches a yield token position.
 * Matches on protocol slug + underlying symbol + chain.
 */
export function matchPool(token: YieldToken, pools: Pool[]): Pool | null {
  return (
    pools.find(p =>
      p.project === token.llamaProject &&
      p.symbol.includes(token.underlying) &&
      p.chain === token.llamaChain
    ) ?? null
  )
}

// ── Position type ──────────────────────────────────────────────────────────────

export type DetectedPosition = {
  token:    YieldToken
  chainId:  SupportedChainId
  rawBalance: bigint       // in token decimals
  usdValue:  number        // estimated USD value
  apy:       number | null // from DeFi Llama match, null if unmatched
  pool:      Pool | null   // matched pool (for routing)
}
