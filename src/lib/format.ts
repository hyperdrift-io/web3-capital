function browserLocale(): string | readonly string[] | undefined {
  if (typeof navigator === 'undefined') return undefined
  return navigator.languages?.length ? navigator.languages : navigator.language
}

export function formatUsd(value: number, compact = false): string {
  return new Intl.NumberFormat(browserLocale(), {
    style: 'currency',
    currency: 'USD',
    notation: compact ? 'compact' : 'standard',
    minimumFractionDigits: compact ? 0 : 2,
    maximumFractionDigits: compact ? 1 : 2,
  }).format(value)
}

export function formatWholeUsd(value: number): string {
  return new Intl.NumberFormat(browserLocale(), {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatApy(apy: number): string {
  return `${apy.toFixed(2)}%`
}

export function formatScore(score: number): string {
  return new Intl.NumberFormat(browserLocale(), {
    maximumFractionDigits: 0,
  }).format(score)
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
