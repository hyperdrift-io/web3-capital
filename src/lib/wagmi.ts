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

// ── RPC profile ───────────────────────────────────────────────────────────────
//
// NODE_ENV drives the profile — no extra env var needed:
//
//   development  → public CORS-friendly endpoints (free, no key, rate-limited)
//                  Override any chain by setting NEXT_PUBLIC_RPC_* in .env.local
//
//   production   → same logic; public fallbacks work fine for real traffic
//                  (Cloudflare, Offchain Labs, Coinbase, OP Labs, Polygon
//                  Foundation all run these as public infrastructure)
//                  Switch to Alchemy/Infura only when you need guaranteed
//                  uptime SLAs or archive data (thousands of concurrent users)
//
// Single Alchemy key shortcut: set NEXT_PUBLIC_ALCHEMY_KEY and leave the
// per-chain vars blank — wagmi builds the correct URL for each chain.

const alchemyKey = process.env.NEXT_PUBLIC_ALCHEMY_KEY

const PUBLIC_RPCS: Record<number, string> = {
  [mainnet.id]:  'https://cloudflare-eth.com',
  [arbitrum.id]: 'https://arb1.arbitrum.io/rpc',
  [base.id]:     'https://mainnet.base.org',
  [optimism.id]: 'https://mainnet.optimism.io',
  [polygon.id]:  'https://polygon-rpc.com',
}

const ALCHEMY_RPCS: Record<number, string> = {
  [mainnet.id]:  `https://eth-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  [arbitrum.id]: `https://arb-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  [base.id]:     `https://base-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  [optimism.id]: `https://opt-mainnet.g.alchemy.com/v2/${alchemyKey}`,
  [polygon.id]:  `https://polygon-mainnet.g.alchemy.com/v2/${alchemyKey}`,
}

function rpcUrl(chainId: number, envVar: string | undefined): string {
  if (envVar)      return envVar                  // explicit per-chain override
  if (alchemyKey)  return ALCHEMY_RPCS[chainId]  // single Alchemy key
  return PUBLIC_RPCS[chainId]                     // public fallback
}

export const wagmiConfig = createConfig({
  chains: [mainnet, arbitrum, base, optimism, polygon],
  ssr: true,
  connectors: [injected(), porto()],
  transports: {
    [mainnet.id]:  http(rpcUrl(mainnet.id,  process.env.NEXT_PUBLIC_RPC_MAINNET)),
    [arbitrum.id]: http(rpcUrl(arbitrum.id, process.env.NEXT_PUBLIC_RPC_ARBITRUM)),
    [base.id]:     http(rpcUrl(base.id,     process.env.NEXT_PUBLIC_RPC_BASE)),
    [optimism.id]: http(rpcUrl(optimism.id, process.env.NEXT_PUBLIC_RPC_OPTIMISM)),
    [polygon.id]:  http(rpcUrl(polygon.id,  process.env.NEXT_PUBLIC_RPC_POLYGON)),
  },
})
