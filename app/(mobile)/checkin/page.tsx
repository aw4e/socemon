import type { Metadata } from 'next'
import { currentEvent } from '@/lib/checkin'
import { CheckinScreen } from './CheckinScreen'

export const metadata: Metadata = { title: 'Check in', robots: { index: false, follow: false } }

export default async function CheckinPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams
  const event = currentEvent()
  return <CheckinScreen eventName={event.name} dropId={event.dropId} expired={expired === '1'} />
}
