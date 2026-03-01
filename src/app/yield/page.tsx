import { fetchTopPools } from '@/lib/defillama'
import { YieldTable } from '@/components/YieldTable/YieldTable'
import { AllocationBands } from '@/components/AllocationBands/AllocationBands'
import styles from './page.module.css'

export const revalidate = 300 // 5 min ISR

export const metadata = {
  title: 'Yield Discovery — Capital Engine',
  description: 'Top DeFi pools ranked by Capital Efficiency Score. Risk-adjusted yield across Ethereum, Arbitrum, Base, and more.',
}

export default async function YieldPage() {
  const pools = await fetchTopPools(150)

  const totalTvl = pools.reduce((s, p) => s + p.tvlUsd, 0)
  const avgApy   = pools.reduce((s, p) => s + p.apy, 0)   / pools.length

  function formatTvl(n: number) {
    if (n >= 1e12) return `$${(n / 1e12).toFixed(1)}T`
    if (n >= 1e9)  return `$${(n / 1e9).toFixed(1)}B`
    return `$${(n / 1e6).toFixed(0)}M`
  }

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Yield Discovery</h1>
          <p className={styles.subtitle}>
            Live protocol yields, ranked by Capital Efficiency Score
          </p>
        </div>

        <div className={styles.metaBar}>
          <span className={styles.metaLive}>
            <span className={styles.liveDot} />
            Live
          </span>
          <span className={styles.metaItem}>{pools.length} pools</span>
          <span className={styles.metaItem}>TVL {formatTvl(totalTvl)}</span>
          <span className={styles.metaItem}>Avg APY {avgApy.toFixed(1)}%</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-muted)' }}>
            Source: DeFi Llama · refreshes every 5 min
          </span>
        </div>

        <div className={styles.bands}>
          <div className={styles.sectionLabel}>Allocation bands</div>
          <AllocationBands pools={pools} />
        </div>

        <div className={styles.tableSection}>
          <div className={styles.sectionLabel}>All pools</div>

          <div className={styles.ceExplainer}>
            <span className={styles.ceIcon}>◈</span>
            <span>
              <strong style={{ color: 'var(--text-primary)' }}>Capital Efficiency Score</strong> combines
              APY (40%), protocol safety (45%), and TVL depth (15%).
              A high score means the yield is real, the protocol is battle-tested, and there&apos;s enough
              liquidity to enter and exit without slippage.
            </span>
          </div>

          <YieldTable pools={pools} />
        </div>
      </div>
    </div>
  )
}
