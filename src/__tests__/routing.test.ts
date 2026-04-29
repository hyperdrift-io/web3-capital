import { describe, expect, it } from 'vitest'
import { buildAllocation, VAULT_PREFIXES } from '@/lib/routing'
import type { Pool } from '@/types/protocol'

function makePool(overrides: Partial<Pool>): Pool {
  return {
    pool: 'pool-id',
    symbol: 'USDC',
    project: 'Morpho',
    chain: 'Ethereum',
    apy: 5,
    apyBase: 5,
    apyReward: null,
    tvlUsd: 1_000_000,
    stablecoin: true,
    ilRisk: 'NO',
    exposure: 'single',
    underlyingTokens: null,
    rewardTokens: null,
    apyPct7d: null,
    safety: 80,
    capitalEfficiency: 80,
    band: 'anchor',
    ...overrides,
  }
}

describe('buildAllocation', () => {
  it('uses VAULT_PREFIXES when matching preferred tokens against vault symbols', () => {
    for (const prefix of VAULT_PREFIXES) {
      const fallbackPool = makePool({
        pool: `fallback-${prefix}`,
        symbol: 'WETH',
        capitalEfficiency: 95,
      })
      const preferredVaultPool = makePool({
        pool: `preferred-${prefix}`,
        symbol: `${prefix}USDC`,
        capitalEfficiency: 75,
      })

      const [allocation] = buildAllocation(1_000, [fallbackPool, preferredVaultPool], undefined, ['USDC'])

      expect(allocation.pool).toBe(preferredVaultPool)
    }
  })
})
