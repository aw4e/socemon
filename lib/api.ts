import { NextResponse, type NextRequest } from 'next/server'
import { BaseError, getAddress, isAddress, type Address } from 'viem'
import { revertName } from '@/lib/chain'
import { errorFor } from '@/lib/errors'
import { underLimit } from '@/lib/ratelimit'
import { underSharedLimit } from '@/lib/firestore-limit'
import { SESSION_COOKIE, readToken, sessionSecret } from '@/lib/session'

export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

/** The signed-in wallet, or a 401. */
export async function requireUser(req: NextRequest): Promise<Address> {
  const sub = await readToken(sessionSecret(), 'session', req.cookies.get(SESSION_COOKIE)?.value)
  if (!sub || !isAddress(sub)) throw new HttpError('Sign in first', 401)
  return getAddress(sub)
}

/** The caller's IP from the platform's forwarding header (set by Vercel's edge; spoofable behind a bare server). */
export const clientIp = (req: Request) => req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

/** Counts one hit for `bucket` and the caller; throws a 429 once the window is full. Limits are generous because a venue
    puts a whole crowd behind one Wi-Fi IP. */
export function limit(req: Request, bucket: string, max: number, windowMs: number, who = clientIp(req)): void {
  if (!underLimit(`${bucket}:${who}`, max, windowMs)) throw new HttpError('Too many tries, wait a minute', 429)
}

/** Like `limit`, but the count is shared by every server instance. Use it where one wallet or one QR could be spread over many requests. */
export async function limitShared(req: Request, bucket: string, max: number, windowMs: number, who = clientIp(req)): Promise<void> {
  if (!(await underSharedLimit(`${bucket}:${who}`.replace(/[/]/g, '_'), max, windowMs))) throw new HttpError('Too many tries, wait a minute', 429)
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const body: unknown = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError('Invalid JSON body', 400)
  return body as Record<string, unknown>
}

export function int(value: unknown, max: number, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) throw new HttpError(`Invalid ${field}`, 400)
  return value
}

export function address(value: unknown, field: string): Address {
  if (typeof value !== 'string' || !isAddress(value, { strict: false })) throw new HttpError(`Invalid ${field}`, 400)
  return getAddress(value)
}

/** Runs a route body; HttpErrors and contract reverts become JSON errors, viem failures a retryable 502. */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run()
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status })
    const { status, error } = err instanceof BaseError ? errorFor(revertName(err)) : { status: 500, error: 'Server error' }
    if (status >= 500) console.error('socemon route failed', err)
    return NextResponse.json({ error }, { status })
  }
}
