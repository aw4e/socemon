import { NextResponse, type NextRequest } from 'next/server'
import { address, handle, readBody, requireUser } from '@/lib/api'
import { relay } from '@/lib/chain'

/** Approves a request; both trainers get an Egg of the other's type. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const from = address((await readBody(req)).from, 'address')
    const { tx, ms } = await relay('approveConnect', [user, from])
    return NextResponse.json({ tx, ms })
  })
}
