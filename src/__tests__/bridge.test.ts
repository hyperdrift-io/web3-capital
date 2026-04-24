import { describe, it, expect } from 'vitest'
import {
  defiLlamaChainToWormhole,
  usdcTokenForChain,
  BRIDGE_CHAINS,
  BRIDGE_TOKENS,
  DEFI_LLAMA_TO_WORMHOLE,
} from '@/lib/bridge'

// ─── defiLlamaChainToWormhole ─────────────────────────────────────────────────

describe('defiLlamaChainToWormhole', () => {
  it('maps Ethereum → Ethereum', () => {
    expect(defiLlamaChainToWormhole('Ethereum')).toBe('Ethereum')
  })

  it('maps Arbitrum → Arbitrum', () => {
    expect(defiLlamaChainToWormhole('Arbitrum')).toBe('Arbitrum')
  })

  it('maps Base → Base', () => {
    expect(defiLlamaChainToWormhole('Base')).toBe('Base')
  })

  it('maps Optimism → Optimism', () => {
    expect(defiLlamaChainToWormhole('Optimism')).toBe('Optimism')
  })

  it('maps Polygon → Polygon', () => {
    expect(defiLlamaChainToWormhole('Polygon')).toBe('Polygon')
  })

  it('maps Solana → Solana (EVM ↔ Solana via Wormhole NTT)', () => {
    expect(defiLlamaChainToWormhole('Solana')).toBe('Solana')
  })

  it('returns null for unsupported chains', () => {
    expect(defiLlamaChainToWormhole('Avalanche')).toBeNull()
    expect(defiLlamaChainToWormhole('BSC')).toBeNull()
    expect(defiLlamaChainToWormhole('')).toBeNull()
  })
})

// ─── usdcTokenForChain ────────────────────────────────────────────────────────

describe('usdcTokenForChain', () => {
  it('returns USDCeth for Ethereum', () => {
    expect(usdcTokenForChain('Ethereum')).toBe('USDCeth')
  })

  it('returns USDCarb for Arbitrum', () => {
    expect(usdcTokenForChain('Arbitrum')).toBe('USDCarb')
  })

  it('returns USDCbase for Base', () => {
    expect(usdcTokenForChain('Base')).toBe('USDCbase')
  })

  it('returns USDCop for Optimism', () => {
    expect(usdcTokenForChain('Optimism')).toBe('USDCop')
  })

  it('returns USDCpolygon for Polygon', () => {
    expect(usdcTokenForChain('Polygon')).toBe('USDCpolygon')
  })

  it('returns USDCsol for Solana', () => {
    expect(usdcTokenForChain('Solana')).toBe('USDCsol')
  })

  it('falls back to USDC for unknown chains', () => {
    expect(usdcTokenForChain('Avalanche')).toBe('USDC')
  })
})

// ─── BRIDGE_CHAINS ────────────────────────────────────────────────────────────

describe('BRIDGE_CHAINS', () => {
  it('contains the five EVM chains plus Solana', () => {
    expect(BRIDGE_CHAINS).toHaveLength(6)
    expect(BRIDGE_CHAINS).toContain('Ethereum')
    expect(BRIDGE_CHAINS).toContain('Arbitrum')
    expect(BRIDGE_CHAINS).toContain('Base')
    expect(BRIDGE_CHAINS).toContain('Optimism')
    expect(BRIDGE_CHAINS).toContain('Polygon')
    expect(BRIDGE_CHAINS).toContain('Solana')
  })

  it('does not include unsupported chains', () => {
    expect(BRIDGE_CHAINS).not.toContain('Sui')
    expect(BRIDGE_CHAINS).not.toContain('Avalanche')
  })
})

// ─── BRIDGE_TOKENS ────────────────────────────────────────────────────────────

describe('BRIDGE_TOKENS', () => {
  it('covers USDC variants for all supported chains including Solana', () => {
    expect(BRIDGE_TOKENS).toContain('USDCeth')
    expect(BRIDGE_TOKENS).toContain('USDCarb')
    expect(BRIDGE_TOKENS).toContain('USDCbase')
    expect(BRIDGE_TOKENS).toContain('USDCop')
    expect(BRIDGE_TOKENS).toContain('USDCpolygon')
    expect(BRIDGE_TOKENS).toContain('USDCsol')
  })

  it('includes USDT for mainnet stablecoin flows', () => {
    expect(BRIDGE_TOKENS).toContain('USDT')
    expect(BRIDGE_TOKENS).toContain('USDTeth')
  })

  it('only contains stablecoin identifiers — no volatile tokens', () => {
    for (const token of BRIDGE_TOKENS) {
      expect(token.toLowerCase()).toMatch(/usdc|usdt/)
    }
  })
})

// ─── DEFI_LLAMA_TO_WORMHOLE map consistency ───────────────────────────────────

describe('DEFI_LLAMA_TO_WORMHOLE', () => {
  it('covers the same chains as BRIDGE_CHAINS', () => {
    const mapped = Object.values(DEFI_LLAMA_TO_WORMHOLE)
    for (const chain of BRIDGE_CHAINS) {
      expect(mapped).toContain(chain)
    }
  })

  it('maps are bijective within supported set', () => {
    const values = Object.values(DEFI_LLAMA_TO_WORMHOLE)
    const unique  = new Set(values)
    // Each DeFi Llama name maps to a distinct Wormhole chain
    expect(values.length).toBe(unique.size)
  })
})
