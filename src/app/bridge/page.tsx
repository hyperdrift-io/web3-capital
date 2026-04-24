import { fetchTopPools } from '@/lib/defillama'
import { BridgeThenDeploy } from '@/components/BridgeThenDeploy/BridgeThenDeploy'
import styles from './page.module.css'

export const revalidate = 300

export const metadata = {
  title: 'Bridge & Deploy — Capital Engine',
  description: 'Bridge your stablecoins cross-chain — EVM or Solana — via Wormhole CCTP and NTT. No wrapped tokens. Deploy straight into the best yield opportunity.',
}

export default async function BridgePage() {
  const pools = await fetchTopPools(150)
  const topAnchorPool = pools.find(p => p.band === 'anchor') ?? null

  return (
    <div className={styles.page} data-testid="smoke-bridge">
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Bridge &amp; Deploy</h1>
          <p className={styles.subtitle}>
            Move stablecoins cross-chain — EVM or Solana — with Wormhole CCTP and NTT.
            Native burn-and-mint, no wrapped tokens. Then deploy straight into the best opportunity.
          </p>
        </div>

        <div className={styles.content}>
          <BridgeThenDeploy topPool={topAnchorPool} />
        </div>
      </div>
    </div>
  )
}
