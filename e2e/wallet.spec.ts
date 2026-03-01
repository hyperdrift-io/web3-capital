import { test, expect, MOCK_ADDRESS } from './fixtures'

const truncated = `${MOCK_ADDRESS.slice(0, 6)}…${MOCK_ADDRESS.slice(-4)}`

test.describe('Wallet button — no wallet installed', () => {
  test('shows "Install wallet" link when window.ethereum is absent', async ({ noWalletPage: page }) => {
    await page.goto('/')
    await expect(page.getByRole('link', { name: /install wallet/i })).toBeVisible()
  })

  test('install wallet link points to metamask.io', async ({ noWalletPage: page }) => {
    await page.goto('/')
    const link = page.getByRole('link', { name: /install wallet/i })
    await expect(link).toHaveAttribute('href', 'https://metamask.io')
  })
})

test.describe('Wallet button — wallet present but disconnected', () => {
  test('shows "Connect Wallet" when window.ethereum is available', async ({ walletPage: page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible()
  })

  test('shows a chevron button to access alternative connector', async ({ walletPage: page }) => {
    await page.goto('/')
    await expect(page.getByRole('button', { name: /more wallet options/i })).toBeVisible()
  })

  test('chevron dropdown reveals "Smart Wallet" option', async ({ walletPage: page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /more wallet options/i }).click()
    await expect(page.getByText(/smart wallet/i)).toBeVisible()
  })
})

test.describe('Wallet connection flow', () => {
  test('connects and shows truncated address in header', async ({ walletPage: page }) => {
    await page.goto('/')

    // Click the primary connect button
    await page.getByRole('button', { name: /connect wallet/i }).click()

    // After the mock resolves eth_requestAccounts, wagmi marks as connected
    // and the button label changes to the truncated address
    const truncated = `${MOCK_ADDRESS.slice(0, 6)}…${MOCK_ADDRESS.slice(-4)}`
    await expect(page.getByText(truncated)).toBeVisible({ timeout: 5_000 })
  })

  test('connected address dropdown shows copy and disconnect actions', async ({ walletPage: page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /connect wallet/i }).click()

    const truncated = `${MOCK_ADDRESS.slice(0, 6)}…${MOCK_ADDRESS.slice(-4)}`
    await page.getByText(truncated).click()

    await expect(page.getByRole('button', { name: /disconnect/i })).toBeVisible()
    await expect(page.getByTitle(/copy address/i)).toBeVisible()
  })

  test('disconnect returns wallet button to "Connect Wallet" state', async ({ walletPage: page }) => {
    await page.goto('/')
    await page.getByRole('button', { name: /connect wallet/i }).click()

    const truncated = `${MOCK_ADDRESS.slice(0, 6)}…${MOCK_ADDRESS.slice(-4)}`
    await page.getByText(truncated).click()
    await page.getByRole('button', { name: /disconnect/i }).click()

    await expect(page.getByRole('button', { name: /connect wallet/i })).toBeVisible({ timeout: 3_000 })
  })
})

test.describe('Capital page — wallet-gated content', () => {
  test('shows "Connect your wallet" prompt when disconnected', async ({ noWalletPage: page }) => {
    await page.goto('/capital')
    await expect(page.getByText(/connect your wallet/i)).toBeVisible()
    await expect(page.getByText(/reads are on-chain only/i)).toBeVisible()
  })

  test('shows capital projection cards after connecting', async ({ walletPage: page }) => {
    // Pre-navigate to capital page — projection cards only render when connected
    await page.goto('/capital')

    // Confirm the "connect" prompt is there first
    await expect(page.getByText(/connect your wallet/i)).toBeVisible()

    // Connect from the header
    await page.getByRole('button', { name: /connect wallet/i }).click()

    const truncated = `${MOCK_ADDRESS.slice(0, 6)}…${MOCK_ADDRESS.slice(-4)}`
    await expect(page.getByText(truncated)).toBeVisible({ timeout: 5_000 })

    // Capital view should now show available capital panel
    await expect(page.getByText(/available capital/i)).toBeVisible()
  })

  test('capital projection shows ETH balance from chain', async ({ walletPage: page }) => {
    // Intercept the RPC call for eth_getBalance to return a known value
    // wagmi targets the configured RPC URLs — intercept any of them
    await page.route('**/*', async (route) => {
      const body = route.request().postData()
      if (body?.includes('"eth_getBalance"')) {
        await route.fulfill({
          contentType: 'application/json',
          // Return exactly 2 ETH in hex
          body: JSON.stringify({ jsonrpc: '2.0', id: 1, result: '0x1BC16D674EC80000' }),
        })
      } else {
        await route.continue()
      }
    })

    await page.goto('/capital')
    await page.getByRole('button', { name: /connect wallet/i }).click()

    await expect(page.getByText(truncated)).toBeVisible({ timeout: 5_000 })
    // 2 ETH should appear somewhere in the balance display
    await expect(page.getByText(/2\.0000/)).toBeVisible({ timeout: 5_000 })
  })
})
