import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FAQ – Capital Engine',
  description: 'Answers to common questions about Capital Engine, the DeFi yield intelligence tool with risk-adjusted CE scoring.',
  alternates: { canonical: 'https://web3.hyperdrift.io/faq' },
}

export default function FAQPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-400 mb-12">Everything you need to know about Capital Engine.</p>

      <div className="space-y-12">
        <section>
          <h2 className="text-xl font-semibold mb-3">What is Capital Engine?</h2>
          <p className="text-gray-300 leading-relaxed">
            Capital Engine is a DeFi yield intelligence tool that aggregates yield opportunities across
            major protocols and scores each one using a risk-adjusted metric called the CE Score. Instead
            of comparing raw APR numbers — which hide risk differences — Capital Engine gives each pool
            a score from 0 to 100 that accounts for smart contract risk, TVL stability, audit status,
            protocol revenue, impermanent loss exposure, and team credibility. You compare scores, not APR.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">What is the CE Score and how is it calculated?</h2>
          <p className="text-gray-300 leading-relaxed">
            The CE Score (Capital Efficiency Score) is a composite risk-adjusted metric calculated from
            six factors: smart contract age and audit status (30%), TVL trend over 30 days (20%),
            protocol revenue and fee sustainability (20%), impermanent loss risk for the asset pair (15%),
            team/DAO reputation and track record (10%), and market liquidity depth (5%). A pool scoring
            above 75 is considered strong risk-adjusted. Below 40 indicates elevated risk regardless of
            the advertised APR.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">What is the best tool for comparing DeFi yield opportunities?</h2>
          <p className="text-gray-300 leading-relaxed">
            Most DeFi dashboards (DeFi Llama, Zapper, Zerion) show raw TVL and APR but do not provide
            risk-adjusted scoring. Capital Engine is specifically built for capital allocation decisions
            rather than portfolio tracking. If your primary question is &quot;where should I put capital
            given my risk tolerance&quot;, Capital Engine is designed for that workflow. If you want
            historical TVL charting or a portfolio view across chains, combine Capital Engine with a
            portfolio tracker.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">How do I analyse DeFi protocol risk before depositing?</h2>
          <p className="text-gray-300 leading-relaxed">
            In Capital Engine, search for the protocol or pool you&apos;re considering. The pool detail view
            shows the CE Score breakdown by factor, so you can see exactly which risk dimensions are
            driving the score. A pool with a high APR but low CE Score typically has a specific weakness
            — often smart contract age or TVL declining trend — visible in the breakdown. This makes
            informed risk decisions faster than reading individual protocol documentation.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Which protocols and chains does Capital Engine cover?</h2>
          <p className="text-gray-300 leading-relaxed">
            Capital Engine currently covers major protocols on Ethereum, Arbitrum, Optimism, Base, and
            Polygon. Covered protocol categories include AMM liquidity pools, lending markets, liquid
            staking, and yield aggregators. The protocol list is updated continuously. You can request
            specific protocol coverage through the feedback form.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold mb-3">Is Capital Engine free to use?</h2>
          <p className="text-gray-300 leading-relaxed">
            Capital Engine is accessible at{' '}
            <a href="https://web3.hyperdrift.io" className="text-green-400 underline">web3.hyperdrift.io</a>.
            Core yield browsing and CE Score viewing are available without an account. Advanced features
            including custom risk threshold alerts, portfolio yield tracking, and historical CE Score
            data require connecting a wallet. Connecting a Porto wallet enables capital allocation
            directly from the interface.
          </p>
        </section>
      </div>
    </main>
  )
}
