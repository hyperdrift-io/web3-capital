export default function manifest() {
  return {
    name: 'Capital Engine',
    short_name: 'Capital Engine',
    description: 'DeFi yield intelligence. 8,000+ pools ranked by capital efficiency. Passkey-first access — no seed phrase.',
    start_url: '/',
    display: 'standalone',
    background_color: '#070605',
    theme_color: '#39d48f',
    icons: [
      {
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }
}
