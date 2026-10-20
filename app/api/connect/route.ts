import { NextResponse, type NextRequest } from 'next/server'
import { parseEventLogs } from 'viem'
import { address, handle, readBody, requireUser } from '@/lib/api'
import { SOCEMON_ABI } from '@/lib/abi'
import { relay } from '@/lib/chain'

/** Sends a connection request, or connects right away when the other trainer already asked. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const to = address((await readBody(req)).to, 'address')
    const { receipt, tx, ms } = await relay('requestConnect', [user, to])
    const connected = parseEventLogs({ abi: SOCEMON_ABI, logs: receipt.logs, eventName: 'Connected' }).length > 0
    return NextResponse.json({ tx, ms, status: connected ? 'connected' : 'requested' })
  })
}
