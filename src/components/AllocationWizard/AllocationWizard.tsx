'use client'

import { useState, useMemo, useEffect } from 'react'
import { useAccount } from 'wagmi'
import type { Pool } from '@/types/protocol'
import { buildAllocation, type BandAllocation } from '@/lib/routing'
import { formatApy, formatUsd } from '@/lib/format'
import { RouteButton } from '@/components/RouteButton/RouteButton'
import { CEScoreBreakdown } from '@/components/CEScoreBreakdown/CEScoreBreakdown'
import { useEthUsdPrice } from '@/hooks/useEthUsdPrice'
import { useMultiChainBalances } from '@/hooks/useMultiChainBalances'
import styles from './AllocationWizard.module.css'

type Props = {
  pools: Pool[]
}

const BAND_COLORS: Record<string, string> = {
  anchor:        'var(--green)',
  balanced:      'var(--accent)',
  opportunistic: 'var(--yellow, #f59e0b)',
}

const MIN_DEPLOY = 100
const DEFAULT_AMOUNT = 5_000

/**
 * Allocation Wizard — Iteration 3.2+
 *
 * Wallet-aware: when connected, auto-populates the deploy amount from the
 * user's real multi-chain portfolio total and prefers pools whose underlying
 * tokens match what the user actually holds.
 *
 * UX principle: the user thinks in dollars ("I want to deploy $5,000").
 * The wizard handles band selection, pool ranking, and routing prep.
 * They never need to understand what a pool is.
 */
export function AllocationWizard({ pools }: Props) {
  const { address, isConnected } = useAccount()
  const ethUsdPrice = useEthUsdPrice()
  const { totalUsd, chainsWithBalance, isLoading: balancesLoading } = useMultiChainBalances(address, ethUsdPrice)

  // Derive the set of token symbols the user actually holds (for token-aware pool selection)
  const heldTokenSymbols = useMemo(
    () => chainsWithBalance.flatMap(c => c.tokens.map(t => t.meta.symbol.toUpperCase())),
    [chainsWithBalance],
  )

  const [amount, setAmount] = useState(DEFAULT_AMOUNT)
  const [input,  setInput]  = useState(DEFAULT_AMOUNT.toString())
  const [custom, setCustom] = useState<Record<string, number>>({})
  // Open by default — user has capital to deploy, no reason to hide this
  const [open, setOpen] = useState(true)
  // Track whether the amount has been manually overridden
  const [amountOverridden, setAmountOverridden] = useState(false)

  // Auto-populate from wallet total when balances load (only if not manually changed)
  useEffect(() => {
    if (isConnected && !balancesLoading && totalUsd >= MIN_DEPLOY && !amountOverridden) {
      const rounded = Math.floor(totalUsd)
      setAmount(rounded)
      setInput(rounded.toString())
    }
  }, [isConnected, balancesLoading, totalUsd, amountOverridden])

  const fractions = useMemo(() => ({
    anchor:        custom.anchor        ?? 0.50,
    balanced:      custom.balanced      ?? 0.30,
    opportunistic: custom.opportunistic ?? 0.20,
  }), [custom])

  const allocation = useMemo(
    () => buildAllocation(amount, pools, fractions, heldTokenSymbols),
    [amount, pools, fractions, heldTokenSymbols],
  )

  const totalPct    = Object.values(fractions).reduce((s, v) => s + v, 0)
  const isValid     = amount >= MIN_DEPLOY && Math.abs(totalPct - 1) < 0.001
  const weightedApy = allocation.reduce((s, row) =>
    row.pool ? s + row.pool.apy * row.fraction : s
  , 0)

  const showWalletHint = isConnected && !balancesLoading && totalUsd >= MIN_DEPLOY && !amountOverridden

  function handleAmountChange(raw: string) {
    setInput(raw)
    setAmountOverridden(true)
    const n = parseFloat(raw.replace(/[^0-9.]/g, ''))
    if (!isNaN(n)) setAmount(n)
  }

  function handleSlider(band: string, value: number) {
    const others = ['anchor', 'balanced', 'opportunistic'].filter(b => b !== band)
    const remaining = 1 - value
    const otherTotal = others.reduce((s, b) => s + (custom[b] ?? fractions[b as keyof typeof fractions]), 0)
    if (otherTotal === 0) return
    const scale = remaining / otherTotal

    setCustom(prev => ({
      ...prev,
      [band]: value,
      ...Object.fromEntries(
        others.map(b => [b, Math.max(0, (prev[b] ?? fractions[b as keyof typeof fractions]) * scale)])
      ),
    }))
  }

  return (
    <div className={styles.wrapper}>
      {/* Entry toggle */}
      <button className={styles.trigger} onClick={() => setOpen(o => !o)}>
        <span className={styles.triggerIcon}>{open ? '▲' : '▼'}</span>
        <span className={styles.triggerLabel}>
          {open ? 'Close wizard' : 'Deploy Capital Wizard'}
        </span>
        <span className={styles.triggerSub}>
          Enter an amount → get an optimised split → route to 1inch
        </span>
      </button>

      {open && (
        <div className={styles.body}>
          {/* Amount input */}
          <div className={styles.amountRow}>
            <label className={styles.label} htmlFor="deploy-amount">
              I want to deploy
            </label>
            <div className={styles.amountInput}>
              <span className={styles.currencySymbol}>$</span>
              <input
                id="deploy-amount"
                type="number"
                min={MIN_DEPLOY}
                step={100}
                value={input}
                onChange={e => handleAmountChange(e.target.value)}
                className={styles.input}
                placeholder="5000"
              />
            </div>
            {amount >= MIN_DEPLOY && (
              <span className={styles.apyProjection}>
                Blended APY: <strong>{weightedApy.toFixed(1)}%</strong>
                {' '}·{' '}
                ~${(amount * weightedApy / 100).toFixed(0)}/yr
              </span>
            )}
          </div>

          {/* Wallet hint */}
          {showWalletHint && (
            <p className={styles.walletHint}>
              ◈ Using your wallet balance: {formatUsd(totalUsd)} across all chains
              {amountOverridden ? null : (
                <button
                  className={styles.resetHint}
                  onClick={() => {
                    setAmountOverridden(false)
                    const rounded = Math.floor(totalUsd)
                    setAmount(rounded)
                    setInput(rounded.toString())
                  }}
                >
                  Reset to wallet total
                </button>
              )}
            </p>
          )}

          {/* Band allocation sliders */}
          <div className={styles.sliders}>
            {allocation.map(row => (
              <div key={row.band} className={styles.sliderRow}>
                <span
                  className={styles.sliderLabel}
                  style={{ color: BAND_COLORS[row.band] }}
                >
                  {row.label}
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(row.fraction * 100)}
                  onChange={e => handleSlider(row.band, parseInt(e.target.value) / 100)}
                  className={styles.sliderInput}
                  style={{ '--thumb-color': BAND_COLORS[row.band] } as React.CSSProperties}
                />
                <span className={styles.sliderPct}>
                  {Math.round(row.fraction * 100)}%
                  {amount >= MIN_DEPLOY && (
                    <span className={styles.sliderAmt}> · {formatUsd(row.amountUsd)}</span>
                  )}
                </span>
              </div>
            ))}
            {!isValid && Math.abs(totalPct - 1) > 0.001 && (
              <p className={styles.sliderError}>
                Allocations must sum to 100% (currently {Math.round(totalPct * 100)}%)
              </p>
            )}
          </div>

          {/* Allocation table */}
          {amount >= MIN_DEPLOY && (
            <div className={styles.allocationGrid}>
              {allocation.map(row => (
                <AllocationRow key={row.band} row={row} />
              ))}
            </div>
          )}

          {amount < MIN_DEPLOY && (
            <p className={styles.minNote}>Minimum deploy amount is ${MIN_DEPLOY}</p>
          )}

          <p className={styles.disclaimer}>
            Routing links open 1inch with pre-filled parameters. No transaction is initiated here.
            Review slippage and gas on 1inch before confirming.
          </p>
        </div>
      )}
    </div>
  )
}

// ── Allocation row ────────────────────────────────────────────────────────────

function AllocationRow({ row }: { row: BandAllocation }) {
  const { band, label, description, amountUsd, pool, intent } = row

  return (
    <div className={styles.allocRow}>
      <div className={styles.allocHeader}>
        <div className={styles.allocBand}>
          <span
            className={styles.allocBandDot}
            style={{ background: BAND_COLORS[band] }}
          />
          <div>
            <div className={styles.allocBandName}>{label}</div>
            <div className={styles.allocBandDesc}>{description}</div>
          </div>
        </div>
        <div className={styles.allocAmount}>
          ${amountUsd.toLocaleString('en-US', { maximumFractionDigits: 0 })}
        </div>
      </div>

      {pool ? (
        <>
          <div className={styles.poolRow}>
            <div className={styles.poolMeta}>
              <span className={styles.poolName}>{pool.project}</span>
              <span className={styles.poolSymbol}>{pool.symbol}</span>
            </div>
            <div className={styles.poolStats}>
              <span className={styles.poolApy}>{formatApy(pool.apy)}</span>
              <CEScoreBreakdown pool={pool}>
                <span className={`${styles.poolScore} ${ceClass(pool.capitalEfficiency)}`}>
                  ◈ {pool.capitalEfficiency}
                </span>
              </CEScoreBreakdown>
            </div>
          </div>

          {intent && (
            <RouteButton
              intent={intent}
              amountUsd={amountUsd}
              variant="full"
            />
          )}
        </>
      ) : (
        <p className={styles.noPool}>No pool available for this band</p>
      )}
    </div>
  )
}

function ceClass(score: number): string {
  if (score >= 70) return styles.ceHigh
  if (score >= 45) return styles.ceMid
  return styles.ceLow
}
