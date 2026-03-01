'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useEffect, useRef } from 'react'
import { formatAddress } from '@/lib/format'
import { CONNECTOR_ID, type ConnectorId } from '@/lib/wagmi'
import styles from './WalletButton.module.css'

const PREF_KEY = 'wallet_connector_pref'

function useConnectorPref() {
  // Start with injected as default; hydrate from localStorage after mount to avoid SSR mismatch
  const [pref, setPref] = useState<ConnectorId>(CONNECTOR_ID.injected)

  useEffect(() => {
    const stored = localStorage.getItem(PREF_KEY) as ConnectorId | null
    if (stored && Object.values(CONNECTOR_ID).includes(stored)) {
      setPref(stored)
    }
  }, [])

  const updatePref = (id: ConnectorId) => {
    setPref(id)
    localStorage.setItem(PREF_KEY, id)
  }

  return [pref, updatePref] as const
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

function PasskeyIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M12 12v8" />
      <path d="M9 17h6" />
      <path d="M9 20h6" />
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
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [pref, updatePref] = useConnectorPref()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

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
              onClick={() => { disconnect(); setOpen(false) }}
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
  const portoConnector    = connectors.find(c => c.id === CONNECTOR_ID.porto)

  const isPortoPref = pref === CONNECTOR_ID.porto
  const primaryConnector = isPortoPref ? portoConnector : injectedConnector
  const altConnector     = isPortoPref ? injectedConnector : portoConnector
  const altPref          = isPortoPref ? CONNECTOR_ID.injected : CONNECTOR_ID.porto

  if (!primaryConnector && !altConnector) {
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

  const handleConnect = (connector: typeof primaryConnector, newPref?: ConnectorId) => {
    if (!connector) return
    if (newPref) updatePref(newPref)
    setOpen(false)
    connect({ connector })
  }

  const primaryLabel = isPortoPref ? 'Smart Wallet' : 'Connect Wallet'
  const altLabel     = isPortoPref ? 'Browser Wallet' : 'Smart Wallet'

  return (
    <div ref={wrapperRef} className={styles.wrapper}>
      <div className={styles.splitBtn}>
        <button
          className={`${styles.splitPrimary} ${styles.disconnected}`}
          onClick={() => handleConnect(primaryConnector)}
          disabled={isPending || !primaryConnector}
        >
          {isPending ? 'Connecting…' : primaryLabel}
        </button>

        {altConnector && (
          <>
            <span className={styles.splitDivider} />
            <button
              className={`${styles.splitChevron} ${styles.disconnected}`}
              onClick={() => setOpen(o => !o)}
              aria-label="More wallet options"
              disabled={isPending}
            >
              <ChevronIcon open={open} />
            </button>
          </>
        )}
      </div>

      {open && altConnector && (
        <div className={styles.dropdown}>
          <button
            className={styles.dropdownItem}
            onClick={() => handleConnect(altConnector, altPref)}
          >
            {!isPortoPref && <PasskeyIcon />}
            {altLabel}
            {!isPortoPref && <span className={styles.badge}>passkey</span>}
          </button>
        </div>
      )}

      {error && (
        <span className={styles.errorMsg}>
          {error.message.includes('rejected') ? 'Rejected' : error.message}
        </span>
      )}
    </div>
  )
}
