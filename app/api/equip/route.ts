import { NextResponse, type NextRequest } from 'next/server'
import { handle, int, readBody, requireUser } from '@/lib/api'
import { SLOT_NAMES } from '@/lib/avatar'
import { relay } from '@/lib/chain'

/** Puts a wearable the trainer owns on its slot; `id` 0 takes that slot off. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const body = await readBody(req)
    const slot = int(body.slot, SLOT_NAMES.length - 1, 'slot')
    const id = int(body.id, 9999, 'wearable')
    const { tx, ms } = await relay('equip', [user, slot, BigInt(id)])
    return NextResponse.json({ tx, ms })
  })
}
