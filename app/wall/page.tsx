import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { loadEvent } from '@/lib/event'
import { SESSION_COOKIE, canOpenWall } from '@/lib/session'
import { WallScreen } from './WallScreen'

export const metadata: Metadata = { title: 'Event Wall', robots: { index: false, follow: false } }

export default async function WallPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams
  if (!(await canOpenWall((await cookies()).get(SESSION_COOKIE)?.value, key))) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-8 text-center">
        <h1 className="font-poster text-[48px] uppercase leading-none text-text-primary">Event Wall</h1>
        <p className="font-sans text-[14px] text-text-secondary max-w-xs">Sign in with an event host wallet in the app, then open the Explore tab.</p>
      </main>
    )
  }
  const event = await loadEvent()
  return <WallScreen wallKey={key ?? ''} eventName={event.name} dropId={event.dropId} />
}
