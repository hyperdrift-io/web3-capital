# Capital Engine: DeFi Allocation Interface

Capital Engine is a DeFi allocation interface for users who want to deploy capital intelligently instead of chasing raw APY. It ranks yield opportunities by Capital Efficiency Score, builds allocation plans, and routes cross-chain movement through Wormhole before deployment.

Live: [web3.hyperdrift.io](https://web3.hyperdrift.io)
Article: [Wormhole turns Capital Engine into a deployment layer](https://hyperdrift.io/blog/wormhole-capital-engine-deployment-layer)

---

## What it does

Capital Engine answers a different question than most DeFi yield tools. Instead of "what has the highest APY?", it asks: **where should I allocate, given my capital and risk tolerance?**

Protocols are ranked by a **Capital Efficiency Score** combining yield, protocol safety, TVL depth, and deployability signals. The app groups them into allocation bands:

| Band | Description | APY range |
|------|-------------|-----------|
| Anchor | Battle-tested, deep liquidity - core allocation | Up to 12% |
| Balanced | Established protocols - satellite allocation | Up to 25% |
| Opportunistic | Higher-yield, capped exposure | 25%+ |

Review a scored allocation plan, then bridge the right asset toward the recommended destination with Wormhole Connect.

---

## Modules

- **`/yield`** - Live APY data across DeFi Llama pools, filtered and ranked by Capital Efficiency Score.
- **`/capital`** - Allocation wizard, balance context, and projected returns by band.
- **`/bridge`** - Wormhole-powered Bridge & Deploy flow that infers the right destination asset from the selected opportunity.

---

## Stack

- **Next.js 14** (App Router, ISR - yield data refreshes every 5 min)
- **wagmi v3 + viem** - wallet state and on-chain reads
- **Wormhole Connect** - embedded cross-chain asset movement
- **DeFi Llama Yields API** - live APY + TVL, no API key required
- **CSS Modules** - no Tailwind, full design system control
- **PM2 + Nginx** - deployed at web3.hyperdrift.io

---

## Integrations

**Live**
- DeFi Llama `/yields/pools` - APY, TVL, pool metadata for 8000+ pools
- Wormhole Connect - bridge-aware asset movement before deployment
- viem `useBalance`, `useBlockNumber` - on-chain reads

**Next**
- DEX aggregation - route from bridge completion into the destination protocol.
- Protocol health deltas - show how TVL and safety move over time.
- Session-scoped approvals - make Porto deployment feel like a modern fintech action.

---

## Related

- [Capital Engine deployment layer notes](docs/CAPITAL-ENGINE-ARTICLE.md) - working notes for the bridge-aware deployment work.
- [The bridge should be invisible](https://hyperdrift.io/blog/the-bridge-should-be-invisible) - Hyperdrift thesis on cross-chain UX.

---

## Local dev

```bash
pnpm install
pnpm run dev       # http://localhost:3000
pnpm run build     # production build
```

No `.env` required for local development. DeFi Llama API is public with no key.
