import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WalletButton } from '@/components/WalletPanel/WalletButton'

// Minimal connector shape the component uses
const injectedConnector = { id: 'injected', name: 'MetaMask' }
const portoConnector    = { id: 'xyz.ithaca.porto', name: 'Porto' }

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
  connectors = [injectedConnector, portoConnector],
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
  vi.mocked(useConnect).mockReturnValue({ connect: mockConnect, connectors, isPending, error } as unknown as ReturnType<typeof useConnect>)
  vi.mocked(useDisconnect).mockReturnValue({ disconnect: mockDisconnect } as unknown as ReturnType<typeof useDisconnect>)
}

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
})

describe('WalletButton', () => {
  describe('no wallet installed', () => {
    it('shows an install prompt when no connectors are available', () => {
      setupMocks({ connectors: [] })
      render(<WalletButton />)
      expect(screen.getByText(/install wallet/i)).toBeInTheDocument()
    })

    it('install link points to metamask.io', () => {
      setupMocks({ connectors: [] })
      render(<WalletButton />)
      const link = screen.getByRole('link', { name: /install wallet/i })
      expect(link).toHaveAttribute('href', 'https://metamask.io')
    })
  })

  describe('disconnected with connectors available', () => {
    it('shows "Connect Wallet" as the default primary action', () => {
      setupMocks()
      render(<WalletButton />)
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument()
    })

    it('calls connect() with the injected connector on primary click', async () => {
      const user = userEvent.setup()
      setupMocks()
      render(<WalletButton />)
      await user.click(screen.getByRole('button', { name: /connect wallet/i }))
      expect(mockConnect).toHaveBeenCalledWith({ connector: injectedConnector })
    })

    it('shows "Connecting…" label while connection is pending', () => {
      setupMocks({ isPending: true })
      render(<WalletButton />)
      expect(screen.getByText(/connecting…/i)).toBeInTheDocument()
    })

    it('displays a simplified error when the user rejects the connection', () => {
      setupMocks({ error: { message: 'User rejected the request' } })
      render(<WalletButton />)
      expect(screen.getByText(/rejected/i)).toBeInTheDocument()
    })

    it('chevron dropdown reveals the alt connector option', async () => {
      const user = userEvent.setup()
      setupMocks()
      render(<WalletButton />)
      const chevron = screen.getByLabelText(/more wallet options/i)
      await user.click(chevron)
      expect(screen.getByText(/smart wallet/i)).toBeInTheDocument()
    })
  })

  describe('connected state', () => {
    const address = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'

    it('renders the truncated address instead of connect button', () => {
      setupMocks({ isConnected: true, address })
      render(<WalletButton />)
      // formatAddress('0xd8dA6...96045') → '0xd8dA…6045'
      expect(screen.getByText(/0xd8dA.*6045/)).toBeInTheDocument()
    })

    it('opens dropdown on click showing disconnect option', async () => {
      const user = userEvent.setup()
      setupMocks({ isConnected: true, address })
      render(<WalletButton />)
      await user.click(screen.getByText(/0xd8dA.*6045/))
      expect(screen.getByText(/disconnect/i)).toBeInTheDocument()
    })

    it('calls disconnect() when the Disconnect button is clicked', async () => {
      const user = userEvent.setup()
      setupMocks({ isConnected: true, address })
      render(<WalletButton />)
      await user.click(screen.getByText(/0xd8dA.*6045/))
      await user.click(screen.getByRole('button', { name: /disconnect/i }))
      expect(mockDisconnect).toHaveBeenCalledOnce()
    })
  })
})
