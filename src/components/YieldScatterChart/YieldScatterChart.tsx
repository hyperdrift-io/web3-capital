'use client'

import { useState, useCallback } from 'react'
import type { Pool } from '@/types/protocol'
import { formatApy, formatUsd } from '@/lib/format'
import styles from './YieldScatterChart.module.css'

type Props = {
  pools: Pool[]
}

// ── Chart geometry ────────────────────────────────────────────────────────────
const W  = 760
const H  = 420
const PAD = { top: 24, right: 24, bottom: 52, left: 56 }
const PLOT_W = W - PAD.left - PAD.right
const PLOT_H = H - PAD.top  - PAD.bottom

// Domains
const X_MIN = 0,   X_MAX = 100  // safety score
const Y_MIN = 0,   Y_MAX = 50   // APY % (pools above 50% are extreme outliers)

// Map data values → SVG coordinates
const xScale = (v: number) => PAD.left + ((v - X_MIN) / (X_MAX - X_MIN)) * PLOT_W
const yScale = (v: number) => PAD.top  + (1 - (v - Y_MIN) / (Y_MAX - Y_MIN)) * PLOT_H

// Bubble radius from TVL (log-scaled, clamped)
const bubbleRadius = (tvl: number) =>
  Math.max(4, Math.min(16, Math.log10(Math.max(tvl, 1e6)) * 3 - 14))

// Quadrant boundary lines (band thresholds from the scoring algorithm)
const ANCHOR_SAFETY = 75, ANCHOR_APY   = 12
const BALANCED_SAFETY = 55, BALANCED_APY = 25

const BAND_COLOR: Record<Pool['band'], string> = {
  anchor:        'var(--green)',
  balanced:      'var(--accent)',
  opportunistic: '#f59e0b',
}

const BAND_LABEL: Record<Pool['band'], string> = {
  anchor:        'Anchor',
  balanced:      'Balanced',
  opportunistic: 'Opportunistic',
}

// ── Component ─────────────────────────────────────────────────────────────────

export function YieldScatterChart({ pools }: Props) {
  const [hovered, setHovered] = useState<Pool | null>(null)
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

  // Take top 120 pools for the chart — the rest are low-CE and would clutter
  const chartPools = pools.slice(0, 120)

  // Sort so smaller bubbles render on top
  const sorted = [...chartPools].sort((a, b) => b.tvlUsd - a.tvlUsd)

  const handleMouseMove = useCallback((pool: Pool, e: React.MouseEvent<SVGCircleElement>) => {
    const svg = e.currentTarget.closest('svg')
    if (!svg) return
    const rect = svg.getBoundingClientRect()
    setTooltipPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    })
    setHovered(pool)
  }, [])

  const x_a = xScale(ANCHOR_SAFETY)
  const y_a = yScale(ANCHOR_APY)
  const x_b = xScale(BALANCED_SAFETY)
  const y_b = yScale(BALANCED_APY)

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>Risk vs Yield</div>
        <div className={styles.legend}>
          {(['anchor', 'balanced', 'opportunistic'] as Pool['band'][]).map(band => (
            <span key={band} className={styles.legendItem}>
              <span className={styles.legendDot} style={{ background: BAND_COLOR[band] }} />
              {BAND_LABEL[band]}
            </span>
          ))}
          <span className={styles.legendItem}>
            <span className={styles.legendBubbleSmall} />
            <span className={styles.legendBubbleLarge} />
            TVL
          </span>
        </div>
      </div>

      <div className={styles.chartWrapper}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className={styles.svg}
          onMouseLeave={() => setHovered(null)}
        >
          {/* Zone fills */}
          {/* Anchor zone: right of safety=75, below apy=12 */}
          <rect
            x={x_a} y={y_a}
            width={W - PAD.right - x_a} height={H - PAD.bottom - y_a}
            className={styles.zoneAnchor}
          />
          {/* Opportunistic zone: left of safety=55, above apy=25 */}
          <rect
            x={PAD.left} y={PAD.top}
            width={x_b - PAD.left} height={y_b - PAD.top}
            className={styles.zoneOpportunistic}
          />

          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map(v => (
            <line key={`gx-${v}`}
              x1={xScale(v)} y1={PAD.top}
              x2={xScale(v)} y2={H - PAD.bottom}
              className={styles.grid}
            />
          ))}
          {[0, 10, 20, 30, 40, 50].map(v => (
            <line key={`gy-${v}`}
              x1={PAD.left} y1={yScale(v)}
              x2={W - PAD.right} y2={yScale(v)}
              className={styles.grid}
            />
          ))}

          {/* Boundary lines */}
          <line x1={x_a} y1={PAD.top} x2={x_a} y2={H - PAD.bottom} className={styles.boundary} strokeDasharray="4 3" />
          <line x1={PAD.left} y1={y_a} x2={W - PAD.right} y2={y_a} className={styles.boundary} strokeDasharray="4 3" />
          <line x1={x_b} y1={PAD.top} x2={x_b} y2={H - PAD.bottom} className={styles.boundaryBalanced} strokeDasharray="3 4" />
          <line x1={PAD.left} y1={y_b} x2={W - PAD.right} y2={y_b} className={styles.boundaryBalanced} strokeDasharray="3 4" />

          {/* Zone labels */}
          <text x={x_a + 8} y={H - PAD.bottom - 10} className={`${styles.zoneLabel} ${styles.zoneLabelAnchor}`}>
            Anchor zone
          </text>
          <text x={PAD.left + 6} y={PAD.top + 16} className={`${styles.zoneLabel} ${styles.zoneLabelOpportunistic}`}>
            Opportunistic
          </text>

          {/* X axis */}
          <line x1={PAD.left} y1={H - PAD.bottom} x2={W - PAD.right} y2={H - PAD.bottom} className={styles.axis} />
          {[0, 25, 50, 75, 100].map(v => (
            <g key={`xt-${v}`}>
              <line x1={xScale(v)} y1={H - PAD.bottom} x2={xScale(v)} y2={H - PAD.bottom + 4} className={styles.tick} />
              <text x={xScale(v)} y={H - PAD.bottom + 16} className={styles.tickLabel} textAnchor="middle">{v}</text>
            </g>
          ))}
          <text x={PAD.left + PLOT_W / 2} y={H - 4} className={styles.axisLabel} textAnchor="middle">
            Safety Score → Safer
          </text>

          {/* Y axis */}
          <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={H - PAD.bottom} className={styles.axis} />
          {[0, 10, 20, 30, 40, 50].map(v => (
            <g key={`yt-${v}`}>
              <line x1={PAD.left - 4} y1={yScale(v)} x2={PAD.left} y2={yScale(v)} className={styles.tick} />
              <text x={PAD.left - 8} y={yScale(v) + 4} className={styles.tickLabel} textAnchor="end">{v}%</text>
            </g>
          ))}
          <text
            x={14}
            y={PAD.top + PLOT_H / 2}
            className={styles.axisLabel}
            textAnchor="middle"
            transform={`rotate(-90, 14, ${PAD.top + PLOT_H / 2})`}
          >
            APY ↑ Higher yield
          </text>

          {/* Bubbles */}
          {sorted.map(pool => {
            const cx = xScale(pool.safety)
            const cy = yScale(Math.min(pool.apy, Y_MAX))
            const r  = bubbleRadius(pool.tvlUsd)
            const isHovered = hovered?.pool === pool.pool

            return (
              <circle
                key={pool.pool}
                cx={cx}
                cy={cy}
                r={isHovered ? r + 2 : r}
                fill={BAND_COLOR[pool.band]}
                fillOpacity={isHovered ? 0.95 : 0.65}
                stroke={BAND_COLOR[pool.band]}
                strokeOpacity={isHovered ? 1 : 0.4}
                strokeWidth={isHovered ? 1.5 : 0.5}
                className={styles.bubble}
                onMouseMove={(e) => handleMouseMove(pool, e)}
              />
            )
          })}
        </svg>

        {/* Tooltip */}
        {hovered && (
          <div
            className={styles.tooltip}
            style={{
              left: tooltipPos.x + 12,
              top:  tooltipPos.y - 8,
            }}
          >
            <div className={styles.tooltipProject}>{hovered.project}</div>
            <div className={styles.tooltipSymbol}>{hovered.symbol}</div>
            <div className={styles.tooltipGrid}>
              <span className={styles.tooltipLabel}>APY</span>
              <span className={styles.tooltipValue} style={{ color: 'var(--green)' }}>
                {formatApy(hovered.apy)}
              </span>
              <span className={styles.tooltipLabel}>Safety</span>
              <span className={styles.tooltipValue}>{hovered.safety}/100</span>
              <span className={styles.tooltipLabel}>TVL</span>
              <span className={styles.tooltipValue}>{formatUsd(hovered.tvlUsd, true)}</span>
              <span className={styles.tooltipLabel}>CE</span>
              <span className={styles.tooltipValue}>{hovered.capitalEfficiency}</span>
              <span className={styles.tooltipLabel}>Chain</span>
              <span className={styles.tooltipValue}>{hovered.chain}</span>
            </div>
            <div
              className={styles.tooltipBand}
              style={{ background: BAND_COLOR[hovered.band] + '25', color: BAND_COLOR[hovered.band] }}
            >
              {BAND_LABEL[hovered.band]}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
