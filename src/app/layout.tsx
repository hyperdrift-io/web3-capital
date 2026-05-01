import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header/Header'
import { Analytics } from '@/components/Analytics'
import { PWARegistration } from '@/components/PWARegistration'
import { wagmiConfig } from '@/lib/wagmi'
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

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://web3.hyperdrift.io'

export const metadata: Metadata = {
  applicationName: 'Capital Engine',
  title: 'Capital Engine - DeFi Allocation for People With Something to Lose',
  description: 'Turn DeFi noise into a capital plan you can understand and defend. CE Score ranks pools by real yield, safety, and liquidity depth before you deploy.',
  metadataBase: new URL(baseUrl),
  manifest: '/manifest.webmanifest',
  keywords: ['DeFi', 'yield farming', 'capital allocation', 'DeFi portfolio', 'crypto yield', 'CE Score', 'web3 finance'],
  openGraph: {
    title: 'Capital Engine - DeFi Allocation for People With Something to Lose',
    description: 'A calmer way to allocate in DeFi. CE Score, allocation bands, Proof Mode, and bridge-aware deployment.',
    url: baseUrl,
    siteName: 'Capital Engine',
    type: 'website',
    locale: 'en_US',
    images: [{ url: `${baseUrl}/opengraph-image`, width: 1200, height: 630, alt: 'Capital Engine - DeFi Allocation' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Capital Engine - DeFi Allocation',
    description: 'DeFi allocation for people with something to lose. CE Score, allocation bands, and bridge-aware deployment.',
    images: [`${baseUrl}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  icons: {
    icon: [
      { url: '/branding/logo-capital-engine-power-03-score-recraft-vector.svg', type: 'image/svg+xml' },
      { url: '/pwa-icon/192', sizes: '192x192', type: 'image/png' },
      { url: '/icon', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/pwa-icon/192', sizes: '192x192', type: 'image/png' }],
    apple: [{ url: '/apple-icon', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    title: 'Capital Engine',
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
  },
  alternates: { canonical: baseUrl },
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const initialState = cookieToInitialState(wagmiConfig, headersList.get('cookie'))

  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body>
        <Providers initialState={initialState}>
          <Header />
          <main>{children}</main>
        </Providers>
        <Analytics />
        <PWARegistration />
      </body>
    </html>
  )
}
