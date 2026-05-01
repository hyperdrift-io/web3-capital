import { fetchTopPools } from '@/lib/defillama'
import { defaultBridgeDeployPool } from '@/lib/routing'
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
  const explicitMatch = poolId ? pools.find(p => p.pool === poolId) : undefined
  const topPool = explicitMatch ?? defaultBridgeDeployPool(pools)
  const selectionSubtitle = explicitMatch
    ? 'Opened from your link — always verify APY and protocol details.'
    : 'Matched across Anchor, Balanced, and Opportunistic bands using realistic yields (extreme APY outliers excluded).'

  return (
    <div className={styles.page} data-testid="smoke-bridge">
      <div className="container">
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Bridge &amp; Deploy</h1>
            <p className={styles.subtitle}>
              Move ETH, USDC, WBTC, wstETH and more cross-chain — EVM or Solana — via Wormhole.
              No wrapped tokens. Then deploy straight into the highest CE-scored opportunity.
            </p>
          </div>
          <aside className={styles.ticket} aria-label="Bridge route ticket">
            <div className={styles.ticketTop}>
              <span>Route ticket</span>
              <strong>Prepared</strong>
            </div>
            <div className={styles.ticketRoute}>
              <span>Source</span>
              <i />
              <span>Bridge</span>
              <i />
              <span>Deploy</span>
            </div>
            <p className={styles.ticketNote}>Verify asset, chain, and CE score before signing.</p>
          </aside>
        </div>

        <div className={styles.content}>
          <BridgeThenDeploy topPool={topPool} selectionSubtitle={selectionSubtitle} />
        </div>
      </div>
    </div>
  )
}
