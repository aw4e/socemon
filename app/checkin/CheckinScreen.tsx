'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, type Catch } from '@/lib/client'
import { speciesById } from '@/lib/socemon'

/* Where the Event Wall QR lands once the ticket cookie is set: onboarding if needed, then the drop. */
export function CheckinScreen({ eventName, dropId, expired }: { eventName: string; dropId: number; expired: boolean }) {
  const reveal = useCatch()
  const [caught, setCaught] = useState(false)
  const drop = speciesById(dropId)

  const teaser = (
    <>
      <Logo height={24} />
      <MonsterImage id={dropId} size={160} silhouette={!caught} />
      <h1 className="font-display text-[28px] leading-tight text-text-primary">{eventName}</h1>
      <p className="font-sans text-[14px] text-text-secondary max-w-xs">
        Check in to catch {drop?.name ?? 'the event Socemon'}. Only {drop?.maxSupply} exist, and it is the only tradeable Socemon.
      </p>
    </>
  )

  if (expired) {
    return (
      <main className="flex flex-col items-center text-center gap-4 px-6 py-10">
        {teaser}
        <p role="alert" className="font-sans text-[14px] text-text-error">This QR expired. Scan the Event Wall again.</p>
      </main>
    )
  }

  async function catchDrop() {
    if (await reveal.run(`Catching ${drop?.name ?? 'the drop'}…`, () => post<Catch>('/api/checkin', {}))) setCaught(true)
  }

  return (
    <main className="px-6">
      <Gate hero={teaser}>
        {() => (
          <div className="flex flex-col items-center text-center gap-4 py-10">
            {teaser}
            {caught ? (
              <Link href="/" className="font-sans text-[15px] font-medium text-text-accent">See it in your Socédex</Link>
            ) : (
              <Button size="lg" loading={reveal.state?.phase === 'pending'} onClick={catchDrop}>Catch {drop?.name}</Button>
            )}
          </div>
        )}
      </Gate>
      <Reveal state={reveal.state} onClose={reveal.close} />
    </main>
  )
}
