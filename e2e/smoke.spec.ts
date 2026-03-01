import { test, expect } from './fixtures'

/**
 * Smoke tests: every page must return 200 and render key content.
 * Run these first (or in CI) to catch broken builds before deeper e2e.
 * Covers both "no wallet" and "wallet present" so route-level errors
 * (syntax, missing deps, bad imports) are caught regardless of wallet state.
 *
 * Uses data-testid for stable selectors; see AGENTS.md (E2E / data-testid).
 */

const ROUTES: { path: string; testId: string }[] = [
  { path: '/', testId: 'smoke-home' },
  { path: '/yield', testId: 'smoke-yield' },
  { path: '/capital', testId: 'smoke-capital' },
]

test.describe('Smoke — pages load (no wallet)', () => {
  for (const { path, testId } of ROUTES) {
    test(`${path} returns 200 and renders key content`, async ({ noWalletPage: page }) => {
      const res = await page.goto(path)
      expect(res?.ok(), `${path} should return 2xx, got ${res?.status()}`).toBe(true)
      await expect(page.getByTestId(testId)).toBeVisible({ timeout: 15_000 })
    })
  }
})

test.describe('Smoke — pages load (wallet present)', () => {
  for (const { path, testId } of ROUTES) {
    test(`${path} returns 200 and renders key content`, async ({ walletPage: page }) => {
      const res = await page.goto(path)
      expect(res?.ok(), `${path} should return 2xx, got ${res?.status()}`).toBe(true)
      await expect(page.getByTestId(testId)).toBeVisible({ timeout: 15_000 })
    })
  }
})
