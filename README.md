# Capital Engine

A DeFi capital allocation interface — yield discovery, wallet integration, and risk-adjusted projections in a single system.

Live: [web3.hyperdrift.io](https://web3.hyperdrift.io)

---

## What it does

Capital Engine answers a different question than most DeFi yield tools. Instead of "what has the highest APY?", it asks: **where should I allocate, given my capital and risk tolerance?**

Protocols are ranked by a **Capital Efficiency Score** combining yield, protocol safety, and TVL depth — the variables a capital allocator weighs, not just the rate at the top of a sorted list. They are grouped into allocation bands:

| Band | Description | APY range |
|------|-------------|-----------|
| Anchor | Battle-tested, deep liquidity — core allocation | 2–12% |
| Balanced | Established protocols — satellite allocation | 6–25% |
| Opportunistic | High-yield, capped exposure | 25%+ |

Connect a wallet and Capital Engine projects your monthly and annual returns at current yields, using your actual on-chain balance as the principal.

---

## Modules

- **`/yield`** — Live APY data across 150+ pools, filtered and ranked by Capital Efficiency Score. Allocation bands surface the right protocols for each risk tier.
- **`/capital`** — Wallet connect (injected), native balance, network context, block number, and projected returns at anchor + balanced yields.

---

## Stack

- **Next.js 14** (App Router, ISR — yield data refreshes every 5 min)
- **wagmi v2 + viem** — wallet connect, on-chain reads
- **DeFi Llama Yields API** — live APY + TVL, no API key required
- **CSS Modules** — no Tailwind, full design system control
- **PM2 + Nginx** — deployed at web3.hyperdrift.io

---

## Integrations

**Live**
- DeFi Llama `/yields/pools` — APY, TVL, pool metadata for 8000+ pools
- wagmi injected connector — MetaMask, Rabby, Coinbase Wallet
- viem `useBalance`, `useBlockNumber` — on-chain reads

**Planned**
- DEX aggregator (1inch / 0x) — swap routing from yield discovery
- Price oracle (Pyth / Chainlink) — accurate USD projection without hardcoded ETH price
- WalletConnect v2 — mobile wallet support
- Risk band model — per-protocol historical drawdown + audit status
- Capital routing — one-click allocation to top anchor pool

---

## Related

- [alpha-drift](https://github.com/hyperdrift-io/alpha-drift) — ML-driven DeFi execution agent (momentum, carry, arb strategies)

---

## Local dev

```bash
npm install
npm run dev       # http://localhost:3000
npm run build     # production build
```

No `.env` required for local development. DeFi Llama API is public with no key.
