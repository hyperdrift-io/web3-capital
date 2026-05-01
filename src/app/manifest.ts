import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Capital Engine',
    short_name: 'Capital',
    description: 'DeFi allocation for people with something to lose. Pools ranked by capital efficiency, safety, and liquidity depth.',
    id: '/',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#070605',
    theme_color: '#39d48f',
    categories: ['finance', 'productivity', 'utilities'],
    icons: [
      {
        src: '/branding/logo-capital-engine-power-03-score-recraft-vector.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/pwa-icon/192',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/pwa-icon/512',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  }
}
