'use client'

import { useState } from 'react'
import type { Pool } from '@/types/protocol'
import { formatUsd, formatApy, chainColor } from '@/lib/format'
import { CEScoreBreakdown } from '@/components/CEScoreBreakdown/CEScoreBreakdown'
import { RouteButton } from '@/components/RouteButton/RouteButton'
import { buildRouteIntent } from '@/lib/routing'
import styles from './YieldTable.module.css'

type SortKey = 'apy' | 'tvlUsd' | 'capitalEfficiency'
type SortDir = 'asc' | 'desc'

type Props = {
  pools: Pool[]
  /** Pool IDs that just received an APY update — animate their APY cell. */
  updatedIds?: ReadonlySet<string>
}

export function YieldTable({ pools, updatedIds }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('capitalEfficiency')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
  }

  const sorted = [...pools].sort((a, b) => {
    const mul = sortDir === 'desc' ? -1 : 1
    return (a[sortKey] - b[sortKey]) * mul
  })

  function ceClass(score: number) {
    if (score >= 70) return styles.ceHigh
    if (score >= 45) return styles.ceMid
    return styles.ceLow
  }

  function sortIcon(key: SortKey) {
    if (key !== sortKey) return <span className={styles.sortIcon}>↕</span>
    return <span className={styles.sortIcon}>{sortDir === 'desc' ? '↓' : '↑'}</span>
  }

  return (
    <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th>Protocol / Pool</th>
            <th
              className={sortKey === 'apy' ? styles.sorted : ''}
              onClick={() => handleSort('apy')}
            >
              APY {sortIcon('apy')}
            </th>
            <th
              className={sortKey === 'tvlUsd' ? styles.sorted : ''}
              onClick={() => handleSort('tvlUsd')}
            >
              TVL {sortIcon('tvlUsd')}
            </th>
            <th
              className={sortKey === 'capitalEfficiency' ? styles.sorted : ''}
              onClick={() => handleSort('capitalEfficiency')}
            >
              CE Score {sortIcon('capitalEfficiency')}
            </th>
            <th>Chain</th>
            <th>Band</th>
            <th className={styles.routeCol}>Route</th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 && (
            <tr>
              <td colSpan={7} className={styles.empty}>No pools match your filters</td>
            </tr>
          )}
          {sorted.map(pool => (
            <tr key={pool.pool} className={styles.row}>
              <td className={styles.cell}>
                <div className={styles.projectCell}>
                  <span className={styles.project}>{pool.project}</span>
                  <span className={styles.symbol}>{pool.symbol}</span>
                </div>
              </td>
              <td className={`${styles.cell} ${updatedIds?.has(pool.pool) ? styles.apyUpdated : ''}`}>
                <div className={styles.apy}>
                  {formatApy(pool.apy)}
                  <YieldTrend pct={pool.apyPct7d} />
                </div>
                {pool.apyBase != null && pool.apyReward != null && pool.apyReward > 0 && (
                  <div className={styles.apyBreakdown}>
                    {formatApy(pool.apyBase)} base + {formatApy(pool.apyReward)} reward
                  </div>
                )}
              </td>
              <td className={`${styles.cell} ${styles.tvl}`}>
                {formatUsd(pool.tvlUsd, true)}
              </td>
              <td className={styles.cell}>
                <CEScoreBreakdown pool={pool}>
                  <span className={`${styles.ceScore} ${ceClass(pool.capitalEfficiency)}`}>
                    {pool.capitalEfficiency}
                  </span>
                </CEScoreBreakdown>
              </td>
              <td className={styles.cell}>
                <span className={styles.chainDot}>
                  <span
                    className={styles.dot}
                    style={{ background: chainColor(pool.chain) }}
                  />
                  {pool.chain}
                </span>
              </td>
              <td className={styles.cell}>
                <BandBadge band={pool.band} />
              </td>
              <td className={`${styles.cell} ${styles.routeCell}`}>
                {(() => {
                  const intent = buildRouteIntent(pool, 1_000)
                  return intent
                    ? <RouteButton intent={intent} amountUsd={1_000} variant="compact" />
                    : null
                })()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function YieldTrend({ pct }: { pct: number | null }) {
  if (pct == null) return null
  if (pct > 1)   return <span className={styles.trendUp} title={`+${pct.toFixed(1)}% APY (7d)`}>↑</span>
  if (pct < -2)  return <span className={styles.trendDown} title={`${pct.toFixed(1)}% APY (7d)`}>↓</span>
  return null
}

function BandBadge({ band }: { band: Pool['band'] }) {
  const map = {
    anchor:       { label: 'Anchor',       cls: 'badge--green'  },
    balanced:     { label: 'Balanced',     cls: 'badge--accent' },
    opportunistic:{ label: 'Opportunistic',cls: 'badge--yellow' },
  } as const

  const { label, cls } = map[band]
  return <span className={`badge ${cls}`}>{label}</span>
}
