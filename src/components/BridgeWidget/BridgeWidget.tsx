'use client'

import { Component, type ReactNode } from 'react'
import dynamic from 'next/dynamic'
import type { Chain } from '@wormhole-foundation/wormhole-connect'
import type { config as WormholeConnectConfigNS, WormholeConnectTheme } from '@wormhole-foundation/wormhole-connect'
import { BRIDGE_CHAINS, BRIDGE_RPCS, BRIDGE_TOKENS } from '@/lib/bridge'
import styles from './BridgeWidget.module.css'

type WormholeConnectConfig = WormholeConnectConfigNS.WormholeConnectConfig

// Lazy-load the heavy Wormhole Connect bundle — it's only needed when the
// user actually opens the bridge panel.
const WormholeConnect = dynamic(
  () => import('@wormhole-foundation/wormhole-connect'),
  {
    ssr: false,
    loading: () => <div className={styles.loading}>Loading bridge…</div>,
  },
)

export type BridgeWidgetProps = {
  /** Pre-selected destination chain (from CE score best pool). */
  targetChain?: Chain
  /** Source chain — defaults to Ethereum. */
  sourceChain?: Chain
  /**
   * Pre-selected source token (Wormhole Connect v5 symbol string).
   * Defaults to 'USDC'. Use tokenForPoolSymbol() to derive from pool data.
   */
  sourceToken?: string
  /**
   * Pre-selected destination token (Wormhole Connect v5 symbol string).
   * Defaults to match sourceToken so the user sees a sensible pre-fill.
   */
  destToken?: string
}

// ── Error boundary ────────────────────────────────────────────────────────────

type EBState = { hasError: boolean }

class BridgeErrorBoundary extends Component<{ children: ReactNode }, EBState> {
  state: EBState = { hasError: false }

  static getDerivedStateFromError(): EBState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorFallback}>
          <p>The bridge widget failed to load.</p>
          <a
            href="https://portalbridge.com"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.fallbackLink}
          >
            Open Portal Bridge →
          </a>
        </div>
      )
    }
    return this.props.children
  }
}

// ── Widget ────────────────────────────────────────────────────────────────────

/**
 * BridgeWidget — Wormhole Connect embedded with opinionated defaults.
 *
 * Token IDs use Wormhole Connect v5 symbol strings (e.g. "USDC", "WETH")
 * rather than legacy per-chain IDs ("USDCeth", "WETHarb"). The v5 widget
 * resolves chain-specific contract addresses internally.
 *
 * Token pre-fill strategy (v5 constraint):
 *   The v5 widget validates `defaultInputs.token` against its token store.
 *   Setting the same symbol on both source and destination for non-native
 *   tokens (e.g. source.token=USDC + destination.token=USDC) triggers a
 *   validation error and silently drops both. We therefore always set
 *   source.token (fixes the "Can't call setAmount without a fromChain and
 *   token" warning), and only set destination.token when it differs from
 *   source.token. For the USDC→USDC demo flow this means dest.token is
 *   omitted — the user lands with source pre-filled and confirms dest.
 *
 * Restrictions applied:
 *   - EVM chains where Capital Engine pools live, excluding BNB/BSC (see chain note).
 *   - Full token whitelist: ETH, WETH, USDC, USDT, WBTC, wstETH, DAI.
 *   - Source chain defaults to Ethereum; destination from highest-CE pool.
 *   - Destination token pre-filled from the pool's inferred asset.
 *
 * Why Wormhole:
 *   - Supports CCTP (Circle's native USDC burn-and-mint): zero slippage,
 *     no wrapped tokens, instant finality on most lanes.
 *   - Works across all enabled chains in our set.
 *   - Embeddable React component — no iframe, no redirect.
 */
export function BridgeWidget({
  targetChain = 'Arbitrum',
  sourceChain = 'Ethereum',
  sourceToken: _sourceToken = 'USDC',
  destToken,
}: BridgeWidgetProps) {
  // Only set destination.token when it differs from source token.
  // Setting the same non-native symbol on both source and destination triggers
  // a v5 validation error that silently drops both pre-fills. For USDC→USDC
  // (our primary demo flow) we pre-fill only the source so the widget
  // initialises with fromChain+token set — this eliminates the
  // "Can't call setAmount without a fromChain and token" console warning.
  const resolvedDestToken = destToken !== _sourceToken ? destToken : undefined

  // Exclude Bsc/BNB from the bridge widget: Wormhole fetches CoinGecko prices
  // for every whitelisted token on the selected chain. With BSC selected,
  // the free-tier API returns 400 for multi-contract requests (limit = 1),
  // which blocks routing/confirm state. Capital Engine's primary flows are
  // ETH-ecosystem only; users needing BSC can use portalbridge.com directly.
  const widgetChains = BRIDGE_CHAINS.filter(c => c !== 'Bsc')

  const config: WormholeConnectConfig = {
    network: 'Mainnet',
    chains:  widgetChains,
    rpcs:    BRIDGE_RPCS,
    tokens:  [...BRIDGE_TOKENS],
    ui: {
      defaultInputs: {
        source:      { chain: sourceChain, token: _sourceToken },
        destination: { chain: targetChain, token: resolvedDestToken },
      },
      showFooter: false,
    },
  }

  const theme: WormholeConnectTheme = {
    mode:            'dark',
    background:      '#141720',
    formBackground:  '#1c2030',
    formBorder:      '#252a3a',
    input:           '#212640',
    primary:         '#4f8ef7',
    secondary:       '#3ecf8e',
    text:            '#e8eaf0',
    textSecondary:   '#8b91a8',
    font:            'var(--font-sans, Inter, sans-serif)',
  }

  return (
    <div className={styles.wrapper} data-testid="bridge-widget">
      <BridgeErrorBoundary>
        <WormholeConnect config={config} theme={theme} />
      </BridgeErrorBoundary>
    </div>
  )
}
