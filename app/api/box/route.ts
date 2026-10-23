import { NextResponse, type NextRequest } from 'next/server'
import { handle, requireUser } from '@/lib/api'
import { boxResult, relay } from '@/lib/chain'

/** Opens one of the trainer's blind boxes (one per connection) and returns the wearable it dropped. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const { receipt, tx, ms } = await relay('openBox', [user])
    return NextResponse.json({ tx, ms, itemId: boxResult(receipt.logs) })
  })
}
