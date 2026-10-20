import { NextResponse } from 'next/server'
import { generateSiweNonce } from 'viem/siwe'
import { NONCE_COOKIE, NONCE_TTL_S, cookieOptions, sessionSecret, signToken } from '@/lib/session'

/** The nonce cookie is signed, so a client cannot vouch for a nonce the server never issued. */
export async function GET() {
  const nonce = generateSiweNonce()
  const res = NextResponse.json({ nonce })
  res.cookies.set(NONCE_COOKIE, await signToken(sessionSecret(), 'nonce', nonce, NONCE_TTL_S), cookieOptions(NONCE_TTL_S))
  return res
}
