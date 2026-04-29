'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import styles from './Header.module.css'
import { WalletButton } from '@/components/WalletPanel/WalletButton'

const NAV = [
  { href: '/',        label: 'Overview' },
  { href: '/yield',   label: 'Yield'    },
  { href: '/capital', label: 'Capital'  },
  { href: '/bridge',  label: 'Bridge'   },
]

export function Header() {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close menu on outside click/touch
  useEffect(() => {
    const handler = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    if (menuOpen) {
      document.addEventListener('mousedown', handler)
      document.addEventListener('touchstart', handler)
    }
    return () => {
      document.removeEventListener('mousedown', handler)
      document.removeEventListener('touchstart', handler)
    }
  }, [menuOpen])

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <span className={styles.dot} />
          Capital Engine
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
        </nav>

        <div className={styles.right}>
          <WalletButton />
          <div ref={menuRef} className={styles.mobileMenuWrapper}>
            <button
              className={styles.hamburger}
              onClick={() => setMenuOpen(o => !o)}
              aria-label="Toggle navigation menu"
              aria-expanded={menuOpen}
              data-testid="mobile-menu-btn"
            >
              <span className={`${styles.hamburgerBar} ${menuOpen ? styles.barOpen1 : ''}`} />
              <span className={`${styles.hamburgerBar} ${menuOpen ? styles.barOpen2 : ''}`} />
              <span className={`${styles.hamburgerBar} ${menuOpen ? styles.barOpen3 : ''}`} />
            </button>

            {menuOpen && (
              <nav className={styles.mobileMenu} aria-label="Mobile navigation">
                {NAV.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className={`${styles.mobileNavLink} ${pathname === href ? styles.active : ''}`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {label}
                  </Link>
                ))}
              </nav>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
