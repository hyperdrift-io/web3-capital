export type AllocationBand = 'anchor' | 'balanced' | 'opportunistic'

export type Pool = {
  pool: string        // unique pool id
  symbol: string
  project: string     // protocol name
  chain: string
  apy: number
  apyBase: number | null
  apyReward: number | null
  tvlUsd: number
  stablecoin: boolean
  ilRisk: string | null   // 'YES' | 'NO' | null
  exposure: string | null // 'single' | 'multi'
  underlyingTokens: string[] | null
  rewardTokens: string[] | null
  // computed
  capitalEfficiency: number  // 0–100
  band: AllocationBand
}

export type PoolFilters = {
  chain: string
  band: AllocationBand | 'all'
  stablecoinOnly: boolean
  minTvl: number
}

export type WalletCapital = {
  address: string
  network: string
  chainId: number
  nativeBalance: bigint
  nativeSymbol: string
  nativeUsdValue: number | null
  blockNumber: bigint | null
}

export type CapitalProjection = {
  principal: number           // USD
  topPool: Pool
  monthlyReturn: number       // USD
  annualReturn: number        // USD
  riskAdjustedMonthly: number // USD (using safety-weighted APY)
}
