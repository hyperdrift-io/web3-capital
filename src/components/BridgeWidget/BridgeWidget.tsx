'use client'

import dynamic from 'next/dynamic'
import type { Chain } from '@wormhole-foundation/wormhole-connect'
import type { config as WormholeConnectConfigNS, WormholeConnectTheme } from '@wormhole-foundation/wormhole-connect'
import { BRIDGE_CHAINS, BRIDGE_TOKENS, usdcTokenForChain } from '@/lib/bridge'
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
}

/**
 * BridgeWidget — Wormhole Connect embedded with opinionated defaults.
 *
 * Restrictions applied:
 *   - Only the five EVM chains where Capital Engine pools live (Ethereum,
 *     Arbitrum, Base, Optimism, Polygon).
 *   - Only stablecoin tokens (USDC + USDT variants).
 *   - Source defaults to USDC on Ethereum.
 *   - Destination pre-filled from the highest-CE-scored pool's chain.
 *
 * Why Wormhole:
 *   - Supports CCTP (Circle's native USDC burn-and-mint): zero slippage,
 *     no wrapped tokens, instant finality on most lanes.
 *   - Works on all five chains in our set.
 *   - Embeddable React component — no iframe, no redirect.
 */
export function BridgeWidget({ targetChain = 'Arbitrum', sourceChain = 'Ethereum' }: BridgeWidgetProps) {
  const sourceToken = usdcTokenForChain(sourceChain)
  const destToken = usdcTokenForChain(targetChain)

  const config: WormholeConnectConfig = {
    network: 'Mainnet',
    chains:  BRIDGE_CHAINS,
    tokens:  [...BRIDGE_TOKENS],
    ui: {
      defaultInputs: {
        source:      { chain: sourceChain, token: sourceToken },
        destination: { chain: targetChain, token: destToken },
      },
      showFooter:          false,
      disableUserInputtedTokens: true,
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
      <WormholeConnect config={config} theme={theme} />
    </div>
  )
}
