import { NextResponse, type NextRequest } from 'next/server'
import { CHECKIN_EVENT, checkinSecret, verifyCheckinToken } from '@/lib/checkin'
import { TICKET_COOKIE, TICKET_TTL_S, cookieOptions, sessionSecret, signToken } from '@/lib/session'

/** The Event Wall QR lands here: a fresh token becomes a 10-minute ticket cookie, so onboarding cannot outlast the QR.
    ponytail: the ticket is not bound to a wallet, so several accounts on one device can use it; bind it after sign-in if that matters. */
export async function GET(req: NextRequest) {
  const fresh = verifyCheckinToken(checkinSecret(), CHECKIN_EVENT, req.nextUrl.searchParams.get('t'), Date.now())
  const res = NextResponse.redirect(new URL(fresh ? '/checkin' : '/checkin?expired=1', req.url))
  if (fresh) res.cookies.set(TICKET_COOKIE, await signToken(sessionSecret(), 'ticket', CHECKIN_EVENT, TICKET_TTL_S), cookieOptions(TICKET_TTL_S))
  return res
}
