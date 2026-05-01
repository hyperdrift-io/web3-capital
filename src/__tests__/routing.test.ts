import { describe, it, expect } from 'vitest'
import {
  buildAllocation,
  buildBridgeRouteIntent,
  buildRouteIntent,
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

describe('route intents', () => {
  it('does not build symbol-only DEX routes for unknown vault receipts', () => {
    const vaultReceipt = makePool({
      pool: 'steak',
      band: 'anchor',
      symbol: 'STEAKUSDC',
      project: 'morpho-blue',
      chain: 'Base',
      underlyingTokens: ['0x1111111111111111111111111111111111111111'],
    })

    expect(buildRouteIntent(vaultReceipt)).toBeNull()
    expect(buildBridgeRouteIntent(vaultReceipt, 'USDC')).toBeNull()
  })

  it('builds routes only when the target token has a known chain address', () => {
    const usdc = makePool({
      pool: 'usdc',
      band: 'anchor',
      chain: 'Base',
      underlyingTokens: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
    })

    expect(buildRouteIntent(usdc)).not.toBeNull()
    expect(buildBridgeRouteIntent(usdc, 'USDC')).not.toBeNull()
  })

  it('routes LP pools into the non-source pair leg on 1inch', () => {
    const wethUsdc = makePool({
      pool: 'weth-usdc',
      band: 'opportunistic',
      symbol: 'WETH-USDC',
      project: 'uniswap-v3',
      chain: 'Base',
      exposure: 'multi',
      ilRisk: 'YES',
      underlyingTokens: [
        '0x4200000000000000000000000000000000000006',
        '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      ],
    })

    expect(buildRouteIntent(wethUsdc)?.url).toBe('https://1inch.com/swap?src=8453%3AUSDC&dst=8453%3AWETH')
  })

  it('does not send unknown protocols to Aave for same-token LP routes', () => {
    const stableLp = makePool({
      pool: 'stable-lp',
      band: 'balanced',
      symbol: 'USDC-UNKNOWN',
      project: 'uniswap-v3',
      chain: 'Base',
      underlyingTokens: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
    })

    expect(buildRouteIntent(stableLp)).toBeNull()
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

  it('skips pools that cannot produce a post-bridge route', () => {
    const unrouteable = makePool({
      pool: 'steak',
      band: 'anchor',
      symbol: 'STEAKUSDC',
      project: 'morpho-blue',
      chain: 'Base',
      capitalEfficiency: 95,
      safety: 95,
      underlyingTokens: ['0x1111111111111111111111111111111111111111'],
    })
    const routeable = makePool({
      pool: 'usdc',
      band: 'balanced',
      symbol: 'USDC',
      project: 'aave-v3',
      chain: 'Base',
      capitalEfficiency: 60,
      underlyingTokens: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
    })

    expect(defaultBridgeDeployPool([unrouteable, routeable])?.pool).toBe('usdc')
  })
})
