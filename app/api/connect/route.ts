import { NextResponse, type NextRequest } from 'next/server'
import { parseEventLogs } from 'viem'
import { address, handle, readBody, requireUser } from '@/lib/api'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { publicClient, relay } from '@/lib/chain'
import { verifyMeetCode } from '@/lib/checkin'

/** With a fresh `code` from the other trainer's QR, connects you both right away: showing the code is their yes.
    Without one (a shared profile link), sends a request they approve on Home, or connects if they already asked. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const body = await readBody(req)
    const to = address(body.to, 'address')
    /* a stale code (an old screenshot, or a long sign-up) falls back to a normal request instead of a dead end */
    const scanned = body.code !== undefined && verifyMeetCode(to, body.code, Date.now())

    if (scanned) {
      /* an earlier link request from you is already waiting, so only their approval is left */
      const asked = await publicClient.readContract({ address: socemonAddress(), abi: SOCEMON_ABI, functionName: 'link', args: [user, to] })
      let ms = 0
      if (asked !== 1) {
        const first = await relay('requestConnect', [user, to])
        ms = first.ms
        if (parseEventLogs({ abi: SOCEMON_ABI, logs: first.receipt.logs, eventName: 'Connected' }).length) {
          return NextResponse.json({ tx: first.tx, ms, status: 'connected' })
        }
      }
      const second = await relay('approveConnect', [to, user])
      return NextResponse.json({ tx: second.tx, ms: ms + second.ms, status: 'connected' })
    }

    const { receipt, tx, ms } = await relay('requestConnect', [user, to])
    const connected = parseEventLogs({ abi: SOCEMON_ABI, logs: receipt.logs, eventName: 'Connected' }).length > 0
    return NextResponse.json({ tx, ms, status: connected ? 'connected' : 'requested' })
  })
}
