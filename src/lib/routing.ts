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

// ── Known DEX-tradeable token addresses ──────────────────────────────────────
//
// Receipt/vault tokens (csyUSDC, aUSDC, cUSDC, etc.) are NOT tradeable on
// 1inch — they are issued by lending protocols after deposit. This map lets us
// resolve the underlying tradeable base asset from well-known symbols.
//
// Key: uppercase symbol — Value: chainId → contract address

type ChainAddresses = Partial<Record<number, `0x${string}`>>

export const KNOWN_TOKEN: Record<string, ChainAddresses> = {
  USDC: {
    1:     '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    42161: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
    8453:  '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
    10:    '0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85',
    137:   '0x3c499c542cEF5E3811e1192ce70d8cC03d5c3359',
    56:    '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    43114: '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E',
  },
  USDT: {
    1:     '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    42161: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9',
    8453:  '0xfde4C96c8593536E31F229EA8f37b2ADa2699bb2',
    10:    '0x94b008aA00579c1307B0EF2c499aD98a8ce58e58',
    137:   '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
    56:    '0x55d398326f99059fF775485246999027B3197955',
  },
  DAI: {
    1:     '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    42161: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    10:    '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1',
    137:   '0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063',
  },
  WETH: {
    1:     '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    42161: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
    8453:  '0x4200000000000000000000000000000000000006',
    10:    '0x4200000000000000000000000000000000000006',
    137:   '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
  },
  WSTETH: {
    1:     '0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0',
    42161: '0x5979D7b546E38E414F7E9822514be443A4800529',
    8453:  '0xc1CBa3fCea344f92D9239c08C0568f6F2F0ee452',
    10:    '0x1F32b1c2345538c0c6f582fCB022739c4A194Ebb',
  },
  STETH: {
    1:     '0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84',
  },
  WEETH: {
    1:     '0xCd5fE23C85820F7B72D0926FC9b05b43E359b7ee',
    42161: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
    8453:  '0x04C0599Ae5A44757c0af6F9eC3b93da8976c150A',
  },
  RETH: {
    1:     '0xae78736Cd615f374D3085123A210448E74Fc6393',
    42161: '0xEC70Dcb4A1EFa46b8F2D97C310C9c4790ba5ffA',
    10:    '0x9Bcef72be871e61ED4fBbc7630889beE758eb81D',
  },
  CBETH: {
    1:     '0xBe9895146f7AF43049ca1c1AE358B0541Ea49704',
    8453:  '0x2Ae3F1Ec7F1F5012CFEab0185bfc7aa3cf0DEc22',
  },
  WBTC: {
    1:     '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    42161: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
    10:    '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
    137:   '0x1BFD67037B42Cf73acF2047067bd4F2C47D9BfD6',
  },
  GHO: {
    1:     '0x40D16FC0246aD3160Ccc09B8D0D3A2cD28aE6C2f',
    42161: '0x7dfF72693f6A4149b17e7C6314655f6A9F7c8B33',
  },
  CRVUSD: {
    1:     '0xf939E0A03FB07F59A73314E73794Be0E57ac1b4E',
  },
  LUSD: {
    1:     '0x5f98805A4E8be255a32880FDeC7F6728C6568bA0',
  },
  FRAX: {
    1:     '0x853d955aCEf822Db058eb8505911ED77F175b99e',
  },
  SUSDE: {
    1:     '0x9D39A5DE30e57443BfF2A8307A4256c8797A3497',
    42161: '0x211Cc4DD073734dA055fbF44a2b4667d5E5fE5d2',
  },
  USDE: {
    1:     '0x4c9EDD5852cd905f086C759E8383e09bff1E68B3',
    42161: '0x5d3a1Ff2b6BAb83b63cd9AD0787074081a52ef34',
  },
  SDAI: {
    1:     '0x83F20F44975D03b1b09e64809B757c47f942BEeA',
  },
}

const KNOWN_TOKEN_ADDRESSES = new Set(
  Object.values(KNOWN_TOKEN).flatMap(chains => Object.values(chains)).map(a => a!.toLowerCase()),
)

// ── Non-tradeable vault token prefix patterns ─────────────────────────────────
//
// These prefixes identify receipt/vault tokens. Stripping them reveals the
// underlying base asset symbol which we can look up in KNOWN_TOKEN.
//
// Order matters: try longest match first.
const VAULT_PREFIXES = ['csy', 'asy', 'a', 'c', 'b', 'm'] as const

/**
 * Resolve the best 1inch `dst` token for a given pool.
 *
 * Strategy (in order):
 * 1. If underlyingTokens[0] is a known tradeable address → use it.
 * 2. If the pool symbol is a known tradeable symbol → use its address.
 * 3. Strip vault prefixes from the symbol and retry step 2.
 * 4. Fall back to the raw symbol string (1inch may still resolve it).
 */
export function resolveToToken(pool: { symbol: string; underlyingTokens: string[] | null }, chainId: number): string {
  const known = KNOWN_TOKEN

  // 1. underlying token address that is DEX-tradeable
  const underlying = pool.underlyingTokens?.[0]
  if (underlying && KNOWN_TOKEN_ADDRESSES.has(underlying.toLowerCase())) {
    return underlying
  }

  const sym = pool.symbol.toUpperCase()

  // 2. exact symbol match
  const direct = known[sym]?.[chainId]
  if (direct) return direct

  // 3. strip vault prefix and retry
  for (const prefix of VAULT_PREFIXES) {
    if (sym.startsWith(prefix.toUpperCase())) {
      const base = sym.slice(prefix.length)
      const fromBase = known[base]?.[chainId]
      if (fromBase) return fromBase
    }
  }

  // 4. last resort — let 1inch try to interpret the symbol
  return pool.symbol
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
  /** Human-readable protocol name for the deposit button label (e.g. "Morpho", "Aave") */
  protocolLabel?: string
}

// ── Protocol-aware deposit URL helpers ───────────────────────────────────────

/**
 * Returns the correct deposit/supply app URL for a given DeFi protocol.
 * Used when the routing intent is a direct deposit (no token swap required).
 */
function getProtocolDepositUrl(project: string, chain: string): string {
  const p = project.toLowerCase()
  const c = chain.toLowerCase()
  if (p.includes('morpho')) {
    const network = c === 'ethereum' ? 'ethereum' : c
    return `https://app.morpho.org/?network=${network}`
  }
  if (p.includes('compound')) return 'https://app.compound.finance'
  if (p.includes('spark'))    return 'https://app.spark.fi'
  if (p.includes('fluid'))    return 'https://fluid.instadapp.io'
  if (p.includes('euler'))    return 'https://app.euler.finance'
  if (p.includes('yearn'))    return 'https://yearn.fi'
  // Default: Aave
  const market = c === 'ethereum' ? '' : `/?marketName=proto_${c}_v3`
  return `https://app.aave.com${market}`
}

/** Short display name for a DeFi protocol (used in button labels). */
function getProtocolLabel(project: string): string {
  const p = project.toLowerCase()
  if (p.includes('morpho'))   return 'Morpho'
  if (p.includes('compound')) return 'Compound'
  if (p.includes('spark'))    return 'Spark'
  if (p.includes('fluid'))    return 'Fluid'
  if (p.includes('euler'))    return 'Euler'
  if (p.includes('yearn'))    return 'Yearn'
  return 'Aave'
}

/**
 * Returns true when the pool requires a direct deposit rather than a token swap.
 *
 * Covers two cases:
 * 1. resolveToToken found a known address that matches the source (same-token swap).
 * 2. resolveToToken fell back to the raw pool symbol (vault receipt token unknown
 *    to our KNOWN_TOKEN map) — this means it's a vault that mints a receipt token
 *    upon deposit of the underlying, so no DEX swap is needed.
 */
function isDirectDeposit(
  toToken: string,
  fromAddress: string,
  sourceSymbol: string,
  pool: { symbol: string },
): boolean {
  if (toToken.toLowerCase() === fromAddress.toLowerCase()) return true
  if (toToken.toUpperCase() === sourceSymbol.toUpperCase()) return true
  // Note: the former "toToken === pool.symbol" fallback has been removed.
  // Vault receipt tokens not in KNOWN_TOKEN (e.g. STEAKUSDC, crvUSD) were
  // being incorrectly flagged as direct deposits — they still require
  // either a DEX swap or a separate deposit step.
  return false
}

/**
 * Build a 1inch deep-link for routing `amountUsd` of USDC into `pool`.
 *
 * Returns null if the pool's chain is not supported by 1inch or we can't
 * determine the target token.
 *
 * URL format: https://app.1inch.io/swap?src={chain}:{from}&dst={chain}:{to}
 * where {to} is the pool's first underlying token address when available,
 * otherwise the pool symbol (1inch accepts well-known symbols).
 */
export function buildRouteIntent(pool: Pool): RouteIntent | null {
  const chainId = CHAIN_ID[pool.chain]
  if (!chainId) return null

  const fromAddress = USDC_ADDRESS[chainId]
  if (!fromAddress) return null

  // Resolve destination: strips vault/receipt token prefixes to find the
  // underlying tradeable base asset (e.g. csyUSDC → USDC, aWETH → WETH).
  const toToken = resolveToToken(pool, chainId)

  const isSameToken = isDirectDeposit(toToken, fromAddress, 'USDC', pool)

  const url = isSameToken
    ? getProtocolDepositUrl(pool.project, pool.chain)
    : `https://app.1inch.io/swap?src=${chainId}:${fromAddress}&dst=${chainId}:${toToken}`

  return {
    url,
    isSameToken,
    fromSymbol: 'USDC',
    toSymbol: pool.symbol,
    chainId,
    protocolLabel: isSameToken ? getProtocolLabel(pool.project) : undefined,
  }
}

/**
 * Build a 1inch deep-link for a post-bridge routing intent.
 *
 * Use this when the user has already bridged a specific token (e.g. USDT)
 * to the pool's chain and needs to swap from that token into the pool's
 * underlying asset. Unlike buildRouteIntent (which always uses USDC as source),
 * this accepts the actual bridged token as the source.
 *
 * Falls back to USDC_ADDRESS if the source token isn't in KNOWN_TOKEN for
 * the target chain — so the result is always usable.
 */
export function buildBridgeRouteIntent(pool: Pool, sourceBridgeToken: string): RouteIntent | null {
  const chainId = CHAIN_ID[pool.chain]
  if (!chainId) return null

  const sourceKey = sourceBridgeToken.toUpperCase()
  // Strict lookup — no USDC fallback. If the source token isn't in KNOWN_TOKEN
  // for this chain, return null rather than silently routing from USDC while
  // still labelling the intent with the bridge token (address/symbol mismatch).
  const fromAddress = KNOWN_TOKEN[sourceKey]?.[chainId]
  if (!fromAddress) return null

  const toToken = resolveToToken(pool, chainId)

  const isSameToken = isDirectDeposit(toToken, fromAddress, sourceKey, pool)

  const url = isSameToken
    ? getProtocolDepositUrl(pool.project, pool.chain)
    : `https://app.1inch.io/swap?src=${chainId}:${fromAddress}&dst=${chainId}:${toToken}`

  return {
    url,
    isSameToken,
    fromSymbol: sourceBridgeToken,
    toSymbol: pool.symbol,
    chainId,
    protocolLabel: isSameToken ? getProtocolLabel(pool.project) : undefined,
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
    const intent     = bestPool ? buildRouteIntent(bestPool) : null

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
