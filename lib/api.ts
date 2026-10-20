import { NextResponse, type NextRequest } from 'next/server'
import { BaseError, getAddress, isAddress, type Address } from 'viem'
import { revertName } from '@/lib/chain'
import { errorFor } from '@/lib/errors'
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
