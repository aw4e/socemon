import { connection } from 'next/server'
import { cookies } from 'next/headers'
import { isHostWallet, loadEvent } from '@/lib/event'
import { SESSION_COOKIE, readToken, sessionSecret } from '@/lib/session'
import { ExploreScreen } from './ExploreScreen'

/* Server page so the event config stays in server env; `connection()` keeps the live flag per request instead of frozen at build. */
export default async function ExplorePage() {
  await connection()
  const event = await loadEvent()
  const user = await readToken(sessionSecret(), 'session', (await cookies()).get(SESSION_COOKIE)?.value)
  return <ExploreScreen drop={{ name: event.name, dropId: event.dropId, live: event.live, host: await isHostWallet(user), startsAt: event.startsAt, endsAt: event.endsAt, revealed: event.revealed }} />
}
