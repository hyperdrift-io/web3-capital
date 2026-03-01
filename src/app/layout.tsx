import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header/Header'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Capital Engine — DeFi Yield Intelligence',
  description: 'Allocate capital across DeFi protocols with yield visibility, risk awareness, and execution clarity.',
  openGraph: {
    title: 'Capital Engine',
    description: 'DeFi capital allocation — yield discovery, wallet integration, risk-adjusted projections.',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers>
          <Header />
          <main>{children}</main>
        </Providers>
      </body>
    </html>
  )
}
