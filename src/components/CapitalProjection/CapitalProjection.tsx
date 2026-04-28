'use client'

import { useAccount } from 'wagmi'
import type { Pool } from '@/types/protocol'
import { formatUsd, formatApy } from '@/lib/format'
import { useEthUsdPrice } from '@/hooks/useEthUsdPrice'
import { useMultiChainBalances } from '@/hooks/useMultiChainBalances'
import styles from './CapitalProjection.module.css'

type Props = {
  topAnchorPool: Pool | null
  topBalancedPool: Pool | null
}

export function CapitalProjection({ topAnchorPool, topBalancedPool }: Props) {
  const { address, isConnected } = useAccount()
  const ethUsdPrice = useEthUsdPrice()
  const { totalUsd, isLoading } = useMultiChainBalances(address, ethUsdPrice)

  if (!isConnected || !address) {
    return (
      <div className={styles.card} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          Connect your wallet to see projected returns
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Reads are on-chain only — no approvals required
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className={styles.projectionCard}>
        <div className={styles.label}>What you could earn</div>
        <div className={`${styles.projectionGrid} ${styles.projectionGridSkeleton}`}>
          {[0, 1, 2, 3].map(i => (
            <div key={i} className={styles.projectionItem}>
              <div className={styles.skeleton} style={{ width: 80, height: 12, marginBottom: 6 }} />
              <div className={styles.skeleton} style={{ width: 60, height: 24 }} />
            </div>
          ))}
        </div>
      </div>
    )
  }

  const anchorApy   = topAnchorPool?.apy  ?? 0
  const balancedApy = topBalancedPool?.apy ?? 0

  const anchorMonthly   = (totalUsd * anchorApy)   / 100 / 12
  const balancedMonthly = (totalUsd * balancedApy)  / 100 / 12
  const anchorAnnual    = (totalUsd * anchorApy)    / 100
  const balancedAnnual  = (totalUsd * balancedApy)  / 100

  return (
    <div className={styles.projectionCard}>
      <div className={styles.label}>What you could earn</div>
      <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '0 0 var(--space-3)' }}>
        Based on {formatUsd(totalUsd)} across all your chains
      </p>
      <div className={styles.projectionGrid}>
        <div className={styles.projectionItem}>
          <span className={styles.projectionLabel}>Anchor — Monthly</span>
          <span className={styles.projectionValue}>{formatUsd(anchorMonthly)}</span>
          <span className={styles.projectionSub}>{formatApy(anchorApy)} APY via {topAnchorPool?.project ?? '—'}</span>
        </div>
        <div className={styles.projectionItem}>
          <span className={styles.projectionLabel}>Anchor — Annual</span>
          <span className={styles.projectionValue}>{formatUsd(anchorAnnual)}</span>
          <span className={styles.projectionSub}>on {formatUsd(totalUsd)} principal</span>
        </div>
        <div className={styles.projectionItem}>
          <span className={styles.projectionLabel}>Balanced — Monthly</span>
          <span className={styles.projectionValue}>{formatUsd(balancedMonthly)}</span>
          <span className={styles.projectionSub}>{formatApy(balancedApy)} APY via {topBalancedPool?.project ?? '—'}</span>
        </div>
        <div className={styles.projectionItem}>
          <span className={styles.projectionLabel}>Balanced — Annual</span>
          <span className={styles.projectionValue}>{formatUsd(balancedAnnual)}</span>
          <span className={styles.projectionSub}>on {formatUsd(totalUsd)} principal</span>
        </div>
      </div>
      <p className={styles.disclaimer}>
        Projections are illustrative. APY is variable and subject to protocol conditions.
        This does not constitute financial advice.
      </p>
    </div>
  )
}
