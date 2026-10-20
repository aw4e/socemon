import { NextResponse } from 'next/server'
import { STARTER_ID, imageFor, speciesById, typeName } from '@/lib/socemon'

/** ERC-1155 metadata for one Socemon species; the contract's uri(id) points here. */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const species = /^\d{1,3}$/.test(id) ? speciesById(Number(id)) : undefined
  if (!species) return NextResponse.json({ error: 'Unknown Socemon' }, { status: 404 })

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? new URL(req.url).origin
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
    { headers: { 'Cache-Control': 'public, max-age=3600' } },
  )
}
