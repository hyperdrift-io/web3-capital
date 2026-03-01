import { test as base, type Page } from '@playwright/test'

const MOCK_ADDRESS = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
// 2 ETH in wei (hex)
const MOCK_BALANCE = '0x1BC16D674EC80000'

/**
 * Injects a minimal EIP-1193 + EIP-6963 provider before page scripts run.
 * Handles the methods wagmi's injected() connector actually calls.
 */
async function injectMockWallet(page: Page) {
  await page.addInitScript(({ address, balance }) => {
    const provider = {
      isMetaMask: true,
      selectedAddress: address,
      chainId: '0x1',
      request: async ({ method, params }: { method: string; params?: unknown[] }) => {
        switch (method) {
          case 'eth_accounts':
          case 'eth_requestAccounts':
            return [address]
          case 'eth_chainId':
            return '0x1'
          case 'eth_blockNumber':
            return '0x143f2e0'
          case 'eth_getBalance':
            return balance
          case 'wallet_switchEthereumChain':
            return null
          default:
            throw new Error(`Mock wallet: unhandled method ${method}`)
        }
      },
      on: () => {},
      removeListener: () => {},
    }

    // EIP-1193 legacy path
    ;(window as Window & { ethereum?: unknown }).ethereum = provider

    // EIP-6963 — wagmi's injected() connector uses this for discovery
    const info = {
      uuid: 'test-wallet-uuid',
      name: 'Mock Wallet',
      icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
      rdns: 'io.metamask',
    }
    const announce = () => {
      window.dispatchEvent(
        new CustomEvent('eip6963:announceProvider', {
          detail: Object.freeze({ info, provider }),
        })
      )
    }
    window.addEventListener('eip6963:requestProvider', announce)
    announce()
  }, { address: MOCK_ADDRESS, balance: MOCK_BALANCE })
}

export const test = base.extend<{
  /** Page with no wallet at all — window.ethereum absent */
  noWalletPage: Page
  /** Page with a mock wallet injected (not yet connected) */
  walletPage: Page
}>({
  noWalletPage: async ({ page }, use) => {
    // Remove any lingering wagmi reconnect state
    await page.addInitScript(() => {
      localStorage.removeItem('wagmi.store')
      localStorage.removeItem('wallet_connector_pref')
    })
    await use(page)
  },

  walletPage: async ({ page }, use) => {
    await injectMockWallet(page)
    await page.addInitScript(() => {
      localStorage.removeItem('wagmi.store')
    })
    await use(page)
  },
})

export { expect } from '@playwright/test'
export { MOCK_ADDRESS }
