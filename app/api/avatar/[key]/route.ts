import { isAddress, type Address } from 'viem'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { renderAvatar, renderWearable } from '@/lib/avatar'
import { publicClient } from '@/lib/chain'
import { imageFor } from '@/lib/socemon'

const svg = (body: string, maxAge: number) =>
  new Response(body, { headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': `public, max-age=${maxAge}` } })

/** SVG image for a trainer's avatar (`/api/avatar/0x…`, what they wear now plus their partner as pet) or for one
    wearable (`/api/avatar/120`). `?wear=100,0,120,…` previews any outfit, one id per slot. */
export async function GET(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const { key } = await params
  const wear = new URL(req.url).searchParams.get('wear')
  if (wear !== null) return svg(renderAvatar(wear.split(',').map((n) => Number(n) || 0)), 60)

  if (/^\d{1,4}$/.test(key)) {
    const body = renderWearable(Number(key))
    return body ? svg(body, 86400) : new Response('Unknown wearable', { status: 404 })
  }
  if (!isAddress(key)) return new Response('Not an address or wearable', { status: 400 })

  const address = socemonAddress()
  const [equipped, profile] = await Promise.all([
    publicClient.readContract({ address, abi: SOCEMON_ABI, functionName: 'equippedOf', args: [key as Address] }),
    publicClient.readContract({ address, abi: SOCEMON_ABI, functionName: 'profileOf', args: [key as Address] }),
  ])
  let pet: string | undefined
  if (profile.partner > 0n) {
    // ponytail: inlined so marketplaces render it; drop to a plain URL if pet PNGs get heavy
    const png = await fetch(new URL(imageFor(Number(profile.partner)), req.url))
    if (png.ok) pet = `data:image/png;base64,${Buffer.from(await png.arrayBuffer()).toString('base64')}`
  }
  return svg(renderAvatar(equipped, pet), 30)
}
