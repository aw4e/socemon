import { connection } from 'next/server'
import { cookies } from 'next/headers'
import { currentEvent, isHost } from '@/lib/checkin'
import { SESSION_COOKIE, readToken, sessionSecret } from '@/lib/session'
import { EventScreen } from './EventScreen'

/* Server page so the event config stays in server env; `connection()` keeps the live flag per request instead of frozen at build. */
export default async function EventPage() {
  await connection()
  const event = currentEvent()
  const user = await readToken(sessionSecret(), 'session', (await cookies()).get(SESSION_COOKIE)?.value)
  return <EventScreen name={event.name} dropId={event.dropId} live={event.live} host={isHost(user)} />
}
