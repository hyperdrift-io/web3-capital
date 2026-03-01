# Capital Engine — Testing Guide

Quick reference for verifying each feature layer. Read top to bottom for a
full test run, or jump to the iteration you're currently working on.

---

## Setup

```bash
npm run dev          # http://localhost:3000
npm test             # unit tests (vitest)
npm run test:watch   # vitest in watch mode
npm run test:e2e     # Playwright end-to-end (requires dev server running)
```

No `.env` required. Public RPC endpoints are used by default.

---

## Dev address override

Most portfolio features require a wallet with on-chain positions. Rather than
funding a wallet, append `?dev=0x<address>` to the capital page URL in
development mode. The address is used in place of the connected wallet for
all portfolio reads — no wallet connection needed.

```
http://localhost:3000/capital?dev=0x<address>
```

**Stripped in production builds** — guarded by `NODE_ENV !== 'development'`.

### Test addresses

All addresses are public blockchain data. Verify current state at
[debank.com](https://debank.com/profile/0x<address>) before using —
positions change over time.

#### Full portfolio — Aave v3 multi-chain + Compound v3

```
0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa
```

Expected on DeBank: Aave v3 USDC and WETH positions on Ethereum.
Tests: chain balance grid, position detection, rebalancing panel.

```
http://localhost:3000/capital?dev=0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa
```

---

#### Multi-chain stablecoin holdings (no yield positions)

```
0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503
```

Binance 8 — large USDC/USDT across multiple chains, likely no aTokens.
Tests: chain balance grid with non-zero assets, undeployed capital tip in
RebalancingPanel, AllocationWizard pre-fill.

```
http://localhost:3000/capital?dev=0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503
```

---

#### Empty / minimal wallet (your own wallet)

Connect your own wallet (even with 0 balance). Tests all empty states.

---

#### Finding fresh addresses

1. Open [app.aave.com](https://app.aave.com) → any market (e.g. USDC)
2. Scroll to **Top Suppliers** list
3. Pick holder #20–50 (mid-sized, not a protocol treasury)
4. Verify on [debank.com/profile/0x...](https://debank.com) — confirm Aave
   or Compound positions on Ethereum/Arbitrum/Base/Optimism
5. Paste address as `?dev=0x<address>`

Or: [etherscan.io/token/0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c#balances](https://etherscan.io/token/0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c#balances)
— every address in the aUSDC holder list has a live Aave v3 USDC position.

---

## Feature checklist by iteration

### Iteration 1 — Foundation

| Feature | URL | Pass criteria |
|---------|-----|---------------|
| Yield table loads | `/yield` | 100–150 pools shown, APY + TVL + CE Score visible |
| CE Score sorting | `/yield` | Clicking "CE Score" header sorts correctly ↓ ↑ |
| Allocation bands | `/yield` | Anchor / Balanced / Opportunistic bands shown above table |
| Porto wallet button | `/` | "Smart Wallet" button visible in header |
| Injected wallet button | `/` | Switching pref shows MetaMask-style button |
| Capital projection (no wallet) | `/capital` | Prompts to connect, no crash |

---

### Iteration 2 — Real-Time Foundation

| Feature | URL | Pass criteria |
|---------|-----|---------------|
| SSE stream connects | `/yield` | Status dot shows "Live" (green pulse) |
| APY trend indicator | `/yield` | ↑ or ↓ badge visible on some rows |
| CE Score proof mode | `/yield` | Hover any ◈ score → popover with APY/Safety/TVL breakdown |
| Risk vs Yield chart | `/yield` | Bubble chart renders, hover shows pool detail |
| Chainlink ETH price | `/capital` (connected wallet) | ETH/USD shown as live price, not $3,200 |
| ERC-20 balances | `/capital` (connected wallet with tokens) | USDC/USDT/wstETH listed |

---

### Iteration 3 — Routing Intent

| Feature | URL | Pass criteria |
|---------|-----|---------------|
| Route button on table rows | `/yield` | Hover a row → "Route →" appears in last column |
| Route button opens 1inch | `/yield` | Click "Route →" → `app.1inch.io` opens with tokens pre-filled |
| AllocationWizard opens | `/capital` | Click "Deploy Capital Wizard" → expands |
| Wizard calculates split | `/capital` | Enter $5000 → Anchor $2500 / Balanced $1500 / Opportunistic $1000 |
| Wizard sliders sum to 100% | `/capital` | Drag a slider → others adjust proportionally |
| Blended APY updates live | `/capital` | Changing amount or sliders updates "Blended APY" and annual projection |
| Wizard route CTAs | `/capital` | "Route via 1inch ↗" opens 1inch with correct params |
| Protocol health badge | `/yield` | Some APY cells show ↑ (green) or ↓ (amber) 7-day trend |

---

### Iteration 4 — Multi-Chain Portfolio

Use `?dev=` address for full coverage.

| Feature | URL | Pass criteria |
|---------|-----|---------------|
| Chain balance grid | `/capital?dev=0x...` | 4 chain cards with ETH + ERC-20 breakdown |
| Share bars | `/capital?dev=0x...` | Bar widths reflect % of total portfolio per chain |
| Total portfolio value | `/capital?dev=0x...` | Sum matches DeBank total (±5% for price timing) |
| Position detection | `/capital?dev=0x...` | "You're Earning" lists Aave/Compound positions |
| Position APY | `/capital?dev=0x...` | APY shown per position (from DeFi Llama match) |
| Blended APY summary | `/capital?dev=0x...` | Summary bar shows effective APY + annual return |
| Rebalancing delta | `/capital?dev=0x...` | "You could earn +X% more" panel appears |
| Comparison cards | `/capital?dev=0x...` | Current vs optimal APY side-by-side |
| Route CTAs in panel | `/capital?dev=0x...` | Per-band Route buttons link to correct 1inch URLs |
| Wizard scroll CTA | `/capital?dev=0x...` | "Plan full reallocation in Wizard ↓" scrolls to wizard |
| No positions tip | `/capital?dev=0x...` (empty wallet) | "You have $X undeployed capital" banner |
| Already optimal state | `/capital?dev=0x...` (optimal wallet) | Green "✓ already earning X% APY" banner |
| Empty connect state | `/capital` (no wallet) | Connect prompt, dev hint in dev mode |
| Shimmer loading | `/capital?dev=0x...` | Brief skeleton visible before data loads |

---

## Unit tests

```bash
npm test
```

| Test file | Covers |
|-----------|--------|
| `defillama.test.ts` | `safetyScore`, `capitalEfficiency`, `allocationBand`, edge cases |
| `format.test.ts` | `formatUsd`, `formatApy`, `formatAddress`, chain color |
| `YieldTable.test.tsx` | Sort by APY / TVL / CE Score, sort direction toggle |
| `WalletButton.test.tsx` | Connect/disconnect flow, Porto vs injected preference |

All 52 tests should pass. No mocks required for the core library tests.

---

## E2E tests

Requires the dev server to be running (`npm run dev` in another terminal).

```bash
npm run test:e2e          # headless
npm run test:e2e:ui       # Playwright UI mode (recommended for debugging)
```

| Test file | Covers |
|-----------|--------|
| `e2e/yield.spec.ts` | Yield table renders, sorting, CE scores, live data from DeFi Llama |
| `e2e/wallet.spec.ts` | No-wallet state, mock wallet connect, disconnect, capital view |

E2E tests hit the live DeFi Llama API — occasional flakiness if the API
is slow. Re-run once before escalating.

---

## Real-money test (one-time, ~$5)

The only test that exercises the full production data pipeline with your
actual wallet:

1. Buy $10 USDC on Base (or bridge from another chain)
2. Go to [app.aave.com](https://app.aave.com) → switch to Base → Supply USDC
3. You now have `aUSDC` on Base
4. Connect your wallet to `localhost:3000/capital`
5. **Expected:** aUSDC appears in "You're Earning", blended APY shown,
   RebalancingPanel activates with delta calculation

Base gas fees are <$0.05 per transaction. Total cost: ~$0.10 in gas.

---

## Quick sanity check (30 seconds)

```
1. npm run dev
2. open http://localhost:3000/yield
   → table loads, CE scores visible, Live dot green
3. open http://localhost:3000/capital?dev=0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa
   → portfolio loads, chain grid shows balances, positions shown
4. npm test
   → 52/52 pass
```
