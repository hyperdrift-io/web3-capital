/**
 * Maps DeFi Llama chain names to @web3icons/react Network components.
 *
 * Usage:
 *   import { NETWORK_ICON } from '@/lib/chainIcons'
 *   const Icon = NETWORK_ICON['Arbitrum']
 *   if (Icon) <Icon size={16} variant="branded" />
 */

import type { ComponentType, SVGProps } from 'react'
import {
  NetworkEthereum,
  NetworkArbitrumOne,
  NetworkBase,
  NetworkOptimism,
  NetworkBinanceSmartChain,
  NetworkPolygon,
  NetworkAvalanche,
  NetworkSolana,
} from '@web3icons/react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number | string; variant?: 'mono' | 'branded' | 'background' }
export type ChainIconComponent = ComponentType<IconProps>

/**
 * DeFi Llama chain name → web3icons Network component.
 * Only chains that appear in the app's pool data are mapped.
 */
export const NETWORK_ICON: Record<string, ChainIconComponent | undefined> = {
  Ethereum:            NetworkEthereum,
  Arbitrum:            NetworkArbitrumOne,
  Base:                NetworkBase,
  Optimism:            NetworkOptimism,
  'BSC':               NetworkBinanceSmartChain,
  'Binance':           NetworkBinanceSmartChain,
  Polygon:             NetworkPolygon,
  Avalanche:           NetworkAvalanche,
  Solana:              NetworkSolana,
}
