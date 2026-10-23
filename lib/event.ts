import { adminDb } from '@/lib/firebase-admin'
import { currentEvent, isHost } from '@/lib/checkin'

/* The event this deployment runs, read from Firestore document `config/event` so it can be changed from the Firebase console
   without a redeploy. Fields: name (text), dropId (number), startsAt and endsAt (timestamps), hosts (list of wallet addresses).
   Anything missing falls back to the EVENT_* env vars, and so does a database that cannot be reached, so check-in keeps working. */

interface StoredEvent { name?: string; dropId?: number; startsAt?: string; endsAt?: string; hosts: string[] }

const TTL_MS = 15_000
let cache: { at: number; value: StoredEvent | null } | null = null

const iso = (v: unknown): string | undefined => {
  if (v && typeof v === 'object' && 'toDate' in v) return (v as { toDate(): Date }).toDate().toISOString()
  return typeof v === 'string' && v ? v : undefined
}

async function stored(now: number): Promise<StoredEvent | null> {
  if (cache && now - cache.at < TTL_MS) return cache.value
  let value: StoredEvent | null = null
  try {
    const d = (await adminDb().collection('config').doc('event').get()).data()
    if (d) {
      value = {
        name: typeof d.name === 'string' && d.name.trim() ? d.name.trim() : undefined,
        dropId: Number.isInteger(d.dropId) ? d.dropId : undefined,
        startsAt: iso(d.startsAt),
        endsAt: iso(d.endsAt),
        hosts: Array.isArray(d.hosts) ? d.hosts.filter((h: unknown): h is string => typeof h === 'string') : [],
      }
    }
  } catch (err) {
    console.error('could not read config/event, using the env fallback', (err as { code?: unknown }).code)
  }
  cache = { at: now, value }
  return value
}

/** Env as `currentEvent` and `isHost` expect it, with the Firestore values laid over it. */
async function merged(now: number): Promise<Record<string, string | undefined>> {
  const s = await stored(now)
  const env: Record<string, string | undefined> = { ...process.env }
  if (!s) return env
  if (s.name) env.EVENT_NAME = s.name
  if (s.dropId !== undefined) env.EVENT_DROP_ID = String(s.dropId)
  if (s.startsAt) env.EVENT_STARTS_AT = s.startsAt
  if (s.endsAt) env.EVENT_ENDS_AT = s.endsAt
  env.EVENT_HOSTS = [process.env.EVENT_HOSTS ?? '', ...s.hosts].filter(Boolean).join(',')
  return env
}

const JAKARTA_OFFSET_MS = 7 * 3600_000

/** True from midnight (Jakarta time) of the event's day: "hari H", when the mystery drop is revealed. No start time means always. */
export function dropRevealed(startsAtIso: string | null, now = Date.now()): boolean {
  if (!startsAtIso) return true
  const local = new Date(new Date(startsAtIso).getTime() + JAKARTA_OFFSET_MS)
  const dayStart = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()) - JAKARTA_OFFSET_MS
  return now >= dayStart
}

/** name, dropId, live, startsAt, endsAt of the one event this deployment runs, and whether its drop is revealed yet. */
export async function loadEvent(now = Date.now()) {
  const event = currentEvent(await merged(now), now)
  return { ...event, revealed: dropRevealed(event.startsAt, now) }
}

/** Whether `address` is an event host: listed in `config/event.hosts` or in EVENT_HOSTS. */
export async function isHostWallet(address: string | null | undefined): Promise<boolean> {
  return isHost(address, await merged(Date.now()))
}
