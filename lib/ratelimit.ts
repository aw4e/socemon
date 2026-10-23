/* Fixed-window counters kept in memory.
   ponytail: each server instance counts alone, so on serverless the real ceiling is limit x live instances. It blunts a
   lone script, not a determined one; swap the Map for Upstash or Vercel KV when that is not enough. */

const windows = new Map<string, { count: number; resetAt: number }>()
const SWEEP_AT = 5000

/** True while `key` is under `max` hits in the current window; every call counts as a hit. */
export function underLimit(key: string, max: number, windowMs: number, now = Date.now()): boolean {
  if (windows.size > SWEEP_AT) {
    for (const [k, w] of windows) if (w.resetAt <= now) windows.delete(k)
  }
  const w = windows.get(key)
  if (!w || w.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }
  w.count++
  return w.count <= max
}
