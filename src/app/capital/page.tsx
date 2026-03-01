import { fetchTopPools } from '@/lib/defillama'
import { CapitalProjection }  from '@/components/CapitalProjection/CapitalProjection'
import { PortfolioView }      from '@/components/PortfolioView/PortfolioView'
import { RebalancingPanel }   from '@/components/RebalancingPanel/RebalancingPanel'
import { AllocationWizard }   from '@/components/AllocationWizard/AllocationWizard'
import styles from './page.module.css'

export const revalidate = 300

export const metadata = {
  title: 'Capital View — Capital Engine',
  description: 'Connect your wallet to see available capital and projected returns at current DeFi yields.',
}

export default async function CapitalPage() {
  const pools = await fetchTopPools(150)

  const anchorPools   = pools.filter(p => p.band === 'anchor')
  const balancedPools = pools.filter(p => p.band === 'balanced')

  const topAnchorPool   = anchorPools[0]   ?? null
  const topBalancedPool = balancedPools[0] ?? null

  return (
    <div className={styles.page} data-testid="smoke-capital">
      <div className="container">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className={styles.header}>
          <h1 className={styles.title}>Capital View</h1>
          <p className={styles.subtitle}>
            Your full on-chain portfolio — across chains, active positions, and what you&apos;re leaving on the table.
          </p>
        </div>

        {/* ── 4.1 + 4.2: Multi-chain portfolio + yield positions ─── */}
        <div className={styles.section}>
          <PortfolioView pools={pools} />
        </div>

        {/* ── 4.3: Rebalancing recommendations ─────────────────── */}
        <div className={styles.section}>
          <RebalancingPanel pools={pools} />
        </div>

        {/* ── Single-chain projection (quick snapshot) ─────────── */}
        <div className={styles.section}>
          <div className={styles.sectionLabel}>Single-chain projection</div>
          <CapitalProjection
            topAnchorPool={topAnchorPool}
            topBalancedPool={topBalancedPool}
          />
        </div>

        {/* ── Allocation wizard ─────────────────────────────────── */}
        <div className={styles.section} id="allocation-wizard">
          <div className={styles.sectionLabel}>Deploy Capital</div>
          <AllocationWizard pools={pools} />
        </div>

      </div>
    </div>
  )
}
