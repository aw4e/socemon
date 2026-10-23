import type { Metadata } from 'next'
import { loadEvent } from '@/lib/event'
import { CheckinScreen } from './CheckinScreen'

export const metadata: Metadata = { title: 'Check in', robots: { index: false, follow: false } }

export default async function CheckinPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams
  const event = await loadEvent()
  return <CheckinScreen eventName={event.name} dropId={event.dropId} revealed={event.revealed} expired={expired === '1'} />
}
