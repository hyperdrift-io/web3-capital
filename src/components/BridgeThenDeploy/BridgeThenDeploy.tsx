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
   * Recommended deploy target — chosen from allocation-band logic or an explicit `?pool=` link.
   */
  topPool: Pool | null
  /** How this pool was selected (plain language). */
  selectionSubtitle?: string
}

/**
 * BridgeThenDeploy — timeline/wizard hybrid for cross-chain deployment.
 *
 * The bridge widget is lazy-mounted on first open, then shown/hidden inline.
 * That keeps the intent visible while only loading Wormhole when the user asks.
 */
export function BridgeThenDeploy({ topPool, selectionSubtitle }: Props) {
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
      <div className={styles.flowIntro}>
        <p className={styles.eyebrow}>Guided route</p>
        <h2 className={styles.flowTitle}>Move capital in three decisions.</h2>
        <p className={styles.flowCopy}>
          Capital Engine chooses the destination first, then shows the bridge only when it is needed.
        </p>
      </div>

      <div className={styles.timeline}>
        <section className={styles.stepCard} aria-labelledby="bridge-step-1">
          <div className={styles.stepMarker} aria-hidden="true">
            <span className={styles.stepBadge}>1</span>
          </div>
          <div className={styles.stepBody}>
            <div className={styles.stepHead}>
              <span className={styles.stepKicker}>Destination</span>
              <h3 id="bridge-step-1" className={styles.stepTitle}>Recommended deploy target</h3>
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
              <div className={styles.contextSub}>
                {selectionSubtitle ?? 'Highest CE score destination for this session.'}
              </div>
            </div>
          </div>
        </section>

        <section className={styles.stepCard} aria-labelledby="bridge-step-2">
          <div className={styles.stepMarker} aria-hidden="true">
            <span className={styles.stepBadge}>2</span>
          </div>
          <div className={styles.stepBody}>
            <div className={styles.stepHead}>
              <span className={styles.stepKicker}>Bridge</span>
              <h3 id="bridge-step-2" className={styles.stepTitle}>
                {isOnEthereum ? 'Already on the right chain' : `Bridge ${bridgeToken} to ${topPool.chain}`}
              </h3>
            </div>

            <div className={styles.bridgeRoute}>
              <span className={styles.routeNode}>
                <NetworkEthereum size={15} variant="branded" className={styles.chainInline} />
                Ethereum
              </span>
              <span className={styles.routeLine} aria-hidden="true" />
              <span className={styles.routeNode}>
                {ChainIcon && <ChainIcon size={15} variant="branded" className={styles.chainInline} />}
                {topPool.chain}
              </span>
            </div>

            <div className={styles.contextSub}>
              {isOnEthereum
                ? `${bridgeToken} is already on Ethereum. Continue to deploy.`
                : `${bridgeToken} moves via Wormhole. No wrapped tokens. About 1 minute.`}
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
          </div>
        </section>

        <section className={styles.stepCard} aria-labelledby="bridge-step-3">
          <div className={styles.stepMarker} aria-hidden="true">
            <span className={styles.stepBadge}>3</span>
          </div>
          <div className={styles.stepBody}>
            <div className={styles.stepHead}>
              <span className={styles.stepKicker}>Deploy</span>
              <h3 id="bridge-step-3" className={styles.stepTitle}>Deploy into {topPool.project}</h3>
            </div>
            <div className={styles.deployRow}>
              <span className={styles.deployLabel}>
                {routeIntent
                  ? (isOnEthereum ? 'Ready to deploy now.' : 'After bridging, continue to the route step.')
                  : 'Routing pre-fill is not available for this pool yet. Bridge first, then deposit in the protocol UI.'}
              </span>
              {routeIntent ? <RouteButton intent={routeIntent} amountUsd={0} variant="compact" /> : null}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
