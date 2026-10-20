import { NextResponse } from 'next/server'
import { generateSiweNonce } from 'viem/siwe'
import { NONCE_COOKIE, NONCE_TTL_S, cookieOptions } from '@/lib/session'

export function GET() {
  const nonce = generateSiweNonce()
  const res = NextResponse.json({ nonce })
  res.cookies.set(NONCE_COOKIE, nonce, cookieOptions(NONCE_TTL_S))
  return res
}
