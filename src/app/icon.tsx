import { ImageResponse } from 'next/og'

export const size = { width: 512, height: 512 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#070605',
        }}
      >
        <div
          style={{
            width: 400,
            height: 400,
            borderRadius: 80,
            background: '#0e1f18',
            border: '6px solid #39d48f',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              color: '#39d48f',
              fontSize: 160,
              fontWeight: 800,
              fontFamily: 'sans-serif',
              letterSpacing: '-6px',
            }}
          >
            CE
          </span>
        </div>
      </div>
    ),
    { ...size }
  )
}
