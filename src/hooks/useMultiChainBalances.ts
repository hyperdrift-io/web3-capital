'use client'

import { useMemo } from 'react'
import { useBalance, useReadContracts } from 'wagmi'
import { DEPLOYABLE_TOKENS, estimateUsdValue, type TokenMeta } from '@/lib/tokens'
import { SUPPORTED_CHAIN_IDS, CHAIN_NAMES, type SupportedChainId } from '@/lib/yieldPositions'

/**
 * Reads native ETH and ERC-20 balances across all supported chains in parallel.
 *
 * Architecture:
 * - 4 × useBalance calls for native ETH (hardcoded — hooks must be unconditional)
 * - 1 × useReadContracts batching ALL ERC-20 reads across all chains
 *   wagmi groups them by chainId internally → one multicall per chain
 *
 * In production (Nika Finance scale), you'd add:
 * - Custom fallback RPCs per chain with failover
 * - Stale-while-revalidate caching with Redis
 * - WebSocket subscriptions for balance change events
 */

const ERC20_ABI = [{
  name:            'balanceOf',
  type:            'function',
  stateMutability: 'view',
  inputs:          [{ name: 'account', type: 'address' }],
  outputs:         [{ name: '',        type: 'uint256' }],
}] as const

export type ChainBalance = {
  chainId:   SupportedChainId
  chainName: string
  nativeSymbol: string
  /** Native ETH/MATIC balance in wei */
  native:    bigint
  /** Native token USD value (0 on chains without a configured native oracle) */
  nativeUsd: number
  /** ERC-20 token balances */
  tokens:    { meta: TokenMeta; raw: bigint; usd: number }[]
  /** Total USD value (native + ERC-20) */
  totalUsd:  number
}

const NATIVE_SYMBOL: Record<SupportedChainId, string> = {
  1: 'ETH',
  42161: 'ETH',
  8453: 'ETH',
  10: 'ETH',
  56: 'BNB',
  137: 'MATIC',
}

function estimateNativeUsd(chainId: SupportedChainId, nativeWei: bigint, ethUsdPrice: number): number {
  // ETH L1/L2 native tokens are ETH-priced. Non-ETH chain native assets are
  // intentionally excluded until dedicated BNB/MATIC oracles are wired.
  if (chainId !== 1 && chainId !== 42161 && chainId !== 8453 && chainId !== 10) {
    return 0
  }
  return Number(nativeWei) / 1e18 * ethUsdPrice
}

export function useMultiChainBalances(
  address:     `0x${string}` | undefined,
  ethUsdPrice: number,
) {
  const enabled = !!address

  // ── Native balances — one hook per chain (rules of hooks: no loops) ──────────
  const ethMain = useBalance({ address, chainId: 1,     query: { enabled } })
  const ethArb  = useBalance({ address, chainId: 42161, query: { enabled } })
  const ethBase = useBalance({ address, chainId: 8453,  query: { enabled } })
  const ethOpt  = useBalance({ address, chainId: 10,    query: { enabled } })
  const bnbMain = useBalance({ address, chainId: 56,    query: { enabled } })
  const matic   = useBalance({ address, chainId: 137,   query: { enabled } })

  const nativeResults = [ethMain, ethArb, ethBase, ethOpt, bnbMain, matic]

  // ── ERC-20 balances — one multicall batched across all chains ─────────────────
  const contracts = useMemo(() => {
    if (!address) return []
    return SUPPORTED_CHAIN_IDS.flatMap(chainId =>
      (DEPLOYABLE_TOKENS[chainId] ?? []).map(token => ({
        abi:          ERC20_ABI,
        address:      token.address,
        functionName: 'balanceOf' as const,
        args:         [address] as const,
        chainId,
      }))
    )
  }, [address])

  const { data: erc20Data, isLoading: erc20Loading } = useReadContracts({
    contracts,
    query: { enabled },
  })

  // ── Debug logging (development only) ─────────────────────────────────────────
  if (process.env.NODE_ENV === 'development' && address && !erc20Loading) {
    const nativeSum = nativeResults.map((r, i) => ({
      chain: CHAIN_NAMES[SUPPORTED_CHAIN_IDS[i]],
      wei:   r.data?.value?.toString() ?? 'null',
      error: r.error?.message,
    }))
    console.debug('[balances] native:', nativeSum)
    console.debug('[balances] erc20 results:', erc20Data?.length, 'slots,',
      erc20Data?.filter(d => d?.result && (d.result as bigint) > 0n).length, 'non-zero')
  }

  // ── Process into per-chain summaries ─────────────────────────────────────────
  const chains = useMemo((): ChainBalance[] => {
    return SUPPORTED_CHAIN_IDS.map((chainId, ci) => {
      const nativeWei = nativeResults[ci].data?.value ?? 0n
      const nativeUsd = estimateNativeUsd(chainId, nativeWei, ethUsdPrice)

      const chainTokens = DEPLOYABLE_TOKENS[chainId] ?? []

      // Calculate starting index in the flat contracts/data array for this chain
      const offset = SUPPORTED_CHAIN_IDS
        .slice(0, ci)
        .reduce((sum, cid) => sum + (DEPLOYABLE_TOKENS[cid]?.length ?? 0), 0)

      const tokenItems = chainTokens
        .map((meta, ti) => {
          const raw = erc20Data?.[offset + ti]?.result as bigint | undefined
          if (!raw || raw === 0n) return null
          const usd = estimateUsdValue(meta, raw, ethUsdPrice)
          if (usd < 0.01) return null
          return { meta, raw, usd }
        })
        .filter((x): x is { meta: TokenMeta; raw: bigint; usd: number } => x !== null)

      const totalUsd = nativeUsd + tokenItems.reduce((s, t) => s + t.usd, 0)

      return {
        chainId,
        chainName: CHAIN_NAMES[chainId],
        nativeSymbol: NATIVE_SYMBOL[chainId],
        native:    nativeWei,
        nativeUsd,
        tokens:    tokenItems,
        totalUsd,
      }
    })
  }, [
    ethUsdPrice,
    // intentionally depend on each value (not the hook result objects)
    ethMain.data, ethArb.data, ethBase.data, ethOpt.data, bnbMain.data, matic.data,
    erc20Data,
  ])

  const totalUsd   = chains.reduce((s, c) => s + c.totalUsd, 0)
  const isLoading  = nativeResults.some(r => r.isLoading) || erc20Loading
  const chainsWithBalance = chains.filter(c => c.totalUsd > 0.01)

  return { chains, chainsWithBalance, totalUsd, isLoading }
}
