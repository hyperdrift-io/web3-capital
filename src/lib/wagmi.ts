import { createConfig, http } from 'wagmi'
import { mainnet, arbitrum, base, optimism, polygon } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'
import { porto } from 'porto/wagmi'

// Stable ids used for localStorage preference persistence
export const CONNECTOR_ID = {
  injected: 'injected',
  porto: 'xyz.ithaca.porto',
} as const

export type ConnectorId = typeof CONNECTOR_ID[keyof typeof CONNECTOR_ID]

/**
 * RPC transports with explicit CORS-friendly public endpoints as fallback.
 *
 * Problem: wagmi's http() with no URL falls back to viem's default nodes
 * (eth.merkle.io etc.) which block CORS from browser origins — unusable
 * for client-side reads (balance fetches, Chainlink, ERC-20 calls).
 *
 * Pattern:
 *   NEXT_PUBLIC_RPC_* env vars → private Alchemy/Infura key (production)
 *   fallback → official chain RPC + Cloudflare (free, CORS-open, no key)
 *
 * Production upgrade: set NEXT_PUBLIC_RPC_MAINNET=https://eth-mainnet.g.alchemy.com/v2/<key>
 * in your deployment env. Public fallbacks are fine for a demo but will
 * rate-limit under real user load.
 */
const rpc = {
  [mainnet.id]:   http(process.env.NEXT_PUBLIC_RPC_MAINNET  ?? 'https://cloudflare-eth.com'),
  [arbitrum.id]:  http(process.env.NEXT_PUBLIC_RPC_ARBITRUM ?? 'https://arb1.arbitrum.io/rpc'),
  [base.id]:      http(process.env.NEXT_PUBLIC_RPC_BASE     ?? 'https://mainnet.base.org'),
  [optimism.id]:  http(process.env.NEXT_PUBLIC_RPC_OPTIMISM ?? 'https://mainnet.optimism.io'),
  [polygon.id]:   http(process.env.NEXT_PUBLIC_RPC_POLYGON  ?? 'https://polygon-rpc.com'),
}

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, base, optimism, polygon],
  ssr: true, // required for Next.js App Router — prevents hydration mismatch
  connectors: [
    injected(),
    porto(),
  ],
  transports: rpc,
})
