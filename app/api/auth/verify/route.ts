import { NextResponse, type NextRequest } from 'next/server'
import { getAddress, type Hex } from 'viem'
import { parseSiweMessage } from 'viem/siwe'
import { HttpError, handle, limit, readBody } from '@/lib/api'
import { publicClient } from '@/lib/chain'
import { NONCE_COOKIE, SESSION_COOKIE, SESSION_TTL_S, cookieOptions, readToken, sessionSecret, signToken } from '@/lib/session'

/** Checks a SIWE signature against the nonce cookie and this host, then starts a 7-day session. */
export function POST(req: NextRequest) {
  return handle(async () => {
    limit(req, 'verify', 60, 60_000)
    const { message, signature } = await readBody(req)
    if (typeof message !== 'string' || message.length > 2000 || typeof signature !== 'string' || !/^0x[0-9a-fA-F]+$/.test(signature)) {
      throw new HttpError('Invalid sign-in', 400)
    }
    const nonce = await readToken(sessionSecret(), 'nonce', req.cookies.get(NONCE_COOKIE)?.value)
    const { address } = parseSiweMessage(message)
    if (!nonce || !address) throw new HttpError('Sign-in expired, try again', 401)
    const valid = await publicClient.verifySiweMessage({ message, signature: signature as Hex, domain: req.nextUrl.host, nonce })
    if (!valid) throw new HttpError('Signature did not match', 401)

    const user = getAddress(address)
    const res = NextResponse.json({ address: user })
    res.cookies.set(SESSION_COOKIE, await signToken(sessionSecret(), 'session', user, SESSION_TTL_S), cookieOptions(SESSION_TTL_S))
    res.cookies.delete(NONCE_COOKIE)
    return res
  })
}
