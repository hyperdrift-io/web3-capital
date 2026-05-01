import Link from 'next/link'
import styles from './page.module.css'
import { HDCredit } from '@yannvr/analytics/client'
import { HugeiconsIcon } from '@hugeicons/react'
import {
  ChartAnalysisIcon,
  DashboardSpeed02Icon,
  Layers01Icon,
  SecurityCheckIcon,
  WalletDone01Icon,
} from '@hugeicons/core-free-icons'

const MODULES = [
  {
    href: '/yield',
    icon: ChartAnalysisIcon,
    name: 'Find defendable yield',
    description: 'Start with the short list, not the leaderboard. Every pool is scored by yield, safety, and liquidity depth before it earns attention.',
    tag: '150+ pools ranked',
  },
  {
    href: '/capital',
    icon: WalletDone01Icon,
    name: 'Build your allocation',
    description: 'Turn available capital into an Anchor, Balanced, and Opportunistic plan with balance context and deployment steps.',
    tag: 'Allocation planner',
  },
  {
    href: '/bridge',
    icon: Layers01Icon,
    name: 'Bridge before you deploy',
    description: 'Use Wormhole-powered routing to move the right asset toward the opportunity Capital Engine recommends.',
    tag: 'Wormhole Connect',
  },
]

const SIGNALS = [
  { icon: SecurityCheckIcon, label: 'Safety before yield', sub: 'Protocol tier, audit signals, IL risk' },
  { icon: DashboardSpeed02Icon, label: 'One score you can defend', sub: 'Yield x safety x liquidity depth' },
  { icon: Layers01Icon, label: 'A plan, not a table', sub: 'Anchor, Balanced, Opportunistic' },
]

const MEMO_ROWS = [
  { label: 'Capital Efficiency', value: '84', note: 'Strong yield with deep liquidity' },
  { label: 'Band', value: 'Anchor', note: 'Core allocation candidate' },
  { label: 'Proof', value: 'Open', note: 'Score breakdown available on demand' },
]

const RULES = [
  'Never chase yield you cannot explain.',
  'Treat bridges as execution, not adventure.',
  'If the score is high, the proof should be boring.',
]

export default function HomePage() {
  return (
    <>
      <section className={styles.hero} data-testid="smoke-home">
        <div className={`container ${styles.heroInner}`}>
          <div className={styles.heroCopy}>
            <div className={styles.brandLockup}>
              <img
                src="/branding/logo-capital-engine-power-03-score-recraft-vector.svg?v=white-green"
                alt=""
                className={styles.brandLogo}
              />
              <div>
                <div className={styles.eyebrow}>Capital Engine</div>
                <p className={styles.brandLine}>The calm allocation desk for on-chain capital.</p>
              </div>
            </div>
            <h1 className={styles.headline}>
              DeFi allocation for people with something to lose.
            </h1>
            <p className={styles.subline}>
              You want the upside without spending Sunday night decoding pool risk. Capital
              Engine turns 8,000+ opportunities into a short list you can understand, verify,
              and act on.
            </p>
            <div className={styles.actions}>
              <Link href="/capital#allocation-wizard" className="btn btn--primary" data-testid="cta-build-allocation">Build my allocation</Link>
              <Link href="/yield" className="btn btn--ghost" data-testid="cta-review-scores">Review the scores</Link>
            </div>
            <p className={styles.trustLine}>
              Built for the careful optimist: curious about DeFi, allergic to APY roulette.
            </p>
          </div>

          <aside className={styles.memoCard} aria-label="Example Capital Engine allocation memo">
            <div className={styles.memoStamp} aria-hidden="true">
              <img src="/branding/logo-capital-engine-power-03-score-recraft-vector.svg?v=white-green" alt="" />
            </div>
            <div className={styles.memoHeader}>
              <span className={styles.memoKicker}>Allocation memo</span>
              <span className={styles.memoStatus}>CE verified</span>
            </div>
            <div className={styles.memoScore}>
              <span>CE</span>
              <strong>84</strong>
            </div>
            <p className={styles.memoSummary}>
              Aave USDC clears the Anchor bar: real liquidity, mature protocol risk, and
              yield worth considering without pretending the risk is zero.
            </p>
            <div className={styles.memoRows}>
              {MEMO_ROWS.map(row => (
                <div key={row.label} className={styles.memoRow}>
                  <span className={styles.memoLabel}>{row.label}</span>
                  <span className={styles.memoValue}>{row.value}</span>
                  <span className={styles.memoNote}>{row.note}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className={styles.identity}>
        <div className="container">
          <div className={styles.identityGrid}>
            <div>
              <div className={styles.sectionTitle}>The old way</div>
              <p className={styles.identityStatement}>
                Chase the highest APY, open five tabs, decode bridge routes, then hope you did
                not just optimise your way into a bad night of sleep.
              </p>
            </div>
            <div>
              <div className={styles.sectionTitle}>The Capital Engine way</div>
              <p className={styles.identityStatement}>
                Think like an allocator: safety first, yield second, execution last. The app gives
                you the memo, the score, and the route without making you cosplay as a protocol analyst.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.rules}>
        <div className="container">
          <div className={styles.rulesCard}>
            <div className={styles.sectionTitle}>House rules</div>
            <div className={styles.rulesList}>
              {RULES.map((rule, index) => (
                <p key={rule} className={styles.ruleItem}>
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  {rule}
                </p>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.modules}>
        <div className="container">
          <div className={styles.moduleGrid}>
            {MODULES.map(m => (
              <Link key={m.href} href={m.href} className={styles.moduleCard}>
                <div className={styles.moduleIcon} aria-hidden="true">
                  <HugeiconsIcon icon={m.icon} size={24} color="currentColor" strokeWidth={1.5} />
                </div>
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
                <span className={styles.signalIcon} aria-hidden="true">
                  <HugeiconsIcon icon={s.icon} size={20} color="currentColor" strokeWidth={1.5} />
                </span>
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
              <Link href="/bridge">Bridge console</Link>
            </div>
          </div>
          <HDCredit />
        </div>
      </footer>
    </>
  )
}
