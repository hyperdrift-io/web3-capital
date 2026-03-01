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

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, base, optimism, polygon],
  ssr: true, // required for Next.js App Router — prevents hydration mismatch
  connectors: [
    injected(),
    porto(),
  ],
  transports: {
    [mainnet.id]:   http(),
    [arbitrum.id]:  http(),
    [base.id]:      http(),
    [optimism.id]:  http(),
    [polygon.id]:   http(),
  },
})
