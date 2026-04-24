'use client'

import { useState, useMemo } from 'react'
import type { Pool } from '@/types/protocol'
import { formatUsd, formatApy } from '@/lib/format'
import { NETWORK_ICON } from '@/lib/chainIcons'
import { PROTOCOL_ICON, type ProtocolIconComponent } from '@/lib/protocolIcons'
import { CEScoreBreakdown } from '@/components/CEScoreBreakdown/CEScoreBreakdown'
import { RouteButton } from '@/components/RouteButton/RouteButton'
import { buildRouteIntent } from '@/lib/routing'
import styles from './YieldTable.module.css'

type NumericSortKey = 'apy' | 'tvlUsd' | 'capitalEfficiency'
type StringSortKey  = 'project' | 'chain' | 'band'
type SortKey = NumericSortKey | StringSortKey
type SortDir = 'asc' | 'desc'

type Props = {
  pools: Pool[]
  /** Pool IDs that just received an APY update — animate their APY cell. */
  updatedIds?: ReadonlySet<string>
}

const PAGE_SIZE = 25
const NUMERIC_SORT_KEYS: NumericSortKey[] = ['apy', 'tvlUsd', 'capitalEfficiency']

export function YieldTable({ pools, updatedIds }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('capitalEfficiency')
  const [sortDir, setSortDir] = useState<SortDir>('desc')
  const [page, setPage] = useState(0)

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    } else {
      setSortKey(key)
      setSortDir('desc')
    }
    setPage(0)
  }

  const sorted = useMemo(() => [...pools].sort((a, b) => {
    const mul = sortDir === 'desc' ? -1 : 1
    if (NUMERIC_SORT_KEYS.includes(sortKey as NumericSortKey)) {
      return ((a[sortKey as NumericSortKey] as number) - (b[sortKey as NumericSortKey] as number)) * mul
    }
    return (a[sortKey as StringSortKey] as string).localeCompare(b[sortKey as StringSortKey] as string) * mul
  }), [pools, sortKey, sortDir])

  const pageCount = Math.ceil(sorted.length / PAGE_SIZE)
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

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
    <div>
      <div className={styles.wrapper}>
      <table className={styles.table}>
        <thead className={styles.thead}>
          <tr>
            <th className={sortKey === 'project' ? styles.sorted : ''}>
              <button
                type="button"
                className={styles.thButton}
                onClick={() => handleSort('project')}
              >
                Protocol / Pool {sortIcon('project')}
              </button>
            </th>
            <th className={sortKey === 'apy' ? styles.sorted : ''}>
              <button
                type="button"
                className={styles.thButton}
                onClick={() => handleSort('apy')}
              >
                APY {sortIcon('apy')}
              </button>
            </th>
            <th className={sortKey === 'tvlUsd' ? styles.sorted : ''}>
              <button
                type="button"
                className={styles.thButton}
                onClick={() => handleSort('tvlUsd')}
              >
                TVL {sortIcon('tvlUsd')}
              </button>
            </th>
            <th className={sortKey === 'capitalEfficiency' ? styles.sorted : ''}>
              <button
                type="button"
                className={styles.thButton}
                onClick={() => handleSort('capitalEfficiency')}
              >
                CE Score {sortIcon('capitalEfficiency')}
              </button>
            </th>
            <th className={sortKey === 'chain' ? styles.sorted : ''}>
              <button
                type="button"
                className={styles.thButton}
                onClick={() => handleSort('chain')}
              >
                Chain {sortIcon('chain')}
              </button>
            </th>
            <th className={sortKey === 'band' ? styles.sorted : ''}>
              <button
                type="button"
                className={styles.thButton}
                onClick={() => handleSort('band')}
              >
                Band {sortIcon('band')}
              </button>
            </th>
            <th className={styles.routeCol}>Route</th>
          </tr>
        </thead>
        <tbody>
          {paged.length === 0 && (
            <tr>
              <td colSpan={7} className={styles.empty}>No pools match your filters</td>
            </tr>
          )}
          {paged.map(pool => {
            const ProtocolIcon = PROTOCOL_ICON[pool.project] as ProtocolIconComponent | undefined
            const ChainIcon = NETWORK_ICON[pool.chain]

            return (
            <tr key={pool.pool} className={styles.row}>
              <td className={styles.cell}>
                <div className={styles.projectCell}>
                  <div className={styles.projectRow}>
                    {ProtocolIcon
                      ? <ProtocolIcon size={16} variant="branded" className={styles.protocolIcon} />
                      : <span className={styles.protocolIconFallback}>{pool.project.charAt(0).toUpperCase()}</span>}
                    <span className={styles.project}>{pool.project}</span>
                  </div>
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
                  {ChainIcon ? <ChainIcon size={14} variant="branded" className={styles.chainIcon} /> : null}
                  {pool.chain}
                </span>
              </td>
              <td className={styles.cell}>
                <BandBadge band={pool.band} />
              </td>
              <td className={`${styles.cell} ${styles.routeCell}`}>
                {(() => {
                  const intent = buildRouteIntent(pool)
                  return intent
                    ? <RouteButton intent={intent} amountUsd={1_000} variant="compact" />
                    : null
                })()}
              </td>
            </tr>
            )
          })}
        </tbody>
      </table>
      </div>
      {pageCount > 1 && (
        <div className={styles.pager}>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            ← Prev
          </button>
          <span className={styles.pageInfo}>
            {page + 1} / {pageCount}
          </span>
          <button
            className={styles.pageBtn}
            onClick={() => setPage(p => Math.min(pageCount - 1, p + 1))}
            disabled={page === pageCount - 1}
          >
            Next →
          </button>
        </div>
      )}
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
