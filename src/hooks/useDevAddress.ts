'use client'

import { useState, useEffect } from 'react'

/**
 * Dev-only address override for testing portfolio views without a funded wallet.
 *
 * Usage: append ?dev=0x<address> to any URL in development.
 * The address is used in place of the connected wallet in PortfolioView and
 * RebalancingPanel, so you can inspect any on-chain portfolio read-only.
 *
 * Example addresses with Aave v3 / Compound v3 positions on mainnet
 * (all public blockchain data — no privacy concern):
 *
 *   0x4B16c5dE96EB2117bBE5fd171E4d203624B014aa  — Aave v3 USDC/WETH supplier
 *   0x47ac0Fb4F2D84898e4D9E7b4DaB3C24507a6D503  — Binance 8 (large stablecoin holdings)
 *   0xF977814e90dA44bFA03b6295A0616a897441aceC  — Binance 14 (multi-chain)
 *
 * To find fresh addresses: go to app.aave.com → Markets → any reserve →
 * top suppliers. Click any address to see their positions, then use that.
 *
 * Stripped at build time (process.env.NODE_ENV check).
 * NEVER expose in production: anyone sharing a URL could deanonymise themselves.
 */
export function useDevAddress(): `0x${string}` | undefined {
  const [address, setAddress] = useState<`0x${string}` | undefined>(undefined)

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const params = new URLSearchParams(window.location.search)
    const dev    = params.get('dev')
    if (!dev) return
    if (!/^0x[0-9a-fA-F]{40}$/.test(dev)) return
    setAddress(dev as `0x${string}`)
  }, [])

  return address
}
