'use client'
import Link from 'next/link'
import { ChevronRight, ScanLine } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { TypeChip } from '@/components/socemon/TypeChip'
import { useProfiles, useTrainer, useUser } from '@/lib/client'
import { TYPE_COLOR } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

/* Everyone you are connected with, newest first: their partner on a tile of their type color, name and type. */
export default function FriendsPage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const profileOf = useProfiles(trainer.connections)
  const friends = [...(trainer.connections ?? [])].reverse()

  return (
    <div>
      <PageHeader title="Friends">
        <p className="font-poster text-[26px] leading-none text-text-secondary">{friends.length}</p>
      </PageHeader>

      {friends.length === 0 ? (
        <section className="flex flex-col items-center text-center py-16">
          <p className="font-poster text-[34px] uppercase leading-none">No friends yet</p>
          <p className="font-sans text-[15px] font-bold text-text-secondary max-w-xs mt-3">
            Scan someone’s code at the event. Once they approve, you both get an Egg of each other’s type.
          </p>
          <Link
            href="/app/qr"
            className="inline-flex items-center gap-2 h-12 px-6 mt-7 rounded-2xl bg-primary text-white font-sans text-[14px] font-extrabold uppercase tracking-[0.05em] shadow-[0_4px_0_var(--primary-shadow)] active:translate-y-1 active:shadow-none"
          >
            <ScanLine className="w-5 h-5" /> Open scanner
          </Link>
        </section>
      ) : (
        <ul>
          {friends.map((a) => {
            const p = profileOf(a)
            const partner = Number(p?.partner ?? 0n)
            return (
              <li key={a}>
                <Link href={`/u/${a}`} className="flex items-center gap-3 py-3 border-b border-(--border-subtle) active:opacity-70">
                  <span className="w-14 h-14 rounded-[18px] flex items-center justify-center shrink-0" style={{ background: `${TYPE_COLOR[p?.role ?? 0]}2e` }}>
                    <MonsterImage key={partner} id={partner} size={48} />
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[17px] font-black text-text-primary truncate">{p?.name || shortAddress(a)}</p>
                    {p && <TypeChip role={p.role} className="mt-1 !text-[10px] !px-2 !py-0.5" />}
                  </div>
                  <ChevronRight className="w-5 h-5 text-text-tertiary shrink-0" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
