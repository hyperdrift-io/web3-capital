import { ImageResponse } from 'next/og'
import { CapitalEngineIconArtwork } from '../../iconArtwork'

export const runtime = 'edge'

const supportedSizes = new Set(['192', '512'])

export function GET(_request: Request, { params }: { params: { size: string } }) {
  const pixelSize = supportedSizes.has(params.size) ? Number(params.size) : 512

  return new ImageResponse(
    <CapitalEngineIconArtwork />,
    {
      width: pixelSize,
      height: pixelSize,
    },
  )
}
