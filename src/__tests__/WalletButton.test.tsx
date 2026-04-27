import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WalletButton } from '@/components/WalletPanel/WalletButton'

// Minimal connector shape the component uses
const injectedConnector = { id: 'injected', name: 'Browser Wallet' }

const mockConnect    = vi.fn()
const mockDisconnect = vi.fn()

vi.mock('wagmi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('wagmi')>()
  return {
    ...actual,
    useAccount:    vi.fn(),
    useConnect:    vi.fn(),
    useDisconnect: vi.fn(),
  }
})

import { useAccount, useConnect, useDisconnect } from 'wagmi'

function setupMocks({
  isConnected = false,
  address,
  connectors = [injectedConnector],
  isPending = false,
  error = null,
}: {
  isConnected?: boolean
  address?: string
  connectors?: typeof injectedConnector[]
  isPending?: boolean
  error?: { message: string } | null
} = {}) {
  vi.mocked(useAccount).mockReturnValue({ isConnected, address } as ReturnType<typeof useAccount>)
  vi.mocked(useConnect).mockReturnValue({ connect: mockConnect, connectors, isPending, error, reset: vi.fn() } as unknown as ReturnType<typeof useConnect>)
  vi.mocked(useDisconnect).mockReturnValue({ disconnect: mockDisconnect } as unknown as ReturnType<typeof useDisconnect>)
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

afterEach(() => {
  Reflect.deleteProperty(window, 'ethereum')
})

describe('WalletButton', () => {
  describe('no wallet installed', () => {
    it('shows an install prompt when no connectors are available', () => {
      setupMocks({ connectors: [] })
      const view = render(<WalletButton />)
      expect(view.getByText(/install metamask/i)).toBeInTheDocument()
    })

    it('install link points to metamask.io', () => {
      setupMocks({ connectors: [] })
      const view = render(<WalletButton />)
      const link = view.getByRole('link', { name: /install metamask/i })
      expect(link).toHaveAttribute('href', 'https://metamask.io')
    })
  })

  describe('disconnected with connectors available', () => {
    it('shows "Connect Wallet" button', async () => {
      setupMocks()
      const view = render(<WalletButton />)
      await waitFor(() => {
        expect(view.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument()
      })
    })

    it('calls connect() with the injected connector on click', async () => {
      const user = userEvent.setup()
      setupMocks()
      const view = render(<WalletButton />)
      const connectBtn = await waitFor(() =>
        view.getByRole('button', { name: /connect wallet/i }),
      )
      await user.click(connectBtn)
      expect(mockConnect).toHaveBeenCalledWith({ connector: injectedConnector })
    })

    it('shows "Connecting…" label while connection is pending', async () => {
      setupMocks({ isPending: true })
      const view = render(<WalletButton />)
      await waitFor(() => {
        expect(view.getByText(/connecting…/i)).toBeInTheDocument()
      })
    })

    it('displays a simplified error when the user rejects the connection', () => {
      setupMocks({ error: { message: 'User rejected the request' } })
      const view = render(<WalletButton />)
      expect(view.getByText(/rejected/i)).toBeInTheDocument()
    })

    it('shows install link when MetaMask extension not found error occurs', () => {
      setupMocks({ error: { message: 'MetaMask extension not found' } })
      const view = render(<WalletButton />)
      expect(view.getByText(/install metamask/i)).toBeInTheDocument()
    })
  })

  describe('connected state', () => {
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

    it('renders the truncated address instead of connect button', () => {
      setupMocks({ isConnected: true, address })
      const view = render(<WalletButton />)
      expect(view.getByText(/0xd8dA.*6045/)).toBeInTheDocument()
    })

    it('opens dropdown on click showing disconnect option', async () => {
      const user = userEvent.setup()
      setupMocks({ isConnected: true, address })
      const view = render(<WalletButton />)
      await user.click(view.getByText(/0xd8dA.*6045/))
      expect(view.getByText(/disconnect/i)).toBeInTheDocument()
    })

    it('calls disconnect() when the Disconnect button is clicked', async () => {
      const user = userEvent.setup()
      setupMocks({ isConnected: true, address })
      const view = render(<WalletButton />)
      await user.click(view.getByText(/0xd8dA.*6045/))
      await user.click(view.getByRole('button', { name: /disconnect/i }))
      expect(mockDisconnect).toHaveBeenCalledOnce()
    })
  })
})

