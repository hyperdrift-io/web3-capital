import { fetchTopPools } from '@/lib/defillama'
import { BridgeThenDeploy } from '@/components/BridgeThenDeploy/BridgeThenDeploy'
import styles from './page.module.css'

export const revalidate = 300

export const metadata = {
  title: 'Bridge & Deploy — Capital Engine',
  description: 'Bridge ETH, USDC, WBTC, wstETH and more cross-chain — EVM or Solana — via Wormhole. No wrapped tokens. Deploy straight into the highest CE-scored yield opportunity.',
}

export default async function BridgePage({ searchParams }: { searchParams: { pool?: string } }) {
  const { pool: poolId } = searchParams
  const pools = await fetchTopPools(150)
  const topAnchorPool = poolId
    ? (pools.find(p => p.pool === poolId) ?? pools.find(p => p.band === 'anchor') ?? null)
    : (pools.find(p => p.band === 'anchor') ?? null)

  return (
    <div className={styles.page} data-testid="smoke-bridge">
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Bridge &amp; Deploy</h1>
          <p className={styles.subtitle}>
            Move ETH, USDC, WBTC, wstETH and more cross-chain — EVM or Solana — via Wormhole.
            No wrapped tokens. Then deploy straight into the highest CE-scored opportunity.
          </p>
        </div>

        <div className={styles.content}>
          <BridgeThenDeploy topPool={topAnchorPool} />
        </div>
      </div>
    </div>
  )
}
