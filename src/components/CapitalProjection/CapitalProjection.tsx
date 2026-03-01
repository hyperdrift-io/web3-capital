'use client'

import { useAccount, useBalance, useBlockNumber, useReadContract } from 'wagmi'
import { mainnet } from 'wagmi/chains'
import type { Pool } from '@/types/protocol'
import { formatUsd, formatApy, formatAddress, formatEther } from '@/lib/format'
import { AGGREGATOR_V3_ABI, ETH_USD_FEED, FALLBACK_ETH_USD, parseChainlinkAnswer } from '@/lib/chainlink'
import { TokenBalances } from '@/components/TokenBalances/TokenBalances'
import styles from './CapitalProjection.module.css'

type Props = {
  topAnchorPool: Pool | null
  topBalancedPool: Pool | null
}

export function CapitalProjection({ topAnchorPool, topBalancedPool }: Props) {
  const { address, isConnected, chain } = useAccount()
  const chainId   = chain?.id ?? mainnet.id
  const feedAddr  = ETH_USD_FEED[chainId] ?? ETH_USD_FEED[1]

  const { data: balance } = useBalance({
    address,
    chainId,
  })
  const { data: blockNumber } = useBlockNumber({
    chainId,
    watch: false,
  })

  // Live ETH/USD price from Chainlink — falls back to constant if feed unavailable
  const { data: roundData } = useReadContract({
    address:      feedAddr,
    abi:          AGGREGATOR_V3_ABI,
    functionName: 'latestRoundData',
    chainId:      mainnet.id, // price feed lives on mainnet
    query:        { refetchInterval: 30_000 }, // refresh every 30s
  })
  const ethUsdPrice = roundData
    ? parseChainlinkAnswer(roundData[1])
    : FALLBACK_ETH_USD

  if (!isConnected || !address) {
    return (
      <div className={styles.card} style={{ textAlign: 'center', padding: 'var(--space-12)' }}>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-2)' }}>
          Connect your wallet to view available capital
        </p>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
          Reads are on-chain only — no approvals required
        </p>
      </div>
    )
  }

  const nativeBalance    = balance ? parseFloat(formatEther(balance.value, 6)) : 0
  const principalUsd     = nativeBalance * ethUsdPrice

  const anchorApy   = topAnchorPool?.apy  ?? 0
  const balancedApy = topBalancedPool?.apy ?? 0

  const anchorMonthly    = (principalUsd * anchorApy)   / 100 / 12
  const balancedMonthly  = (principalUsd * balancedApy)  / 100 / 12
  const anchorAnnual     = (principalUsd * anchorApy)   / 100
  const balancedAnnual   = (principalUsd * balancedApy)  / 100

  return (
    <div className={styles.wrapper}>
      {/* Wallet card */}
      <div className={styles.card}>
        <div className={styles.label}>Available Capital</div>
        <div className={styles.balanceRow}>
          <span className={styles.balanceValue}>
            {balance ? formatEther(balance.value, 4) : '—'}
          </span>
          <span className={styles.balanceSub}>{balance?.symbol ?? 'ETH'}</span>
        </div>

        {principalUsd > 0 && (
          <div style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: 'var(--space-2)' }}>
            ≈ {formatUsd(principalUsd)}
          </div>
        )}

        <div style={{ marginTop: 'var(--space-4)', display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
          <InfoRow label="Address" value={formatAddress(address)} mono />
          <InfoRow label="Network" value={chain?.name ?? 'Ethereum'} />
          <InfoRow label="Block"   value={blockNumber ? `#${blockNumber.toLocaleString()}` : '—'} mono />
          <InfoRow
            label="ETH/USD"
            value={roundData ? `$${ethUsdPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })} ◈` : `$${FALLBACK_ETH_USD.toLocaleString()} (est.)`}
            mono
          />
        </div>

        <TokenBalances ethUsdPrice={ethUsdPrice} />
      </div>

      {/* Protocol snapshot */}
      <div className={styles.card}>
        <div className={styles.label}>Top Yield Opportunities</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginTop: 'var(--space-2)' }}>
          {topAnchorPool && (
            <PoolSnapshot label="Anchor pick" pool={topAnchorPool} />
          )}
          {topBalancedPool && (
            <PoolSnapshot label="Balanced pick" pool={topBalancedPool} />
          )}
        </div>
      </div>

      {/* Projection card — full width */}
      <div className={styles.projectionCard}>
        <div className={styles.label}>Capital Projection</div>
        <div className={styles.projectionGrid}>
          <div className={styles.projectionItem}>
            <span className={styles.projectionLabel}>Anchor — Monthly</span>
            <span className={styles.projectionValue}>{formatUsd(anchorMonthly)}</span>
            <span className={styles.projectionSub}>{formatApy(anchorApy)} APY via {topAnchorPool?.project ?? '—'}</span>
          </div>
          <div className={styles.projectionItem}>
            <span className={styles.projectionLabel}>Anchor — Annual</span>
            <span className={styles.projectionValue}>{formatUsd(anchorAnnual)}</span>
            <span className={styles.projectionSub}>on {formatUsd(principalUsd)} principal</span>
          </div>
          <div className={styles.projectionItem}>
            <span className={styles.projectionLabel}>Balanced — Monthly</span>
            <span className={styles.projectionValue}>{formatUsd(balancedMonthly)}</span>
            <span className={styles.projectionSub}>{formatApy(balancedApy)} APY via {topBalancedPool?.project ?? '—'}</span>
          </div>
          <div className={styles.projectionItem}>
            <span className={styles.projectionLabel}>Balanced — Annual</span>
            <span className={styles.projectionValue}>{formatUsd(balancedAnnual)}</span>
            <span className={styles.projectionSub}>on {formatUsd(principalUsd)} principal</span>
          </div>
        </div>
        <p className={styles.disclaimer}>
          Projections are illustrative. APY is variable and subject to protocol conditions.
          This does not constitute financial advice.
          {roundData
            ? ` ETH price live from Chainlink: $${ethUsdPrice.toLocaleString('en-US', { maximumFractionDigits: 0 })}.`
            : ` ETH price estimated at $${FALLBACK_ETH_USD.toLocaleString()}.`
          }
        </p>
      </div>
    </div>
  )
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
      <span style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span style={{
        color: 'var(--text-secondary)',
        fontFamily: mono ? 'var(--font-mono)' : undefined,
      }}>
        {value}
      </span>
    </div>
  )
}

function PoolSnapshot({ label, pool }: { label: string; pool: Pool }) {
  return (
    <div style={{
      padding: 'var(--space-3)',
      background: 'var(--bg-elevated)',
      borderRadius: 'var(--radius-md)',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '14px', textTransform: 'capitalize' }}>{pool.project}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--green)', fontSize: '14px' }}>
          {formatApy(pool.apy)}
        </span>
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: 2 }}>
        {pool.symbol} · {pool.chain} · CE {pool.capitalEfficiency} · Safety {pool.safety}
      </div>
    </div>
  )
}
