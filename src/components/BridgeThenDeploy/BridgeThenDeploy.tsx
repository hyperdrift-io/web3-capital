'use client'

import { useState } from 'react'
import type { Pool } from '@/types/protocol'
import { defiLlamaChainToWormhole, tokenForPoolSymbol, vaultTokenNote } from '@/lib/bridge'
import { buildBridgeRouteIntent } from '@/lib/routing'
import { BridgeWidget } from '@/components/BridgeWidget/BridgeWidget'
import { RouteButton } from '@/components/RouteButton/RouteButton'
import { formatApy } from '@/lib/format'
import { CEScoreBreakdown } from '@/components/CEScoreBreakdown/CEScoreBreakdown'
import { NETWORK_ICON } from '@/lib/chainIcons'
import { NetworkEthereum } from '@web3icons/react'
import styles from './BridgeThenDeploy.module.css'

type Props = {
  /**
   * The top anchor pool — used to determine the best target chain and show
   * the deployment opportunity that justifies the bridge.
   */
  topPool: Pool | null
}

/**
 * BridgeThenDeploy — "bridge first, then deploy" narrative.
 *
 * Shows the user the single most compelling DeFi opportunity (the top
 * anchor pool by CE score), the chain it lives on, and embeds the Wormhole
 * Connect widget pre-configured to move stablecoins there.
 *
 * UX principle: the user never has to think about bridging as a separate
 * step.  The narrative is:
 *   1. Here is the best yield: [pool] on [chain]
 *   2. Your USDC is on Ethereum — bridge it to [chain] in one step
 *   3. Then deposit (routing button pre-fills 1inch / Aave)
 *
 * Technical note: Wormhole CCTP lanes mean USDC moves natively — no
 * wrapped token, no slippage, no liquidity fragmentation risk.
 */
export function BridgeThenDeploy({ topPool }: Props) {
  const [open, setOpen] = useState(false)

  // Resolve the best destination chain
  const targetWormholeChain = topPool
    ? defiLlamaChainToWormhole(topPool.chain)
    : null

  // Don't render if the top pool is on an unsupported bridge chain
  if (!topPool || !targetWormholeChain) return null

  const isOnEthereum = topPool.chain === 'Ethereum'

  // Infer the token the user needs to bridge from the pool's symbol
  const bridgeToken = tokenForPoolSymbol(topPool.symbol)
  // Explain vault/LP tokens so the user knows not to search for the pool symbol in the bridge
  const tokenNote = vaultTokenNote(topPool.symbol, bridgeToken, topPool.project)
  // Build the post-bridge route intent (from bridged token → pool's underlying asset)
  const routeIntent = buildBridgeRouteIntent(topPool, bridgeToken)

  return (
    <div className={styles.wrapper} data-testid="bridge-then-deploy">
      {/* ── Narrative header ───────────────────────────────────────── */}
      <div className={styles.narrative}>
        <div className={styles.narrativeStep}>
          <span className={styles.stepBadge}>1</span>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>Best opportunity right now</div>
            <div className={styles.opportunityRow}>
              <span className={styles.poolProject}>{topPool.project}</span>
              <span className={styles.poolSymbol}>{topPool.symbol}</span>
              <span className={styles.chainPill}>
                {(() => { const I = NETWORK_ICON[topPool.chain]; return I ? <I size={14} variant="branded" /> : null })()}
                {topPool.chain}
              </span>
              <span className={styles.poolApy}>{formatApy(topPool.apy)}</span>
              <CEScoreBreakdown pool={topPool}>
                <span className={styles.ceScore}>◈ {topPool.capitalEfficiency}</span>
              </CEScoreBreakdown>
            </div>
          </div>
        </div>

        <div className={styles.narrativeArrow}>↓</div>

        <div className={styles.narrativeStep}>
          <span className={styles.stepBadge}>2</span>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>
              {isOnEthereum ? (
                <><NetworkEthereum size={14} variant="branded" className={styles.chainInline} /> Your {bridgeToken} is already on Ethereum — ready to deploy</>
              ) : (
                <><NetworkEthereum size={14} variant="branded" className={styles.chainInline} /> Bridge {bridgeToken} from Ethereum → {(() => { const I = NETWORK_ICON[topPool.chain]; return I ? <I size={14} variant="branded" className={styles.chainInline} /> : null })()} {topPool.chain}</>
              )}
            </div>
            {!isOnEthereum && (
              <div className={styles.stepSub}>
                Wormhole: native bridge · no wrapped tokens · ~1 min
              </div>
            )}
            {tokenNote && (
              <div className={styles.tokenNote}>
                ℹ {tokenNote}
              </div>
            )}
          </div>
        </div>

        {!isOnEthereum && <div className={styles.narrativeArrow}>↓</div>}

        <div className={styles.narrativeStep}>
          <span className={styles.stepBadge}>{isOnEthereum ? 2 : 3}</span>
          <div className={styles.stepContent}>
            <div className={styles.stepTitle}>
              Deploy into {topPool.project}
            </div>
            {routeIntent ? (
              <RouteButton intent={routeIntent} amountUsd={0} variant="compact" />
            ) : (
              <div className={styles.stepSub}>
                Pre-filled routing — one click to 1inch or direct deposit
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bridge toggle ──────────────────────────────────────────── */}
      {!isOnEthereum && (
        <button
          className={styles.bridgeTrigger}
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          aria-controls="bridge-widget-panel"
          data-testid="bridge-toggle"
        >
          <span className={styles.bridgeTriggerIcon}>{open ? '▲' : '⇄'}</span>
          <span className={styles.bridgeTriggerLabel}>
            {open ? 'Close bridge' : `Bridge to ${topPool.chain}`}
          </span>
          <span className={styles.bridgeTriggerSub}>
            Wormhole Connect · {bridgeToken}
          </span>
        </button>
      )}

      {open && (
        <div id="bridge-widget-panel" className={styles.widgetContainer}>
          <div className={styles.widgetHint}>
            Select <strong>{bridgeToken}</strong> in the bridge widget below → {topPool.chain}
          </div>
          <BridgeWidget
            targetChain={targetWormholeChain}
            sourceToken={bridgeToken}
            destToken={bridgeToken}
          />
        </div>
      )}
    </div>
  )
}
