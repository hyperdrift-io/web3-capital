import crypto from 'node:crypto'

/**
 * Tenderly Virtual Testnet fixture for E2E portfolio tests.
 *
 * What this gives you:
 *   - A forked copy of Ethereum mainnet (fresh for every test suite)
 *   - `tenderly_setErc20Balance` to mint any ERC-20 to a test address — no real funds
 *   - All wagmi RPC calls intercepted and proxied to the fork, so the app's hooks
 *     read REAL contract state (not mocked responses) from a CONTROLLED environment
 *   - Automatic fork teardown after each test
 *
 * Setup:
 *   1. Create a free account at dashboard.tenderly.co
 *   2. Create a project and note the account/project slugs from the URL:
 *        dashboard.tenderly.co/<ACCOUNT>/<PROJECT>
 *   3. Generate an access key: Settings → Authorization → Generate Access Key
 *   4. Add to .env.local:
 *        TENDERLY_ACCESS_KEY=...
 *        TENDERLY_ACCOUNT=...
 *        TENDERLY_PROJECT=...
 *
 * Tests using the `fork` fixture are automatically skipped when these vars are absent,
 * so CI works without secrets and the tests opt-in when you have them.
 *
 * Docs: https://docs.tenderly.co/virtual-testnets
 */

import { test as base, type Page, type TestInfo } from '@playwright/test'

// ── Config ────────────────────────────────────────────────────────────────────

const ACCOUNT    = process.env.TENDERLY_ACCOUNT    ?? ''
const PROJECT    = process.env.TENDERLY_PROJECT    ?? ''
const ACCESS_KEY = process.env.TENDERLY_ACCESS_KEY ?? ''

export const isTenderlyConfigured =
  Boolean(ACCOUNT && PROJECT && ACCESS_KEY)

// ── Well-known test address ───────────────────────────────────────────────────
//
// Hardhat default account #0 — recognised by every DeFi developer.
// Has no real mainnet funds; we fund it via tenderly_setErc20Balance.

export const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266' as const

// ── Known mainnet token addresses ─────────────────────────────────────────────

export const TOKENS = {
  // Aave v3 aTokens (mainnet)
  aUSDC:  '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c',  // 6 dec
  aUSDT:  '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a',  // 6 dec
  aWETH:  '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8',  // 18 dec
  // Liquid tokens
  USDC:   '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',  // 6 dec
  USDT:   '0xdAC17F958D2ee523a2206206994597C13D831ec7',  // 6 dec
} as const

// ── Known whale addresses per token ──────────────────────────────────────────
//
// Used by setErc20() to impersonate a holder and transfer to the test address.
// tenderly_setErc20Balance is not supported on Virtual Testnets; impersonation
// achieves the same result and exercises real ERC-20 transfer logic.
//
// Addresses sourced from Etherscan holders list for each token.
// Verify at: https://etherscan.io/token/<token_address>#balances

// Whale addresses sourced from recent Transfer event logs on mainnet
// (block ~24,565,000, Mar 2026). Verify via Etherscan if tests fail after
// a major market event — holders do move funds.
const TOKEN_WHALE: Record<string, string> = {
  // aUSDC — large Aave depositor (verified block ~24.5M, holds >500k aUSDC)
  '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c': '0x464C71f6c2F760DdA6093dCB91C24c39e5d6e18c',
  // aWETH — active depositor (verified block ~24.5M, holds ~101 aWETH)
  '0x4d5F47FA6A74757f35C14fD3a6Ef8E3C9BC514E8': '0x13a76d83abedff682ba900199d7d2e926657d606',
  // USDC — Binance 14 (holds >1B raw USDC)
  '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': '0x28C6c06298d514Db089934071355E5743bf21d60',
  // USDT — Binance 14
  '0xdAC17F958D2ee523a2206206994597C13D831ec7': '0x28C6c06298d514Db089934071355E5743bf21d60',
}

// ── Amount helpers ────────────────────────────────────────────────────────────

/** Encode any bigint as a 0x hex string (for Tenderly RPC params). */
export const toHex = (n: bigint): `0x${string}` =>
  `0x${n.toString(16)}` as `0x${string}`

/** USDC / aUSDC amount — 6 decimals. `usdc(1000)` = 1,000 USDC. */
export const usdc = (amount: number) => toHex(BigInt(Math.round(amount * 1_000_000)))

/** ETH amount — 18 decimals. `eth(2)` = 2 ETH. */
export const eth  = (amount: number) => toHex(BigInt(Math.round(amount * 1e18)))

/** 18-decimal ERC-20 amount (WETH, aWETH, wstETH). `weth(0.5)` = 0.5 tokens. */
export const weth = eth  // same encoding — alias for clarity

// ── Tenderly API helpers ──────────────────────────────────────────────────────

interface VNet {
  id:       string
  adminRpc: string
  rpcUrl:   string
}

const apiHeaders = {
  'X-Access-Key': ACCESS_KEY,
  'Content-Type': 'application/json',
}

async function createVNet(): Promise<VNet> {
  const res = await fetch(
    `https://api.tenderly.co/api/v1/account/${ACCOUNT}/project/${PROJECT}/vnets`,
    {
      method:  'POST',
      headers: apiHeaders,
      body: JSON.stringify({
        // UUID slug — prevents collisions when tests run in parallel
        slug:         `e2e-${crypto.randomUUID()}`,
        display_name: 'Capital Engine E2E',
        fork_config: {
          network_id: 1,          // Ethereum mainnet
          // no block_number → forks from latest
        },
        virtual_network_config: {
          chain_config: { chain_id: 1 },
        },
        access_config: { type: 'TENDERLY' },
      }),
    }
  )

  if (!res.ok) {
    throw new Error(`Tenderly VNet creation failed (${res.status}): ${await res.text()}`)
  }

  const data = await res.json()
  const rpcs: Array<{ url: string; name: string }> = data.rpcs ?? []

  // Tenderly returns two RPC endpoints: one with admin methods, one without
  const adminRpc = rpcs.find(r => r.name?.toLowerCase().includes('admin'))?.url
                ?? rpcs[0]?.url
  const rpcUrl   = rpcs.find(r => !r.name?.toLowerCase().includes('admin'))?.url
                ?? rpcs[1]?.url
                ?? rpcs[0]?.url

  if (!adminRpc || !rpcUrl) {
    throw new Error(`Unexpected Tenderly VNet response shape: ${JSON.stringify(data)}`)
  }

  return { id: data.id, adminRpc, rpcUrl }
}

async function deleteVNet(id: string): Promise<void> {
  await fetch(
    `https://api.tenderly.co/api/v1/account/${ACCOUNT}/project/${PROJECT}/vnets/${id}`,
    { method: 'DELETE', headers: apiHeaders }
  )
}

async function rpc(url: string, method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  })
  const data = await res.json()
  if (data.error) {
    throw new Error(`Tenderly RPC ${method} error: ${JSON.stringify(data.error)}`)
  }
  return data.result
}

/**
 * Fund a test address with an ERC-20 token by impersonating a known whale holder
 * and transferring to the target.
 *
 * Note: tenderly_setErc20Balance is not supported on Virtual Testnets (only DevNets).
 * The impersonation approach is actually more realistic — it exercises real ERC-20
 * transfer() logic, including the hook mechanisms in Aave aTokens.
 */
async function setErc20ByImpersonation(
  adminRpc:    string,
  to:          string,
  token:       string,
  amountHex:   `0x${string}`,
): Promise<void> {
  const whale = TOKEN_WHALE[token.toLowerCase()]
           ?? TOKEN_WHALE[token]
  if (!whale) {
    throw new Error(
      `No whale address registered for token ${token}. ` +
      `Add one to TOKEN_WHALE in e2e/tenderly.ts.`
    )
  }

  // Give the whale ETH so the transfer doesn't fail on gas
  await rpc(adminRpc, 'hardhat_setBalance', [whale, eth(1)])
  await rpc(adminRpc, 'hardhat_impersonateAccount', [whale])

  // ERC-20 transfer(address to, uint256 amount)
  const toPadded  = to.slice(2).toLowerCase().padStart(64, '0')
  const amtPadded = amountHex.slice(2).padStart(64, '0')
  const data      = `0xa9059cbb${toPadded}${amtPadded}`

  // Use higher gas limit — Aave aTokens run hooks on every transfer
  // and require more gas than a plain ERC-20 (tested: 0x30000 fails for aWETH)
  await rpc(adminRpc, 'eth_sendTransaction', [{
    from: whale,
    to:   token,
    data,
    gas:  '0x60000',
  }])

  await rpc(adminRpc, 'hardhat_stopImpersonatingAccount', [whale])
}

// ── Playwright route helper ───────────────────────────────────────────────────

/**
 * Intercept all wagmi RPC calls in the browser and proxy them to the Tenderly
 * fork. The app code is untouched — wagmi still sends to cloudflare-eth.com, but
 * Playwright catches those at the network layer and forwards them to the fork.
 *
 * This means the React hooks read REAL contract state from the fork (including
 * balances we set with tenderly_setErc20Balance), without any response mocking.
 */
async function routeRpcToFork(page: Page, forkRpcUrl: string) {
  const mainnetRpcs = /cloudflare-eth\.com|eth-mainnet\.g\.alchemy\.com/

  await page.route(mainnetRpcs, async (route) => {
    const body = route.request().postData()
    try {
      const res = await fetch(forkRpcUrl, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    body ?? '{}',
      })
      const json = await res.json()
      await route.fulfill({ json })
    } catch {
      // Fall through to the real endpoint on proxy error
      await route.continue()
    }
  })
}

// ── Fixture ───────────────────────────────────────────────────────────────────

export type ForkFixture = {
  /** The Playwright page with mainnet RPC calls routed to the fork. */
  page:        Page
  /** Well-known test address — use this with `?dev=` or a mock wallet. */
  testAddress: typeof TEST_ADDRESS
  /** Set any ERC-20 balance on the test address in the fork. */
  setErc20:    (token: string, amount: `0x${string}`) => Promise<void>
  /** Set the native ETH balance on the test address in the fork. */
  setEth:      (amount: `0x${string}`) => Promise<void>
}

export const test = base.extend<{ fork: ForkFixture }>({
  fork: async ({ page }, use, testInfo: TestInfo) => {
    testInfo.skip(
      !isTenderlyConfigured,
      'Tenderly not configured — set TENDERLY_ACCESS_KEY, TENDERLY_ACCOUNT, TENDERLY_PROJECT in .env.local to run these tests'
    )

    const vnet = await createVNet()

    // Default: give the test address 2 ETH so gas reads don't error
    await rpc(vnet.adminRpc, 'hardhat_setBalance', [TEST_ADDRESS, eth(2)])

    // Proxy wagmi's mainnet RPC calls to the fork
    await routeRpcToFork(page, vnet.rpcUrl)

    await use({
      page,
      testAddress: TEST_ADDRESS,
      setErc20: (token, amount) =>
        setErc20ByImpersonation(vnet.adminRpc, TEST_ADDRESS, token, amount),
      setEth: (amount) =>
        rpc(vnet.adminRpc, 'hardhat_setBalance', [TEST_ADDRESS, amount]),
    })

    await deleteVNet(vnet.id)
  },
})

export { expect } from '@playwright/test'
