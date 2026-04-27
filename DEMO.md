# Capital Engine — Demo Script

## Scenario: Bridge USDC from Ethereum → Base → Deploy into Morpho STEAKUSDC

**Time:** ~5 minutes  
**Wallet state needed:** USDC on Ethereum (MetaMask, Trust Wallet, or any EVM wallet)  
**Goal:** Demonstrate the full cross-chain capital deployment flow — bridge, deposit — without leaving the app.

---

## Why this flow?

The user holds USDC on Ethereum. The highest-yield anchor pool is **morpho-blue STEAKUSDC on Base** (4%+ APY, CE Score 65). STEAKUSDC is a Morpho Blue vault receipt token — not directly bridgeable or swappable. The user just needs to:

1. Bridge USDC natively from Ethereum → Base (Wormhole CCTP, ~1 min, no wrapped tokens)
2. Deposit USDC directly into Morpho on Base to receive STEAKUSDC

Capital Engine identifies this automatically and provides a pre-filled path at every step.

---

## Step-by-step

### Step 1 — Open the Bridge page

Navigate to: **https://web3.hyperdrift.io/bridge**

> **What to show:** The top anchor pool is displayed automatically — protocol (morpho-blue), symbol (STEAKUSDC), chain (Base), APY, and CE Score. Below it, the narrative explains exactly what to do: bridge USDC from Ethereum to Base, then deposit on Morpho.

*Talking point:* "Capital Engine scores every yield pool on a composite metric — APY, protocol safety, and liquidity depth. STEAKUSDC on Morpho Base is the top-ranked opportunity right now."

The info note reads: *"STEAKUSDC is a vault receipt token — bridge USDC to this chain, then deposit it into morpho-blue to receive STEAKUSDC."* This is the key UX moment: the app explains the mechanics so the user never has to figure it out themselves.

---

### Step 2 — Bridge USDC from Ethereum → Base

The Wormhole Connect widget is pre-configured:
- **From:** Ethereum · USDC
- **To:** Base · USDC

1. Enter your amount (e.g. $500)
2. Click **"Confirm transaction"** and sign in your wallet

> **What to show:** Wormhole CCTP burns USDC on Ethereum and mints native USDC on Base — no wrapped token, no slippage, ~1 minute.

*Talking point:* "Wormhole uses Circle's CCTP protocol — USDC moves natively, not wrapped. This is the same infrastructure Circle uses for institutional transfers."

---

### Step 3 — Deposit into Morpho Blue on Base

Once the bridge completes, the Capital Engine narrative shows **Step 3: Deploy into morpho-blue** with a **"Deposit on Morpho ↗"** button.

Click **"Deposit on Morpho ↗"**.

> **What to show:** `app.morpho.org/?network=base` opens — the Morpho Base market pre-selected. The user supplies USDC and receives STEAKUSDC (vault receipt token representing their share).

*Talking point:* "STEAKUSDC is a vault receipt token. The user doesn't need to know that — they just click Deposit. Capital Engine handles the protocol routing."

---

### Step 4 — Show the yield position (optional)

Navigate to **https://web3.hyperdrift.io/capital** with wallet connected.

> **What to show:** The portfolio view reflects the STEAKUSDC balance and its live yield contribution.

---

## Troubleshooting

**"The Aave swap modal doesn't show STEAKUSDC":**

This is expected — STEAKUSDC is a Morpho vault receipt token, not an Aave asset and not a DEX-tradeable token. The correct path is:
1. Bridge USDC to Base (via Wormhole)
2. Deposit USDC on Morpho Blue directly (not via 1inch swap)

The **"Deposit on Morpho ↗"** button links to `app.morpho.org/?network=base` — use that, not Aave's swap modal.

**"I see STEAKUSDC on 1inch but it's on Ethereum chain":**

The STEAKUSDC tokens on 1inch are Ethereum-chain vault tokens (different contracts). The Base deployment at `0xbeef...64cb` / `0xbeef...0f51` is unlisted on 1inch's default token list. This is correct — you don't swap into STEAKUSDC, you deposit USDC into Morpho and receive it automatically.

**"Unable to connect to BNB Chain" / 401 from bscrpc.com in MetaMask:**

MetaMask ships with `bscrpc.com` as the default BNB Chain RPC, which now requires a paid API key. Fix:

1. MetaMask → Settings → Networks → BNB Smart Chain
2. Change **RPC URL** to: `https://bsc-dataseed.binance.org`
3. Save and reconnect

---

## Automated recording

Use **Playwright** to record a scripted walkthrough for repeatable demo videos.

### Setup

```bash
pnpm exec playwright install chromium
```

### Record interactively (capture your manual walkthrough)

```bash
pnpm exec playwright codegen https://web3.hyperdrift.io/bridge
```

This opens a browser with Playwright's inspector. Every click/type you make is captured as a script you can save and replay.

### Scripted demo flow

Create `e2e/demo-recording.spec.ts`:

```ts
import { test } from '@playwright/test'

test('demo: bridge USDC Ethereum → Base → deposit on Morpho', async ({ page }) => {
  // Slow down actions so recording is watchable
  page.context().setDefaultTimeout(10_000)

  await page.goto('https://web3.hyperdrift.io/bridge')

  // Step 1: Show the top pool narrative
  await page.waitForSelector('[data-testid="bridge-then-deploy"]')
  await page.waitForTimeout(3000) // pause for camera

  // Step 2: Show the token note explaining STEAKUSDC
  await page.waitForSelector('text=vault receipt token')
  await page.waitForTimeout(2000)

  // Step 3: Show the Deposit on Morpho button and click it
  const depositBtn = page.getByRole('link', { name: /Deposit on Morpho/i })
  await depositBtn.scrollIntoViewIfNeeded()
  await page.waitForTimeout(2000) // pause before click
  // Don't navigate away — just highlight it for the recording
  // await depositBtn.click()
})
```

### Record to video

In `playwright.config.ts`, enable video capture:

```ts
use: {
  video: 'on',
  slowMo: 800, // ms between actions — makes recording watchable
}
```

Run:

```bash
pnpm exec playwright test e2e/demo-recording.spec.ts --headed
```

Video is saved to `test-results/`. Convert to MP4 with:

```bash
ffmpeg -i test-results/**/video.webm -c:v libx264 demo.mp4
```

### Tips for a polished recording

- Set browser window to 1280×800 — good aspect ratio for Twitter/X embeds
- Use `slowMo: 1000` and `waitForTimeout()` pauses to give viewers time to read
- Hover the CE Score badge to trigger the Proof Mode breakdown tooltip
- Pause on the Wormhole widget to show "no wrapped tokens · ~1 min"
- Pause on the `app.morpho.org` URL in the address bar after the button click

---

## Alternative flow (no bridge — same-chain)

If the viewer already has USDC on Base:

1. Go to **https://web3.hyperdrift.io/yield**
2. Find the top anchor pool — click **Route →** in the table row
3. **"Deposit on Morpho ↗"** opens pre-filled → done in 2 steps

Use this as the "fast path" contrast: bridge is for cross-chain capital, routing is for same-chain. Capital Engine handles both.
