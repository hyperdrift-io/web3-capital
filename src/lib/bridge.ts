/**
 * Wormhole Connect bridge configuration utilities.
 *
 * Maps DeFi Llama chain names → Wormhole SDK Chain names and provides
 * the opinionated config used by the BridgeWidget.
 *
 * Supported flow: stablecoins (USDC/USDT) on the five EVM chains where
 * Capital Engine's top pools live.  The user is never shown chains or
 * tokens outside this set, so the widget stays minimal and purposeful.
 */

import type { Chain } from '@wormhole-foundation/wormhole-connect'

// ── Chain mapping ─────────────────────────────────────────────────────────────

/**
 * DeFi Llama chain name → Wormhole SDK Chain name.
 * Only the five chains supported by the bridge widget are included.
 */
export const DEFI_LLAMA_TO_WORMHOLE: Record<string, Chain> = {
  Ethereum: 'Ethereum',
  Arbitrum: 'Arbitrum',
  Base:     'Base',
  Optimism: 'Optimism',
  Polygon:  'Polygon',
}

/** Wormhole Chain names available in the bridge widget. */
export const BRIDGE_CHAINS: Chain[] = [
  'Ethereum',
  'Arbitrum',
  'Base',
  'Optimism',
  'Polygon',
]

// ── Token identifiers ─────────────────────────────────────────────────────────

/**
 * Wormhole Connect token identifiers for stablecoins across supported chains.
 * These string keys are used in `WormholeConnectConfig.tokens`.
 */
export const BRIDGE_TOKENS = [
  'USDC',
  'USDCeth',
  'USDCarb',
  'USDCbase',
  'USDCop',
  'USDCpolygon',
  'USDT',
  'USDTeth',
] as const

// ── Chain helpers ─────────────────────────────────────────────────────────────

/**
 * Convert a DeFi Llama pool chain name to the Wormhole SDK Chain name.
 * Returns null if the chain is not in the supported set.
 */
export function defiLlamaChainToWormhole(chain: string): Chain | null {
  return DEFI_LLAMA_TO_WORMHOLE[chain] ?? null
}

/**
 * Return the USDC token identifier for a given Wormhole chain name.
 * Used to pre-select the destination token when the target chain is known.
 */
export function usdcTokenForChain(chain: Chain): string {
  const map: Partial<Record<Chain, string>> = {
    Ethereum: 'USDCeth',
    Arbitrum: 'USDCarb',
    Base:     'USDCbase',
    Optimism: 'USDCop',
    Polygon:  'USDCpolygon',
  }
  return map[chain] ?? 'USDC'
}
