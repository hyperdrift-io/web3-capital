/**
 * Maps DeFi Llama project slugs to @web3icons/react Token/Exchange components.
 *
 * Project slugs are lowercase hyphenated strings as returned by the DeFi Llama
 * pools API (e.g. "aave-v3", "curve-dex", "uniswap-v3").
 *
 * Usage:
 *   import { PROTOCOL_ICON } from '@/lib/protocolIcons'
 *   const Icon = PROTOCOL_ICON['aave-v3']
 *   if (Icon) <Icon size={16} variant="branded" />
 */

import type { ComponentType, ComponentProps } from 'react'
import {
  TokenAAVE,
  TokenCOMP,
  TokenCRV,
  TokenPENDLE,
  TokenFLUID,
  TokenYFI,
  TokenFRAX,
  TokenGHO,
  TokenRETH,
  TokenMKR,
  TokenDAI,
  TokenUSDC,
  TokenUSDT,
  TokenSONNE,
  TokenTAROT,
} from '@web3icons/react'
import {
  ExchangeUniswap,
  ExchangeBalancer,
  ExchangeSushiswap,
  Exchange1inch,
  ExchangePancakeSwap,
} from '@web3icons/react'

type IconProps = ComponentProps<typeof TokenAAVE>
export type ProtocolIconComponent = ComponentType<IconProps>

/**
 * DeFi Llama project slug → web3icons component.
 * Covers the most common protocols in the top-150 pool set.
 */
export const PROTOCOL_ICON: Record<string, unknown> = {
  // Aave
  'aave-v3':                    TokenAAVE,
  'aave-v2':                    TokenAAVE,
  'aave':                       TokenAAVE,

  // Compound
  'compound-v3':                TokenCOMP,
  'compound-v2':                TokenCOMP,
  'compound':                   TokenCOMP,

  // Curve
  'curve-dex':                  TokenCRV,
  'curve':                      TokenCRV,
  'convex-finance':             TokenCRV,  // Convex builds on Curve

  // Uniswap
  'uniswap-v3':                 ExchangeUniswap,
  'uniswap-v2':                 ExchangeUniswap,
  'uniswap':                    ExchangeUniswap,

  // Balancer
  'balancer-v2':                ExchangeBalancer,
  'balancer':                   ExchangeBalancer,

  // SushiSwap
  'sushiswap':                  ExchangeSushiswap,
  'sushi':                      ExchangeSushiswap,

  // PancakeSwap
  'pancakeswap-v3':             ExchangePancakeSwap,
  'pancakeswap':                ExchangePancakeSwap,

  // 1inch
  '1inch':                      Exchange1inch,

  // Pendle
  'pendle':                     TokenPENDLE,
  'pendle-v2':                  TokenPENDLE,

  // Fluid
  'fluid':                      TokenFLUID,

  // Yearn
  'yearn-finance':              TokenYFI,
  'yearn':                      TokenYFI,

  // Frax
  'frax':                       TokenFRAX,
  'fraxlend':                   TokenFRAX,
  'frax-ether':                 TokenFRAX,

  // Maker / Spark / Sky
  'makerdao':                   TokenMKR,
  'spark':                      TokenMKR,
  'sky':                        TokenMKR,
  'sdai':                       TokenDAI,

  // GHO / Aave stablecoin
  'gho':                        TokenGHO,

  // rETH / Rocket Pool
  'rocket-pool':                TokenRETH,

  // Sonne Finance
  'sonne-finance':              TokenSONNE,
  'sonne':                      TokenSONNE,

  // Tarot
  'tarot':                      TokenTAROT,

  // Generic stablecoins used as identifiers in some pools
  'usdc':                       TokenUSDC,
  'usdt':                       TokenUSDT,
  'dai':                        TokenDAI,
  'uniswap-labs':               ExchangeUniswap,
}
