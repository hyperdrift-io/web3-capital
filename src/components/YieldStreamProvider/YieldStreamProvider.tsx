'use client'

import type { Pool } from '@/types/protocol'
import { useYieldStream, type StreamStatus } from '@/hooks/useYieldStream'
import { AllocationBands } from '@/components/AllocationBands/AllocationBands'
import { YieldScatterChart } from '@/components/YieldScatterChart/YieldScatterChart'
import { YieldTable } from '@/components/YieldTable/YieldTable'
import styles from './YieldStreamProvider.module.css'

type Props = {
  initialPools: Pool[]
}

/**
 * Client boundary for the yield page.
 *
 * Receives the ISR snapshot from the server component (for instant first paint)
 * and upgrades it to a live SSE stream. Renders all data-dependent sections:
 * meta bar, allocation bands, scatter chart, yield table.
 *
 * The server component keeps only the static shell (page title/subtitle).
 */
export function YieldStreamProvider({ initialPools }: Props) {
  const { pools, updatedIds, status, updateCount } = useYieldStream(initialPools)

  const totalTvl = pools.reduce((s, p) => s + p.tvlUsd, 0)
  const avgApy   = pools.reduce((s, p) => s + p.apy, 0) / pools.length

  return (
    <>
      {/* Meta bar */}
      <div className={styles.metaBar}>
        <StatusIndicator status={status} />
        <span className={styles.metaItem}>{pools.length} pools</span>
        <span className={styles.metaItem}>TVL {formatTvl(totalTvl)}</span>
        <span className={styles.metaItem}>Avg APY {avgApy.toFixed(1)}%</span>
        {updateCount > 0 && (
          <span className={styles.updateBadge} key={updateCount}>
            {updateCount} update{updateCount !== 1 ? 's' : ''}
          </span>
        )}
        <span className={styles.metaSource}>
          Source: DeFi Llama · live when APY changes &gt;0.5%
        </span>
      </div>

      {/* Allocation bands */}
      <div className={styles.bands}>
        <div className={styles.sectionLabel}>Allocation bands</div>
        <AllocationBands pools={pools} />
      </div>

      {/* Risk vs yield chart */}
      <div className={styles.chartSection}>
        <div className={styles.sectionLabel}>Risk vs Yield</div>
        <p className={styles.chartSubtitle}>
          Each bubble is a pool. Size = TVL. X axis = safety score, Y axis = APY.
          Hover for details.
        </p>
        <YieldScatterChart pools={pools} />
      </div>

      {/* Yield table */}
      <div className={styles.tableSection}>
        <div className={styles.sectionLabel}>All pools</div>

        <div className={styles.ceExplainer}>
          <span className={styles.ceIcon}>◈</span>
          <span>
            <strong style={{ color: 'var(--text-primary)' }}>Capital Efficiency Score</strong> combines
            APY (40%), protocol safety (45%), and TVL depth (15%).
            A high score means the yield is real, the protocol is battle-tested, and there&apos;s enough
            liquidity to enter and exit without slippage.
            {' '}<span className={styles.proofHint}>Hover any score to see the breakdown.</span>
          </span>
        </div>

        <YieldTable pools={pools} updatedIds={updatedIds} />
      </div>
    </>
  )
}

// ── Status indicator ──────────────────────────────────────────────────────────

function StatusIndicator({ status }: { status: StreamStatus }) {
  return (
    <span className={`${styles.statusBadge} ${styles[`status--${status}`]}`}>
      <span className={styles.statusDot} />
      {status === 'live'       && 'Live'}
      {status === 'connecting' && 'Connecting…'}
      {status === 'error'      && 'Reconnecting…'}
    </span>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTvl(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
  if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
  return `$${(n / 1e6).toFixed(0)}M`
}
