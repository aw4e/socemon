import { NextResponse } from 'next/server'
import { getAddress, toHex } from 'viem'
import { SLOT_NAMES, wearableById } from '@/lib/avatar'
import { STARTER_ID, imageFor, speciesById, typeName } from '@/lib/socemon'

const AVATAR_FLAG = 1n << 255n
const cache = { headers: { 'Cache-Control': 'public, max-age=3600' } }

/** ERC-1155 metadata for one Socemon species; the contract's uri(id) points here. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin

  if (/^\d{70,78}$/.test(id) && BigInt(id) >= AVATAR_FLAG && BigInt(id) < AVATAR_FLAG << 1n) {
    const owner = getAddress(toHex(BigInt(id) - AVATAR_FLAG, { size: 20 }))
    return NextResponse.json({
      name: `Trainer ${owner.slice(0, 6)}…${owner.slice(-4)}`,
      description: 'A Socemon trainer avatar. Soulbound; it shows the wearables its trainer has on and their partner as pet.',
      image: `${site}/api/avatar/${owner}`,
      attributes: [{ trait_type: 'Type', value: 'Avatar' }, { trait_type: 'Soulbound', value: 'Yes' }],
    }, { headers: { 'Cache-Control': 'public, max-age=30' } })
  }

  const wearable = /^\d{1,4}$/.test(id) ? wearableById(Number(id)) : undefined
  if (wearable) {
    return NextResponse.json({
      name: wearable.name,
      description: `A Socemon blind box wearable for the ${SLOT_NAMES[wearable.slot].toLowerCase()} slot. Tradeable.`,
      image: `${site}/api/avatar/${wearable.id}`,
      attributes: [
        { trait_type: 'Slot', value: SLOT_NAMES[wearable.slot] },
        { trait_type: 'Tier', value: wearable.tier },
        { trait_type: 'Soulbound', value: 'No' },
      ],
    }, cache)
  }

  const species = /^\d{1,3}$/.test(id) ? speciesById(Number(id)) : undefined
  if (!species) return NextResponse.json({ error: 'Unknown Socemon' }, { status: 404 })

  const description = species.id === STARTER_ID
    ? 'Soci, the starter every Socemon trainer begins with.'
    : species.transferable
      ? `A ${typeName(species.pool)} Socemon, caught by showing up at an event. Tradeable.`
      : `A ${typeName(species.pool)} Socemon, caught by meeting people in real life. Soulbound.`

  return NextResponse.json(
    {
      name: species.name,
      description,
      image: `${site}${imageFor(species.id)}`,
      attributes: [
        { trait_type: 'Type', value: species.id === STARTER_ID ? 'Starter' : typeName(species.pool) },
        { trait_type: 'Tier', value: species.tier },
        { trait_type: 'Soulbound', value: species.transferable ? 'No' : 'Yes' },
      ],
    },
    cache,
  )
}
