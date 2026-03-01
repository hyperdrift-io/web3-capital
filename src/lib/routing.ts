/**
 * 1inch routing utilities.
 *
 * Iteration 3 uses 1inch deep-links for routing *intent* — no execution,
 * no API key required. The user is handed off to app.1inch.io with tokens
 * and amount pre-filled. They see a professional aggregator UI for free.
 *
 * Why 1inch and not 0x at this stage:
 * - 1inch has a deep-link URL scheme (`app.1inch.io/#/{chain}/simple/swap/...`)
 *   that pre-fills source token, target token, and amount. 0x has no equivalent.
 * - Without execution, there is nothing unique 0x adds here.
 *
 * Iteration 5 switches to 0x Gasless API for actual on-chain execution:
 * - Meta-transaction swaps (user signs EIP-712, relayer pays gas)
 * - 0x Permit2 eliminates the approve() transaction
 * - Combined with Porto session keys: zero popups, zero gas UI
 *
 * See: https://hyperdrift.io/blog/1inch-vs-0x-dex-aggregators-defi-routing
 */

import type { Pool } from '@/types/protocol'
import { DEPLOYABLE_TOKENS } from './tokens'

// ── Chain resolution ──────────────────────────────────────────────────────────

/** DeFi Llama chain name → EVM chain ID (1inch URL scheme uses chain IDs) */
export const CHAIN_ID: Record<string, number> = {
  Ethereum:  1,
  Arbitrum:  42161,
  Base:      8453,
  Optimism:  10,
  Polygon:   137,
  BSC:       56,
  Avalanche: 43114,
  zkSync:    324,
  Gnosis:    100,
}

// ── USDC source token per chain ───────────────────────────────────────────────

/** USDC address on each chain (default source for routing intents). */
export const USDC_ADDRESS: Record<number, `0x${string}`> = {
  1:     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
  8453:  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
  10:    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
  137:   '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
  56:    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
}

// ── Deep-link builder ─────────────────────────────────────────────────────────

export type RouteIntent = {
  /** 1inch app URL with from/to pre-filled */
  url: string
  /** True when the pool's underlying is USDC on the same chain (deposit, not swap) */
  isSameToken: boolean
  fromSymbol: string
  toSymbol: string
  chainId: number | null
}

/**
 * Build a 1inch deep-link for routing `amountUsd` of USDC into `pool`.
 *
 * Returns null if the pool's chain is not supported by 1inch or we can't
 * determine the target token.
 */
export function buildRouteIntent(pool: Pool, amountUsd: number): RouteIntent | null {
  const chainId = CHAIN_ID[pool.chain]
  if (!chainId) return null

  const fromAddress = USDC_ADDRESS[chainId]
  if (!fromAddress) return null

  // Resolve the target token: use the pool's first underlying token if available,
  // otherwise fall back to the symbol (1inch accepts well-known symbols too)
  const toAddress  = pool.underlyingTokens?.[0] ?? null
  const toToken    = toAddress ?? pool.symbol

  // Check if source and target are the same (direct deposit, not a swap)
  const isSameToken = toAddress
    ? toAddress.toLowerCase() === fromAddress.toLowerCase()
    : pool.symbol.toUpperCase() === 'USDC'

  // Amount in raw USDC units (6 decimals) — 1inch reads `inputCurrency` param
  const amountRaw = Math.floor(amountUsd * 1_000_000).toString()

  const url = isSameToken
    ? `https://app.aave.com` // direct deposit: Aave for USDC pools
    : `https://app.1inch.io/#/${chainId}/simple/swap/${fromAddress}/${toToken}?inputCurrency=${amountRaw}`

  return {
    url,
    isSameToken,
    fromSymbol: 'USDC',
    toSymbol: pool.symbol,
    chainId,
  }
}

// ── Price estimation ──────────────────────────────────────────────────────────

type CoinPriceResponse = {
  coins: Record<string, { price: number; symbol: string; decimals: number; timestamp: number }>
}

/**
 * Fetch a USD price from DeFi Llama's coins API.
 * Free, no API key, covers most on-chain tokens.
 * Returns null on any error (network, unsupported token, etc.)
 */
export async function fetchTokenUsdPrice(
  chain: string,
  address: string,
): Promise<number | null> {
  // DeFi Llama chain name → coins API prefix
  const chainSlug = chain.toLowerCase() === 'bsc' ? 'bsc' : chain.toLowerCase()
  const coinKey   = `${chainSlug}:${address}`

  try {
    const res = await fetch(
      `https://coins.llama.fi/prices/current/${coinKey}`,
      { next: { revalidate: 60 } },
    )
    if (!res.ok) return null
    const data: CoinPriceResponse = await res.json()
    return data.coins[coinKey]?.price ?? null
  } catch {
    return null
  }
}

/**
 * Estimate how many `toToken` units the user gets for `amountUsd` of USDC.
 * Uses DeFi Llama prices; returns a display string like "~1,240.00 wstETH".
 * Returns null if price is unavailable.
 */
export async function estimateSwapOutput(
  pool: Pool,
  amountUsd: number,
): Promise<string | null> {
  const toAddress = pool.underlyingTokens?.[0]
  if (!toAddress) return null

  const toPrice = await fetchTokenUsdPrice(pool.chain, toAddress)
  if (!toPrice || toPrice === 0) return null

  const outputAmount = amountUsd / toPrice
  const formatted = outputAmount >= 1_000
    ? outputAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })
    : outputAmount.toFixed(4)

  return `~${formatted} ${pool.symbol}`
}

// ── Allocation split ──────────────────────────────────────────────────────────

export type BandAllocation = {
  band: 'anchor' | 'balanced' | 'opportunistic'
  label: string
  description: string
  fraction: number  // e.g. 0.5 = 50%
  amountUsd: number
  pool: Pool | null
  intent: RouteIntent | null
}

const DEFAULT_FRACTIONS: Record<string, number> = {
  anchor:        0.50,
  balanced:      0.30,
  opportunistic: 0.20,
}

const BAND_META: Record<string, { label: string; description: string }> = {
  anchor:        { label: 'Anchor',        description: 'Stable base yield — battle-tested protocols only' },
  balanced:      { label: 'Balanced',      description: 'Established protocols, moderate yield uplift' },
  opportunistic: { label: 'Opportunistic', description: 'High yield, capped exposure — don\'t put rent money here' },
}

/**
 * Given a total deploy amount and the current pool list, return a 3-band
 * allocation with the best pool per band and its 1inch routing intent.
 */
export function buildAllocation(
  totalUsd: number,
  pools: Pool[],
  fractions = DEFAULT_FRACTIONS,
): BandAllocation[] {
  const bands = ['anchor', 'balanced', 'opportunistic'] as const

  return bands.map(band => {
    const fraction   = fractions[band] ?? DEFAULT_FRACTIONS[band]
    const amountUsd  = totalUsd * fraction
    const bestPool   = pools.filter(p => p.band === band)[0] ?? null
    const intent     = bestPool ? buildRouteIntent(bestPool, amountUsd) : null

    return {
      band,
      ...BAND_META[band],
      fraction,
      amountUsd,
      pool: bestPool,
      intent,
    }
  })
}

// ── Source token selection ────────────────────────────────────────────────────

/**
 * Pick the USDC address on the user's current chain to use as source.
 * Falls back to mainnet USDC if the chain isn't in our map.
 */
export function getSourceToken(chainId: number): `0x${string}` {
  return USDC_ADDRESS[chainId] ?? USDC_ADDRESS[1]
}

/** Look up deployable tokens for a chain. */
export function getDeployableTokens(chainId: number) {
  return DEPLOYABLE_TOKENS[chainId] ?? DEPLOYABLE_TOKENS[1]
}
