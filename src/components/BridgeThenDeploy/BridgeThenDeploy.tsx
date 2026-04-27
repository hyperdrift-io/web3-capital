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
 * BridgeThenDeploy — flat layout: context strip → widget (always visible) → deploy.
 *
 * No accordion, no expand/collapse state. Showing the widget immediately is
 * the single highest-leverage conversion improvement — removing the extra
 * click required to see the primary action.
 *
 *   ┌────────────────────────────────────────────────────────┐
 *   │  morpho-blue STEAKUSDC  Base  4.10%  ◈ 65            │  context strip
 *   │  Bridge USDC Ethereum → Base via Wormhole · ~1 min    │  sub-caption
 *   ├────────────────────────────────────────────────────────┤
 *   │         [ Wormhole Connect widget (full width) ]       │  primary action
 *   ├────────────────────────────────────────────────────────┤
 *   │  After bridging — deploy into morpho-blue  [ Route → ]│  next step
 *   └────────────────────────────────────────────────────────┘
 */
export function BridgeThenDeploy({ topPool }: Props) {
  const [bridgeOpen, setBridgeOpen] = useState(false)
  const [bridgeInitialized, setBridgeInitialized] = useState(false)

  const targetWormholeChain = topPool
    ? defiLlamaChainToWormhole(topPool.chain)
    : null

  if (!topPool || !targetWormholeChain) return null

  const isOnEthereum = topPool.chain === 'Ethereum'
  const bridgeToken = tokenForPoolSymbol(topPool.symbol)
  const tokenNote = vaultTokenNote(topPool.symbol, bridgeToken, topPool.project)
  const routeIntent = buildBridgeRouteIntent(topPool, bridgeToken)
  const ChainIcon = NETWORK_ICON[topPool.chain]

  return (
    <div className={styles.wrapper} data-testid="bridge-then-deploy">
      <div className={styles.timeline}>
        <section className={styles.stepCard} aria-labelledby="bridge-step-1">
          <div className={styles.stepHead}>
            <span className={styles.stepBadge}>1</span>
            <h3 id="bridge-step-1" className={styles.stepTitle}>Best opportunity right now</h3>
          </div>
          <div className={styles.contextStrip}>
            <div className={styles.opportunityRow}>
              <span className={styles.poolProject}>{topPool.project}</span>
              <span className={styles.poolSymbol}>{topPool.symbol}</span>
              <span className={styles.chainPill}>
                {ChainIcon && <ChainIcon size={13} variant="branded" />}
                {topPool.chain}
              </span>
              <span className={styles.poolApy}>{formatApy(topPool.apy)}</span>
              <CEScoreBreakdown pool={topPool}>
                <span className={styles.ceScore}>Score {topPool.capitalEfficiency}</span>
              </CEScoreBreakdown>
            </div>
            <div className={styles.contextSub}>Highest CE score destination for this session.</div>
          </div>
        </section>

        <section className={styles.stepCard} aria-labelledby="bridge-step-2">
          <div className={styles.stepHead}>
            <span className={styles.stepBadge}>2</span>
            <h3 id="bridge-step-2" className={styles.stepTitle}>
              {isOnEthereum ? 'Bridge skipped' : `Bridge ${bridgeToken} to ${topPool.chain}`}
            </h3>
          </div>

          <div className={styles.contextSub}>
            {isOnEthereum ? (
              <>
                <NetworkEthereum size={13} variant="branded" className={styles.chainInline} />
                {` ${bridgeToken} is already on Ethereum. Continue to deploy.`}
              </>
            ) : (
              <>
                <NetworkEthereum size={13} variant="branded" className={styles.chainInline} />
                {` ${bridgeToken} on Ethereum -> `}
                {ChainIcon && <ChainIcon size={13} variant="branded" className={styles.chainInline} />}
                {` ${topPool.chain} via Wormhole. No wrapped tokens. About 1 minute.`}
              </>
            )}
          </div>

          {tokenNote && <div className={styles.tokenNote}>Info: {tokenNote}</div>}

          {!isOnEthereum && (
            <>
              <button
                type="button"
                className={styles.bridgeToggle}
                onClick={() => {
                  setBridgeOpen((prev) => {
                    const next = !prev
                    if (next) setBridgeInitialized(true)
                    return next
                  })
                }}
                aria-expanded={bridgeOpen}
                aria-controls="wormhole-bridge-panel"
                data-testid="bridge-toggle"
              >
                {bridgeOpen ? 'Hide Wormhole Bridge' : 'Open Wormhole Bridge'}
              </button>

              {bridgeInitialized && (
                <div
                  id="wormhole-bridge-panel"
                  className={`${styles.widgetArea} ${!bridgeOpen ? styles.widgetAreaHidden : ''}`}
                  aria-hidden={!bridgeOpen}
                >
                  <BridgeWidget
                    targetChain={targetWormholeChain}
                    sourceToken={bridgeToken}
                    destToken={bridgeToken}
                  />
                </div>
              )}
            </>
          )}
        </section>

        {routeIntent && (
          <section className={styles.stepCard} aria-labelledby="bridge-step-3">
            <div className={styles.stepHead}>
              <span className={styles.stepBadge}>3</span>
              <h3 id="bridge-step-3" className={styles.stepTitle}>Deploy into {topPool.project}</h3>
            </div>
            <div className={styles.deployRow}>
              <span className={styles.deployLabel}>
                {isOnEthereum ? 'Ready to deploy now.' : 'After bridging, continue to the route step.'}
              </span>
              <RouteButton intent={routeIntent} amountUsd={0} variant="compact" />
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
