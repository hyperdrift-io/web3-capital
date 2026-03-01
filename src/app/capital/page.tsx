import { fetchTopPools } from '@/lib/defillama'
import { CapitalProjection } from '@/components/CapitalProjection/CapitalProjection'
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
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Capital View</h1>
          <p className={styles.subtitle}>
            Your on-chain capital, yield context, and projected returns — all in one place.
          </p>
        </div>

        <CapitalProjection
          topAnchorPool={topAnchorPool}
          topBalancedPool={topBalancedPool}
        />
      </div>
    </div>
  )
}
