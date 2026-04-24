'use client'

import { useAccount } from 'wagmi'
import { useReadContracts } from 'wagmi'
import { mainnet } from 'viem/chains'
import { DEPLOYABLE_TOKENS, estimateUsdValue } from '@/lib/tokens'
import { formatUsd } from '@/lib/format'
import styles from './TokenBalances.module.css'

const ERC20_ABI = [{
  name: 'balanceOf',
  type: 'function',
  stateMutability: 'view',
  inputs:  [{ name: 'account', type: 'address' }],
  outputs: [{ name: '',        type: 'uint256' }],
}] as const

type Props = {
  ethUsdPrice: number
}

/**
 * Shows ERC-20 token balances on the connected chain.
 * Reads from the connected wallet's chain — works across Mainnet, Arbitrum, Base, Optimism.
 */
export function TokenBalances({ ethUsdPrice }: Props) {
  const { address, chain } = useAccount()
  const chainId = chain?.id ?? mainnet.id
  const tokens  = DEPLOYABLE_TOKENS[chainId] ?? []

  const contracts = address
    ? tokens.map(token => ({
        address:      token.address,
        abi:          ERC20_ABI,
        functionName: 'balanceOf' as const,
        args:         [address] as const,
        chainId,
      }))
    : []

  const { data: balances, isLoading } = useReadContracts({ contracts })

  if (!address || tokens.length === 0) return null

  // Pair tokens with their balances
  const items = tokens
    .map((token, i) => {
      const raw = balances?.[i]?.result as bigint | undefined
      if (!raw || raw === 0n) return null
      const usd = estimateUsdValue(token, raw, ethUsdPrice)
      if (usd < 0.01) return null
      return { token, raw, usd }
    })
    .filter(Boolean) as { token: typeof tokens[0]; raw: bigint; usd: number }[]

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <span className={styles.loadingDot} />
        <span className={styles.loadingDot} />
        <span className={styles.loadingDot} />
      </div>
    )
  }

  if (items.length === 0) return null

  const totalUsd = items.reduce((s, i) => s + i.usd, 0)

  return (
    <div className={styles.wrapper}>
      <div className={styles.label}>ERC-20 Balances</div>

      <div className={styles.rows}>
        {items.map(({ token, usd }) => (
          <div key={token.address} className={styles.row}>
            <span className={styles.symbol}>{token.symbol}</span>
            <span className={styles.usd}>{formatUsd(usd)}</span>
          </div>
        ))}
      </div>

      <div className={styles.total}>
        <span className={styles.totalLabel}>Total ERC-20</span>
        <span className={styles.totalValue}>{formatUsd(totalUsd)}</span>
      </div>
    </div>
  )
}
