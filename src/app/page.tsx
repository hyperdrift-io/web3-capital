import Link from 'next/link'
import styles from './page.module.css'

const MODULES = [
  {
    href: '/yield',
    icon: '◈',
    name: 'Yield Discovery',
    description: 'Live APY across 8,000+ DeFi pools, scored by capital efficiency — not raw yield. Grouped into Anchor, Balanced, and Opportunistic bands.',
    tag: 'Live · 150+ pools ranked',
  },
  {
    href: '/capital',
    icon: '◉',
    name: 'Capital View',
    description: 'Connect with a smart wallet (passkey) or browser wallet. See your real on-chain balance and projected returns at current yields.',
    tag: 'Smart wallet · Passkey · No seed phrase',
  },
]

const SIGNALS = [
  { icon: '⬡', label: 'Protocol safety score', sub: 'Tier-1/2 curation, audit flags, IL risk' },
  { icon: '◎', label: 'Capital Efficiency Score', sub: 'Yield × safety × TVL depth' },
  { icon: '⬡', label: 'Allocation bands', sub: 'Anchor · Balanced · Opportunistic' },
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
            Where should your capital go?
          </h1>
          <p className={styles.subline}>
            8,000+ DeFi yield opportunities. One score that cuts through the noise.
            Connect your wallet and see your returns — no approvals required.
          </p>
          <div className={styles.actions}>
            <Link href="/yield" className="btn btn--primary">Explore Yields</Link>
            <Link href="/capital" className="btn btn--ghost">Connect Wallet</Link>
          </div>
        </div>
      </section>

      <section className={styles.modules}>
        <div className="container">
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

          <div className={styles.signals}>
            {SIGNALS.map(s => (
              <div key={s.label} className={styles.signalItem}>
                <span className={styles.signalIcon}>{s.icon}</span>
                <span className={styles.signalLabel}>{s.label}</span>
                <span className={styles.signalSub}>{s.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className="container">
          <div className={styles.footerInner}>
            <span className={styles.footerBrand}>Capital Engine</span>
            <div className={styles.footerLinks}>
              <a href="https://github.com/hyperdrift-io/web3-capital" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://hyperdrift.io/blog/web3-capital-engine-architecture-roadmap" target="_blank" rel="noopener noreferrer">Article</a>
              <Link href="/yield">Yield</Link>
              <Link href="/capital">Capital</Link>
            </div>
          </div>
        </div>
      </footer>
    </>
  )
}
