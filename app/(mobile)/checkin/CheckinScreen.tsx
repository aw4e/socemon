'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { MonsterStage } from '@/components/socemon/MonsterStage'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, type Catch } from '@/lib/client'
import { isDropWearable, speciesById } from '@/lib/socemon'

/* Where the Event Wall QR lands once the ticket cookie is set: onboarding if needed, then the drop. */
export function CheckinScreen({ eventName, dropId, expired }: { eventName: string; dropId: number; expired: boolean }) {
  const reveal = useCatch()
  const [caught, setCaught] = useState(false)
  const drop = speciesById(dropId)
  const wearable = isDropWearable(dropId)

  const teaser = (
    <>
      <Logo height={24} tone="dark" />
      <p className="eyebrow mt-2">{eventName}</p>
      <MonsterStage id={dropId} size={200} silhouette={!caught} ghost={caught ? drop?.name : '???'} />
      <h1 className="font-poster text-[48px] uppercase leading-none">{caught ? drop?.name : 'Event drop'}</h1>
      <p className="font-sans text-[15px] font-bold text-text-secondary max-w-xs">
        {wearable
          ? `Check in to claim the ${drop?.name}, an event-only wearable for your avatar. Only ${drop?.maxSupply} exist, and you can trade it.`
          : `Check in to catch ${drop?.name ?? 'the event Socemon'}. Only ${drop?.maxSupply} exist, and it is the only tradeable Socemon.`}
      </p>
    </>
  )

  if (expired) {
    return (
      <main className="flex flex-col items-center text-center gap-4 px-6 py-10">
        {teaser}
        <p role="alert" className="font-sans text-[15px] font-bold text-text-error">This code expired. Scan the Event Wall again.</p>
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
              <Link href={wearable ? '/app/wardrobe' : '/app/dex'} className="font-sans text-[14px] font-extrabold uppercase tracking-[0.06em] text-text-accent">
                {wearable ? 'Wear it in your Wardrobe' : 'See it in your Socédex'}
              </Link>
            ) : (
              <Button size="lg" fullWidth loading={reveal.state?.phase === 'pending'} onClick={catchDrop}>{wearable ? 'Claim it' : 'Catch it'}</Button>
            )}
          </div>
        )}
      </Gate>
      <Reveal state={reveal.state} onClose={reveal.close} />
    </main>
  )
}
