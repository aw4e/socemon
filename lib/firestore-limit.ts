import { adminDb } from '@/lib/firebase-admin'
import { underLimit } from '@/lib/ratelimit'

/** Fixed-window rate limit kept in Firestore, so it holds across serverless instances (the in-memory one in lib/ratelimit.ts
    does not). False once `key` has used `max` hits in the current window. Collection `rateLimits`; add a TTL policy on `expiresAt` to purge old windows. */
export async function underStoredLimit(key: string, max: number, windowMs = 60_000): Promise<boolean> {
  const ref = adminDb().collection('rateLimits').doc(key)
  const now = Date.now()
  try {
    return await adminDb().runTransaction(async (tx) => {
      const data = (await tx.get(ref)).data()
      if (!data || now - data.windowStart > windowMs) {
        tx.set(ref, { windowStart: now, count: 1, expiresAt: new Date(now + windowMs * 2) })
        return true
      }
      if (data.count >= max) return false
      tx.update(ref, { count: data.count + 1 })
      return true
    })
  } catch (err) {
    const code = (err as { code?: unknown }).code
    /* the database cannot be reached (14 UNAVAILABLE, 4 DEADLINE_EXCEEDED, or no gRPC code at all): let the caller fall back */
    if (code === undefined || code === 14 || code === 4) throw err
    /* contention on one key: refusing the excess is the limiter doing its job, and better than a 500 */
    console.warn('rate limit check failed, refusing the request', key, code)
    return false
  }
}

/** The limit every instance shares (Firestore), falling back to this instance's own count when the database is not set up or
    cannot be reached, so a database outage never blocks signing in or checking in. */
export async function underSharedLimit(key: string, max: number, windowMs = 60_000): Promise<boolean> {
  try {
    return await underStoredLimit(key, max, windowMs)
  } catch {
    return underLimit(key, max, windowMs)
  }
}
