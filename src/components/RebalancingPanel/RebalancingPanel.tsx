'use client'

import { useMemo } from 'react'
import { useAccount } from 'wagmi'
import { useMultiChainBalances }  from '@/hooks/useMultiChainBalances'
import { useYieldPositions }      from '@/hooks/useYieldPositions'
import { useDevAddress }          from '@/hooks/useDevAddress'
import { useEthUsdPrice }         from '@/hooks/useEthUsdPrice'
import { buildAllocation }        from '@/lib/routing'
import { formatApy, formatUsd, formatWholeUsd } from '@/lib/format'
import { RouteButton }            from '@/components/RouteButton/RouteButton'
import type { Pool }              from '@/types/protocol'
import styles from './RebalancingPanel.module.css'

type Props = {
  pools: Pool[]
}

/**
 * Rebalancing Recommendations — Iteration 4.3
 *
 * "Opportunity Delta": shows the gap between what the user is currently
 * earning and what they could earn without increasing risk.
 *
 * The calculation:
 * 1. Detect active positions (useYieldPositions)
 * 2. Sum total deployed USD + compute effective blended APY
 * 3. Run the same capital through buildAllocation() with current top pools
 * 4. Show the delta: +X% APY and +$Y/year
 * 5. Pre-fill the AllocationWizard with the detected amount
 *
 * Principle: show the user what they're leaving on the table — not just
 * "here's a yield table" but "here's exactly how much you'd gain by acting."
 * This is the feature that turns a dashboard into a decision-support tool.
 */
export function RebalancingPanel({ pools }: Props) {
  const { address: walletAddress } = useAccount()
  const devAddress = useDevAddress()
  const address    = devAddress ?? walletAddress

  const ethUsdPrice = useEthUsdPrice()

  const { totalUsd: availableUsd } = useMultiChainBalances(address, ethUsdPrice)
  const { positions, summary }     = useYieldPositions(address, ethUsdPrice, pools)

  // ── Compute optimal allocation for the same capital ───────────────────────
  const deployed      = summary?.totalUsd ?? 0

  const optimal = useMemo(() => {
    if (deployed === 0) return null
    const allocation = buildAllocation(deployed, pools)
    const weightedApy = allocation.reduce((s, row) =>
      row.pool ? s + row.pool.apy * row.fraction : s
    , 0)
    return { allocation, weightedApy }
  }, [deployed, pools])

  // ── Delta calculation ──────────────────────────────────────────────────────
  const delta = useMemo(() => {
    if (!summary || !optimal) return null
    const apyDelta      = optimal.weightedApy - summary.weightedApy
    const annualDelta   = deployed * (apyDelta / 100)
    return { apyDelta, annualDelta }
  }, [summary, optimal, deployed])

  // Don't render if no wallet or nothing to rebalance
  if (!address) return null
  if (!summary || !delta) return <NoPositionsTip availableUsd={availableUsd} />
  if (delta.apyDelta < 0.1) return <AlreadyOptimalState summary={summary} />

  return (
    <div className={styles.wrapper}>
      {/* ── Opportunity header ────────────────────────────────────── */}
      <div className={styles.opportunityHeader}>
        <div className={styles.opportunityIcon}>⬆</div>
        <div className={styles.opportunityText}>
          <div className={styles.opportunityTitle}>
            You could earn{' '}
            <strong className={styles.deltaHighlight}>
              +{delta.apyDelta.toFixed(1)}% more
            </strong>
          </div>
          <div className={styles.opportunitySub}>
            ~{formatWholeUsd(delta.annualDelta)} extra per year
            · same risk profile · better pools available now
          </div>
        </div>
      </div>

      {/* ── Current vs Optimal ───────────────────────────────────── */}
      <div className={styles.comparisonGrid}>
        <ComparisonCard
          label="You're earning"
          apy={summary.weightedApy}
          annualReturn={summary.annualReturn}
          variant="current"
          positionCount={positions.length}
        />
        <div className={styles.arrow}>→</div>
        <ComparisonCard
          label="You could earn"
          apy={optimal!.weightedApy}
          annualReturn={deployed * (optimal!.weightedApy / 100)}
          variant="optimal"
        />
      </div>

      {/* ── Optimal allocation breakdown ─────────────────────────── */}
      <div className={styles.allocationBreakdown}>
        <div className={styles.breakdownLabel}>Suggested reallocation</div>
        {optimal!.allocation.map(row => row.pool && (
          <div key={row.band} className={styles.breakdownRow}>
            <div className={styles.breakdownLeft}>
              <span className={`badge badge--${row.band === 'anchor' ? 'green' : row.band === 'balanced' ? 'accent' : 'yellow'}`}>
                {row.label}
              </span>
              <span className={styles.breakdownPool}>
                {row.pool.project} · {row.pool.symbol}
              </span>
            </div>
            <div className={styles.breakdownRight}>
              <span className={styles.breakdownAmount}>
                {formatWholeUsd(row.amountUsd)}
              </span>
              <span className={styles.breakdownApy}>
                {formatApy(row.pool.apy)}
              </span>
              {row.intent && (
                <RouteButton
                  intent={row.intent}
                  amountUsd={row.amountUsd}
                  variant="compact"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── CTA ──────────────────────────────────────────────────── */}
      <div className={styles.ctaRow}>
        <button
          className={styles.wizardCta}
          onClick={() => {
            document.getElementById('allocation-wizard')?.scrollIntoView({
              behavior: 'smooth', block: 'start',
            })
          }}
        >
          Plan full reallocation in Wizard ↓
        </button>
        <span className={styles.ctaNote}>
          No transaction initiated here · review on 1inch before confirming
        </span>
      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ComparisonCard({ label, apy, annualReturn, variant, positionCount }: {
  label:          string
  apy:            number
  annualReturn:   number
  variant:        'current' | 'optimal'
  positionCount?: number
}) {
  return (
    <div className={`${styles.compCard} ${styles[`compCard--${variant}`]}`}>
      <div className={styles.compLabel}>{label}</div>
      <div className={styles.compApy}>{apy.toFixed(2)}%</div>
      <div className={styles.compReturn}>
        ~{formatWholeUsd(annualReturn)}/yr
      </div>
      {positionCount !== undefined && (
        <div className={styles.compMeta}>{positionCount} active position{positionCount !== 1 ? 's' : ''}</div>
      )}
    </div>
  )
}

function NoPositionsTip({ availableUsd }: { availableUsd: number }) {
  if (availableUsd < 100) return null
  return (
    <div className={styles.tipBanner}>
      <span className={styles.tipIcon}>💡</span>
      <span>
        You have{' '}
        <strong>{formatWholeUsd(availableUsd)}</strong>{' '}
        in undeployed capital across your wallets.
        Use the <strong>Deploy Capital Wizard</strong> below to put it to work.
      </span>
    </div>
  )
}

function AlreadyOptimalState({ summary }: { summary: { weightedApy: number; totalUsd: number } }) {
  return (
    <div className={styles.optimalBanner}>
      <span className={styles.optimalIcon}>✓</span>
      <span>
        Your {formatUsd(summary.totalUsd)} is already earning{' '}
        <strong>{summary.weightedApy.toFixed(1)}% APY</strong>.
        That&apos;s near-optimal for the current pool landscape.
      </span>
    </div>
  )
}

