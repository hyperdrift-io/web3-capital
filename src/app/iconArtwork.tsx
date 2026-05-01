/* eslint-disable @next/next/no-img-element -- ImageResponse does not support next/image. */

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://web3.hyperdrift.io'

const logoSrc = new URL(
  '/branding/logo-capital-engine-power-03-score-recraft-vector.png',
  baseUrl,
).toString()

export function CapitalEngineIconArtwork() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #070605 0%, #0b1611 54%, #03120d 100%)',
      }}
    >
      <div
        style={{
          width: '82%',
          height: '82%',
          borderRadius: '24%',
          border: '4px solid rgba(57, 212, 143, 0.52)',
          background: 'rgba(57, 212, 143, 0.08)',
          boxShadow: '0 24px 80px rgba(57, 212, 143, 0.18)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12%',
        }}
      >
        <img
          src={logoSrc}
          alt="Capital Engine"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
          }}
        />
      </div>
    </div>
  )
}
