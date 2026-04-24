import { describe, it, expect } from 'vitest'
import {
  defiLlamaChainToWormhole,
  tokenForPoolSymbol,
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

// ─── tokenForPoolSymbol ───────────────────────────────────────────────────────

describe('tokenForPoolSymbol', () => {
  it('returns WBTC for WBTC pools', () => {
    expect(tokenForPoolSymbol('WBTC')).toBe('WBTC')
    expect(tokenForPoolSymbol('WBTC-ETH')).toBe('WBTC')
  })

  it('returns wstETH for staked ETH pools', () => {
    expect(tokenForPoolSymbol('wstETH')).toBe('wstETH')
    expect(tokenForPoolSymbol('wstETH-ETH')).toBe('wstETH')
    expect(tokenForPoolSymbol('stETH')).toBe('wstETH')
  })

  it('returns WETH for ETH pools (unless stablecoin is also present)', () => {
    expect(tokenForPoolSymbol('WETH')).toBe('WETH')
    // WETH-USDC → USDC wins (CCTP preferred for mixed pools)
    expect(tokenForPoolSymbol('WETH-USDC')).toBe('USDC')
    expect(tokenForPoolSymbol('ETH')).toBe('WETH')
    // Pure WETH pools
    expect(tokenForPoolSymbol('WETH-DAI')).toBe('DAI')
  })

  it('returns USDT for USDT pools (unless USDC is also present)', () => {
    expect(tokenForPoolSymbol('USDT')).toBe('USDT')
    // USDT-USDC → USDC wins (CCTP preferred)
    expect(tokenForPoolSymbol('USDT-USDC')).toBe('USDC')
  })

  it('returns DAI for pure DAI pools', () => {
    expect(tokenForPoolSymbol('DAI')).toBe('DAI')
    // DAI-USDC → USDC wins (CCTP is better than bridging DAI)
    expect(tokenForPoolSymbol('DAI-USDC')).toBe('USDC')
  })

  it('returns USDC for USDC pools (CCTP preferred over other tokens)', () => {
    expect(tokenForPoolSymbol('USDC')).toBe('USDC')
    expect(tokenForPoolSymbol('USDC-WETH')).toBe('USDC')
  })

  it('defaults to USDC for unknown or synthetic stablecoin pools', () => {
    expect(tokenForPoolSymbol('crvUSD')).toBe('USDC')
    expect(tokenForPoolSymbol('USDe')).toBe('USDC')
    expect(tokenForPoolSymbol('GHO')).toBe('USDC')
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
  it('uses v5 symbol strings (not legacy per-chain suffixed IDs)', () => {
    // v5 format: clean symbol strings — no "USDCeth", "USDCarb", "USDCsol", etc.
    // Note: "ETH" and "wstETH" are valid v5 symbols (they END in ETH as a name, not a chain suffix).
    const legacyChainSuffixedIds = ['USDCeth', 'USDCarb', 'USDCbase', 'USDCop', 'USDCpolygon', 'USDCsol', 'USDTeth']
    for (const token of BRIDGE_TOKENS) {
      expect(legacyChainSuffixedIds).not.toContain(token)
    }
  })

  it('includes stablecoins', () => {
    expect(BRIDGE_TOKENS).toContain('USDC')
    expect(BRIDGE_TOKENS).toContain('USDT')
    expect(BRIDGE_TOKENS).toContain('DAI')
  })

  it('includes ETH variants for yield pools that hold ETH', () => {
    expect(BRIDGE_TOKENS).toContain('ETH')
    expect(BRIDGE_TOKENS).toContain('WETH')
  })

  it('includes BTC and liquid staking tokens for high-CE pools', () => {
    expect(BRIDGE_TOKENS).toContain('WBTC')
    expect(BRIDGE_TOKENS).toContain('wstETH')
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
