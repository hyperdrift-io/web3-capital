'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useEffect, useRef } from 'react'
import { formatAddress } from '@/lib/format'
import { CONNECTOR_ID } from '@/lib/wagmi'
import styles from './WalletButton.module.css'

function friendlyError(msg: string): { text: string; showInstall: boolean } {
  const lower = msg.toLowerCase()
  if (lower.includes('provider not found') || lower.includes('no injected provider') || lower.includes('ethereum provider') || lower.includes('metamask extension not found') || lower.includes('failed to connect to metamask')) {
    return { text: 'No wallet detected.', showInstall: true }
  }
  if (lower.includes('rejected') || lower.includes('user denied') || lower.includes('user rejected')) {
    return { text: 'Rejected', showInstall: false }
  }
  if (lower.includes('already pending')) {
    return { text: 'Check your wallet — a request is pending', showInstall: false }
  }
  return { text: 'Connection failed', showInstall: false }
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 10 10"
      fill="currentColor"
      style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms' }}
    >
      <path d="M1 3L5 7L9 3" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function CopyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

function LogOutIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}

export function WalletButton() {
  const { address, isConnected, connector: activeConnector } = useAccount()
  const { connect, connectors, isPending, error, reset } = useConnect()
  const { disconnect } = useDisconnect()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Auto-reset stuck pending state after 8 seconds
  useEffect(() => {
    if (isPending) {
      connectTimeoutRef.current = setTimeout(() => reset(), 8000)
    } else {
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current)
    }
    return () => { if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current) }
  }, [isPending, reset])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCopy = () => {
    if (!address) return
    navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  // ── Connected state ────────────────────────────────────────
  if (isConnected && address) {
    return (
      <div ref={wrapperRef} className={styles.wrapper}>
        <button
          className={`${styles.btn} ${styles.connected}`}
          onClick={() => setOpen(o => !o)}
        >
          <span className={styles.indicator} />
          {formatAddress(address)}
          <ChevronIcon open={open} />
        </button>

        {open && (
          <div className={styles.dropdown}>
            <div className={styles.dropdownAddress}>
              <span className={styles.dropdownAddressFull}>{formatAddress(address)}</span>
              <button className={styles.copyBtn} onClick={handleCopy} title="Copy address">
                {copied ? '✓' : <CopyIcon />}
              </button>
            </div>
            <div className={styles.dropdownDivider} />
            <button
              className={`${styles.dropdownItem} ${styles.dropdownItemDanger}`}
              onClick={() => {
                setOpen(false)
                disconnect({ connector: activeConnector })
              }}
            >
              <LogOutIcon />
              Disconnect
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Disconnected state ─────────────────────────────────────
  const injectedConnector = connectors.find(c => c.id === CONNECTOR_ID.injected)
  const parsedError = error ? friendlyError(error.message) : null

  if (!injectedConnector) {
    return (
      <a
        href="https://metamask.io"
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.btn} ${styles.disconnected}`}
        data-testid="install-metamask"
      >
        Install MetaMask
      </a>
    )
  }

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <button
        className={`${styles.btn} ${styles.disconnected}`}
        onClick={() => connect({ connector: injectedConnector })}
        disabled={isPending}
        data-testid="connect-wallet-btn"
      >
        {isPending ? 'Connecting…' : 'Connect Wallet'}
      </button>

      {parsedError && (
        <span className={styles.errorMsg}>
          {parsedError.text}
          {parsedError.showInstall && (
            <>
              {' '}
              <a
                href="https://metamask.io/download/"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.errorLink}
              >
                Install MetaMask ↗
              </a>
            </>
          )}
        </span>
      )}
    </div>
  )
}

