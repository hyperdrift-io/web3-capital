# Capital Engine — Strategic Roadmap

**Target positioning:** Founding Engineer signal for DeFi wealth management roles (Nika Finance and equivalents).  
**Live product:** https://web3.hyperdrift.io  
**Principle:** Every iteration ships something demonstrable in a live URL, not a promise.

---

## Vision: Redefine Web3 UX

**Capital Engine is the template that proves web3 can feel like the best fintech apps — and go beyond them.**

This is not a yield dashboard. It's a statement: that web3 UX can make capital deployment legible, and that users don't need to understand gas or chains to benefit from DeFi.

### The North Star Filter

Every feature must answer yes to at least one:
- **Remove friction** — session keys, intent-based UX, chain abstraction
- **Empower with information** — live prices, multi-asset view, real-time yield
- **Show the work** — CE Score breakdown, protocol health, scoring transparency
- **Enable action** — 1inch routing, allocation wizard, one-tap deployment

Features that don't pass this filter don't ship.

### Reprioritization Against the Vision

The original roadmap is technically sound. Recalibrating priorities through the vision filter:

| Feature | Vision alignment | Priority |
|---------|-----------------|----------|
| CE Score Proof Mode | Show the work | ⬆️ Move up (Iter 2, now) |
| Risk/Yield Bubble Chart | Empower with information | ⬆️ Move up (Iter 2, now) |
| Chainlink price oracle | Empower / accuracy | ✅ Keep (Iter 2) |
| Multi-token balances | Empower with information | ✅ Keep (Iter 2) |
| Allocation Wizard | Enable action | ⬆️ Move up (Iter 3, before routing) |
| Porto Session Keys | Remove friction (biggest UX leap) | ⬆️ Move up (Iter 3) |
| 1inch routing | Enable action | ✅ Keep (Iter 3) |
| Protocol health badges | Show the work | ✅ Keep (Iter 3) |
| Live yield streaming (SSE) | Nice — polling is good enough | ⬇️ Defer |
| WalletConnect v2 | Porto is the preferred path | ⬇️ Defer indefinitely |
| Multi-chain aggregation | Complexity without execution value | ⬇️ Defer to Iter 4 |

**The single highest-leverage UX insight:** Porto session keys (Iteration 5.2 originally) should move up alongside 1inch routing. A user who says "deploy $500 to Anchor pools" and doesn't get a signing popup is a user who comes back. That flow is the product.

---

---

## Where We Stand

**Iteration 1 — Shipped ✅**

The foundation is solid and genuinely differentiated:

- Live yield data from DeFi Llama — 8,000+ pools filtered to 150 high-quality opportunities
- Capital Efficiency Score — weighted composite (yield 40%, safety 45%, TVL 15%) that penalises mercenary rewards, IL exposure, and unaudited protocols
- Allocation bands — Anchor / Balanced / Opportunistic (TradFi capital allocation logic applied to DeFi)
- Wallet-connected portfolio context — balances, network, block number, and projected returns
- On-chain reads: ETH balance, network, block number, projected returns
- Deployed, tested, green

**What's missing vs what a $150–220k founding engineer role would expect:**

| Gap | Nika Finance signal |
|-----|---------------------|
| No real-time data (5-min ISR only) | WebSocket / live data experience |
| Hardcoded ETH price ($3,200) | Price oracle integration |
| No aggregator / routing | DEX/aggregator integration mindset |
| No ERC-20 balances | Multi-asset portfolio awareness |
| Read-only (no execution) | Full DeFi protocol integration |
| No multi-chain portfolio view | Cross-chain architecture |

---

## Iteration 2 — Real-Time Foundation (2–3 weeks)
*Makes the demo feel alive. Every number on screen is current.*

### 2.1 Price Oracle — Chainlink / Pyth
Replace `$3,200` hardcoded ETH price with a live feed.
- Fetch from Chainlink's ETH/USD price feed via viem (`readContract`)
- Show live USD value of wallet balance in Capital View
- **Nika signal:** Protocol integration, smart contract reads

### 2.2 ERC-20 Balances
Show deployable capital across stablecoins and major tokens.
- `useBalance` for USDC, USDT, WBTC, wstETH on each connected chain
- "Available to deploy" summary: total USD value of deployable assets
- **Nika signal:** Multi-asset portfolio thinking

### 2.3 Live Yield Streaming (SSE / polling upgrade)
Move yield data from 5-min ISR to a live-updating client feed.
- Server-Sent Events endpoint that pushes fresh DeFi Llama data when APY changes >0.5%
- APY cells animate on update (subtle pulse)
- **Nika signal:** Real-time architecture, WebSocket/SSE experience

### 2.4 WalletConnect v2
Mobile wallet support. Required for real-world usage.

---

## Iteration 3 — The Intent Layer (3–4 weeks)
*User sees the best allocation → can act on it in one click.*

### 3.1 1inch Routing Integration
The biggest UX leap available without writing smart contracts.
- "Route" button on the top pool per allocation band
- Deep-links to 1inch with: `fromTokenAddress` (USDC), `toTokenAddress` (pool's underlying token), `amount` from wallet balance
- Shows estimated output using DeFi Llama price API — no execution, no API key required
- **Why 1inch here, not 0x:** 1inch deep-links give free UI for free. 0x has no equivalent deep-link — you'd be forced to build custom execution UI prematurely. See [our engineering writeup](https://hyperdrift.io/blog/1inch-vs-0x-dex-aggregators-defi-routing).
- **Nika signal:** DEX aggregator integration — this is literally what Nika does

### 3.2 Allocation Wizard
Enter an amount → get a split across all three bands → see routing options.
- Input: "I want to deploy $5,000"
- Output: $2,500 Anchor (Aave USDC at 4.2%), $1,500 Balanced (Curve 3pool at 8.1%), $1,000 Opportunistic (top CE scorer)
- Each row has a "Route" CTA that opens 1inch with pre-filled params
- **Nika signal:** Full-stack product thinking, financial UX

### 3.3 Protocol Health Badges
Add TVL delta (24h change %) next to each pool in the yield table.
- Source: DeFi Llama's `/protocol/{slug}` historical TVL endpoint
- Green if TVL growing, amber if flat, red if -10%+ in 24h
- **Nika signal:** Depth of protocol data integration

---

## Iteration 4 — Multi-Chain Portfolio (4–6 weeks)
*Turns Capital Engine from a yield tool into a portfolio interface.*

### 4.1 Cross-Chain Balance Aggregation
Simultaneously fetch native + ERC-20 balances across Mainnet, Arbitrum, Base, Optimism.
- Single "Available Capital" view: chain breakdown, per-asset totals, USD sum
- Shows where capital is currently sitting vs where the best yield is
- **Nika signal:** Multi-chain architecture, parallel RPC management

### 4.2 Yield Position Detection (Read-Only)
Detect if the connected wallet already holds yield-bearing tokens.
- Check for aTokens (Aave), cTokens (Compound), stETH (Lido), LP tokens (Uniswap/Curve)
- Display current positions in a "You're Earning" panel alongside "You Could Be Earning" suggestions
- **Nika signal:** Protocol-level data integration, user state management

### 4.3 Rebalancing Recommendations
Calculate the gap between current allocation and optimal CE Score allocation.
- "Your current allocation earns 3.2% effective APY. Optimising to Anchor + Balanced yields 5.8%."
- Each recommendation surfaces the routing path (Iteration 3 routing, not execution)
- **Nika signal:** Financial systems thinking, product intelligence

---

## Iteration 5 — On-Chain Execution (6–10 weeks)
*The full product. Porto session keys make the UX genuinely novel.*

### 5.1 Protocol Adapters
Standardised deposit/withdraw interface over:
- Aave v3 (supply USDC → earn aUSDC)
- Lido (stake ETH → earn stETH)
- Compound v3 (supply USDC → earn cUSDC)
- Curve 3pool (deposit stablecoins → earn CRV + pool fees)

Each adapter: deposit, withdraw, balance read, current APY, historical performance.

### 5.2 Porto Session Keys + 0x Gasless — The UX Endgame
The combination that no competitor has working yet.

**Porto session keys (EIP-7702):**
- User approves a session key: "allow up to $500 of USDC deposits to approved Anchor pools for 24h"
- Subsequent operations (rebalance, top-up) don't require a signing prompt
- Full transaction history with session context

**0x Gasless API (replacing 1inch for execution):**
- Meta-transaction swaps: user signs an EIP-712 message, 0x relayer pays gas
- Gas deducted from swap output — user never sees a gas UI
- 0x Permit2 integration eliminates the `approve()` transaction (one fewer popup)
- **Why 0x here instead of 1inch:** 0x Gasless is purpose-built for the "no gas confusion" UX goal. 1inch has no equivalent. This is the switch point.

**Combined flow:**
> User: "Deploy $500 to Anchor pools"
> App: executes, no signing popup, no gas prompt
> User: done.

This is the moment Capital Engine stops feeling like a DeFi app and starts feeling like a fintech app.
- **Nika signal:** Account abstraction, EIP-7702, gasless UX — Porto already integrated, 0x Gasless is the execution layer

### 5.3 Alpha-Drift Integration
Capital Engine surfaces the allocation → alpha-drift executes.
- `POST /execute { pool, amount, strategy }` contract between the two services
- Execution status tracked in Capital View
- Strategy configuration (conservative carry, momentum, arb) surfaced in UI

---

## UX Innovations That Actually Differentiate

Most DeFi apps are technically competent and product-illiterate. These are the UX bets worth making:

### Wallet-Neutral Onboarding
For users with capital: a first-class flow that keeps wallet choice secondary to the allocation decision.
- Clear connect state and balance context before asking users to act
- No connector education in the primary path
- Works on mobile Day 1
- **Why it matters:** users came to decide where capital should go, not to study wallet mechanics.

### "Proof Mode" Toggle
A toggle that reveals the reasoning behind each Capital Efficiency Score.
- Hover on any score → tooltip showing weights: "yield: 40% (8.2% APY) + safety: 45% (Tier-1 + audited + stablecoin) + TVL depth: 15% (high)"
- Makes the scoring transparent and trustworthy rather than opaque
- Signals: product honesty, financial UX thinking

### Opportunity Delta Indicator
Show not just "what's available" but "what's better than where you are."
- For connected wallets: detect current yield positions → calculate APY delta vs top CE scorer in same band
- "+2.3% available in same risk band" displayed in Capital View
- **Why it matters:** action-prompting, not just informational

### Dark / Focused Mode for Yield Table
One-key shortcut (Cmd+K style) to enter a focused view: full-screen yield table, no chrome, keyboard navigation between pools.
- Row expansion shows protocol detail, audit history, TVL chart sparkline
- **Why it matters:** power users (traders, allocators) want density without noise

---

## Nika Finance Alignment Map

The job asks for:

| Requirement | Capital Engine evidence |
|-------------|------------------------|
| DeFi protocol integration | DeFi Llama API, 8,000+ pool scoring, risk model |
| Aggregator experience | 1inch routing intent (Iteration 3), 0x Gasless execution (Iteration 5) |
| Viem | Core of wagmi/on-chain reads throughout |
| Account abstraction (nice-to-have) | Porto EIP-7702 already shipped, default connector |
| WebSockets | Live yield streaming (Iteration 2) — add before applying |
| Full-stack (Node.js, TypeScript) | Next.js App Router server components, API routes |
| "Interfaces people love" | Wallet-neutral onboarding, allocation wizard, CE Score proof mode |
| Live products | https://web3.hyperdrift.io (deployed, working, public) |

**The single most valuable thing to do before applying to Nika:**

Ship the 1inch routing integration (Iteration 3.1). Nika Finance is a wealth management product that connects to DeFi protocols and aggregators. Showing a working aggregator integration — even just routing intent, not execution — directly demonstrates the core of what they're building.

**Estimated time to compelling demo:** 2–3 weeks (Iterations 2 + 3.1 + 3.2).

---

## What NOT to Build

- **Custom smart contracts** — unnecessary risk surface, slow to audit, not the differentiator
- **Staking as a standalone feature** — belongs inside the adapter pattern (Iteration 5)
- **Social/copy-trading features** — out of scope, dilutes the capital allocation narrative
- **Token / points system** — noise at this stage
- **Solana support** — only relevant if Nika specifically requires it; adds significant complexity

---

## Application Strategy

The product is the application. When applying to roles like Nika:

1. **Link to the live app first** — https://web3.hyperdrift.io — before anything else
2. **Screenshot or Loom the allocation flow** — show how quickly a user gets from capital context to a scored plan
3. **Reference specific integrations:** DeFi Llama API (8,000+ pools), Porto/EIP-7702, wagmi/viem, multi-chain reads
4. **Link the article** — https://hyperdrift.io/blog/web3-capital-engine-architecture-roadmap — shows product thinking and communication
5. **Be specific about what's next:** "1inch aggregator integration is the next iteration" signals you understand what the role actually builds

The goal isn't to look like you built everything. It's to demonstrate you understand the problem space deeply enough to know what matters.

---

*Updated: March 2026*
