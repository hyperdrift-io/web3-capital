import type { ReactNode, SVGProps } from 'react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { BridgeThenDeploy } from '@/components/BridgeThenDeploy/BridgeThenDeploy'
import type { Pool } from '@/types/protocol'

const { mockBuildBridgeRouteIntent } = vi.hoisted(() => ({
  mockBuildBridgeRouteIntent: vi.fn(),
}))

vi.mock('@/lib/bridge', () => ({
  defiLlamaChainToWormhole: vi.fn(() => 'Base'),
  tokenForPoolSymbol: vi.fn(() => 'USDC'),
  vaultTokenNote: vi.fn(() => null),
}))

vi.mock('@/lib/routing', () => ({
  buildBridgeRouteIntent: mockBuildBridgeRouteIntent,
}))

vi.mock('@/components/BridgeWidget/BridgeWidget', () => ({
  BridgeWidget: () => <div>Bridge Widget</div>,
}))

vi.mock('@/components/RouteButton/RouteButton', () => ({
  RouteButton: ({ intent }: { intent: { url: string } }) => <a href={intent.url}>Route</a>,
}))

vi.mock('@/components/CEScoreBreakdown/CEScoreBreakdown', () => ({
  CEScoreBreakdown: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock('@/lib/chainIcons', () => ({
  NETWORK_ICON: {
    Base: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
  },
}))

vi.mock('@web3icons/react', () => ({
  NetworkEthereum: (props: SVGProps<SVGSVGElement>) => <svg {...props} />,
}))

function makePool(): Pool {
  return {
    pool: 'pool-1',
    symbol: 'USDC',
    project: 'morpho-blue',
    chain: 'Base',
    apy: 4.1,
    apyBase: 4.1,
    apyReward: null,
    tvlUsd: 1000000,
    stablecoin: true,
    ilRisk: 'NO',
    exposure: 'single',
    underlyingTokens: ['0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'],
    rewardTokens: null,
    apyPct7d: null,
    safety: 80,
    capitalEfficiency: 65,
    band: 'anchor',
  }
}

beforeEach(() => {
  mockBuildBridgeRouteIntent.mockReset()
})

describe('BridgeThenDeploy', () => {
  it('keeps the deploy step visible when no route intent can be built', () => {
    mockBuildBridgeRouteIntent.mockReturnValue(null)

    const view = render(<BridgeThenDeploy topPool={makePool()} />)

    expect(view.getByRole('heading', { name: /deploy into morpho-blue/i })).toBeInTheDocument()
    expect(
      view.getByText(/routing pre-fill is not available for this pool yet/i),
    ).toBeInTheDocument()
    expect(view.queryByRole('link', { name: /route/i })).not.toBeInTheDocument()
  })

  it('shows the route action when a route intent is available', () => {
    mockBuildBridgeRouteIntent.mockReturnValue({
      url: 'https://app.1inch.io',
      isSameToken: false,
      fromSymbol: 'USDC',
      toSymbol: 'USDC',
      chainId: 8453,
    })

    const view = render(<BridgeThenDeploy topPool={makePool()} />)

    expect(view.getByRole('link', { name: /route/i })).toHaveAttribute('href', 'https://app.1inch.io')
  })
})