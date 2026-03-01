import type { Pool, AllocationBand } from '@/types/protocol'

const YIELDS_API = 'https://yields.llama.fi/pools'

// Protocols with established track records — higher safety weight
const TIER_1_PROTOCOLS = new Set([
  'aave-v3', 'aave-v2', 'aave',
  'compound-v3', 'compound-v2', 'compound',
  'lido', 'rocket-pool', 'stader',
  'curve', 'curve-dex',
  'uniswap-v3', 'uniswap-v2',
  'makerdao', 'spark',
  'morpho', 'morpho-blue',
  'frax', 'frax-ether',
  'yearn-finance', 'beefy',
  'pendle',
  'convex-finance',
  'euler',
])

const TIER_2_PROTOCOLS = new Set([
  'balancer', 'sushiswap',
  'across', 'stargate',
  'gmx', 'gains-network',
  'notional', 'exactly',
])

type RawPool = {
  pool: string
  symbol: string
  project: string
  chain: string
  apy: number
  apyBase: number | null
  apyReward: number | null
  tvlUsd: number
  stablecoin: boolean
  ilRisk: string | null
  exposure: string | null
  underlyingTokens: string[] | null
  rewardTokens: string[] | null
}

function safetyScore(pool: RawPool): number {
  let score = 50

  // Protocol tier
  if (TIER_1_PROTOCOLS.has(pool.project)) score += 30
  else if (TIER_2_PROTOCOLS.has(pool.project)) score += 15

  // TVL — liquidity depth signal
  if (pool.tvlUsd >= 1_000_000_000) score += 15
  else if (pool.tvlUsd >= 100_000_000) score += 10
  else if (pool.tvlUsd >= 10_000_000)  score += 5
  else if (pool.tvlUsd < 1_000_000)   score -= 10

  // Impermanent loss risk
  if (pool.ilRisk === 'YES') score -= 10

  // Single asset exposure is safer than LP
  if (pool.exposure === 'single') score += 5

  // Stablecoins eliminate price risk
  if (pool.stablecoin) score += 5

  // Reward-only APY (mercenary liquidity risk)
  if (pool.apyBase === 0 && (pool.apyReward ?? 0) > 0) score -= 10

  return Math.max(0, Math.min(100, score))
}

function capitalEfficiency(pool: RawPool, safety: number): number {
  // Normalize APY: capped at 30% for scoring purposes
  const normalizedApy = Math.min(pool.apy / 30, 1) * 100

  // TVL liquidity score
  const tvlScore = Math.min(pool.tvlUsd / 500_000_000, 1) * 100

  // Weighted composite
  return Math.round(
    normalizedApy * 0.40 +
    safety        * 0.45 +
    tvlScore      * 0.15
  )
}

function allocationBand(safety: number, apy: number): AllocationBand {
  if (safety >= 75 && apy <= 12) return 'anchor'
  if (safety >= 55 && apy <= 25) return 'balanced'
  return 'opportunistic'
}

function enrichPool(raw: RawPool): Pool {
  const safety = safetyScore(raw)
  const ce = capitalEfficiency(raw, safety)
  const band = allocationBand(safety, raw.apy)

  return {
    ...raw,
    apy: raw.apy ?? 0,
    apyBase: raw.apyBase ?? null,
    apyReward: raw.apyReward ?? null,
    capitalEfficiency: ce,
    band,
  }
}

export async function fetchPools(): Promise<Pool[]> {
  const res = await fetch(YIELDS_API, {
    next: { revalidate: 300 }, // revalidate every 5 min
  })

  if (!res.ok) throw new Error(`DeFi Llama API error: ${res.status}`)

  const json = await res.json()
  const raw: RawPool[] = json.data ?? []

  return raw
    .filter(p => p.apy > 0 && p.tvlUsd >= 1_000_000)
    .map(enrichPool)
    .sort((a, b) => b.capitalEfficiency - a.capitalEfficiency)
}

export async function fetchTopPools(limit = 100): Promise<Pool[]> {
  const all = await fetchPools()
  return all.slice(0, limit)
}
