# From YieldMax to Capital Engine: Building a Federated Web3 Capital Platform

*March 2026 — by Yann*

---

## Where This Started

Every product in this space started as a question someone couldn't answer cleanly.

Mine was this: *given the capital I actually have, connected to a real wallet, on real chains — where should it go?*

The answer required three things that didn't exist in the same place: yield data, risk framing, and wallet-native UX. So over the past couple of years I built toward it incrementally — starting with a CLI yield aggregator, pivoting through an algorithmic trading agent, and landing on Capital Engine as the synthesis. This article tells that story, explains the current architecture, and maps out where it goes next.

---

## YieldMax: The Precursor

**YieldMax** was the first piece. A CLI tool and then a small web interface that fetched yield data from DeFi Llama, sorted by APY, and displayed the top opportunities across major protocols. It did one thing: answer "where is APY highest right now?" quickly.

It was useful at the time, primarily as a research tool — a faster way to scan the yield landscape than manually visiting Aave, Compound, Lido, and a dozen smaller protocols. But it was also a symptom of a first-generation problem.

The DeFi yield tooling space has matured significantly since then. Apps like [Exponential.fi](https://exponential.fi/) now offer deep risk research, curated pool ratings, whitepaper-backed risk methodology, and protocol-level analysis with editorial quality. Exponential brings a full investment research workflow to DeFi pools — risk ratings, position analysis, asset context — with a level of curation that a scraping layer on top of a public API cannot replicate on its own.

YieldMax was superseded by tools like this. The raw sorting problem is solved.

**So what problem isn't solved yet?**

The gap isn't information access — it's the distance between *knowing* where to allocate and *actually doing it* with your own capital, from your own wallet, with the confidence that what you're reading reflects your specific situation.

---

## How the DeFi Llama Connection Works (and Why It's a Feature, Not a Limitation)

Capital Engine connects directly to the [DeFi Llama Yields API](https://defillama.com/docs/api) — no intermediary, no proprietary data layer, no API key.

The raw API returns 8,000+ pools across hundreds of protocols. The response payload is ~17MB of JSON. This is not a limitation we paper over — it's the starting point.

The pipeline:

1. **Fetch** — server-side, on a 5-minute ISR cycle. The 17MB response is processed once per render cycle on the server and served as pre-rendered HTML to every subsequent request. The raw response never hits the client.
2. **Filter** — pools with `apy > 0` and `tvlUsd >= $1M` are kept. This removes zombie pools, dust positions, and illiquid traps.
3. **Score** — each pool receives a Capital Efficiency Score (0–100), a weighted composite of yield (40%), safety (45%), and TVL depth (15%). The safety component penalises impermanent loss exposure, mercenary reward flags, unaudited protocols, and low TVL, while rewarding Tier-1 protocol membership and stablecoin exposure.
4. **Band** — pools are grouped into Anchor (core allocation, safe), Balanced (satellite, measured risk), and Opportunistic (high yield, capped exposure).
5. **Render** — the user gets a sorted, banded, scored table with chain context and allocation semantics. Not a raw APY list.

The difference from YieldMax is not the data source — both use DeFi Llama. The difference is the *layer of judgment* applied on top: the scoring algorithm transforms protocol metadata into capital allocator semantics. The question shifts from "what has the highest APY?" to "where should I put my capital given what I know about these protocols?"

This is also why Capital Engine doesn't compete directly with Exponential.fi. Exponential applies editorial research and manual curation — high signal, lower breadth. Capital Engine applies algorithmic scoring at full breadth — every pool DeFi Llama tracks, ranked by a consistent methodology. They're complementary views on the same underlying data.

---

## Alpha-Drift: The Trading Agent

While YieldMax was solving the yield visibility problem, **[alpha-drift](https://github.com/hyperdrift-io/alpha-drift)** was exploring a different question: *can momentum, carry, and arbitrage signals be captured automatically?*

Alpha-drift is a CLI-first trading agent built around three strategy classes:
- **Momentum** — trend-following across pairs based on price velocity
- **Carry** — exploiting yield differentials between correlated assets
- **Arb** — cross-DEX price discrepancies with execution latency constraints

The CLI format was a deliberate choice. Trading agents live in a world of logs, cron jobs, and direct RPC calls. The feedback loop is the terminal, not the browser. A trading agent that wraps itself in a React UI early is a trading agent that's optimising the wrong thing.

Alpha-drift demonstrated something important: the execution layer in DeFi is fast, adversarial, and requires a different architecture from the discovery layer. Gas estimation, slippage tolerance, MEV protection, and transaction retry logic are concerns that don't belong in a Next.js app. They belong in a dedicated execution agent — TypeScript or Rust, with direct RPC access, built for correctness and speed.

**The integration path:** Alpha-drift doesn't need to become a web app. It needs to become a *service* that Capital Engine can dispatch work to. The natural seam is: Capital Engine's allocation bands identify *where* capital should go → alpha-drift's execution layer handles *how* it gets there. A simple API contract between the two — `POST /execute { pool, amount, strategy }` — is all that's needed. The CLI agent becomes the backend of the platform's execution module.

---

## Capital Engine: The Synthesis

Capital Engine is the interface layer that the previous experiments were pointing toward.

It's not a trading tool — it doesn't execute. It's not a research database — it doesn't do editorial curation. It's the product that sits between a user with capital and a DeFi ecosystem of 8,000+ yield opportunities, and makes the answer to "where should I put this?" legible and actionable.

### Wallet Security: Keep the Connector Secondary

One of the architectural choices worth explaining is keeping wallet mechanics out of the primary product story.

The dominant model — BIP-39 seed phrases — is a static secret that, if compromised, gives an attacker permanent, irrevocable access to everything. No revocation. No 2FA. One phishing link and it's gone.

Capital Engine should let the user choose their trust model without making connector education the headline. The product earns attention through allocation quality, transparent scoring, and clear routing before it asks users to think about execution.

### The Architecture Decisions

**Server components for data, client components for interactivity.** The yield and capital pages are async server components. The DeFi Llama response is processed server-side on a 5-minute ISR cycle. The user gets a rendered, indexed page instantly. Only `YieldTable`, `WalletButton`, and `CapitalProjection` are `'use client'` — they're the components that actually need the browser.

**No Tailwind.** CSS Modules with design tokens throughout. Full control, no build-time purge configuration, no utility proliferation in JSX. Readable components, readable styles, no framework dependency.

**ETH price hardcoded at $3,200.** This is a known limitation, called out explicitly in the codebase. The capital projections are illustrative until a Pyth or Chainlink oracle is integrated. Hiding this would be dishonest; surfacing it is part of the product's integrity.

### Testing: What Was Built and What Was Deferred

The test pyramid is:

- **Unit tests (Vitest)** — the Capital Efficiency Score algorithm: boundary conditions, tier bonuses, penalties, weighting. If this is wrong, everything downstream is noise.
- **Component tests (Testing Library)** — the WalletButton state machine (disconnected → connecting → connected → error), the YieldTable sort logic.
- **E2E tests (Playwright)** — full wallet connect/disconnect/capital page flows using a lightweight EIP-1193 + EIP-6963 mock wallet injected before page scripts run. The yield E2E tests intentionally hit the live DeFi Llama API — the point is to verify the full pipeline, not a mock.

**[Synpress](https://synpress.io/) was deliberately held off.** Synpress automates real browser extension wallets (MetaMask) in Playwright. It's the right tool for testing transaction submission, approval flows, and the MetaMask popup lifecycle. It was not the right tool for this iteration, for a precise reason: *Capital Engine is currently read-only*. The wallet flow reads balance and block number. No approvals. No transaction signing. A lightweight mock that drives the full wagmi state machine is faster (no 3–5 minute extension warm-up), more reliable (no extension version drift in CI), and tests exactly as much surface area as the current product requires.

Synpress becomes necessary in the next iteration — when off-chain reads are complemented by on-chain execution. Approval flows require a real signing surface. That's when its overhead earns its place.

---

## The Roadmap

### Iteration 1 — Current (Live)

- ✅ Yield discovery: 150+ pools ranked by Capital Efficiency Score
- ✅ Allocation bands: Anchor / Balanced / Opportunistic
- ✅ Wallet connect: injected + Porto
- ✅ On-chain reads: ETH balance, network, block number
- ✅ Capital projections at anchor and balanced APY
- ✅ Unit, component, and E2E test coverage
- ✅ Live at [web3.hyperdrift.io](https://web3.hyperdrift.io)

### Iteration 2 — Complete the Read Layer

- Price oracle (Pyth / Chainlink) — replace hardcoded ETH price
- ERC20 token balances — USDC, USDT, WBTC
- WalletConnect v2 — mobile wallet support
- Synpress E2E layer — warranted once transaction flows exist

### Iteration 3 — Capital Routing (Intent Layer)

- 1-click routing to DEX aggregator (1inch / 0x) pre-filled with target pool and amount
- Allocation wizard: enter an amount → split across bands → clickable routes
- Per-protocol historical drawdown from DeFi Llama TVL history
- Audit status badges

### Iteration 4 — On-Chain Execution

- Protocol adapters: standardised deposit/withdraw over Aave v3, Compound v3, Lido, Curve
- Session keys (Porto / EIP-7702): scoped sessions for approved operations without per-transaction signing prompts
- Alpha-drift execution service integration — Capital Engine surfaces the allocation, alpha-drift executes
- Gas sponsorship via EIP-7702 paymaster
- Transaction tracking, position state, P&L display

### On Staking

Staking is not a standalone feature — it's a subcase of the protocol adapter pattern in Iteration 4. Lido stETH is `adapter.deposit(amount)`. Building it now as a one-off creates a parallel code path that conflicts with the adapter architecture and ships without the capital routing context that makes it a meaningful user decision. **Staking ships in Iteration 4 alongside the other adapters.**

---

## The Platform: Federating the Experiments

The long-term intent, written in the original mission doc and now coming into clearer resolution:

> *Capital Engine becomes a federated Web3 financial system interface — demonstrating real integration, financial logic, UX clarity, and execution maturity.*

What that looks like concretely:

A portal under `hyperdrift.io` that unifies:

| Layer | Component | Role |
|-------|-----------|------|
| Discovery | Capital Engine — yield table, band scoring | What to consider |
| Analysis | Research layer — drawdown history, audit status, protocol context | Whether to trust it |
| Intent | Allocation wizard — how much, which band, which chains | What to do |
| Execution | Alpha-drift service + protocol adapters | Actually doing it |
| Monitoring | Position tracking, P&L, rebalance alerts | Staying in control |

Each piece already exists in some form. YieldMax's data layer is absorbed by Capital Engine. Alpha-drift's execution engine is a service waiting for a dispatch contract. The portal is the frame that makes them a coherent product rather than a collection of experiments.

This is also the demonstration value. Not: "I built a yield dashboard." But: "I designed and shipped the full stack of a capital allocation system — from data ingestion through risk scoring through wallet-native UX through execution layer — and I understand how each piece connects to the others."

---

## Lessons Learned

**Start with the data layer, not the UI.** YieldMax's real contribution was establishing the DeFi Llama integration pattern that Capital Engine inherits. The scoring algorithm emerged from having clean, normalised data to reason over. The UI followed.

**CLI tools are infrastructure, not finished products.** Alpha-drift is more valuable as a service than as a standalone tool. The CLI format was right for development and debugging; the service format is right for integration.

**Read-only first, writes second.** Capital Engine's current architecture is deliberately stateless. This constraint forced clarity: the product must earn trust through its analysis before it asks for execution authority. A tool that reads well earns the right to act.

**Security primitives matter more than security hygiene.** Capital Engine should adopt stronger wallet primitives where they improve the user path, but the core promise is still clearer capital allocation, not connector novelty.

**Score, don't sort.** Raw APY is a trap. The Capital Efficiency Score — yield + safety + TVL depth — is the insight that makes Capital Engine not just another yield table. Every future product built in this space should start with the question: *what is the actual decision being made here, and what data does that decision require?*

**ISR + server components change the economics of DeFi tooling.** Processing a 17MB API response once per 5 minutes and serving pre-rendered HTML to all users is fundamentally more scalable and faster than having every client fetch and parse the same payload. Next.js's App Router makes this the default pattern. Use it.

---

## Avenues to Explore

**Risk-adjusted rebalancing.** Given a wallet's current positions (via protocol APIs), calculate the CE Score of the current allocation vs the optimal allocation and surface the gap as a rebalancing recommendation. The delta between "where you are" and "where you should be" is a product.

**Cross-chain capital efficiency.** The same dollar deployed on Arbitrum vs Ethereum vs Base has different effective yields after gas and bridge costs. A cross-chain routing layer that surfaces the net-of-cost opportunity is an unsolved UX problem.

**Yield forecasting.** APY data is a lagging indicator — it reflects the recent past. APY velocity (rate of change over the last 24h, 7d) is a leading indicator. A simple momentum layer on top of DeFi Llama's historical APY data would make the Opportunistic band more actionable.

**Alpha-drift strategy marketplace.** The execution layer could expose multiple strategy configurations — conservative carry, aggressive arb, momentum with stop-loss — selectable through the Capital Engine UI. Users configure intent; the agent executes.

**Protocol health monitoring.** TVL drawdowns, governance proposals, oracle updates, and smart contract upgrades are signals that should surface as alerts before they become positions to exit. A background monitoring service — cron + webhook — that integrates with the Anchor/Balanced band recommendations would make Capital Engine a tool you keep open, not just consult occasionally.

**Institutional-grade reporting.** The TradFi context this project emerged from is relevant here. A downloadable allocation report — current positions, historical performance, risk-adjusted return by band, tax lot tracking — is a feature set that no current DeFi tool does well. It's also a feature set that matters to the allocators with the most capital.

---

## Conclusion

YieldMax was a scraper. Alpha-drift is an agent. Capital Engine is a platform in progress.

The common thread is a question that keeps getting harder to ignore: *in a space with 8,000+ yield opportunities, real on-chain capital, and signing primitives that are better than seed phrases, why is the best available UX still a sorted table you have to manually interpret?*

Capital Engine is the answer under construction. Not theoretical — deployed. Not generic — scored. Not read-only forever — execution is the next milestone.

The federated platform that absorbs YieldMax's data patterns, alpha-drift's execution capability, and Capital Engine's allocation logic into a single coherent interface is the end state. The iterations are the path.

**Tangible over theoretical. Deployed over documented. Cohesive over scattered.**

---

*Capital Engine — [web3.hyperdrift.io](https://web3.hyperdrift.io) — [github.com/hyperdrift-io/web3-capital](https://github.com/hyperdrift-io/web3-capital)*
*Alpha-drift — [github.com/hyperdrift-io/alpha-drift](https://github.com/hyperdrift-io/alpha-drift)*
