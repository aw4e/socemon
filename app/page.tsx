'use client'
import { useState } from 'react'
import QRCode from 'qrcode'
import { Egg, LogOut, QrCode } from 'lucide-react'
import type { Address } from 'viem'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, useNames, useSession, useTrainer, type Catch } from '@/lib/client'
import { POOL, ROLES, SPECIES, STARTER, STARTER_ID, TIER_COLOR, speciesById, speciesInPool, typeName } from '@/lib/socemon'

const DEX = [
  { title: 'Starter', list: [STARTER] },
  ...[POOL.byte, POOL.blaze, POOL.prism, POOL.gold, POOL.echo, POOL.wild, POOL.bonus, POOL.event].map((pool) => ({
    title: typeName(pool),
    list: speciesInPool(pool),
  })),
]

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

export default function HomePage() {
  return (
    <main className="px-5">
      <Gate hero={hero}>{(user) => <Home user={user} />}</Gate>
    </main>
  )
}

/* Everything a trainer does: partner, QR to connect, requests to approve, Eggs to hatch, and the Socédex. */
function Home({ user }: { user: Address }) {
  const { signOut } = useSession()
  const trainer = useTrainer(user, 5_000)
  const nameOf = useNames(trainer.pending)
  const reveal = useCatch()
  const [qr, setQr] = useState('')
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')

  const profile = trainer.profile
  const partner = Number(profile?.partner ?? 0n)
  const eggs = trainer.eggs ?? []
  const types = ROLES.slice(1).filter((r) => speciesInPool(r.role).some((s) => trainer.owned.has(s.id))).length

  async function act(key: string, call: () => Promise<unknown>, done: string) {
    setBusy(key)
    setNote('')
    try {
      await call()
      setNote(done)
      await trainer.refetch()
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy('')
    }
  }

  async function toggleQr() {
    setQr(qr ? '' : await QRCode.toDataURL(`${window.location.origin}/u/${user}`, { margin: 1, width: 560 }))
  }

  return (
    <div className="pb-10">
      <header className="flex items-center justify-between h-16">
        <Logo height={22} />
        <button onClick={signOut} aria-label="Sign out" className="p-2 -mr-2 text-text-tertiary">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <section className="flex flex-col items-center text-center pt-2">
        <MonsterImage id={partner} size={180} />
        <p className="font-display text-[26px] text-text-primary mt-2">{profile?.name}</p>
        <p className="font-sans text-[13px] text-text-secondary">
          {ROLES[profile?.role ?? 0]?.label} · partner {speciesById(partner)?.name}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={toggleQr}>
          <QrCode className="w-4 h-4" /> {qr ? 'Hide my QR' : 'My QR'}
        </Button>
        {qr && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code to your Socemon profile" className="mt-4 w-64 rounded-2xl bg-white p-3" />
            <p className="font-sans text-[12px] text-text-tertiary mt-2">Friends scan this to connect with you.</p>
          </>
        )}
      </section>

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
            Meet people. Every new connection gives you both an Egg of the other person&apos;s type.
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

      <p className="mt-8 font-mono text-[12px] text-text-tertiary text-center">
        {trainer.connections?.length ?? 0} connections · types {types}/5 · caught {trainer.owned.size}/{SPECIES.length + 1}
      </p>

      <section className="mt-6 space-y-6">
        <div>
          <h2 className="eyebrow">Socédex</h2>
          <p className="font-sans text-[12px] text-text-tertiary mt-1">Tap a Socemon you caught to make it your partner.</p>
        </div>
        {DEX.map(({ title, list }) => (
          <div key={title}>
            <p className="font-sans text-[11px] text-text-tertiary mb-2">{title}</p>
            <div className="grid grid-cols-3 gap-3">
              {list.map((s) => {
                const has = trainer.owned.has(s.id)
                return (
                  <button
                    key={s.id}
                    disabled={!has || !!busy || s.id === partner}
                    onClick={() => act(`p${s.id}`, () => post('/api/partner', { id: s.id }), `${s.name} is your partner now.`)}
                    className="flex flex-col items-center gap-1 rounded-[16px] bg-[var(--fill)] p-3 disabled:cursor-default"
                    style={s.id === partner ? { outline: `2px solid ${TIER_COLOR[s.tier]}` } : undefined}
                  >
                    <MonsterImage id={s.id} size={72} silhouette={!has} />
                    <p className="font-sans text-[12px] text-text-primary truncate max-w-full">{has ? s.name : '???'}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <Reveal state={reveal.state} onClose={() => { reveal.close(); trainer.refetch() }} />
    </div>
  )
}
