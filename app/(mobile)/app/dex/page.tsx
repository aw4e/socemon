'use client'
import { Check } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { post, useAct, useTrainer, useUser } from '@/lib/client'
import { POOL, ROLES, SPECIES, STARTER, TIER_COLOR, speciesInPool, typeName } from '@/lib/socemon'
import { cn } from '@/lib/utils'

const SECTIONS = [
  { title: 'Starter', list: [STARTER] },
  ...[POOL.byte, POOL.blaze, POOL.prism, POOL.gold, POOL.echo, POOL.wild, POOL.bonus, POOL.event].map((pool) => ({
    title: typeName(pool),
    list: speciesInPool(pool),
  })),
]

/* The Socédex: type progress toward Nexmon and every species, uncaught ones as silhouettes. Tap one you own to make it your partner. */
export default function DexPage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const { busy, note, act } = useAct(trainer.refetch)
  const partner = Number(trainer.profile?.partner ?? 0n)

  return (
    <div>
      <PageHeader title="Socédex">
        <span className="font-mono text-[13px] text-text-secondary">{trainer.owned.size}/{SPECIES.length + 1}</span>
      </PageHeader>

      <section>
        <p className="font-sans text-[12px] text-text-tertiary mb-2">Catch one of every type and Nexmon joins you.</p>
        <div className="flex flex-wrap gap-2">
          {ROLES.filter((r) => r.role !== POOL.wild).map((r) => {
            const has = speciesInPool(r.role).some((s) => trainer.owned.has(s.id))
            return (
              <span
                key={r.role}
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1 font-sans text-[12px]',
                  has ? 'border-primary text-text-primary' : 'border-(--border-default) text-text-tertiary',
                )}
              >
                {has && <Check className="w-3.5 h-3.5" />} {r.type} <span className="text-text-tertiary">· {r.label}</span>
              </span>
            )
          })}
        </div>
      </section>

      {note && (
        <p role="status" className="mt-6 rounded-2xl bg-[var(--fill)] px-4 py-3 font-sans text-[13px] text-text-secondary">{note}</p>
      )}

      <div className="mt-6 space-y-6">
        {SECTIONS.map(({ title, list }) => (
          <section key={title}>
            <h2 className="eyebrow mb-2">{title}</h2>
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
                    <MonsterImage key={s.id} id={s.id} size={72} silhouette={!has} />
                    <p className="font-sans text-[12px] text-text-primary truncate max-w-full">{has ? s.name : '???'}</p>
                    {s.id === partner && <p className="font-sans text-[10px] text-text-tertiary">Partner</p>}
                  </button>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
