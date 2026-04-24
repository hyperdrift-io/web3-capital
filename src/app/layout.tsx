import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { JetBrains_Mono } from 'next/font/google'
import { headers } from 'next/headers'
import { cookieToInitialState } from 'wagmi'
import { Providers } from '@/components/Providers'
import { Header } from '@/components/Header/Header'
import { Analytics } from '@/components/Analytics'
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
  title: 'Capital Engine — DeFi Yield Intelligence & Capital Allocation',
  description: 'Allocate capital across DeFi protocols with yield visibility, risk awareness, and execution clarity. CE Score ranks every pool by real yield, safety, and liquidity depth.',
  metadataBase: new URL(baseUrl),
  keywords: ['DeFi', 'yield farming', 'capital allocation', 'DeFi portfolio', 'crypto yield', 'CE Score', 'web3 finance'],
  openGraph: {
    title: 'Capital Engine — DeFi Yield Intelligence',
    description: 'Intelligent DeFi capital allocation. CE Score, allocation bands, and passkey wallet — no seed phrase.',
    url: baseUrl,
    siteName: 'Capital Engine',
    type: 'website',
    locale: 'en_US',
    images: [{ url: `${baseUrl}/opengraph-image`, width: 1200, height: 630, alt: 'Capital Engine — DeFi Yield Intelligence' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Capital Engine — DeFi Yield Intelligence',
    description: 'Intelligent DeFi capital allocation. CE Score, allocation bands, and passkey wallet.',
    images: [`${baseUrl}/opengraph-image`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
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
      </body>
    </html>
  )
}
