import { fetchTopPools } from '@/lib/defillama'
import { YieldStreamProvider } from '@/components/YieldStreamProvider/YieldStreamProvider'
import styles from './page.module.css'

export const revalidate = 300 // ISR snapshot: fast initial HTML, SSE upgrades to live on client

export const metadata = {
  title: 'Yield Discovery — Capital Engine',
  description: 'Top DeFi pools ranked by Capital Efficiency Score. Risk-adjusted yield across Ethereum, Arbitrum, Base, and more.',
}

export default async function YieldPage() {
  // Fetched once per server render (ISR: every 5 min) — provides immediate HTML.
  // The client-side SSE stream takes over from here with live updates.
  const initialPools = await fetchTopPools(150)

  return (
    <div className={styles.page} data-testid="smoke-yield">
      <div className="container">
        <div className={styles.header}>
          <h1 className={styles.title}>Yield Discovery</h1>
          <p className={styles.subtitle}>
            Live protocol yields, ranked by Capital Efficiency Score
          </p>
        </div>

        <YieldStreamProvider initialPools={initialPools} />
      </div>
    </div>
  )
}
