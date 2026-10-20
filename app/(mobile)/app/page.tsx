'use client'
import Link from 'next/link'
import { Egg } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, useAct, useNames, useTrainer, useUser, type Catch } from '@/lib/client'
import { ROLES, SPECIES, speciesById, typeName, typesCaught } from '@/lib/socemon'

/* Home: your partner, requests to approve and Eggs to hatch. */
export default function HomePage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const nameOf = useNames(trainer.pending)
  const { busy, note, act } = useAct(trainer.refetch)
  const reveal = useCatch()

  const profile = trainer.profile
  const partner = Number(profile?.partner ?? 0n)
  const eggs = trainer.eggs ?? []
  const stats = [
    { href: '/app/friends', value: trainer.connections?.length ?? 0, label: 'friends' },
    { href: '/app/dex', value: `${typesCaught(trainer.owned)}/5`, label: 'types' },
    { href: '/app/dex', value: `${trainer.owned.size}/${SPECIES.length + 1}`, label: 'caught' },
  ]

  return (
    <div>
      <header className="flex items-center h-16">
        <Logo height={22} />
      </header>

      <section className="flex flex-col items-center text-center">
        <MonsterImage id={partner} size={180} />
        <p className="font-display text-[26px] text-text-primary mt-2">{profile?.name}</p>
        <p className="font-sans text-[13px] text-text-secondary">
          {ROLES[profile?.role ?? 0]?.label} · partner {speciesById(partner)?.name}
        </p>
      </section>

      <div className="grid grid-cols-3 gap-2 mt-6">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="rounded-2xl bg-[var(--fill)] py-3 text-center">
            <p className="font-mono text-[18px] text-text-primary">{s.value}</p>
            <p className="font-sans text-[11px] text-text-tertiary">{s.label}</p>
          </Link>
        ))}
      </div>

      {note && (
        <p role="status" className="mt-6 rounded-2xl bg-[var(--fill)] px-4 py-3 font-sans text-[13px] text-text-secondary">{note}</p>
      )}

      {!!trainer.pending?.length && (
        <section className="mt-8">
          <h2 className="eyebrow mb-3">Requests</h2>
          <ul className="space-y-2">
            {trainer.pending.map((from) => (
              <li key={from} className="flex items-center gap-3 rounded-[14px] bg-[var(--fill)] px-4 py-3">
                <p className="flex-1 min-w-0 font-sans text-[14px] text-text-primary truncate">{nameOf(from)}</p>
                <Button
                  size="sm"
                  loading={busy === from}
                  disabled={!!busy}
                  onClick={() => act(from, () => post('/api/approve', { from }), `Connected with ${nameOf(from)}. You both got an Egg.`)}
                >
                  Approve
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="eyebrow mb-3">Eggs</h2>
        {eggs.every((n) => n === 0) ? (
          <p className="font-sans text-[13px] text-text-secondary">
            Meet people. Every new connection gives you both an Egg of the other person&apos;s type.{' '}
            <Link href="/app/qr" className="text-text-accent">Scan someone</Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {eggs.map((count, pool) =>
              count > 0 ? (
                <li key={pool} className="flex items-center gap-3 rounded-[14px] bg-[var(--fill)] px-4 py-3">
                  <Egg className="w-5 h-5 text-text-accent shrink-0" />
                  <p className="flex-1 font-sans text-[14px] text-text-primary">{typeName(pool)} Egg × {count}</p>
                  <Button
                    size="sm"
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
              ) : null,
            )}
          </ul>
        )}
      </section>

      <Reveal state={reveal.state} onClose={() => { reveal.close(); trainer.refetch() }} />
    </div>
  )
}
