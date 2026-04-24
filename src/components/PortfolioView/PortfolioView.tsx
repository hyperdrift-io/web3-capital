'use client'

import type { ComponentType } from 'react'
import { useAccount } from 'wagmi'
import {
  NetworkEthereum,
  NetworkArbitrumOne,
  NetworkBase,
  NetworkOptimism,
  NetworkBinanceSmartChain,
  NetworkPolygon,
  TokenETH,
  TokenUSDC,
  TokenUSDT,
  TokenBNB,
  TokenMATIC,
} from '@web3icons/react'
import { useMultiChainBalances } from '@/hooks/useMultiChainBalances'
import { useYieldPositions }     from '@/hooks/useYieldPositions'
import { useDevAddress }         from '@/hooks/useDevAddress'
import { useEthUsdPrice }        from '@/hooks/useEthUsdPrice'
import { FALLBACK_ETH_USD } from '@/lib/chainlink'
import { CHAIN_NAMES } from '@/lib/yieldPositions'
import { formatUsd } from '@/lib/format'
import type { Pool } from '@/types/protocol'
import styles from './PortfolioView.module.css'

// Structural icon type matching how we render: size, variant, className.
// Using the concrete variant union from @web3icons/common to satisfy the
// library's TVariant constraint without importing the full IconComponent type.
type AnyIcon = ComponentType<{ size?: number | string; variant?: 'mono' | 'branded' | 'background'; className?: string }>

const CHAIN_ICON: Record<number, AnyIcon> = {
  1:     NetworkEthereum,
  42161: NetworkArbitrumOne,
  8453:  NetworkBase,
  10:    NetworkOptimism,
  56:    NetworkBinanceSmartChain,
  137:   NetworkPolygon,
}

// WETH reuses the ETH icon (same brand). wstETH/stETH have no icon in the library.
const TOKEN_ICON: Record<string, AnyIcon> = {
  ETH:   TokenETH,
  WETH:  TokenETH,
  USDC:  TokenUSDC,
  USDT:  TokenUSDT,
  BNB:   TokenBNB,
  MATIC: TokenMATIC,
}

type Props = {
  pools: Pool[]
}

/**
 * Portfolio Overview — Iteration 4
 *
 * Full cross-chain capital picture:
 * - 4.1 Multi-chain balance aggregation (native + ERC-20 across supported chains)
 * - 4.2 Yield position detection (Aave v3 + Compound v3 aTokens/cTokens)
 *
 * Surfaces active positions as "You're Earning" with live APY from DeFi Llama.
 * RebalancingPanel (4.3) is rendered by the parent page alongside this component.
 */
export function PortfolioView({ pools }: Props) {
  const { address: walletAddress } = useAccount()
  const devAddress = useDevAddress()
  const address    = devAddress ?? walletAddress

  const ethUsdPrice = useEthUsdPrice()

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
      {/* ── Dev observer banner ───────────────────────────────────── */}
      {process.env.NODE_ENV === 'development' && devAddress && (
        <div className={styles.devBanner}>
          <span className={styles.devBannerIcon}>🔍</span>
          <span>
            <strong>Dev mode</strong> — observing{' '}
            <a
              href={`https://debank.com/profile/${devAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.devBannerAddress}
            >
              {devAddress.slice(0, 6)}…{devAddress.slice(-4)}
            </a>
            {isLoading && <span className={styles.devBannerLoading}> · loading…</span>}
            {!isLoading && <span className={styles.devBannerDone}> · {positions.length} position{positions.length !== 1 ? 's' : ''} detected · ETH/USD ${ethUsdPrice.toLocaleString()}</span>}
            <span className={styles.devBannerHint}> · Check console for raw data</span>
          </span>
        </div>
      )}

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
          <span className={styles.chainCount}>
            {isLoading ? 'Scanning chains…' : chainsWithBalance.length > 0 ? `Across ${chainsWithBalance.length} chain${chainsWithBalance.length !== 1 ? 's' : ''}` : 'No assets found'}
          </span>
          {ethUsdPrice !== FALLBACK_ETH_USD && (
            <span className={styles.priceTag}>ETH {formatUsd(ethUsdPrice, false)}</span>
          )}
        </div>
      </div>

      {/* ── Chain breakdown — 4.1 ────────────────────────────────── */}
      {(isLoading || chainsWithBalance.length > 0) && (
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Capital by chain</div>
          <div className={styles.chainGrid}>
            {isLoading
              ? [0, 1, 2].map(i => <ChainCardSkeleton key={i} />)
              : chainsWithBalance.map(chain => (
                  <ChainCard
                    key={chain.chainId}
                    chain={chain}
                    share={totalUsd > 0 ? chain.totalUsd / totalUsd : 0}
                  />
                ))
            }
          </div>
        </div>
      )}

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

function ChainCard({ chain, share }: {
  chain:        ChainBalance
  share:        number
}) {
  const ChainIconComp = CHAIN_ICON[chain.chainId]

  return (
    <div className={styles.chainCard}>
      <div className={styles.chainCardHeader}>
        <div className={styles.chainNameRow}>
          {ChainIconComp && (
            <ChainIconComp
              size={18}
              variant="branded"
              className={styles.chainIcon}
            />
          )}
          <span className={styles.chainName}>{chain.chainName}</span>
        </div>
        <span className={styles.chainUsd}>{formatUsd(chain.totalUsd)}</span>
      </div>

      <div className={styles.shareBar}>
        <div
          className={styles.shareBarFill}
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </div>

      <div className={styles.chainAssets}>
        {chain.nativeUsd > 0.01 && (
          <div className={styles.assetRow}>
            <span className={styles.assetRowLeft}>
              {(() => { const I = TOKEN_ICON[chain.nativeSymbol]; return I ? <I size={16} variant="branded" className={styles.tokenIcon} /> : null })()}
              <span className={styles.assetSymbol}>{chain.nativeSymbol}</span>
            </span>
            <span className={styles.assetUsd}>{formatUsd(chain.nativeUsd)}</span>
          </div>
        )}
        {chain.tokens.map(t => {
          const TokenIconComp = TOKEN_ICON[t.meta.symbol]
          return (
            <div key={t.meta.address} className={styles.assetRow}>
              <span className={styles.assetRowLeft}>
                {TokenIconComp && <TokenIconComp size={16} variant="branded" className={styles.tokenIcon} />}
                <span className={styles.assetSymbol}>{t.meta.symbol}</span>
              </span>
              <span className={styles.assetUsd}>{formatUsd(t.usd)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Position row ──────────────────────────────────────────────────────────────

import type { DetectedPosition } from '@/lib/yieldPositions'

function PositionRow({ pos }: { pos: DetectedPosition }) {
  const { token, chainId, usdValue, apy } = pos
  const protocolLabel   = token.protocol === 'aave-v3' ? 'Aave v3' : 'Compound v3'
  const chainName       = CHAIN_NAMES[chainId]
  const ChainIconComp   = CHAIN_ICON[chainId]
  const TokenIconComp   = TOKEN_ICON[token.underlying]

  return (
    <div className={styles.positionRow}>
      <div className={styles.positionProtocol}>
        <span className={`${styles.protocolBadge} ${styles[`protocol--${token.protocol}`]}`}>
          {protocolLabel}
        </span>
        <span className={styles.positionAssetRow}>
          {TokenIconComp && <TokenIconComp size={16} variant="branded" className={styles.tokenIcon} />}
          <span className={styles.positionAsset}>{token.underlying}</span>
        </span>
        <span className={styles.positionChainRow}>
          {ChainIconComp && <ChainIconComp size={12} variant="mono" className={styles.chainIconSmall} />}
          <span className={styles.positionChain}>{chainName}</span>
        </span>
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
