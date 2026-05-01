import { afterEach, describe, it, expect, vi } from 'vitest'
import { formatUsd, formatApy, formatAddress, formatEther, chainColor } from '@/lib/format'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('formatUsd (compact)', () => {
  const compactCurrency = (value: number) =>
    new Intl.NumberFormat(navigator.languages, {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value)

  it('formats billions with one decimal', () => {
    expect(formatUsd(1_500_000_000, true)).toBe(compactCurrency(1_500_000_000))
    expect(formatUsd(1_000_000_000, true)).toBe(compactCurrency(1_000_000_000))
  })

  it('formats millions with one decimal', () => {
    expect(formatUsd(500_000_000, true)).toBe(compactCurrency(500_000_000))
    expect(formatUsd(1_000_000, true)).toBe(compactCurrency(1_000_000))
  })

  it('formats thousands with compact currency notation', () => {
    expect(formatUsd(999_999, true)).toBe(compactCurrency(999_999))
    expect(formatUsd(1_500, true)).toBe(compactCurrency(1_500))
    expect(formatUsd(1_000, true)).toBe(compactCurrency(1_000))
  })

  it('formats sub-thousand with compact currency notation', () => {
    expect(formatUsd(999, true)).toBe(compactCurrency(999))
  })
})

describe('formatUsd (non-compact)', () => {
  const fullCurrency = (value: number) =>
    new Intl.NumberFormat(navigator.languages, {
      style: 'currency',
      currency: 'USD',
      notation: 'standard',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value)

  it('uses the browser locale for full Intl currency format', () => {
    vi.spyOn(navigator, 'languages', 'get').mockReturnValue(['de-DE'])
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE')

    expect(formatUsd(1234.56)).toBe(new Intl.NumberFormat(['de-DE'], {
      style: 'currency',
      currency: 'USD',
      notation: 'standard',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.56))
    expect(formatUsd(0)).toBe(new Intl.NumberFormat(['de-DE'], {
      style: 'currency',
      currency: 'USD',
      notation: 'standard',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0))
  })

  it('always shows two decimal places', () => {
    expect(formatUsd(100)).toBe(fullCurrency(100))
    expect(formatUsd(0.1)).toBe(fullCurrency(0.1))
  })
})

describe('formatApy', () => {
  it('always renders two decimals with percent sign', () => {
    expect(formatApy(5)).toBe('5.00%')
    expect(formatApy(12.345)).toBe('12.35%') // rounds
    expect(formatApy(0)).toBe('0.00%')
  })
})

describe('formatAddress', () => {
  it('shows first 6 chars + ellipsis + last 4 chars', () => {
    const addr = '0xAbCd1234567890EF'
    // slice(0, 6)  → '0xAbCd'
    // slice(-4)    → '90EF'
    expect(formatAddress(addr)).toBe('0xAbCd…90EF')
  })

  it('produces the canonical 0x truncated format for a real address', () => {
    const addr = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
    const formatted = formatAddress(addr)
    expect(formatted).toBe('0xd8dA…6045')
    expect(formatted).toContain('…')
  })

  it('is always a fixed visual length regardless of input', () => {
    const a = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA00'
    const b = '0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB'
    expect(formatAddress(a).length).toBe(formatAddress(b).length)
  })
})

describe('formatEther', () => {
  it('converts wei to ETH with correct decimals', () => {
    expect(formatEther(BigInt(1e18))).toBe('1.0000')
    expect(formatEther(BigInt(1.5e18))).toBe('1.5000')
  })

  it('respects custom decimal count', () => {
    expect(formatEther(BigInt(1e18), 2)).toBe('1.00')
    expect(formatEther(BigInt(1e18), 6)).toBe('1.000000')
  })

  it('handles zero wei', () => {
    expect(formatEther(BigInt(0))).toBe('0.0000')
  })

  it('handles fractional ETH amounts (less than 1 ETH)', () => {
    expect(formatEther(BigInt(5e17))).toBe('0.5000') // 0.5 ETH
  })
})

describe('chainColor', () => {
  it('returns known chain colors', () => {
    expect(chainColor('Ethereum')).toBe('#627EEA')
    expect(chainColor('Arbitrum')).toBe('#12AAFF')
    expect(chainColor('Base')).toBe('#0052FF')
  })

  it('returns a neutral fallback for unknown chains', () => {
    expect(chainColor('SomeNewL2')).toBe('#8b91a8')
    expect(chainColor('')).toBe('#8b91a8')
  })
})
