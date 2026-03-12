import { describe, it, expect } from 'vitest'
import { safetyScore, capitalEfficiency, allocationBand, type RawPool } from '@/lib/defillama'

function pool(overrides: Partial<RawPool> = {}): RawPool {
  return {
    pool: 'test-pool-id',
    symbol: 'USDC',
    project: 'unknown-protocol',
    chain: 'Ethereum',
    apy: 5,
    apyBase: 5,
    apyReward: null,
    apyPct7d: null,
    tvlUsd: 50_000_000,
    stablecoin: false,
    ilRisk: null,
    exposure: null,
    underlyingTokens: null,
    rewardTokens: null,
    ...overrides,
  }
}

// ─── safetyScore ──────────────────────────────────────────────────────────────

describe('safetyScore', () => {
  it('starts at 50 for an unknown protocol with mid-range TVL', () => {
    // Unknown protocol, $50M TVL (no bonus), no IL, no exposure signal
    expect(safetyScore(pool())).toBe(55) // 50 base + 5 for $10M-$1B TVL range
  })

  it('adds 30 for Tier-1 protocols', () => {
    const base = safetyScore(pool({ project: 'unknown-protocol' }))
    const tier1 = safetyScore(pool({ project: 'aave-v3' }))
    expect(tier1 - base).toBe(30)
  })

  it('adds 15 for Tier-2 protocols', () => {
    const base = safetyScore(pool({ project: 'unknown-protocol' }))
    const tier2 = safetyScore(pool({ project: 'balancer' }))
    expect(tier2 - base).toBe(15)
  })

  it('awards 15 bonus for $100M+ TVL, not 5 for $10M+', () => {
    const mid  = safetyScore(pool({ tvlUsd: 50_000_000 }))   // 5 bonus
    const big  = safetyScore(pool({ tvlUsd: 200_000_000 }))  // 10 bonus
    const huge = safetyScore(pool({ tvlUsd: 1_500_000_000 })) // 15 bonus
    expect(big - mid).toBe(5)
    expect(huge - mid).toBe(10)
  })

  it('penalises low TVL (<$1M) by -10', () => {
    const mid  = safetyScore(pool({ tvlUsd: 50_000_000 }))
    const tiny = safetyScore(pool({ tvlUsd: 500_000 }))
    expect(mid - tiny).toBe(15) // 5 bonus vs -10 penalty
  })

  it('penalises IL risk by -10', () => {
    const noIl = safetyScore(pool({ ilRisk: 'NO' }))
    const withIl = safetyScore(pool({ ilRisk: 'YES' }))
    expect(noIl - withIl).toBe(10)
  })

  it('rewards single-asset exposure by +5', () => {
    const multi  = safetyScore(pool({ exposure: 'multi' }))
    const single = safetyScore(pool({ exposure: 'single' }))
    expect(single - multi).toBe(5)
  })

  it('rewards stablecoins by +5', () => {
    const volatile = safetyScore(pool({ stablecoin: false }))
    const stable   = safetyScore(pool({ stablecoin: true }))
    expect(stable - volatile).toBe(5)
  })

  it('penalises reward-only APY (mercenary liquidity) by -10', () => {
    const organic = safetyScore(pool({ apyBase: 5, apyReward: 0 }))
    const mercenary = safetyScore(pool({ apyBase: 0, apyReward: 5 }))
    expect(organic - mercenary).toBe(10)
  })

  it('is capped at 100 — max score combination does not overflow', () => {
    const maxPool = pool({
      project: 'aave-v3',      // +30
      tvlUsd: 2_000_000_000,   // +15
      stablecoin: true,        // +5
      exposure: 'single',      // +5
      ilRisk: 'NO',
      apyBase: 5,
      apyReward: 0,
    })
    // 50 + 30 + 15 + 5 + 5 = 105 → clamped to 100
    expect(safetyScore(maxPool)).toBe(100)
  })

  it('does not go below 0 — worst case combination', () => {
    const worstPool = pool({
      project: 'completely-unknown',
      tvlUsd: 100_000,   // -10
      ilRisk: 'YES',     // -10
      apyBase: 0,
      apyReward: 20,     // -10
    })
    // 50 - 10 - 10 - 10 = 20 (doesn't hit floor here)
    // But the floor guard shouldn't allow < 0 in any contrived case
    expect(safetyScore(worstPool)).toBeGreaterThanOrEqual(0)
  })
})

// ─── allocationBand ───────────────────────────────────────────────────────────

describe('allocationBand', () => {
  it('anchor: safety >= 75 AND apy <= 12', () => {
    expect(allocationBand(75, 12)).toBe('anchor')
    expect(allocationBand(100, 5)).toBe('anchor')
  })

  it('drops to balanced when safety is exactly 74 (just below anchor threshold)', () => {
    expect(allocationBand(74, 12)).toBe('balanced')
  })

  it('drops to balanced when APY is exactly 12.01 (just above anchor APY cap)', () => {
    expect(allocationBand(75, 12.01)).toBe('balanced')
  })

  it('balanced: safety >= 55 AND apy <= 25', () => {
    expect(allocationBand(55, 25)).toBe('balanced')
    expect(allocationBand(70, 20)).toBe('balanced')
  })

  it('opportunistic: catches anything that missed anchor and balanced', () => {
    expect(allocationBand(54, 10)).toBe('opportunistic') // safety too low
    expect(allocationBand(60, 26)).toBe('opportunistic') // APY too high
    expect(allocationBand(30, 50)).toBe('opportunistic') // both off
  })

  it('high-APY tier-1 protocol still lands in opportunistic (yield > safety bands)', () => {
    // safety=80, apy=40 — high quality protocol but APY screams leverage/risk
    expect(allocationBand(80, 40)).toBe('opportunistic')
  })
})

// ─── capitalEfficiency ────────────────────────────────────────────────────────

describe('capitalEfficiency', () => {
  it('APY component is capped at 30% — a 60% APY pool scores same as 30%', () => {
    const p30 = pool({ apy: 30, tvlUsd: 100_000_000 })
    const p60 = pool({ apy: 60, tvlUsd: 100_000_000 })
    const safety = 70

    expect(capitalEfficiency(p30, safety)).toBe(capitalEfficiency(p60, safety))
  })

  it('TVL contributes up to 15% of score, saturating at $500M', () => {
    const lowTvl  = pool({ apy: 5, tvlUsd: 1_000_000 })
    const highTvl = pool({ apy: 5, tvlUsd: 500_000_000 })
    const safety = 70

    const ceHigh = capitalEfficiency(highTvl, safety)
    const ceLow  = capitalEfficiency(lowTvl, safety)

    // Difference should be close to 15 (the full TVL weight)
    expect(ceHigh - ceLow).toBeCloseTo(15, 0)
  })

  it('safety score dominates at 45% weight — doubling safety matters more than doubling TVL', () => {
    const base   = capitalEfficiency(pool({ apy: 5, tvlUsd: 50_000_000 }), 50)
    const moreTvl = capitalEfficiency(pool({ apy: 5, tvlUsd: 500_000_000 }), 50)
    const moreSafe = capitalEfficiency(pool({ apy: 5, tvlUsd: 50_000_000 }), 100)

    expect(moreSafe - base).toBeGreaterThan(moreTvl - base)
  })

  it('result is always an integer (Math.round applied)', () => {
    const ce = capitalEfficiency(pool({ apy: 7.3, tvlUsd: 123_456_789 }), 67)
    expect(Number.isInteger(ce)).toBe(true)
  })
})
