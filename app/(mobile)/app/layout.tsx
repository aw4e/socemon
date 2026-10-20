'use client'
import type { Address } from 'viem'
import { BottomNav } from '@/components/BottomNav'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { UserContext, useTrainer } from '@/lib/client'
import { STARTER_ID } from '@/lib/socemon'

const hero = (
  <>
    <Logo height={28} />
    <MonsterImage id={STARTER_ID} size={160} />
    <p className="font-display text-[30px] leading-tight text-text-primary">Catch your network.</p>
    <p className="font-sans text-[14px] text-text-secondary max-w-xs">
      Meet people, hatch their type, fill your Socédex. Every Socemon is an NFT on Monad.
    </p>
  </>
)

/* Every /app tab sits behind the Gate and shares one trainer: the shell polls requests for the Home badge, and the
   tabs read the same cached query, so switching tabs costs no extra RPC calls. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5">
      <Gate hero={hero}>{(user) => <Shell user={user}>{children}</Shell>}</Gate>
    </div>
  )
}

function Shell({ user, children }: { user: Address; children: React.ReactNode }) {
  const trainer = useTrainer(user, 5_000)
  return (
    <UserContext.Provider value={user}>
      <div className="pb-32">{children}</div>
      <BottomNav requests={trainer.pending?.length ?? 0} />
    </UserContext.Provider>
  )
}
