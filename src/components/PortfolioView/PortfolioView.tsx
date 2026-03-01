'use client'

import { useAccount } from 'wagmi'
import { useReadContract } from 'wagmi'
import { useMultiChainBalances } from '@/hooks/useMultiChainBalances'
import { useYieldPositions }     from '@/hooks/useYieldPositions'
import { useDevAddress }         from '@/hooks/useDevAddress'
import { AGGREGATOR_V3_ABI, ETH_USD_FEED, FALLBACK_ETH_USD, parseChainlinkAnswer } from '@/lib/chainlink'
import { CHAIN_NAMES } from '@/lib/yieldPositions'
import { formatUsd } from '@/lib/format'
import type { Pool } from '@/types/protocol'
import styles from './PortfolioView.module.css'

type Props = {
  pools: Pool[]
}

/**
 * Portfolio Overview — Iteration 4
 *
 * Full cross-chain capital picture:
 * - 4.1 Multi-chain balance aggregation (native + ERC-20 across 4 chains)
 * - 4.2 Yield position detection (Aave v3 + Compound v3 aTokens/cTokens)
 *
 * Surfaces active positions as "You're Earning" with live APY from DeFi Llama.
 * RebalancingPanel (4.3) is rendered by the parent page alongside this component.
 */
export function PortfolioView({ pools }: Props) {
  const { address: walletAddress } = useAccount()
  const devAddress = useDevAddress()
  const address    = devAddress ?? walletAddress

  // Live ETH/USD price (reuses same Chainlink feed as CapitalProjection)
  const { data: priceData } = useReadContract({
    abi:          AGGREGATOR_V3_ABI,
    address:      ETH_USD_FEED[1],
    functionName: 'latestRoundData',
    chainId:      1,
    query:        { refetchInterval: 30_000 },
  })
  const ethUsdPrice = priceData
    ? parseChainlinkAnswer(priceData[1] as bigint)
    : FALLBACK_ETH_USD

  const { chains, chainsWithBalance, totalUsd, isLoading: balancesLoading } =
    useMultiChainBalances(address, ethUsdPrice)

  const { positions, summary, isLoading: positionsLoading } =
    useYieldPositions(address, ethUsdPrice, pools)

  if (!address) {
    return (
      <div className={styles.connectPrompt}>
        <div className={styles.connectIcon}>◈</div>
        <p className={styles.connectText}>Connect your wallet to see your portfolio across all chains</p>
        {process.env.NODE_ENV === 'development' && (
          <p className={styles.devHint}>
            Dev: append <code>?dev=0x...</code> to inspect any address without connecting
          </p>
        )}
      </div>
    )
  }

  const isLoading = balancesLoading || positionsLoading

  return (
    <div className={styles.wrapper}>
      {/* ── Portfolio header ──────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <div className={styles.headerLabel}>Total Portfolio Value</div>
          {isLoading
            ? <div className={styles.skeleton} style={{ width: 160, height: 36 }} />
            : <div className={styles.totalValue}>{formatUsd(totalUsd)}</div>
          }
        </div>
        <div className={styles.headerMeta}>
          <span className={styles.chainCount}>Across {SUPPORTED_CHAIN_IDS.length} chains</span>
          {ethUsdPrice !== FALLBACK_ETH_USD && (
            <span className={styles.priceTag}>ETH {formatUsd(ethUsdPrice, false)}</span>
          )}
        </div>
      </div>

      {/* ── Chain breakdown — 4.1 ────────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>Capital by chain</div>
        <div className={styles.chainGrid}>
          {isLoading
            ? SUPPORTED_CHAIN_IDS.map(id => <ChainCardSkeleton key={id} />)
            : chains.map(chain => (
                <ChainCard
                  key={chain.chainId}
                  chain={chain}
                  ethUsdPrice={ethUsdPrice}
                  share={totalUsd > 0 ? chain.totalUsd / totalUsd : 0}
                />
              ))
          }
        </div>
      </div>

      {/* ── Active positions — 4.2 ───────────────────────────────── */}
      <div className={styles.section}>
        <div className={styles.sectionLabel}>
          You&apos;re Earning
          {summary && (
            <span className={styles.sectionBadge}>
              {summary.weightedApy.toFixed(1)}% blended APY
            </span>
          )}
        </div>

        {isLoading && (
          <div className={styles.positionsSkeleton}>
            {[0, 1, 2].map(i => <PositionSkeleton key={i} />)}
          </div>
        )}

        {!isLoading && positions.length === 0 && (
          <div className={styles.noPositions}>
            <span className={styles.noPositionsIcon}>○</span>
            No active yield positions detected across Aave v3 or Compound v3.
            <br />
            <span className={styles.noPositionsHint}>
              Use the Deploy Capital Wizard below to put your capital to work.
            </span>
          </div>
        )}

        {!isLoading && positions.length > 0 && (
          <>
            <div className={styles.positionsTable}>
              {positions.map((pos, i) => (
                <PositionRow key={`${pos.chainId}-${pos.token.address}-${i}`} pos={pos} />
              ))}
            </div>

            {summary && (
              <div className={styles.positionsSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Total earning</span>
                  <span className={styles.summaryValue}>{formatUsd(summary.totalUsd)}</span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Effective APY</span>
                  <span className={`${styles.summaryValue} ${styles.apyValue}`}>
                    {summary.weightedApy.toFixed(2)}%
                  </span>
                </div>
                <div className={styles.summaryDivider} />
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Annual return</span>
                  <span className={styles.summaryValue}>~{formatUsd(summary.annualReturn)}/yr</span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// ── Chain card ────────────────────────────────────────────────────────────────

import type { ChainBalance } from '@/hooks/useMultiChainBalances'

function ChainCard({ chain, ethUsdPrice, share }: {
  chain:        ChainBalance
  ethUsdPrice:  number
  share:        number
}) {
  const ethBalance = Number(chain.native) / 1e18
  const isEmpty    = chain.totalUsd < 0.01

  return (
    <div className={`${styles.chainCard} ${isEmpty ? styles.chainCardEmpty : ''}`}>
      <div className={styles.chainCardHeader}>
        <span className={styles.chainName}>{chain.chainName}</span>
        <span className={styles.chainUsd}>
          {isEmpty ? '—' : formatUsd(chain.totalUsd)}
        </span>
      </div>

      {/* Share bar */}
      {!isEmpty && (
        <div className={styles.shareBar}>
          <div
            className={styles.shareBarFill}
            style={{ width: `${Math.round(share * 100)}%` }}
          />
        </div>
      )}

      <div className={styles.chainAssets}>
        {ethBalance > 0.0001 && (
          <div className={styles.assetRow}>
            <span className={styles.assetSymbol}>ETH</span>
            <span className={styles.assetUsd}>{formatUsd(ethBalance * ethUsdPrice)}</span>
          </div>
        )}
        {chain.tokens.map(t => (
          <div key={t.meta.address} className={styles.assetRow}>
            <span className={styles.assetSymbol}>{t.meta.symbol}</span>
            <span className={styles.assetUsd}>{formatUsd(t.usd)}</span>
          </div>
        ))}
        {isEmpty && (
          <span className={styles.assetEmpty}>No assets</span>
        )}
      </div>
    </div>
  )
}

// ── Position row ──────────────────────────────────────────────────────────────

import type { DetectedPosition } from '@/lib/yieldPositions'

function PositionRow({ pos }: { pos: DetectedPosition }) {
  const { token, chainId, usdValue, apy } = pos
  const protocolLabel = token.protocol === 'aave-v3' ? 'Aave v3' : 'Compound v3'
  const chainName     = CHAIN_NAMES[chainId]

  return (
    <div className={styles.positionRow}>
      <div className={styles.positionProtocol}>
        <span className={`${styles.protocolBadge} ${styles[`protocol--${token.protocol}`]}`}>
          {protocolLabel}
        </span>
        <span className={styles.positionAsset}>{token.underlying}</span>
        <span className={styles.positionChain}>{chainName}</span>
      </div>

      <div className={styles.positionRight}>
        <span className={styles.positionUsd}>{formatUsd(usdValue)}</span>
        {apy !== null
          ? <span className={styles.positionApy}>{apy.toFixed(2)}% APY</span>
          : <span className={styles.positionApyNull}>— APY</span>
        }
      </div>
    </div>
  )
}

// ── Skeletons ─────────────────────────────────────────────────────────────────

function ChainCardSkeleton() {
  return (
    <div className={`${styles.chainCard} ${styles.chainCardSkeleton}`}>
      <div className={styles.skeleton} style={{ width: '60%', height: 14 }} />
      <div className={styles.skeleton} style={{ width: '40%', height: 20, marginTop: 8 }} />
    </div>
  )
}

function PositionSkeleton() {
  return (
    <div className={`${styles.positionRow} ${styles.positionRowSkeleton}`}>
      <div className={styles.skeleton} style={{ width: '40%', height: 14 }} />
      <div className={styles.skeleton} style={{ width: '25%', height: 14 }} />
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const SUPPORTED_CHAIN_IDS = [1, 42161, 8453, 10] as const
