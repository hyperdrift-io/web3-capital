'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import styles from './Header.module.css'
import { WalletButton } from '@/components/WalletPanel/WalletButton'

const NAV = [
  { href: '/',        label: 'Overview' },
  { href: '/yield',   label: 'Yield'    },
  { href: '/capital', label: 'Capital'  },
]

export function Header() {
  const pathname = usePathname()

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
        </div>
      </div>
    </header>
  )
}
