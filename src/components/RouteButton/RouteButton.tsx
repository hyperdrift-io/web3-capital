import type { RouteIntent } from '@/lib/routing'
import styles from './RouteButton.module.css'

type Props = {
  intent: RouteIntent
  amountUsd: number
  /** 'full' = label + estimated output + button; 'compact' = icon only */
  variant?: 'full' | 'compact'
  estimatedOutput?: string | null
}

/**
 * Routing CTA that deep-links to 1inch (or Aave for direct deposits).
 *
 * Iteration 3: shows routing *intent* only — no execution, no approval.
 * The user lands on 1inch with source/target/amount pre-filled and
 * completes the swap there. This is a deliberate stepping stone:
 *
 *   Iter 3 → 1inch deep-link (UI for free, zero code)
 *   Iter 5 → 0x Gasless API (meta-tx, relayer pays gas, no popup)
 */
export function RouteButton({ intent, amountUsd, variant = 'full', estimatedOutput }: Props) {
  const { url, isSameToken, fromSymbol, toSymbol, protocolLabel } = intent

  const depositTarget = protocolLabel ?? 'Aave'
  const label = isSameToken ? `Deposit on ${depositTarget}` : `Swap on 1inch`
  const sublabel = isSameToken
    ? `${formatUsd(amountUsd)} USDC → ${toSymbol} pool`
    : estimatedOutput
      ? `${formatUsd(amountUsd)} ${fromSymbol} → ${estimatedOutput}`
      : `${formatUsd(amountUsd)} ${fromSymbol} → ${toSymbol}`

  if (variant === 'compact') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.compact}
        title={sublabel}
        aria-label={label}
      >
        Route →
      </a>
    )
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.routeInfo}>
        <span className={styles.routeLabel}>
          {isSameToken ? '⬇ Direct deposit' : '⇄ Route via 1inch'}
        </span>
        <span className={styles.routeSub}>{sublabel}</span>
      </div>
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={styles.button}
      >
        {label} ↗
      </a>
    </div>
  )
}

function formatUsd(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`
  return `$${n.toFixed(0)}`
}
