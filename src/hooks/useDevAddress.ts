'use client'

import { useState, useLayoutEffect } from 'react'

/**
 * Dev-only address override — append ?dev=0x<address> to any capital page URL.
 *
 * Uses useLayoutEffect (runs before paint) to avoid the flash of "connect wallet"
 * prompt that useEffect caused (it ran after the first paint).
 *
 * Stripped in production builds via NODE_ENV check.
 */
export function useDevAddress(): `0x${string}` | undefined {
  const [address, setAddress] = useState<`0x${string}` | undefined>(undefined)

  useLayoutEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const params = new URLSearchParams(window.location.search)
    const dev    = params.get('dev')
    if (!dev) return
    if (!/^0x[0-9a-fA-F]{40}$/.test(dev)) {
      console.warn('[dev] ?dev= param is not a valid EVM address:', dev)
      return
    }
    console.info('[dev] Observing address:', dev)
    setAddress(dev as `0x${string}`)
  }, [])

  return address
}
