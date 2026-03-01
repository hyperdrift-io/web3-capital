'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { injected } from 'wagmi/connectors'
import { formatAddress } from '@/lib/format'
import styles from './WalletButton.module.css'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  if (isConnected && address) {
    return (
      <button
        className={`${styles.btn} ${styles.connected}`}
        onClick={() => disconnect()}
        title="Click to disconnect"
      >
        <span className={styles.indicator} />
        {formatAddress(address)}
      </button>
    )
  }

  return (
    <button
      className={`${styles.btn} ${styles.disconnected}`}
      onClick={() => connect({ connector: injected() })}
      disabled={isPending}
    >
      {isPending ? 'Connecting…' : 'Connect Wallet'}
    </button>
  )
}
