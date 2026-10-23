import { NextResponse, type NextRequest } from 'next/server'
import { clientIp } from '@/lib/api'
import { underSharedLimit } from '@/lib/firestore-limit'
import { CHECKIN_EVENT, checkinSecret, verifyCheckinToken } from '@/lib/checkin'
import { TICKET_COOKIE, TICKET_TTL_S, cookieOptions, sessionSecret, signToken } from '@/lib/session'

/** The Event Wall QR lands here: a fresh token becomes a 10-minute ticket cookie, so onboarding cannot outlast the QR.
    ponytail: the ticket is not bound to a wallet, so several accounts on one device can use it; bind it after sign-in if that matters. */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('t')
  /* one QR token only trades for so many tickets, and one IP only scans so often: a photo of the wall cannot feed a script. The counts are shared by every server instance.
     The caps sit above a full room scanning one QR at once. */
  const fresh = verifyCheckinToken(checkinSecret(), CHECKIN_EVENT, token, Date.now())
    && (await underSharedLimit(`ticket-token:${token}`, 150, 90_000))
    && (await underSharedLimit(`ticket-ip:${clientIp(req)}`.replace(/[/]/g, '_'), 30, 60_000))
  const res = NextResponse.redirect(new URL(fresh ? '/checkin' : '/checkin?expired=1', req.url))
  if (fresh) res.cookies.set(TICKET_COOKIE, await signToken(sessionSecret(), 'ticket', CHECKIN_EVENT, TICKET_TTL_S), cookieOptions(TICKET_TTL_S))
  return res
}
