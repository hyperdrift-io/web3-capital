/**
 * Chainlink price feed integration.
 *
 * On-chain ETH/USD (and other assets) via Chainlink's AggregatorV3 interface.
 * Uses the connected wallet's chain to pick the correct feed address automatically.
 *
 * Nika Finance signal: protocol integration, smart contract reads via viem.
 */

export const AGGREGATOR_V3_ABI = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      { name: 'roundId',         type: 'uint80'   },
      { name: 'answer',          type: 'int256'   },
      { name: 'startedAt',       type: 'uint256'  },
      { name: 'updatedAt',       type: 'uint256'  },
      { name: 'answeredInRound', type: 'uint80'   },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'decimals',
    outputs: [{ name: '', type: 'uint8' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

/**
 * ETH/USD Chainlink price feed addresses per chain.
 * All Chainlink feeds for reference: https://data.chain.link/
 */
export const ETH_USD_FEED: Record<number, `0x${string}`> = {
  1:     '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // Ethereum mainnet
  42161: '0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612', // Arbitrum One
  8453:  '0x71041dddad3595F9CEd3DcCFBe3D1F4b0a16Bb70', // Base
  10:    '0x13e3Ee699D1909E989722E753853AE30b17e08c5', // Optimism
  137:   '0xF9680D99D6C9589e2a93a78A04A279e509205945', // Polygon
}

export const FALLBACK_ETH_USD = 3_200 // used when feed unavailable or loading

/**
 * Parse the raw `answer` from latestRoundData into a USD price number.
 * Chainlink ETH/USD uses 8 decimal places.
 */
export function parseChainlinkAnswer(answer: bigint): number {
  return Number(answer) / 1e8
}
