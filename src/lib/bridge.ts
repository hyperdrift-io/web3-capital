/**
 * Wormhole Connect bridge configuration utilities.
 *
 * Maps DeFi Llama chain names → Wormhole SDK Chain names and provides
 * the opinionated config used by the BridgeWidget.
 *
 * Supported flow: ETH, WETH, stablecoins (USDC/USDT), WBTC, wstETH, and DAI
 * across six EVM chains (incl. BNB) and Solana, covering the assets that Capital Engine's
 * top-ranked pools actually require. The bridge token is inferred from the
 * pool's symbol so the widget is pre-filled with exactly what the user needs.
 *
 * Token IDs use Wormhole Connect v5 symbol strings (not the legacy v4 per-chain
 * IDs such as "USDCeth"). In v5 the symbol alone (e.g. "USDC") identifies the
 * token; the widget resolves the chain-specific contract address internally.
 *
 * Solana is included because Wormhole's NTT (Native Token Transfers) enables
 * genuine EVM ↔ Solana USDC movement without wrapped tokens — the same
 * primitive that powers Sunrise (sunrisedefi.com), Wormhole Labs' Solana
 * asset gateway.
 */

import type { Chain } from '@wormhole-foundation/wormhole-connect'

// ── Chain mapping ─────────────────────────────────────────────────────────────

/**
 * DeFi Llama chain name → Wormhole SDK Chain name.
 * Covers six EVM chains (incl. BNB / Binance Smart Chain) plus Solana (via Wormhole NTT).
 */
export const DEFI_LLAMA_TO_WORMHOLE: Record<string, Chain> = {
  Ethereum: 'Ethereum',
  Arbitrum: 'Arbitrum',
  Base:     'Base',
  Optimism: 'Optimism',
  Polygon:  'Polygon',
  BSC:      'Bsc',
  Solana:   'Solana',
}

/** Wormhole Chain names available in the bridge widget. */
export const BRIDGE_CHAINS: Chain[] = [
  'Ethereum',
  'Arbitrum',
  'Base',
  'Optimism',
  'Polygon',
  'Bsc',
  'Solana',
]

/**
 * Wormhole Connect RPC overrides.
 *
 * Some wallet/network presets still ship with deprecated BSC endpoints
 * (e.g. bscrpc.com) that now require API keys. Force a stable public RPC.
 */
export const BRIDGE_RPCS: Partial<Record<Chain, string>> = {
  Bsc: 'https://bsc-dataseed.binance.org',
}

// ── Token identifiers (Wormhole Connect v5 symbol strings) ───────────────────

/**
 * Wormhole Connect v5 token symbol strings for the bridge allowlist.
 *
 * In v5, tokens are identified by symbol (not per-chain IDs like "USDCeth").
 * The widget resolves chain-specific contract addresses internally.
 * When a `tokens` whitelist is provided, user-inputted token addresses are
 * automatically disabled (no need to set `disableUserInputtedTokens`).
 */
export const BRIDGE_TOKENS = [
  'ETH',     // Native ETH (Ethereum, Arbitrum, Base, Optimism)
  'WETH',    // Wrapped ETH
  'USDC',    // Circle USD
  'USDT',    // Tether USD
  'WBTC',    // Wrapped Bitcoin
  'wstETH',  // Lido wrapped staked ETH
  'DAI',     // MakerDAO DAI
] as const

export type BridgeToken = (typeof BRIDGE_TOKENS)[number]

// ── Chain helpers ─────────────────────────────────────────────────────────────

/**
 * Convert a DeFi Llama pool chain name to the Wormhole SDK Chain name.
 * Returns null if the chain is not in the supported set.
 */
export function defiLlamaChainToWormhole(chain: string): Chain | null {
  return DEFI_LLAMA_TO_WORMHOLE[chain] ?? null
}

/**
 * Infer the best bridge token symbol from a DeFi Llama pool symbol string.
 *
 * Examples:
 *   "WETH"       → "WETH"
 *   "USDC"       → "USDC"
 *   "wstETH-ETH" → "wstETH"
 *   "WBTC"       → "WBTC"
 *   "crvUSD"     → "USDC"   (unknown stablecoin → default USDC)
 *   "USDe"       → "USDC"   (synthetic stable → default USDC)
 */
/**
 * Return a human-readable note when the pool symbol is a vault or LP receipt
 * token rather than a directly bridgeable asset.
 *
 * Returns null when the pool symbol itself matches the bridge token (e.g. a
 * plain USDC or WETH pool — no explanation needed).
 *
 * Examples:
 *   STEAKUSDC / morpho-blue → "STEAKUSDC is a Morpho Blue vault token — bridge USDC …"
 *   WETH-USDC  / uniswap-v3 → "WETH-USDC is a Uniswap LP token — bridge USDC …"
 *   USDC       / aave-v3    → null (direct match, no note needed)
 */
export function vaultTokenNote(
  poolSymbol: string,
  bridgeToken: BridgeToken,
  project: string,
): string | null {
  const s = poolSymbol.toUpperCase()
  const b = bridgeToken.toUpperCase()
  // Exact match → no note needed
  if (s === b) return null
  // LP token heuristic (contains '-')
  if (poolSymbol.includes('-')) {
    return `${poolSymbol} is an LP token — bridge ${bridgeToken} first, then provide liquidity in ${project} to receive the LP position.`
  }
  // Vault receipt token (e.g. STEAKUSDC, aUSDC, cUSDC)
  return `${poolSymbol} is a vault receipt token — bridge ${bridgeToken} to this chain, then deposit it into ${project} to receive ${poolSymbol}.`
}

export function tokenForPoolSymbol(poolSymbol: string): BridgeToken {
  const s = poolSymbol.toUpperCase()
  // BTC / liquid BTC — most distinctive
  if (s.includes('WBTC') || s === 'BTC') return 'WBTC'
  // Liquid staked ETH — matches before plain ETH
  if (s.includes('WSTETH') || s.includes('STETH')) return 'wstETH'
  // Stablecoins — prefer USDC (CCTP: native burn-and-mint, no slippage) over ETH
  // when a pool contains both (e.g. "USDC-WETH")
  if (s.includes('USDC')) return 'USDC'
  if (s.includes('USDT')) return 'USDT'
  if (s.includes('DAI')) return 'DAI'
  // Plain ETH / WETH pools
  if (s.includes('WETH') || s === 'ETH' || s.match(/\bETH\b/)) return 'WETH'
  // Default to USDC for any unknown or synthetic stablecoin pool
  return 'USDC'
}
