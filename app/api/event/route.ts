import { NextResponse } from 'next/server'
import { loadEvent } from '@/lib/event'

/** What the screens need to know about the running event. Public: it is the same as the poster and the Event Wall show. */
export async function GET() {
  const { name, dropId, live, startsAt, endsAt, revealed } = await loadEvent()
  return NextResponse.json({ name, dropId, live, startsAt, endsAt, revealed }, { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=15' } })
}
