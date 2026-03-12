import { describe, it, expect } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YieldTable } from '@/components/YieldTable/YieldTable'
import type { Pool } from '@/types/protocol'

function makePool(id: string, apy: number, tvl: number, ce: number): Pool {
  return {
    pool: id,
    symbol: `${id.toUpperCase()}-LP`,
    project: id,
    chain: 'Ethereum',
    apy,
    apyBase: apy,
    apyReward: null,
    apyPct7d: null,
    tvlUsd: tvl,
    stablecoin: false,
    ilRisk: null,
    exposure: 'single',
    underlyingTokens: null,
    rewardTokens: null,
    safety: 75,
    capitalEfficiency: ce,
    band: 'anchor',
  }
}

// Three pools with distinct values so sort order is unambiguous
const pools: Pool[] = [
  makePool('aave', 4.5, 2_000_000_000, 80),
  makePool('compound', 7.2, 500_000_000, 60),
  makePool('curve', 2.1, 100_000_000, 40),
]

function getProjectNames() {
  return screen
    .getAllByRole('row')
    .slice(1) // skip header
    .map(row => within(row).getAllByRole('cell')[0].textContent)
}

describe('YieldTable sorting', () => {
  it('defaults to capitalEfficiency descending (highest CE first)', () => {
    render(<YieldTable pools={pools} />)
    const names = getProjectNames()
    expect(names[0]).toContain('aave')   // CE 80
    expect(names[1]).toContain('compound') // CE 60
    expect(names[2]).toContain('curve')   // CE 40
  })

  it('clicking APY header sorts by APY descending', async () => {
    const user = userEvent.setup()
    render(<YieldTable pools={pools} />)
    await user.click(screen.getByRole('columnheader', { name: /apy/i }))
    const names = getProjectNames()
    expect(names[0]).toContain('compound') // 7.2%
    expect(names[1]).toContain('aave')     // 4.5%
    expect(names[2]).toContain('curve')    // 2.1%
  })

  it('clicking the same header a second time reverses to ascending', async () => {
    const user = userEvent.setup()
    render(<YieldTable pools={pools} />)
    const apyHeader = screen.getByRole('columnheader', { name: /apy/i })
    await user.click(apyHeader)
    await user.click(apyHeader)
    const names = getProjectNames()
    expect(names[0]).toContain('curve')    // 2.1% (lowest)
    expect(names[2]).toContain('compound') // 7.2% (highest)
  })

  it('switching to a new column resets to descending — not inheriting previous direction', async () => {
    const user = userEvent.setup()
    render(<YieldTable pools={pools} />)

    // Sort APY asc
    const apyHeader = screen.getByRole('columnheader', { name: /apy/i })
    await user.click(apyHeader)
    await user.click(apyHeader) // now asc

    // Switch to TVL — should reset to desc (highest TVL first)
    await user.click(screen.getByRole('columnheader', { name: /tvl/i }))
    const names = getProjectNames()
    expect(names[0]).toContain('aave')     // $2B
    expect(names[2]).toContain('curve')    // $100M
  })

  it('renders an empty state row when no pools passed', () => {
    render(<YieldTable pools={[]} />)
    expect(screen.getByText(/no pools match/i)).toBeInTheDocument()
  })
})
