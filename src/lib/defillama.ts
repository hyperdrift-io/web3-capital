import type { Pool, AllocationBand } from '@/types/protocol'

const YIELDS_API = 'https://yields.llama.fi/pools'
const USE_E2E_MOCK_YIELDS = process.env.E2E_MOCK_YIELDS === '1'

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

function getE2EMockRawPools(): RawPool[] {
  return [
    { pool: 'pool-aave', symbol: 'USDC', project: 'aave-v3', chain: 'Ethereum', apy: 4.2, apyBase: 4.2, apyReward: null, apyPct7d: 0.3, tvlUsd: 2_400_000_000, stablecoin: true, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-compound', symbol: 'USDC', project: 'compound-v3', chain: 'Base', apy: 5.8, apyBase: 5.8, apyReward: null, apyPct7d: 0.4, tvlUsd: 1_700_000_000, stablecoin: true, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-spark', symbol: 'DAI', project: 'spark', chain: 'Ethereum', apy: 6.4, apyBase: 6.4, apyReward: null, apyPct7d: -0.1, tvlUsd: 980_000_000, stablecoin: true, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-curve', symbol: 'crvUSD', project: 'curve-dex', chain: 'Arbitrum', apy: 3.1, apyBase: 3.1, apyReward: null, apyPct7d: 0.2, tvlUsd: 620_000_000, stablecoin: true, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-pendle', symbol: 'USDe', project: 'pendle', chain: 'Ethereum', apy: 18.4, apyBase: 11.2, apyReward: 7.2, apyPct7d: 1.2, tvlUsd: 430_000_000, stablecoin: false, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-balancer', symbol: 'wstETH-ETH', project: 'balancer', chain: 'Base', apy: 14.6, apyBase: 8.3, apyReward: 6.3, apyPct7d: 0.7, tvlUsd: 260_000_000, stablecoin: false, ilRisk: 'YES', exposure: 'lp', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-gmx', symbol: 'WETH', project: 'gmx', chain: 'Arbitrum', apy: 20.2, apyBase: 14.2, apyReward: 6, apyPct7d: 0.9, tvlUsd: 145_000_000, stablecoin: false, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-morpho', symbol: 'USDC', project: 'morpho-blue', chain: 'Ethereum', apy: 16.1, apyBase: 16.1, apyReward: null, apyPct7d: 0.6, tvlUsd: 88_000_000, stablecoin: true, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-fluid', symbol: 'USDC', project: 'fluid', chain: 'Base', apy: 31.6, apyBase: 19.1, apyReward: 12.5, apyPct7d: 1.6, tvlUsd: 42_000_000, stablecoin: true, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-sonne', symbol: 'WETH', project: 'sonne-finance', chain: 'Optimism', apy: 27.3, apyBase: 17.8, apyReward: 9.5, apyPct7d: 2.1, tvlUsd: 24_000_000, stablecoin: false, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-tarot', symbol: 'USDT', project: 'tarot', chain: 'Optimism', apy: 35.5, apyBase: 21.4, apyReward: 14.1, apyPct7d: 3.4, tvlUsd: 9_000_000, stablecoin: true, ilRisk: null, exposure: 'single', underlyingTokens: null, rewardTokens: null },
    { pool: 'pool-pancake', symbol: 'USDT-USDC', project: 'pancakeswap-v3', chain: 'BSC', apy: 22.7, apyBase: 7.9, apyReward: 14.8, apyPct7d: 1.4, tvlUsd: 165_000_000, stablecoin: true, ilRisk: 'YES', exposure: 'lp', underlyingTokens: null, rewardTokens: null },
  ]
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
  if (USE_E2E_MOCK_YIELDS) {
    return getE2EMockRawPools()
      .map(enrichPool)
      .sort((a, b) => b.capitalEfficiency - a.capitalEfficiency)
  }

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
