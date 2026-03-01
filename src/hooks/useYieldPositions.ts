'use client'

import { useMemo } from 'react'
import { useReadContracts } from 'wagmi'
import {
  YIELD_TOKENS,
  SUPPORTED_CHAIN_IDS,
  matchPool,
  type DetectedPosition,
  type SupportedChainId,
} from '@/lib/yieldPositions'
import type { Pool } from '@/types/protocol'

/**
 * Detects active yield positions across Aave v3 and Compound v3 on all chains.
 *
 * Strategy: batch-read all known yield-bearing token (aToken, cToken) balances
 * across chains. Non-zero balance = active position.
 *
 * APY is resolved by matching to our existing DeFi Llama pool data (same data
 * powering the yield table). This avoids a separate APY API call and keeps
 * the data source consistent.
 *
 * aToken.balanceOf() is the canonical Aave position check — it returns the
 * current deposit balance including accrued interest, updating every block.
 * Compound v3 comet.balanceOf() works identically.
 *
 * Nika signal: protocol-level on-chain reads, cross-protocol position detection,
 * portfolio state management.
 */

const ERC20_ABI = [{
  name:            'balanceOf',
  type:            'function',
  stateMutability: 'view',
  inputs:          [{ name: 'account', type: 'address' }],
  outputs:         [{ name: '',        type: 'uint256' }],
}] as const

/** Minimum USD value to surface as a detected position. */
const MIN_POSITION_USD = 1

export function useYieldPositions(
  address:     `0x${string}` | undefined,
  ethUsdPrice: number,
  pools:       Pool[],
) {
  const enabled = !!address

  // Build flat array of all yield token reads (all chains, all protocols)
  const contracts = useMemo(() => {
    if (!address) return []
    return SUPPORTED_CHAIN_IDS.flatMap(chainId =>
      (YIELD_TOKENS[chainId] ?? []).map(token => ({
        abi:          ERC20_ABI,
        address:      token.address,
        functionName: 'balanceOf' as const,
        args:         [address] as const,
        chainId,
      }))
    )
  }, [address])

  const { data, isLoading } = useReadContracts({
    contracts,
    query: { enabled, refetchInterval: 30_000 },
  })

  // Process: pair each result with its token metadata, filter by balance > 0
  const positions = useMemo((): DetectedPosition[] => {
    if (!data || !address) return []

    const result: DetectedPosition[] = []
    let idx = 0

    for (const chainId of SUPPORTED_CHAIN_IDS) {
      const tokens = YIELD_TOKENS[chainId as SupportedChainId] ?? []

      for (const token of tokens) {
        const raw = data[idx]?.result as bigint | undefined
        idx++

        if (!raw || raw === 0n) continue

        // Convert to USD
        const amount = Number(raw) / Math.pow(10, token.decimals)
        const usdValue = token.underlying === 'WETH' || token.underlying === 'wstETH'
          ? amount * ethUsdPrice * (token.underlying === 'wstETH' ? 1.06 : 1)
          : amount // stablecoins

        if (usdValue < MIN_POSITION_USD) continue

        // Find matching DeFi Llama pool for APY
        const pool = matchPool(token, pools)

        result.push({
          token,
          chainId: chainId as SupportedChainId,
          rawBalance: raw,
          usdValue,
          apy:  pool?.apy ?? null,
          pool,
        })
      }
    }

    return result
  }, [data, address, ethUsdPrice, pools])

  // Summary metrics
  const summary = useMemo(() => {
    if (positions.length === 0) return null

    const totalUsd = positions.reduce((s, p) => s + p.usdValue, 0)
    const weightedApy = positions
      .filter(p => p.apy !== null)
      .reduce((s, p) => s + (p.apy! * p.usdValue), 0) / totalUsd

    const annualReturn = totalUsd * (weightedApy / 100)

    return { totalUsd, weightedApy, annualReturn }
  }, [positions])

  return { positions, summary, isLoading }
}
