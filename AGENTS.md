# Capital Engine — Agent Guidelines

> **Read this before touching a single file.**  
> This document defines the vision, architecture, UX philosophy, and operating rules for every agent working on Capital Engine.
>
> Also read: `~/dev/hyperdrift/AGENTS.md` — workspace-level context (deploy tooling, fleet management, HD infra).

---

## The Vision

**Capital Engine is a proof-of-concept that web3 can feel like the best web2 fintech apps — and go far beyond them.**

Most DeFi apps are technically competent and product-illiterate. They expose infrastructure to users instead of simplifying it. Capital Engine is built to challenge that assumption at every layer:

- **Wallet abstraction** → the connector stays infrastructure, not the product.
- **Capital Efficiency Score** → a single number that combines yield, safety, and liquidity. Not five columns to compare.
- **Allocation bands** → TradFi portfolio logic applied to DeFi. Users don't need to understand 8,000 pools; they need to understand Anchor, Balanced, and Opportunistic.
- **Proof Mode** → scoring is transparent. Users see why a pool scores 84. Trust through clarity.

This app is the **template** for how the next generation of web3 products should be built:

> "Your user doesn't think about the wallet. They think about the app."

---

## North Star

**Every feature must answer yes to at least one of:**

1. **Does it remove friction?** (session keys, intent-based UX, chain abstraction)
2. **Does it empower with information?** (live prices, multi-asset view, real-time yield)
3. **Does it show the work?** (CE Score breakdown, protocol health, scoring transparency)
4. **Does it enable action?** (1inch routing, allocation wizard, one-tap deployment)

If a feature doesn't pass this filter, it doesn't ship.

---

## What This App Is

**Live:** https://web3.hyperdrift.io  
**Stack:** Next.js 14 App Router · wagmi 3 · viem · Porto (EIP-7702) · DeFi Llama API

A DeFi capital allocation interface for sophisticated users who want to deploy capital intelligently, not chase yield blindly.

**Core concepts:**
- **Capital Efficiency Score (CE Score):** Composite metric — APY (40%) + Protocol Safety (45%) + TVL depth (15%). Penalises mercenary rewards, IL exposure, and unaudited protocols.
- **Allocation bands:** `anchor` (battle-tested, ≤12% APY, safety ≥75), `balanced` (established, ≤25% APY, safety ≥55), `opportunistic` (everything else).
- **Safety score:** Internal 0–100 metric. Tier 1/2 protocol tiers, TVL thresholds, IL risk, stablecoin bonus, single-asset exposure bonus, reward-only APY penalty.
- **Wallet state:** Connector-agnostic portfolio reads that keep wallet mechanics out of the primary decision surface.

---

## UX Principles

### 1. Wallets are infrastructure. Hide them.
Users care about their capital, not their connector. The wallet flow should support the allocation decision without becoming the product narrative.

### 2. One number is better than five columns.
CE Score, not a comparison table. The allocation band, not a risk matrix. Make the decision surface as small as possible without losing depth.

### 3. Show your work — but on demand.
The scoring algorithm is the intellectual property. Surface it on hover/click, not by default. Users who want to trust the number can verify it. Users who don't care see the number. Both are served.

### 4. Real-time wins over accurate-at-load.
APY changes. Prices move. Stale data erodes trust faster than loading states do. Animate updates. Pulse when data refreshes. Make liveness visible.

### 5. Intent, not mechanics.
"I want to deploy $5,000 at moderate risk" → system recommends, routes, estimates. Not: "choose a pool, approve token, set slippage, check gas." The allocation wizard is the north star for this.

### 6. Chain abstraction is the UX frontier.
Users don't think in chains. Capital is capital. Build toward a future where the chain is an implementation detail, not a user decision. Porto already handles this at the wallet layer.

---

## Architecture

### File Structure

```
src/
  app/               ← Next.js App Router pages (server components by default)
    page.tsx         ← Landing (overview)
    yield/page.tsx   ← Yield discovery (server fetch → client components)
    capital/page.tsx ← Capital view (server fetch + client wallet components)
  components/        ← Component library
    AllocationBands/ ← Band summary cards
    CapitalProjection/← Wallet-connected projection (client component)
    CEScoreBreakdown/ ← Proof Mode tooltip (client component)
    Header/          ← Nav + wallet button (client component)
    Providers.tsx    ← wagmi + tanstack query providers
    TokenBalances/   ← ERC-20 balance display (client component)
    WalletPanel/     ← WalletButton UI
    YieldScatterChart/← Risk/yield bubble chart (client component)
    YieldTable/      ← Sortable pool table (client component)
  lib/
    chainlink.ts     ← Chainlink price feed ABIs + contract addresses
    defillama.ts     ← Pool scoring, fetching, enrichment
    format.ts        ← Number/address formatting utilities
    tokens.ts        ← Token addresses per chain, balance utilities
    wagmi.ts         ← wagmi config + connector IDs
  types/
    protocol.ts      ← Pool, AllocationBand, CapitalProjection types
```

### Rendering Strategy

- **Server components** for all data fetching (DeFi Llama, Chainlink reads that can be server-side)
- **Client components** only for wallet state, interactivity, and wagmi hooks
- Mark components `'use client'` only when they use hooks or browser APIs
- Never fetch in `useEffect` — prefer RSC data down as props, or wagmi hooks for chain reads

### Key Dependencies

| Library | Purpose |
|---------|---------|
| `wagmi` | Wallet hooks (`useAccount`, `useBalance`, `useReadContract`) |
| `viem` | Chain reads, ABI encoding, type-safe contract calls |
| `porto` | EIP-7702 smart wallet connector |
| `@tanstack/react-query` | Query caching for wagmi |
| `next` | App Router, ISR, server components |

### Patterns to Follow

**Chain reads:** Use `useReadContract` / `useReadContracts` for on-chain data in client components. Use viem `publicClient.readContract` for server-side reads.

**Formatting:** All number/address formatting goes through `src/lib/format.ts`. Never format inline.

**Token addresses:** All per-chain token addresses live in `src/lib/tokens.ts`. Never hardcode addresses in components.

**Wallet state:** All wallet UI state flows from wagmi hooks. Never mock or simulate wallet state outside tests.

---

## What "Bleeding Edge" Means Here

### Already shipped (do not regress):
- **Wallet-connected portfolio reads** — balances, network, and projection context
- **CE Score algorithm** — weighted composite with band classification
- **Safety scoring** — Tier 1/2 protocol recognition, TVL thresholds, IL/stablecoin signals
- **Full test suite** — vitest unit + component + Playwright E2E with wallet mock

### Iteration 2 targets:
- **CE Score Proof Mode** — hover any score → see APY/safety/TVL breakdown
- **Risk/Yield Bubble Chart** — 2D visualization: safety score vs APY, bubble size = TVL, color = band
- **Chainlink price oracle** — live ETH/USD via `useReadContract`
- **Multi-token balances** — USDC/USDT/wstETH via `useReadContracts` on the connected chain
- **Protocol health delta** — 24h TVL change % next to each pool

### Iteration 3 targets (next):
- **1inch routing integration** — "Route to Anchor" button with pre-filled 1inch deep-link
- **Allocation Wizard** — enter amount → get band split → see routing options
- **Session key management** — Porto EIP-7702 scoped session approvals in UI

### Not to build (ever):
- Custom smart contracts — unnecessary risk, not the differentiator
- Staking as a standalone feature — belongs in protocol adapters (Iteration 5)
- Social/copy-trading — out of scope, dilutes the capital allocation narrative
- Wallet choice as the primary product story — allocation quality is the differentiator

---

## Reference Implementations

Study these before designing new features:

| App | What to steal |
|-----|---------------|
| **Summer.fi** (DeFi Saver) | Position health visualization, clean protocol interface |
| **Zerion** | Multi-chain portfolio clarity, token card design |
| **Rainbow Wallet** | Warmth in a cold domain, portfolio chart UX |
| **Idle Finance** | Contextual help embedded in UI, yield strategy explanations |
| **TraderJoe** | Liquidity shape presets (Miller's Law applied to DeFi) |
| **Linear (app)** | Cmd+K command palette, keyboard-first power user UX |
| **1inch** | Routing visualization, swap flow |

---

## Before Any Implementation

### Ask:
1. Does this pass the north star filter? (friction, information, show-work, action)
2. Is there a simpler way? (delete before add, simplify before fix)
3. Does it keep wallet mechanics subordinate to the allocation decision?
4. What does the mobile experience look like?
5. Does it add a new pattern or use an existing one?

### Architecture checklist:
- [ ] Server component if no hooks needed
- [ ] Token addresses in `lib/tokens.ts`, not inline
- [ ] Formatting through `lib/format.ts`
- [ ] Chain reads via wagmi hooks or viem, never `fetch` to custom RPC
- [ ] CSS Modules only, no Tailwind, no inline styles (except CSS variables)
- [ ] `data-testid` on interactive elements
- [ ] Run `npm test` before committing

---

## Success Criteria

A feature is done when:

1. **It makes the app simpler to understand**, not just more capable
2. **It runs on mobile** — capital decisions should not depend on desktop-only flows
3. **It's transparent** — no black boxes; users can verify the reasoning
4. **It loads fast** — server components for data, client only when necessary
5. **It doesn't require the user to know they're using DeFi** — if the word "gas" appears unprompted, reconsider
6. **Tests pass** — `npm test` is green, Playwright E2E covers the happy path

---

## Distribution

> An app hasn't achieved its mission until it meets its users.

**Live:** https://web3.hyperdrift.io  
**Deploy:** `make deploy app=web3-capital` (from `infra/hyperdrift-infra`)  

### Launch readiness status
- [x] `src/app/layout.tsx` — full metadata, OG, Twitter card, canonical
- [x] `src/app/sitemap.ts` — public routes (/, /yield, /capital)
- [x] `src/app/robots.ts` — blocks /api/
- [x] `src/app/opengraph-image.tsx` — green-branded 1200×630 OG image
- [x] `src/components/Analytics.tsx` — GA4 (reads NEXT_PUBLIC_GA_MEASUREMENT_ID)
- [ ] `NEXT_PUBLIC_GA_MEASUREMENT_ID` — add to vault once GA property created
- [ ] `NEXT_PUBLIC_BASE_URL` — add to vault
- [ ] Google Search Console domain verified

### Growth strategy
**Primary channel:** Crypto Twitter/X, Farcaster (DeFi-native audience), DeFi subreddits  
**Growth hook:** The CE Score algorithm is the content — "why this pool scores 84 and this one scores 42"  
**Conversion path:** Discover → explore yield table → connect wallet → allocate capital  
**hyper-post cadence:** On each protocol data update, new feature release, or DeFi market event

---

*Updated: March 2026*  
*Maintainer: Hyperdrift*
