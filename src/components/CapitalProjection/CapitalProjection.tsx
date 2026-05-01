'use client'

import { useAccount, useBalance, useBlockNumber, useReadContract } from 'wagmi'
import { mainnet } from 'viem/chains'
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

  const { data: balance, isLoading: isBalanceLoading } = useBalance({
    address,
    chainId,
    query: { enabled: !!address },
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
      <div className={styles.connectCard}>
        <p className={styles.connectText}>
          Connect your wallet to view available capital
        </p>
        <p className={styles.connectSubtext}>
          Reads are on-chain only — no approvals required
        </p>
      </div>
    )
  }

  const hasBalance       = balance !== undefined
  const nativeBalance    = hasBalance ? parseFloat(formatEther(balance.value, 6)) : null
  const principalUsd     = nativeBalance === null ? null : nativeBalance * ethUsdPrice
  const hasPrincipal     = principalUsd !== null

  const anchorApy   = topAnchorPool?.apy  ?? 0
  const balancedApy = topBalancedPool?.apy ?? 0

  const anchorMonthly    = hasPrincipal ? (principalUsd * anchorApy)   / 100 / 12 : null
  const balancedMonthly  = hasPrincipal ? (principalUsd * balancedApy)  / 100 / 12 : null
  const anchorAnnual     = hasPrincipal ? (principalUsd * anchorApy)   / 100 : null
  const balancedAnnual   = hasPrincipal ? (principalUsd * balancedApy)  / 100 : null
  const projectionStatus = isBalanceLoading ? 'Reading wallet balance...' : 'Balance unavailable'

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

        {principalUsd !== null && principalUsd > 0 && (
          <div className={styles.usdEstimate}>
            ≈ {formatUsd(principalUsd)}
          </div>
        )}

        <div className={styles.infoRows}>
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
        <div className={styles.poolList}>
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
            <span className={styles.projectionValue}>{formatProjectionValue(anchorMonthly)}</span>
            <span className={styles.projectionSub}>{formatApy(anchorApy)} APY via {topAnchorPool?.project ?? '—'}</span>
          </div>
          <div className={styles.projectionItem}>
            <span className={styles.projectionLabel}>Anchor — Annual</span>
            <span className={styles.projectionValue}>{formatProjectionValue(anchorAnnual)}</span>
            <span className={styles.projectionSub}>{formatPrincipal(principalUsd, projectionStatus)}</span>
          </div>
          <div className={styles.projectionItem}>
            <span className={styles.projectionLabel}>Balanced — Monthly</span>
            <span className={styles.projectionValue}>{formatProjectionValue(balancedMonthly)}</span>
            <span className={styles.projectionSub}>{formatApy(balancedApy)} APY via {topBalancedPool?.project ?? '—'}</span>
          </div>
          <div className={styles.projectionItem}>
            <span className={styles.projectionLabel}>Balanced — Annual</span>
            <span className={styles.projectionValue}>{formatProjectionValue(balancedAnnual)}</span>
            <span className={styles.projectionSub}>{formatPrincipal(principalUsd, projectionStatus)}</span>
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

function formatProjectionValue(value: number | null): string {
  return value === null ? '—' : formatUsd(value)
}

function formatPrincipal(value: number | null, fallback: string): string {
  return value === null ? fallback : `on ${formatUsd(value)} principal`
}

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={mono ? styles.infoValueMono : styles.infoValue}>
        {value}
      </span>
    </div>
  )
}

function PoolSnapshot({ label, pool }: { label: string; pool: Pool }) {
  return (
    <div className={styles.poolSnapshot}>
      <div className={styles.poolLabel}>
        {label}
      </div>
      <div className={styles.poolHeader}>
        <span className={styles.poolProject}>{pool.project}</span>
        <span className={styles.poolApy}>
          {formatApy(pool.apy)}
        </span>
      </div>
      <div className={styles.poolMeta}>
        {pool.symbol} · {pool.chain} · CE {pool.capitalEfficiency} · Safety {pool.safety}
      </div>
    </div>
  )
}
