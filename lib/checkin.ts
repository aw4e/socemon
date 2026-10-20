import { createHmac, timingSafeEqual } from 'node:crypto'

/* Rotating check-in QR tokens: the Event Wall shows a fresh one every window, so a photo of the QR goes stale fast. */

export const CHECKIN_WINDOW_MS = 30_000
const EARLY_MS = 30 * 60_000
const DEFAULT_LENGTH_MS = 12 * 3600_000

export function checkinSecret(): string {
  const secret = process.env.CHECKIN_SECRET
  if (!secret) throw new Error('CHECKIN_SECRET is not set')
  return secret
}

export function checkinToken(secret: string, eventId: string, now: number): string {
  return createHmac('sha256', secret).update(`${eventId}:${Math.floor(now / CHECKIN_WINDOW_MS)}`).digest('base64url')
}

/** Accepts the current window and the one before it, so a token stays valid for 30 to 60 seconds. */
export function verifyCheckinToken(secret: string, eventId: string, token: unknown, now: number): boolean {
  if (typeof token !== 'string' || token.length > 64) return false
  const got = Buffer.from(token)
  return [now, now - CHECKIN_WINDOW_MS].some((t) => {
    const want = Buffer.from(checkinToken(secret, eventId, t))
    return got.length === want.length && timingSafeEqual(got, want)
  })
}

/** Live from 30 minutes before the start until the end, or 12 hours after the start when there is no end. */
export function isEventLive(event: { startsAt: Date; endsAt?: Date | null }, now: number): boolean {
  const start = event.startsAt.getTime() - EARLY_MS
  const end = event.endsAt ? event.endsAt.getTime() : event.startsAt.getTime() + DEFAULT_LENGTH_MS
  return now >= start && now <= end
}

/** The check-in token's event id; each deployment runs one event, so a constant keeps the routes in step. */
export const CHECKIN_EVENT = 'event'

/** The one event this deployment runs, from env. No EVENT_STARTS_AT means always live (local dev). */
export function currentEvent(env: Record<string, string | undefined> = process.env, now = Date.now()) {
  const startsAt = env.EVENT_STARTS_AT ? new Date(env.EVENT_STARTS_AT) : null
  const endsAt = env.EVENT_ENDS_AT ? new Date(env.EVENT_ENDS_AT) : null
  return {
    name: env.EVENT_NAME || 'Monad Blitz',
    dropId: Number(env.EVENT_DROP_ID || 20),
    live: startsAt ? isEventLive({ startsAt, endsAt }, now) : true,
  }
}
