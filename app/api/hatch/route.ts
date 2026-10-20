import { NextResponse, type NextRequest } from 'next/server'
import { handle, int, readBody, requireUser } from '@/lib/api'
import { hatchResult, relay } from '@/lib/chain'

export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const pool = int((await readBody(req)).pool, 5, 'Egg type')
    const { receipt, tx, ms } = await relay('hatch', [user, pool])
    return NextResponse.json({ tx, ms, ...hatchResult(receipt.logs) })
  })
}
