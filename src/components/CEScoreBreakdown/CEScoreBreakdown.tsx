'use client'

import { useState, useRef, useEffect } from 'react'
import type { Pool } from '@/types/protocol'
import { safetyBreakdown } from '@/lib/defillama'
import styles from './CEScoreBreakdown.module.css'

type Props = {
  pool: Pool
  children: React.ReactNode
}

/**
 * Proof Mode wrapper — wraps a CE score badge and shows a breakdown popover on hover.
 *
 * Transparency is a feature. Users should be able to verify why a pool scores 84.
 * The breakdown shows the three weighted components and the safety factors.
 */
export function CEScoreBreakdown({ pool, children }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click (for touch devices)
  useEffect(() => {
    if (!open) return
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [open])

  const normalizedApy   = Math.min(pool.apy / 30, 1) * 100
  const tvlScore        = Math.min(pool.tvlUsd / 500_000_000, 1) * 100
  const apyContrib      = Math.round(normalizedApy * 0.40)
  const safetyContrib   = Math.round(pool.safety   * 0.45)
  const tvlContrib      = Math.round(tvlScore      * 0.15)
  const { factors }     = safetyBreakdown(pool)

  return (
    <div
      ref={ref}
      className={styles.wrapper}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      {children}

      {open && (
        <div className={styles.popover} role="tooltip">
          <div className={styles.header}>
            <span className={styles.title}>CE Score Breakdown</span>
            <span className={styles.total}>{pool.capitalEfficiency}<span className={styles.max}>/100</span></span>
          </div>

          <div className={styles.components}>
            <ComponentRow
              label="APY"
              weight="40%"
              pts={apyContrib}
              maxPts={40}
              detail={`${pool.apy.toFixed(1)}% yield${pool.apy >= 30 ? ' (capped at 30%)' : ''}`}
            />
            <ComponentRow
              label="Safety"
              weight="45%"
              pts={safetyContrib}
              maxPts={45}
              detail={`Score ${pool.safety}/100`}
            />
            <ComponentRow
              label="TVL depth"
              weight="15%"
              pts={tvlContrib}
              maxPts={15}
              detail={formatTvl(pool.tvlUsd)}
            />
          </div>

          <div className={styles.divider} />

          <div className={styles.safetyFactors}>
            <div className={styles.safetyTitle}>Safety factors</div>
            {factors.filter(f => f.pts !== 0 || f.label === 'Base').map((f, i) => (
              <div key={i} className={styles.factor}>
                <span className={styles.factorLabel}>{f.label}</span>
                <span className={`${styles.factorPts} ${f.pts > 0 ? styles.pos : f.pts < 0 ? styles.neg : styles.zero}`}>
                  {f.pts > 0 ? `+${f.pts}` : f.pts}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ComponentRow({
  label, weight, pts, maxPts, detail,
}: {
  label: string
  weight: string
  pts: number
  maxPts: number
  detail: string
}) {
  const pct = Math.round((pts / maxPts) * 100)
  return (
    <div className={styles.component}>
      <div className={styles.componentHeader}>
        <span className={styles.componentLabel}>{label}</span>
        <span className={styles.componentWeight}>{weight}</span>
        <span className={styles.componentPts}>{pts}<span className={styles.max}>/{maxPts}</span></span>
      </div>
      <div className={styles.bar}>
        <div className={styles.barFill} style={{ width: `${pct}%` }} />
      </div>
      <div className={styles.componentDetail}>{detail}</div>
    </div>
  )
}

function formatTvl(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(1)}B TVL`
  if (n >= 1e6) return `$${(n / 1e6).toFixed(0)}M TVL`
  return `$${(n / 1e3).toFixed(0)}K TVL`
}
