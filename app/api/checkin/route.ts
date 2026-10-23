import { NextResponse, type NextRequest } from 'next/server'
import { HttpError, handle, limit, requireUser } from '@/lib/api'
import { relay } from '@/lib/chain'
import { currentEvent } from '@/lib/checkin'
import { TICKET_COOKIE, readToken, sessionSecret } from '@/lib/session'

/** Trades the check-in ticket for the event drop. */
export function POST(req: NextRequest) {
  return handle(async () => {
    limit(req, 'checkin', 60, 60_000)
    const user = await requireUser(req)
    if (!(await readToken(sessionSecret(), 'ticket', req.cookies.get(TICKET_COOKIE)?.value))) {
      throw new HttpError('Scan the QR on the Event Wall first', 403)
    }
    const event = currentEvent()
    if (!event.live) throw new HttpError(`${event.name} is not live right now`, 403)
    const { tx, ms } = await relay('mintDrop', [user, BigInt(event.dropId)])
    const res = NextResponse.json({ tx, ms, monsterId: event.dropId })
    res.cookies.delete(TICKET_COOKIE)
    return res
  })
}
