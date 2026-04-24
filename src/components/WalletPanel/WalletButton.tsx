'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useEffect, useRef } from 'react'
import { formatAddress } from '@/lib/format'
import { CONNECTOR_ID, type ConnectorId } from '@/lib/wagmi'
import styles from './WalletButton.module.css'

const MM_ADDR_KEY = 'last_mm_address'

const PREF_KEY = 'wallet_connector_pref'

/** True once we've confirmed window.ethereum exists in the browser */
function useInjectedProviderAvailable() {
  const [available, setAvailable] = useState(false)
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    setAvailable(typeof window !== 'undefined' && !!(window as any).ethereum)
  }, [])
  return available
}

function useConnectorPref() {
  // MetaMask/browser wallet is the default; hydrate from localStorage after mount to avoid SSR mismatch
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

function friendlyError(msg: string): { text: string; showInstall: boolean } {
  const lower = msg.toLowerCase()
  if (lower.includes('provider not found') || lower.includes('no injected provider') || lower.includes('ethereum provider')) {
    return { text: 'MetaMask not detected.', showInstall: true }
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

function DownloadIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
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
  const { address, isConnected, connector: activeConnector } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [pref, updatePref] = useConnectorPref()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const hasInjectedProvider = useInjectedProviderAvailable()

  // Persist the MetaMask address so Porto can reuse it later
  useEffect(() => {
    if (isConnected && address && activeConnector?.id === CONNECTOR_ID.injected) {
      localStorage.setItem(MM_ADDR_KEY, address)
    }
  }, [isConnected, address, activeConnector?.id])

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

  // If the browser has no injected EIP-1193 provider (e.g. Safari without MetaMask),
  // force-prefer Porto so the user isn't immediately presented with a failing option.
  const effectivePref: ConnectorId = !hasInjectedProvider ? CONNECTOR_ID.porto : pref

  const isPortoPref = effectivePref === CONNECTOR_ID.porto
  const primaryConnector = isPortoPref ? portoConnector : injectedConnector
  const altConnector     = isPortoPref ? injectedConnector : portoConnector
  const altPref          = isPortoPref ? CONNECTOR_ID.injected : CONNECTOR_ID.porto

  // Porto is the only option and it's unavailable → last resort: show install link
  if (!primaryConnector && !altConnector) {
    return (
      <a
        href="https://metamask.io"
        target="_blank"
        rel="noopener noreferrer"
        className={`${styles.btn} ${styles.disconnected}`}
        style={{ opacity: 0.7 }}
      >
        Install MetaMask
      </a>
    )
  }

  const handleConnect = (connector: typeof primaryConnector, newPref?: ConnectorId) => {
    if (!connector) return
    if (newPref) updatePref(newPref)
    setOpen(false)
    if (connector.id === CONNECTOR_ID.porto) {
      const lastMmAddr = localStorage.getItem(MM_ADDR_KEY) ?? undefined
      if (lastMmAddr) {
        // Ask Porto to restore the same account used by MetaMask
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        connect({ connector, capabilities: { selectAccount: { address: lastMmAddr } } } as any)
        return
      }
    }
    connect({ connector })
  }

  const primaryLabel = isPortoPref ? 'Smart Wallet' : 'Connect Wallet'
  const altLabel = isPortoPref
    ? (hasInjectedProvider ? 'Browser Wallet' : 'Install MetaMask')
    : 'Smart Wallet'

  const parsedError = error ? friendlyError(error.message) : null

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

        {/* Show chevron if there's an alt connector OR we can offer "Install MetaMask" */}
        {(altConnector || (!hasInjectedProvider && !isPortoPref)) && (
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

      {open && (
        <div className={styles.dropdown}>
          {isPortoPref && !hasInjectedProvider ? (
            // No MetaMask detected — offer install link
            <a
              href="https://metamask.io/download/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.dropdownItem}
              onClick={() => setOpen(false)}
            >
              <DownloadIcon />
              Install MetaMask
            </a>
          ) : altConnector ? (
            <button
              className={styles.dropdownItem}
              onClick={() => {
                if (!hasInjectedProvider && altConnector.id === CONNECTOR_ID.injected) {
                  // Injected selected but unavailable — open MetaMask install page
                  window.open('https://metamask.io/download/', '_blank', 'noopener,noreferrer')
                  setOpen(false)
                  return
                }
                handleConnect(altConnector, altPref)
              }}
            >
              {!isPortoPref && <PasskeyIcon />}
              {altLabel}
              {!isPortoPref && <span className={styles.badge}>passkey</span>}
              {isPortoPref && !hasInjectedProvider && <span className={styles.badge}>install</span>}
            </button>
          ) : null}
        </div>
      )}

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
