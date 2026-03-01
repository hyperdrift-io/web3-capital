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

export type RawPool = {
  pool: string
  symbol: string
  project: string
  chain: string
  apy: number
  apyBase: number | null
  apyReward: number | null
  apyPct7d: number | null  // 7-day APY change % from DeFi Llama
  tvlUsd: number
  stablecoin: boolean
  ilRisk: string | null
  exposure: string | null
  underlyingTokens: string[] | null
  rewardTokens: string[] | null
}

export function safetyScore(pool: RawPool): number {
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

export function capitalEfficiency(pool: RawPool, safety: number): number {
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

export function allocationBand(safety: number, apy: number): AllocationBand {
  if (safety >= 75 && apy <= 12) return 'anchor'
  if (safety >= 55 && apy <= 25) return 'balanced'
  return 'opportunistic'
}

export type SafetyFactor = {
  label: string
  pts: number
  detail: string
}

export function safetyBreakdown(pool: RawPool): { total: number; factors: SafetyFactor[] } {
  const factors: SafetyFactor[] = []
  let score = 50
  factors.push({ label: 'Base', pts: 50, detail: 'Starting score' })

  if (TIER_1_PROTOCOLS.has(pool.project)) {
    score += 30
    factors.push({ label: 'Tier-1 protocol', pts: 30, detail: pool.project })
  } else if (TIER_2_PROTOCOLS.has(pool.project)) {
    score += 15
    factors.push({ label: 'Tier-2 protocol', pts: 15, detail: pool.project })
  } else {
    factors.push({ label: 'Unranked protocol', pts: 0, detail: 'Not in recognised tier' })
  }

  if (pool.tvlUsd >= 1_000_000_000) {
    score += 15
    factors.push({ label: 'TVL > $1B', pts: 15, detail: 'Deep liquidity' })
  } else if (pool.tvlUsd >= 100_000_000) {
    score += 10
    factors.push({ label: 'TVL > $100M', pts: 10, detail: 'Strong liquidity' })
  } else if (pool.tvlUsd >= 10_000_000) {
    score += 5
    factors.push({ label: 'TVL > $10M', pts: 5, detail: 'Adequate liquidity' })
  } else if (pool.tvlUsd < 1_000_000) {
    score -= 10
    factors.push({ label: 'TVL < $1M', pts: -10, detail: 'Thin liquidity' })
  }

  if (pool.ilRisk === 'YES') {
    score -= 10
    factors.push({ label: 'IL risk', pts: -10, detail: 'Impermanent loss exposure' })
  }

  if (pool.exposure === 'single') {
    score += 5
    factors.push({ label: 'Single asset', pts: 5, detail: 'No LP token risk' })
  }

  if (pool.stablecoin) {
    score += 5
    factors.push({ label: 'Stablecoin', pts: 5, detail: 'No price exposure' })
  }

  if (pool.apyBase === 0 && (pool.apyReward ?? 0) > 0) {
    score -= 10
    factors.push({ label: 'Reward-only APY', pts: -10, detail: 'Mercenary liquidity risk' })
  }

  return { total: Math.max(0, Math.min(100, score)), factors }
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
    apyPct7d: raw.apyPct7d ?? null,
    safety,
    capitalEfficiency: ce,
    band,
  }
}

export async function fetchPools(): Promise<Pool[]> {
  const res = await fetch(YIELDS_API, {
    cache: 'no-store', // response ~17MB; Next.js fetch cache has 2MB limit
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
