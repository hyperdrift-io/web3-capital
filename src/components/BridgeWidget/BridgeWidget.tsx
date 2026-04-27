'use client'

import { useEffect, useRef } from 'react'
import type { Chain } from '@wormhole-foundation/wormhole-connect'
import type { config as WormholeConnectConfigNS, WormholeConnectTheme } from '@wormhole-foundation/wormhole-connect'
import { BRIDGE_CHAINS, BRIDGE_RPCS, BRIDGE_TOKENS } from '@/lib/bridge'
import styles from './BridgeWidget.module.css'

type WormholeConnectConfig = WormholeConnectConfigNS.WormholeConnectConfig

// Use the official hosted loader from the package — this injects the pre-built
// Vite bundle directly from jsDelivr CDN as a native <script type="module">,
// bypassing webpack entirely. Config passes via window.__CONNECT_CONFIG.
// This avoids the SyntaxError/ChunkLoadError that occurs when webpack+terser
// tries to re-bundle the pre-built Vite output in production.
import { wormholeConnectHosted } from '@wormhole-foundation/wormhole-connect/hosted'

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

// ── Widget ────────────────────────────────────────────────────────────────────

/**
 * BridgeWidget — Wormhole Connect embedded via the official hosted loader.
 *
 * Instead of `dynamic(() => import(...))` (which routes the pre-built Vite
 * bundle through webpack/terser and produces corrupt chunks in production),
 * we use `wormholeConnectHosted()` from the package's `/hosted` export.
 * That function injects a `<script type="module">` pointing to the pre-built
 * bundle on jsDelivr CDN — webpack never touches the heavy widget code.
 *
 * Config is passed via window.__CONNECT_CONFIG / window.__CONNECT_THEME,
 * which the CDN bundle reads on startup.
 *
 * Token pre-fill strategy (v5 constraint):
 *   Setting the same symbol on both source and destination for non-native
 *   tokens triggers a v5 validation error that silently drops both.
 *   We set source.token always, and only set destination.token when it
 *   differs from source.token.
 */
export function BridgeWidget({
  targetChain = 'Arbitrum',
  sourceChain = 'Ethereum',
  sourceToken: _sourceToken = 'USDC',
  destToken,
}: BridgeWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mountedKeyRef = useRef<string | null>(null)

  // Only set destination.token when it differs from source token.
  const resolvedDestToken = destToken !== _sourceToken ? destToken : undefined
  const mountKey = `${sourceChain}|${targetChain}|${_sourceToken}|${resolvedDestToken ?? ''}`

  const config: WormholeConnectConfig = {
    network: 'Mainnet',
    chains:  BRIDGE_CHAINS,
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

  useEffect(() => {
    if (!containerRef.current) return
    if (mountedKeyRef.current === mountKey && containerRef.current.childElementCount > 0) return

    // Clear any previous widget mount (e.g. on hot-reload or prop change)
    containerRef.current.innerHTML = ''

    wormholeConnectHosted(containerRef.current, {
      config,
      theme,
      // Proxy the widget assets through our server so dynamic chunk imports
      // resolve against our origin instead of CDN — fixes 404 for /assets/*.js.
      // next.config.mjs rewrites /wh-connect/dist/* → jsDelivr CDN.
      cdnBaseUrl: '/wh-connect',
    })

    mountedKeyRef.current = mountKey
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mountKey])

  return (
    <div className={styles.wrapper} data-testid="bridge-widget">
      <div className={styles.mounted} ref={containerRef} />
    </div>
  )
}
