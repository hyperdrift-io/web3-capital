export default function manifest() {
  return {
    name: 'Capital Engine',
    short_name: 'Capital Engine',
    description: 'DeFi allocation for people with something to lose. Pools ranked by capital efficiency, safety, and liquidity depth.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070605',
    theme_color: '#39d48f',
    icons: [
      {
        src: '/branding/logo-capital-engine-power-03-score-recraft-vector-mono.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
