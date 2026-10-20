import { connection } from 'next/server'
import { currentEvent } from '@/lib/checkin'
import { EventScreen } from './EventScreen'

/* Server page so the event config stays in server env; `connection()` keeps the live flag per request instead of frozen at build. */
export default async function EventPage() {
  await connection()
  const event = currentEvent()
  return <EventScreen name={event.name} dropId={event.dropId} live={event.live} />
}
