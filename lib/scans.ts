/* The trainers you scanned most recently, kept on this device (the chain does not record who scanned whom or when).
   Home shows them as "Last scan". */

export interface ScanRecord { address: string; at: number }

const MAX_SCANS = 5
const key = (user: string) => `socemon:scans:${user.toLowerCase()}`

export function readScans(user: string): ScanRecord[] {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(key(user)) ?? '[]')
    if (!Array.isArray(raw)) return []
    return raw.flatMap((r): ScanRecord[] => (r && typeof r.address === 'string' && typeof r.at === 'number' ? [{ address: r.address, at: r.at }] : []))
  } catch {
    return []
  }
}

/** Puts `address` at the top of `user`'s list (once, with the time of this scan). */
export function recordScan(user: string, address: string, now = Date.now()): void {
  try {
    const rest = readScans(user).filter((r) => r.address.toLowerCase() !== address.toLowerCase())
    localStorage.setItem(key(user), JSON.stringify([{ address, at: now }, ...rest].slice(0, MAX_SCANS)))
  } catch {
    /* storage can be blocked (private mode); the scan itself still works */
  }
}

export function ago(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}
