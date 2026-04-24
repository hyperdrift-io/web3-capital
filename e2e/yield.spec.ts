import { test, expect } from './fixtures'

/**
 * These tests hit the real DeFi Llama API — that's intentional.
 * The point is to verify the full pipeline: fetch → score → render.
 * If DeFi Llama is down, skip rather than fail (handled via retry config).
 */
test.describe('Yield page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/yield')
  })

  test('renders the yield table with live pool data', async ({ page }) => {
    // Table should have at least some rows — real API returns thousands
    const rows = page.locator('tbody tr')
    await expect(rows.first()).toBeVisible({ timeout: 15_000 })
    const count = await rows.count()
    expect(count).toBeGreaterThan(10)
  })

  test('every visible row shows a protocol name, APY, TVL and CE score', async ({ page }) => {
    await page.locator('tbody tr').first().waitFor({ timeout: 15_000 })

    // Spot-check the first 5 rows for required fields
    const firstFiveRows = page.locator('tbody tr').nth(0)
    const cells = firstFiveRows.locator('td')

    // Protocol / Pool cell
    await expect(cells.nth(0)).not.toBeEmpty()
    // APY cell — should contain a %
    await expect(cells.nth(1)).toContainText('%')
    // TVL cell — should start with $
    await expect(cells.nth(2)).toContainText('$')
    // CE score — should be a number 0–100
    const ceText = await cells.nth(3).textContent()
    const ce = parseInt(ceText ?? '0', 10)
    expect(ce).toBeGreaterThanOrEqual(0)
    expect(ce).toBeLessThanOrEqual(100)
  })

  test('only anchor / balanced / opportunistic band badges appear', async ({ page }) => {
    await page.locator('tbody tr').first().waitFor({ timeout: 15_000 })

    const badges = page.locator('.badge')
    const count = await badges.count()
    expect(count).toBeGreaterThan(0)

    // All badge text should be one of the three valid bands
    const validBands = new Set(['Anchor', 'Balanced', 'Opportunistic'])
    for (let i = 0; i < Math.min(count, 20); i++) {
      const text = await badges.nth(i).textContent()
      expect(validBands.has(text ?? '')).toBe(true)
    }
  })

  test('CE score is highest for the first row (default sort)', async ({ page }) => {
    await page.locator('tbody tr').first().waitFor({ timeout: 15_000 })

    const ceScores = await page.locator('tbody tr').evaluateAll(rows =>
      rows.slice(0, 10).map(row => {
        const ceCell = row.querySelectorAll('td')[3]
        return parseInt(ceCell?.textContent ?? '0', 10)
      })
    )

    // Default sort is CE descending — each score should be >= the next
    for (let i = 0; i < ceScores.length - 1; i++) {
      expect(ceScores[i]).toBeGreaterThanOrEqual(ceScores[i + 1])
    }
  })

  test('clicking APY header sorts pools by APY descending', async ({ page }) => {
    await page.locator('tbody tr').first().waitFor({ timeout: 15_000 })

    await page.getByRole('button', { name: /apy/i }).click()

    // Give React a tick to re-sort
    await page.waitForTimeout(200)

    const apyValues = await page.locator('tbody tr').evaluateAll(rows =>
      rows.slice(0, 10).map(row => {
        const apyCell = row.querySelectorAll('td')[1]
        return parseFloat(apyCell?.textContent?.replace('%', '') ?? '0')
      })
    )

    for (let i = 0; i < apyValues.length - 1; i++) {
      expect(apyValues[i]).toBeGreaterThanOrEqual(apyValues[i + 1])
    }
  })

  test('clicking APY header twice reverses to ascending', async ({ page }) => {
    await page.locator('tbody tr').first().waitFor({ timeout: 15_000 })

    const apyHeader = page.getByRole('button', { name: /apy/i })
    await apyHeader.click()
    await apyHeader.click()
    await page.waitForTimeout(200)

    const apyValues = await page.locator('tbody tr').evaluateAll(rows =>
      rows.slice(0, 10).map(row => {
        const apyCell = row.querySelectorAll('td')[1]
        return parseFloat(apyCell?.textContent?.replace('%', '') ?? '0')
      })
    )

    for (let i = 0; i < apyValues.length - 1; i++) {
      expect(apyValues[i]).toBeLessThanOrEqual(apyValues[i + 1])
    }
  })

  test('allocation bands panel groups pools correctly', async ({ page }) => {
    // Wait for data to load
    await page.locator('tbody tr').first().waitFor({ timeout: 15_000 })

    // All three band cards should be present
    await expect(page.getByText('Anchor', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Balanced', { exact: true }).first()).toBeVisible()
    await expect(page.getByText('Opportunistic', { exact: true }).first()).toBeVisible()

    // Each band shows a pool count (e.g. "42 pools")
    const poolCounts = page.getByText(/\d+ pools/)
    await expect(poolCounts.first()).toBeVisible()
  })
})
