import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Capital Engine — DeFi Yield Intelligence'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #020f0a 0%, #041a10 50%, #020d18 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '64px 72px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Top: badge */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(52, 211, 153, 0.1)',
            border: '1px solid rgba(52, 211, 153, 0.3)',
            borderRadius: '24px',
            padding: '8px 20px',
            color: '#34d399',
            fontSize: '18px',
            fontWeight: 500,
            letterSpacing: '0.05em',
          }}
        >
          CAPITAL ENGINE
        </div>

        {/* Middle: headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              fontSize: '72px',
              fontWeight: 700,
              color: '#f8fafc',
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
            }}
          >
            DeFi Yield
            <br />
            Intelligence
          </div>
          <div
            style={{
              fontSize: '28px',
              color: '#94a3b8',
              fontWeight: 400,
              maxWidth: '800px',
              lineHeight: 1.4,
            }}
          >
            CE Score. Allocation bands. Passkey wallet. No seed phrase.
          </div>
        </div>

        {/* Bottom: domain */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#475569',
            fontSize: '22px',
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#34d399',
            }}
          />
          web3.hyperdrift.io
        </div>
      </div>
    ),
    { ...size },
  )
}
