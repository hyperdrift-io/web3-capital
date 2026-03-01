export function formatUsd(value: number, compact = false): string {
  if (compact) {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
    if (value >= 1_000_000)     return `$${(value / 1_000_000).toFixed(1)}M`
    if (value >= 1_000)         return `$${(value / 1_000).toFixed(0)}K`
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatApy(apy: number): string {
  return `${apy.toFixed(2)}%`
}

export function formatAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`
}

export function formatEther(wei: bigint, decimals = 4): string {
  const eth = Number(wei) / 1e18
  return eth.toFixed(decimals)
}

export function chainColor(chain: string): string {
  const map: Record<string, string> = {
    Ethereum: '#627EEA',
    Arbitrum: '#12AAFF',
    Base:     '#0052FF',
    Optimism: '#FF0420',
    Polygon:  '#8247E5',
    BSC:      '#F3BA2F',
    Avalanche:'#E84142',
    Solana:   '#9945FF',
  }
  return map[chain] ?? '#8b91a8'
}
