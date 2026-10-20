'use client'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { useProfiles, useTrainer, useUser } from '@/lib/client'
import { ROLES } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

/* Everyone you are connected with, newest first, each with their partner and type. */
export default function FriendsPage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const profileOf = useProfiles(trainer.connections)
  const friends = [...(trainer.connections ?? [])].reverse()

  return (
    <div>
      <PageHeader title="Friends">
        <span className="font-mono text-[13px] text-text-secondary">{friends.length}</span>
      </PageHeader>

      {friends.length === 0 ? (
        <section className="flex flex-col items-center text-center py-16">
          <p className="font-display text-[20px] text-text-primary">No friends yet</p>
          <p className="font-sans text-[13px] text-text-secondary max-w-xs mt-2">
            Scan someone’s code at the event. Once they approve, you both get an Egg of each other’s type.
          </p>
          <Link href="/app/qr" className="inline-flex items-center h-11 px-6 mt-6 rounded-full bg-primary text-primary-fg font-sans text-[15px] font-medium">
            Open scanner
          </Link>
        </section>
      ) : (
        <ul className="space-y-2">
          {friends.map((a) => {
            const p = profileOf(a)
            const role = ROLES[p?.role ?? 0]
            return (
              <li key={a}>
                <Link href={`/u/${a}`} className="flex items-center gap-3 rounded-[16px] bg-[var(--fill)] px-3 py-2.5">
                  <MonsterImage key={Number(p?.partner ?? 0n)} id={Number(p?.partner ?? 0n)} size={48} />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[15px] font-medium text-text-primary truncate">{p?.name || shortAddress(a)}</p>
                    <p className="font-sans text-[12px] text-text-tertiary">{role?.label} · {role?.type} type</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
