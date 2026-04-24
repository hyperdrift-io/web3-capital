'use client'

import { useReadContract } from 'wagmi'
import { AGGREGATOR_V3_ABI, ETH_USD_FEED, FALLBACK_ETH_USD, parseChainlinkAnswer } from '@/lib/chainlink'

/**
 * Live ETH/USD price from the Chainlink mainnet feed.
 * Returns FALLBACK_ETH_USD if the feed is unavailable.
 * Refreshes every 30 s. wagmi deduplicates concurrent callers — one RPC call regardless.
 */
export function useEthUsdPrice(): number {
  const { data } = useReadContract({
    abi:          AGGREGATOR_V3_ABI,
    address:      ETH_USD_FEED[1],
    functionName: 'latestRoundData',
    chainId:      1,
    query:        { refetchInterval: 30_000 },
  })
  return data ? parseChainlinkAnswer(data[1] as bigint) : FALLBACK_ETH_USD
}
