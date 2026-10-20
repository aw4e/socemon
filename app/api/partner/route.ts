import { NextResponse, type NextRequest } from 'next/server'
import { handle, int, readBody, requireUser } from '@/lib/api'
import { relay } from '@/lib/chain'

export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const id = int((await readBody(req)).id, 999, 'Socemon')
    const { tx, ms } = await relay('setPartner', [user, BigInt(id)])
    return NextResponse.json({ tx, ms })
  })
}
