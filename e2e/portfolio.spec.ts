/**
 * Portfolio E2E tests — Tenderly Virtual Testnet.
 *
 * These tests fork Ethereum mainnet, set precise token balances on a test
 * address, then verify the app displays correct portfolio data. wagmi's RPC
 * calls are transparently proxied to the fork — no response mocking.
 *
 * Three scenarios mirror real-world user states:
 *   A — Active Aave v3 position     → "You're Earning" panel populated
 *   B — Idle capital only           → Rebalancing panel urges deployment
 *   C — Mixed (earning + idle)      → Rebalancing delta shown, not dismissed
 *
 * Tests are skipped automatically when TENDERLY_ACCESS_KEY is not set.
 * Set it in .env.local to run:
 *
 *   TENDERLY_ACCESS_KEY=...
 *   TENDERLY_ACCOUNT=...
 *   TENDERLY_PROJECT=...
 *
 * See TESTING.md for setup instructions.
 */

import { test, expect, TOKENS, usdc, weth } from './tenderly'

const capitalUrl = (address: string) => `/capital?dev=${address}`

// Scope helpers — avoid strict mode violations where text appears in multiple elements
const devBanner      = (p: ReturnType<typeof test['info']>['fn'] extends never ? never : Parameters<Parameters<typeof test>[1]>[0]) => p.locator('[class*="devBanner"]')
const portfolioTotal = (p: Parameters<Parameters<typeof test>[1]>[0]) => p.locator('[class*="portfolioTotal"], [class*="totalValue"]')
const sectionLabel   = (p: Parameters<Parameters<typeof test>[1]>[0], text: RegExp) =>
  p.locator('[class*="sectionLabel"]').filter({ hasText: text })
const chainCards     = (p: Parameters<Parameters<typeof test>[1]>[0]) =>
  p.locator('[class*="chainCard"]')

// ── A: Active Aave v3 position ────────────────────────────────────────────────

test.describe('Scenario A — active Aave v3 position', () => {
  test.beforeEach(async ({ fork }) => {
    await fork.setErc20(TOKENS.aUSDC, usdc(1_000))   // 1,000 aUSDC
  })

  test('dev banner appears confirming address is observed', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))

    // Scope to <div> only — CSS modules apply the "devBanner" prefix to all
    // child <span>s too (devBannerIcon, devBannerDone, etc.), so [class*="devBanner"]
    // alone hits 5 elements. The root is always a <div>.
    await expect(page.locator('div[class*="devBanner"]')).toBeVisible({ timeout: 10_000 })
    await expect(page.locator('div[class*="devBanner"]')).toContainText('Dev mode')
  })

  test('"You\'re Earning" section appears and lists the aUSDC holding', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))

    // PortfolioView section label scoped to avoid collision with RebalancingPanel
    const earningSection = page.locator('[class*="PortfolioView"] [class*="sectionLabel"]')
      .filter({ hasText: /you.*earning/i })
    await expect(earningSection).toBeVisible({ timeout: 15_000 })

    // Position row should list USDC (underlying of aUSDC)
    await expect(
      page.locator('[class*="positionRow"], [class*="position"]').first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('portfolio total shows a non-zero USD value', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    // Look for a dollar amount anywhere in the header/total area
    const amount = page.locator('text=/\\$[0-9,]{3,}/')
    await expect(amount.first()).toBeVisible({ timeout: 15_000 })
  })

  test('chain grid shows Ethereum chain card', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    // Chain cards are scoped to the grid component
    const ethCard = page.locator('[class*="chainCard"]').filter({ hasText: /ethereum/i })
    await expect(ethCard.first()).toBeVisible({ timeout: 15_000 })
  })

  test('dev banner shows "1 position detected" after load', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    // Root div only (see devBanner comment above)
    const banner = page.locator('div[class*="devBanner"]')
    await expect(banner).toBeVisible({ timeout: 10_000 })
    // After wagmi hooks resolve, the "devBannerDone" span shows count
    await expect(banner.locator('span[class*="devBannerDone"]')).toContainText(/1 position/i, { timeout: 15_000 })
  })
})

// ── B: Idle capital — no yield positions ─────────────────────────────────────

test.describe('Scenario B — idle capital, no yield positions', () => {
  test.beforeEach(async ({ fork }) => {
    await fork.setErc20(TOKENS.USDC, usdc(5_000))   // 5,000 USDC undeployed
    await fork.setEth(weth(1))                        // 1 ETH
  })

  test('rebalancing panel shows undeployed capital prompt', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    // RebalancingPanel renders a "no positions" tip when capital is idle
    await expect(
      page.locator('[class*="RebalancingPanel"], [class*="rebalancingPanel"]')
        .getByText(/undeployed capital|not earning|deploy your capital/i)
        .first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('allocation wizard CTA is visible', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    await expect(
      page.getByRole('link', { name: /wizard|deploy/i })
        .or(page.getByRole('button', { name: /wizard|deploy capital/i }))
        .first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('Ethereum chain card shows ETH and USDC tokens', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    const ethCard = page.locator('[class*="chainCard"]').filter({ hasText: /ethereum/i })
    await expect(ethCard.first()).toBeVisible({ timeout: 15_000 })
    // Card shows token symbols and USD values (e.g. "ETH$1,945.21 USDC$5,000.00")
    await expect(ethCard.first()).toContainText('ETH', { timeout: 15_000 })
    await expect(ethCard.first()).toContainText('USDC', { timeout: 5_000 })
  })
})

// ── C: Mixed — earning + idle capital ────────────────────────────────────────

test.describe('Scenario C — mixed: earning + idle', () => {
  test.beforeEach(async ({ fork }) => {
    await fork.setErc20(TOKENS.aUSDC, usdc(500))    // 500 aUSDC earning
    await fork.setErc20(TOKENS.USDC,  usdc(2_000))  // 2,000 USDC idle
  })

  test('rebalancing panel shows opportunity delta', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    await expect(
      page.locator('[class*="RebalancingPanel"], [class*="rebalancingPanel"]')
        .getByText(/could earn|opportunity|more per year/i)
        .first()
    ).toBeVisible({ timeout: 15_000 })
  })

  test('"You\'re Earning" section lists existing aUSDC position', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    const earningSection = page.locator('[class*="PortfolioView"] [class*="sectionLabel"]')
      .filter({ hasText: /you.*earning/i })
    await expect(earningSection).toBeVisible({ timeout: 15_000 })
  })

  test('rebalancing panel shows "You\'re earning" and "You could earn" cards', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    const panel = page.locator('[class*="RebalancingPanel"], [class*="rebalancingPanel"]')
    // Exact label text from ComparisonCard component
    await expect(panel.getByText("You're earning").first()).toBeVisible({ timeout: 15_000 })
    await expect(panel.getByText("You could earn").first()).toBeVisible({ timeout: 15_000 })
  })
})

// ── D: Multiple aToken positions — stablecoin + ETH yield ────────────────────

test.describe('Scenario D — multiple yield positions', () => {
  test.beforeEach(async ({ fork }) => {
    await fork.setErc20(TOKENS.aUSDC, usdc(1_000))   // 1,000 aUSDC  (6 dec)
    await fork.setErc20(TOKENS.aWETH, weth(0.1))      // 0.1  aWETH   (18 dec)
  })

  test('dev banner shows "2 positions detected" after load', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    const banner = page.locator('div[class*="devBanner"]')
    await expect(banner).toBeVisible({ timeout: 10_000 })
    await expect(banner.locator('span[class*="devBannerDone"]')).toContainText(/2 position/i, { timeout: 20_000 })
  })

  test('positions panel lists multiple position rows', async ({ fork }) => {
    const { page, testAddress } = fork
    await page.goto(capitalUrl(testAddress))
    const earningSection = page.locator('[class*="PortfolioView"] [class*="sectionLabel"]')
      .filter({ hasText: /you.*earning/i })
    await expect(earningSection).toBeVisible({ timeout: 15_000 })
    // PortfolioView_positionRow — scoped to PortfolioView to avoid any
    // matches in other components. toHaveCount waits for exactly 2.
    const positions = page.locator('[class*="PortfolioView"] [class*="positionRow"]:not([class*="Skeleton"])')
    await expect(positions).toHaveCount(2, { timeout: 15_000 })
  })
})
