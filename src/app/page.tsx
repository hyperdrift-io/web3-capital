import Link from 'next/link'
import styles from './page.module.css'

const MODULES = [
  {
    href: '/yield',
    icon: '◈',
    name: 'Yield Discovery',
    description: 'Live APY across DeFi protocols, ranked by Capital Efficiency Score — risk-adjusted, not just maximum yield.',
    tag: 'DeFi Llama · Live data',
  },
  {
    href: '/capital',
    icon: '◉',
    name: 'Capital View',
    description: 'Connect your wallet. See available capital, network context, and projected returns at current yields.',
    tag: 'wagmi · viem · On-chain reads',
  },
]

const STACK = [
  { label: 'Frontend',  value: 'Next.js 14, React, CSS Modules' },
  { label: 'Web3',      value: 'wagmi v2, viem, WalletConnect' },
  { label: 'Data',      value: 'DeFi Llama Yields API (live)' },
  { label: 'Deploy',    value: 'PM2 · Nginx · web3.hyperdrift.io' },
]

export default function HomePage() {
  return (
    <>
      <section className={styles.hero}>
        <div className="container">
          <div className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            Capital Engine
          </div>
          <h1 className={styles.headline}>
            Allocate capital across DeFi with clarity
          </h1>
          <p className={styles.subline}>
            Yield discovery, wallet integration, and risk-adjusted projections
            in a single interface. Built for capital allocators — not yield chasers.
          </p>
          <div className={styles.actions}>
            <Link href="/yield" className="btn btn--primary">Explore Yields</Link>
            <Link href="/capital" className="btn btn--ghost">Connect Wallet</Link>
          </div>
        </div>
      </section>

      <section className={styles.modules}>
        <div className="container">
          <div className={styles.sectionTitle}>Modules</div>
          <div className={styles.moduleGrid}>
            {MODULES.map(m => (
              <Link key={m.href} href={m.href} className={styles.moduleCard}>
                <div className={styles.moduleIcon}>{m.icon}</div>
                <div className={styles.moduleName}>{m.name}</div>
                <p className={styles.moduleDesc}>{m.description}</p>
                <div className={styles.moduleTag}>
                  {m.tag} →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.thesis}>
        <div className="container">
          <div className={styles.thesisGrid}>
            <div className={styles.thesisText}>
              <h2>Why Capital Engine?</h2>
              <p>
                Most DeFi yield tools optimize for maximum APY. Capital Engine is built
                for a different question: <em>where should I allocate, given my risk tolerance?</em>
              </p>
              <p>
                The Capital Efficiency Score combines yield, protocol safety, and
                liquidity depth — the same variables a capital allocator considers,
                not just the rate at the top of a sorted list.
              </p>
              <p>
                Protocols are grouped into allocation bands: Anchor (core, battle-tested),
                Balanced (satellite allocation), and Opportunistic (high-yield, capped exposure).
                This is how institutional capital thinks about DeFi.
              </p>
            </div>
            <div>
              <div className={styles.sectionTitle} style={{ marginBottom: 'var(--space-4)' }}>
                Stack
              </div>
              <div className={styles.stack}>
                {STACK.map(s => (
                  <div key={s.label} className={styles.stackItem}>
                    <span className={styles.stackLabel}>{s.label}</span>
                    <span className={styles.stackValue}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
