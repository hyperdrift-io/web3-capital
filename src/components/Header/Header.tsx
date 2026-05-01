'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Header.module.css'
import { WalletButton } from '@/components/WalletPanel/WalletButton'

const NAV = [
  { href: '/',      label: 'Overview' },
  { href: '/yield', label: 'Yield'    },
]

const DEPLOY_NAV = [
  {
    href: '/capital#allocation-wizard',
    label: 'Deploy Capital',
    description: 'Enter an amount and get an allocation split.',
  },
  {
    href: '/bridge',
    label: 'Bridge Assets',
    description: 'Move capital cross-chain before deployment.',
  },
  {
    href: '/capital',
    label: 'Capital Dashboard',
    description: 'Review positions, idle capital, and projections.',
  },
]

export function Header() {
  const pathname = usePathname()
  const [deployMenuOpen, setDeployMenuOpen] = useState(false)

  const deployActive = pathname === '/capital' || pathname === '/bridge'

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoMark} aria-hidden="true" />
          <span>Capital Engine</span>
        </Link>

        <nav className={styles.nav}>
          {NAV.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`${styles.navLink} ${pathname === href ? styles.active : ''}`}
            >
              {label}
            </Link>
          ))}

          <div
            className={`${styles.navMenu} ${deployMenuOpen ? styles.navMenuOpen : ''}`}
            onMouseEnter={() => setDeployMenuOpen(true)}
            onMouseLeave={() => setDeployMenuOpen(false)}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                setDeployMenuOpen(false)
              }
            }}
          >
            <button
              type="button"
              className={`${styles.navLink} ${styles.navMenuTrigger} ${deployActive ? styles.active : ''}`}
              aria-haspopup="menu"
              aria-expanded={deployMenuOpen}
              onClick={() => setDeployMenuOpen((open) => !open)}
              onFocus={() => setDeployMenuOpen(true)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setDeployMenuOpen(false)
              }}
            >
              Deploy
              <span className={styles.navChevron} aria-hidden="true">⌄</span>
            </button>

            <div className={`${styles.navDropdown} ${deployMenuOpen ? styles.navDropdownOpen : ''}`} role="menu">
              {DEPLOY_NAV.map(({ href, label, description }) => (
                <Link
                  key={href}
                  href={href}
                  className={styles.dropdownLink}
                  role="menuitem"
                  onClick={() => setDeployMenuOpen(false)}
                >
                  <span className={styles.dropdownLabel}>{label}</span>
                  <span className={styles.dropdownDescription}>{description}</span>
                </Link>
              ))}
            </div>
          </div>
        </nav>

        <div className={styles.right}>
          <WalletButton />
        </div>
      </div>
    </header>
  )
}
