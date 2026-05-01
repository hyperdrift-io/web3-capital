import { describe, it, expect } from 'vitest'
import {
  buildAllocation,
  defaultBridgeDeployPool,
  pickBestPoolForBand,
} from '@/lib/routing'
import type { Pool } from '@/types/protocol'

function makePool(overrides: Partial<Pool> & Pick<Pool, 'pool' | 'band'>): Pool {
  return {
    symbol: 'USDC',
    project: 'aave-v3',
    chain: 'Ethereum',
    apy: 5,
    apyBase: 5,
    apyReward: null,
    apyPct7d: null,
    tvlUsd: 100_000_000,
    stablecoin: true,
    ilRisk: null,
    exposure: 'single',
    underlyingTokens: null,
    rewardTokens: null,
    safety: 80,
    capitalEfficiency: 70,
    apyOutlier: false,
    ...overrides,
  }
}

describe('pickBestPoolForBand', () => {
  it('prefers non-outlier pools when both match the band', () => {
    const sane = makePool({
      pool: 'sane',
      band: 'anchor',
      apyOutlier: false,
      capitalEfficiency: 65,
    })
    const spike = makePool({
      pool: 'spike',
      band: 'anchor',
      apyOutlier: true,
      capitalEfficiency: 95,
    })
    expect(pickBestPoolForBand('anchor', [spike, sane])?.pool).toBe('sane')
  })

  it('falls back to outlier-only band rather than returning null', () => {
    const only = makePool({
      pool: 'only',
      band: 'balanced',
      apyOutlier: true,
      capitalEfficiency: 80,
    })
    expect(pickBestPoolForBand('balanced', [only])?.pool).toBe('only')
  })
})

describe('buildAllocation', () => {
  it('does not pick an outlier when a sane pool exists in the same band', () => {
    const sane = makePool({
      pool: 'sane',
      band: 'anchor',
      apyOutlier: false,
      capitalEfficiency: 60,
    })
    const spike = makePool({
      pool: 'spike',
      band: 'anchor',
      apyOutlier: true,
      capitalEfficiency: 99,
    })
    const rows = buildAllocation(1_000, [spike, sane])
    expect(rows.find(r => r.band === 'anchor')?.pool?.pool).toBe('sane')
  })
})

describe('defaultBridgeDeployPool', () => {
  it('returns a pool from the fetched set', () => {
    const a = makePool({
      pool: 'a',
      band: 'anchor',
      chain: 'Base',
      capitalEfficiency: 72,
    })
    const b = makePool({
      pool: 'b',
      band: 'balanced',
      chain: 'Arbitrum',
      capitalEfficiency: 68,
    })
    const c = makePool({
      pool: 'c',
      band: 'opportunistic',
      chain: 'Optimism',
      capitalEfficiency: 55,
    })
    const chosen = defaultBridgeDeployPool([c, b, a])
    expect(chosen).not.toBeNull()
    expect(['a', 'b', 'c']).toContain(chosen!.pool)
  })
})
