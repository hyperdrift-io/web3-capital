import { ImageResponse } from 'next/og'
import { CapitalEngineIconArtwork } from './iconArtwork'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    <CapitalEngineIconArtwork />,
    { ...size },
  )
}
