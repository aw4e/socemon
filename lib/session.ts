import { SignJWT, jwtVerify } from 'jose'

/* Stateless sessions: signed cookies instead of a session table. The audience keeps a ticket or a nonce from passing as a session. */

export const SESSION_COOKIE = 'socemon_session'
export const NONCE_COOKIE = 'socemon_nonce'
export const TICKET_COOKIE = 'socemon_ticket'
export const SESSION_TTL_S = 7 * 24 * 3600
export const NONCE_TTL_S = 5 * 60
export const TICKET_TTL_S = 10 * 60

type Audience = 'session' | 'ticket' | 'nonce'

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters')
  return secret
}

const keyOf = (secret: string) => new TextEncoder().encode(secret)

export function signToken(secret: string, aud: Audience, sub: string, ttlSeconds: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(aud)
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(keyOf(secret))
}

/** The token's subject, or null when it is missing, forged, expired or meant for another audience. */
export async function readToken(secret: string, aud: Audience, token: string | undefined): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, keyOf(secret), { algorithms: ['HS256'], audience: aud })
    return payload.sub ?? null
  } catch {
    return null
  }
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge,
  path: '/',
})
