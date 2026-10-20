import type { Metadata } from 'next'
import { currentEvent } from '@/lib/checkin'
import { WallScreen } from './WallScreen'

export const metadata: Metadata = { title: 'Event Wall', robots: { index: false, follow: false } }

export default async function WallPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams
  if (!process.env.WALL_KEY || key !== process.env.WALL_KEY) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-8 text-center">
        <h1 className="font-display text-[26px] text-text-primary">Event Wall</h1>
        <p className="font-sans text-[14px] text-text-secondary max-w-xs">Open this page with the wall link from the host.</p>
      </main>
    )
  }
  const event = currentEvent()
  return <WallScreen wallKey={key} eventName={event.name} dropId={event.dropId} />
}
