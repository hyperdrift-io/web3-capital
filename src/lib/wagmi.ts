import { createConfig, http } from 'wagmi'
import { mainnet, arbitrum, base, optimism, polygon } from 'wagmi/chains'
import { injected } from 'wagmi/connectors'

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, base, optimism, polygon],
  connectors: [
    injected(), // MetaMask, Rabby, Coinbase Wallet, etc.
  ],
  transports: {
    [mainnet.id]:   http(),
    [arbitrum.id]:  http(),
    [base.id]:      http(),
    [optimism.id]:  http(),
    [polygon.id]:   http(),
  },
})
