'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { formatAddress } from '@/lib/format'
import styles from './WalletButton.module.css'

export function WalletButton() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
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

  const injectedConnector = connectors[0]

  if (!injectedConnector) {
    return (
      <a
        href="https://metamask.io"
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.btn} ${styles.disconnected}`}
        style={{ opacity: 0.7 }}
      >
        Install wallet
      </a>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      <button
        className={`${styles.btn} ${styles.disconnected}`}
        onClick={() => connect({ connector: injectedConnector })}
        disabled={isPending}
      >
        {isPending ? 'Connecting…' : 'Connect Wallet'}
      </button>
      {error && (
        <span style={{ fontSize: '11px', color: 'var(--red)' }}>
          {error.message.includes('rejected') ? 'Rejected' : error.message}
        </span>
      )}
    </div>
  )
}
