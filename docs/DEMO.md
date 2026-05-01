# Capital Engine — Demo Guide

This guide matches the live app. Pool rankings come from DeFi Llama and **change over time** — before you name a protocol or APY on **Bridge**, glance at Step 1 for the current top pool.

**Live app:** https://web3.hyperdrift.io  

**Suggested video arc (first web3-capital video)**  
**Part 1 — Product showcase:** overview + four surfaces (Overview → Yield → Capital → Bridge preview). **Part 2 — Bridge deep dive:** open Wormhole, deploy, optional shortcuts. That order answers “what is this?” before “how does bridging work?”

---

## Before you start

| Item | Detail |
|------|--------|
| **Duration** | ~3–4 min showcase + ~5–7 min bridge deep dive ≈ **8–12 min** total (trim Part 1 if you need a shorter cut) |
| **Wallet** | Any EVM wallet works; You only need funds on-chain for Part 2 if you execute a real bridge. |
| **Funds (bridge segment)** | USDC on **Ethereum** if you run the widget live. |
| **Data caveat** | The top **anchor** pool changes — always read Step 1 on `/bridge` live. |

---

## Part 1 — Product showcase (read aloud)

Use **SAY** / **DO** as before. Keep Part 1 moving — **30–45 seconds per page** unless you pause on the yield table or chart.

### Showcase A — Overview (landing)

**DO:** Open https://web3.hyperdrift.io/

**SAY:** “This is **Capital Engine** — we’re building DeFi that feels closer to a serious fintech app: one **Capital Efficiency score** instead of raw APY tables, and three **allocation bands** — Anchor, Balanced, Opportunistic — so you think in portfolio terms, not in thousands of anonymous pools.”

**DO:** Scroll slightly so viewers see **Yield Discovery** and **Capital View** cards and the three **signals** (protocol safety, CE score, allocation bands).

**SAY:** “You’ve got four places to work: discover yield, see capital against your wallet, bridge and deploy in one story, plus this landing for positioning. Next I’ll click through each.”

**DO:** Point at the header — **Overview · Yield · Capital · Bridge** — so viewers remember the map.

---

### Showcase B — Yield Discovery

**DO:** Click **Yield** (or **Explore Yields** on the hero).

**SAY:** “**Yield Discovery** pulls live pools — hundreds — and ranks them by our **Capital Efficiency score**, not hype. You’ll see APY, protocol, chain, band, and a **Route** action when you want to move capital into a pool.”

**DO:** Briefly show the **sortable table**; if the **risk / yield chart** is visible, pan or hover one bubble.

**SAY:** “Same data updates over time — we care about **liveness**, not a snapshot from yesterday.”

*(Optional)* **DO:** Hover a row and point at **Route →** without clicking — save the deep link for Part 2.

---

### Showcase C — Capital View

**DO:** Click **Capital**.

**SAY:** “**Capital View** is where you connect and see **your** capital: balances across chains, where you’re already earning if we detect **Aave / Compound-style** positions, rebalancing hints, a quick **projection**, and an **allocation wizard** to split dollars across bands. Passkey-first wallets like **Porto** are supported — no seed phrase theater.”

**DO:** Scroll through **portfolio**, **rebalancing** (if present), **single-chain projection**, the **Bridge** teaser strip, and **Deploy Capital** — even disconnected, the sections read clearly.

**SAY:** “Morpho-style vault receipts aren’t fully wired into this portfolio yet — we’re honest about scope — but the story here is: **one screen for ‘where am I and what could I do?’**”

---

### Showcase D — Bridge (preview only)

**DO:** Click **Bridge**.

**SAY:** “**Bridge & Deploy** is the cross-chain story: we surface the **best anchor opportunity** right now, help you move **USDC** or other deployable assets with **Wormhole** — no wrapped-token confusion in the copy — then **Route →** into the protocol. I’ll walk through this end-to-end in a second.”

**DO:** Show **steps 1–3** on screen (best opportunity, bridge, deploy) **without** opening the Wormhole widget yet — that’s Part 2.

**SAY:** “That’s the product surface. Now let’s focus on the bridge path.”

---

## Part 2 — Bridge deep dive

Use **SAY** / **DO**. Pause 2–3 seconds after major transitions.

### Beat 1 — Step 1: Best opportunity

**DO:** Stay on `/bridge` (or return to it). Point at **“1 — Best opportunity right now”**. Read the row: protocol, symbol, chain, APY, **Score**.

**SAY:** “Step one is always the current highest CE-scored **anchor** pool for this session. **Anchor** is our conservative band. Hover **Score** if you want the Proof Mode breakdown.”

*(Optional)* **DO:** Hover the CE score tooltip.

---

### Beat 2 — Step 2: Bridge

**DO:** Scroll to **“2 — Bridge …”**  
- If the chain isn’t Ethereum, read the Ethereum → destination copy (**no wrapped tokens**, **about 1 minute**).  
- If you see **Bridge skipped**, skip the widget and go to deploy.

**DO:** Read any **Info:** line (vault / LP note).

**DO:** Click **Open Wormhole Bridge**. Set source **Ethereum** and destination to the target chain; token usually **USDC**.

**SAY:** “We lazy-load Wormhole so the page stays fast. USDC moves with burn-and-mint style routing — native on each side.”

**DO:** Enter an amount (e.g. **500** USDC), complete the widget, **sign** when prompted.

---

### Beat 3 — Step 3: Deploy

**DO:** Scroll to **“3 — Deploy into …”**. Point at **Route →** (compact).

**SAY:** “After funds land, **Route →** opens the right place — often a direct **Deposit on Morpho** or **Aave** link — not a random DEX search for the vault symbol.”

**DO:** Click **Route →** (new tab, e.g. Morpho on Base). Don’t swap into receipt tokens on 1inch first unless the route says so.

---

### Beat 4 — Capital (optional recap)

**DO:** Open **Capital**, connect if you haven’t.

**SAY:** “Back on Capital — this is where ongoing portfolio story lives; vault receipt detection for every protocol is still evolving.”

*(Optional)* **DO:** Scroll to **Deploy Capital** / wizard.

---

### Beat 5 — Same-chain shortcut

**DO:** Open **Yield**, hover a row, click **Route →**.

**SAY:** “Already on the right chain? Skip the bridge — same **Route →** intent from the table.”

---

## Quick reference (UI strings)

| Location | What viewers see |
|----------|-------------------|
| Header | **Overview · Yield · Capital · Bridge** |
| Bridge Step 2 | **Open Wormhole Bridge** / **Hide Wormhole Bridge** |
| Bridge Step 3 | **Route →** (compact); elsewhere **Deposit on … ↗** |
| Yield table | Column **Route** with **Route →** |

---

## Troubleshooting

**Vault token doesn’t appear in a swap UI**  
Bridge the underlying → **Route →** / protocol deposit.

**Wrong protocol tab**  
Follow the URL **Route →** opens (Morpho vs Aave vs 1inch).

**BNB RPC 401 in MetaMask**  
Use a public BNB RPC (e.g. `https://bsc-dataseed.binance.org`) in network settings.

---

## Automated recording (Playwright)

### Setup

```bash
pnpm exec playwright install chromium
```

### Interactive recording

```bash
pnpm exec playwright codegen https://web3.hyperdrift.io/
```

### Sample spec (bridge page smoke)

```ts
import { test } from '@playwright/test'

test('demo: bridge page smoke', async ({ page }) => {
  await page.goto('https://web3.hyperdrift.io/bridge')
  await page.getByTestId('bridge-then-deploy').waitFor()
  await page.getByRole('link', { name: /Deposit on Morpho|Deposit on Aave|Swap on 1inch/i }).first().waitFor({ timeout: 15_000 })
})
```

The deploy link’s **accessible name** is **Deposit on …** or **Swap on 1inch** — not the visible **Route →** text.

---

## Other entry points

- **FAQ:** https://web3.hyperdrift.io/faq — scripted Q&A if needed.  
- **Codegen from home:** `pnpm exec playwright codegen https://web3.hyperdrift.io/` for a full tour recording.

---

*Updated April 2026 — product showcase + bridge deep dive; aligned with live nav and pages.*
