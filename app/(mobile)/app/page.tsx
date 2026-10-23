'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Address } from 'viem'
import { ChevronRight, ScanLine } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { EggShape } from '@/components/socemon/EggShape'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { MonsterStage } from '@/components/socemon/MonsterStage'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { TypeChip } from '@/components/socemon/TypeChip'
import { Button } from '@/components/ui/Button'
import { post, useAct, useProfiles, useTrainer, useUser, type Catch } from '@/lib/client'
import { ago, readScans, type ScanRecord } from '@/lib/scans'
import { useDragScroll } from '@/lib/use-drag-scroll'
import { SPECIES, TYPE_COLOR, typeName, typesCaught } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

/* Home: your partner on stage, requests to approve, and the hatchery. */
export default function HomePage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const profileOf = useProfiles(trainer.pending)
  /* the people you scanned on this device, newest first; friends fill the list when this device has no scans yet (the chain keeps
     connections oldest first, so the end of that list is the latest) */
  const [scans, setScans] = useState<ScanRecord[]>([])
  useEffect(() => setScans(readScans(user)), [user])
  const lastScans = [
    ...scans.map((r) => ({ address: r.address as Address, at: r.at as number | null })),
    ...[...(trainer.connections ?? [])].reverse().map((address) => ({ address, at: null })),
  ].filter((r, i, all) => all.findIndex((x) => x.address.toLowerCase() === r.address.toLowerCase()) === i).slice(0, 3)
  const scannedProfile = useProfiles(lastScans.map((r) => r.address))
  const { busy, note, act } = useAct(trainer.refetch)
  const reveal = useCatch()
  const eggScroll = useDragScroll()

  const profile = trainer.profile
  const partner = Number(profile?.partner ?? 0n)
  const eggs = (trainer.eggs ?? []).map((count, pool) => ({ count, pool })).filter((e) => e.count > 0)
  const stats = [
    { href: '/app/friends', value: trainer.connections?.length ?? 0, label: 'Friends' },
    { href: '/app/me#pet', value: `${typesCaught(trainer.owned)}/5`, label: 'Types' },
    { href: '/app/me#pet', value: `${trainer.owned.size}/${SPECIES.length + 1}`, label: 'Caught' },
  ]

  return (
    <div>
      <header className="flex items-center h-16">
        <Logo height={22} tone="dark" />
      </header>

      <section className="flex flex-col items-center text-center">
        <MonsterStage id={partner} size={210} />
        <p className="font-sans font-black text-[30px] leading-tight mt-1">{profile?.name}</p>
        {profile && <TypeChip role={profile.role} className="mt-2" />}
      </section>

      <dl className="grid grid-cols-3 mt-7 divide-x divide-(--border-subtle)">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="flex flex-col-reverse items-center gap-1 active:scale-95 transition-transform">
            <dt className="eyebrow">{s.label}</dt>
            <dd className="font-poster text-[34px] leading-none text-text-primary">{s.value}</dd>
          </Link>
        ))}
      </dl>

      {note && (
        <p role="status" className="mt-6 rounded-2xl border-2 border-primary/40 bg-[var(--accent-primary-dim)] px-4 py-3 font-sans text-[14px] font-bold text-text-primary">
          {note}
        </p>
      )}

      {!!trainer.pending?.length && (
        <section className="mt-9">
          <h2 className="eyebrow flex items-center gap-2 mb-3">
            Wants to connect
            <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-sys-error text-white text-[11px] leading-5 text-center tracking-normal">{trainer.pending.length}</span>
          </h2>
          <ul className="divide-y divide-(--border-subtle)">
            {trainer.pending.map((from) => {
              const p = profileOf(from)
              const color = TYPE_COLOR[p?.role ?? 0]
              const name = p?.name || shortAddress(from)
              return (
                <li key={from} className="flex items-center gap-3 py-3">
                  <span className="w-11 h-11 rounded-2xl flex items-center justify-center font-poster text-[22px] text-[#0D0A1A] shrink-0" style={{ background: color }}>
                    {name.slice(0, 1).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[16px] font-extrabold text-text-primary truncate">{name}</p>
                    <p className="font-sans text-[12px] font-bold text-text-tertiary">You both get an Egg</p>
                  </div>
                  <Button
                    size="sm"
                    loading={busy === from}
                    disabled={!!busy}
                    onClick={() => act(from, () => post('/api/approve', { from }), `Connected with ${name}. You both got an Egg.`)}
                  >
                    Approve
                  </Button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <section className="mt-9">
        <h2 className="eyebrow mb-4">Hatchery</h2>
        {eggs.length === 0 ? (
          <div className="flex items-center gap-4">
            <span className="text-text-tertiary shrink-0"><EggShape color="" ghost size={52} /></span>
            <div className="flex-1">
              <p className="font-sans text-[15px] font-bold text-text-secondary">
                No Eggs yet. Every new friend gives you both an Egg of the other’s type.
              </p>
              <Link
                href="/app/qr"
                className="inline-flex items-center gap-2 h-10 px-4 mt-3 rounded-2xl bg-primary text-white font-sans text-[12px] font-extrabold uppercase tracking-[0.05em] shadow-[0_4px_0_var(--primary-shadow)] active:translate-y-1 active:shadow-none"
              >
                <ScanLine className="w-4 h-4" /> Scan someone
              </Link>
            </div>
          </div>
        ) : (
          <ul {...eggScroll} className="flex gap-3 overflow-x-auto -mx-5 px-5 pb-2 cursor-grab active:cursor-grabbing select-none">
            {eggs.map(({ count, pool }) => {
              const color = TYPE_COLOR[pool]
              return (
                <li key={pool} className="relative shrink-0 w-[132px] flex flex-col items-center pt-3 pb-4 rounded-[26px]" style={{ background: `radial-gradient(circle at 50% 30%, ${color}33, transparent 70%)` }}>
                  <span className="absolute top-2 right-3 font-poster text-[18px]" style={{ color }}>×{count}</span>
                  <div className="animate-float" style={{ animationDuration: '2.4s' }}>
                    <EggShape color={color} size={58} />
                  </div>
                  <p className="font-sans text-[13px] font-black uppercase tracking-[0.06em] mt-2" style={{ color }}>{typeName(pool)}</p>
                  <Button
                    size="sm"
                    className="mt-3"
                    disabled={!!busy || reveal.state?.phase === 'pending'}
                    onClick={() =>
                      reveal.run(`Hatching a ${typeName(pool)} Egg…`, () => post<Catch>('/api/hatch', { pool }), (r) =>
                        r.nexmon ? 'You met every type. Nexmon joined you too!' : undefined,
                      )
                    }
                  >
                    Hatch
                  </Button>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <section className="mt-9">
        <div className="flex items-center justify-between mb-3">
          <h2 className="eyebrow flex items-center gap-2"><ScanLine className="w-3.5 h-3.5" /> Last scan</h2>
          {lastScans.length > 0 && <Link href="/app/friends" className="font-sans text-[12px] font-extrabold uppercase tracking-[0.06em] text-text-accent">See all</Link>}
        </div>
        {lastScans.length === 0 ? (
          <p className="font-sans text-[15px] font-bold text-text-secondary">Nobody yet. People you scan show up here.</p>
        ) : (
          <ul className="space-y-2.5">
            {lastScans.map((r, i) => {
              const p = scannedProfile(r.address)
              const color = TYPE_COLOR[p?.role ?? 0]
              const name = p?.name || shortAddress(r.address)
              return (
                <li key={r.address}>
                  <Link
                    href={`/u/${r.address}`}
                    className="flex items-center gap-3 rounded-3xl bg-bg-surface border-2 border-(--border-default) px-3 py-2.5 active:translate-y-0.5 transition-transform"
                  >
                    <span className="w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center" style={{ background: `${color}33` }}>
                      <MonsterImage id={Number(p?.partner ?? 0n)} size={40} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-sans text-[16px] font-extrabold text-text-primary truncate">{name}</span>
                      <span className="block font-sans text-[12px] font-bold text-text-tertiary">
                        {r.at ? ago(r.at) : i === 0 ? 'Most recent friend' : 'Friend'}
                        {p && <span style={{ color }}> · {typeName(p.role)}</span>}
                      </span>
                    </span>
                    <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" aria-hidden />
                  </Link>
                </li>
              )
            })}
          </ul>
        )}
      </section>

      <Reveal state={reveal.state} onClose={() => { reveal.close(); trainer.refetch() }} />
    </div>
  )
}
