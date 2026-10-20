'use client'
import { Star } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { post, useAct, useTrainer, useUser } from '@/lib/client'
import {
  NEXMON_ID, POOL, ROLES, SPECIES, STARTER, TIER_COLOR, TYPE_COLOR, colorOf, speciesInPool, typeName, typesCaught,
  type SocemonSpecies,
} from '@/lib/socemon'
import { cn } from '@/lib/utils'

const SECTIONS: { title: string; color: string; list: SocemonSpecies[] }[] = [
  { title: 'Starter', color: colorOf(0), list: [STARTER] },
  ...[POOL.byte, POOL.blaze, POOL.prism, POOL.gold, POOL.echo, POOL.wild, POOL.bonus, POOL.event].map((pool) => ({
    title: typeName(pool),
    color: TYPE_COLOR[pool],
    list: speciesInPool(pool),
  })),
]

/* The Socédex: progress toward Nexmon, then every species as a collectible card. Tap one you own to make it your partner. */
export default function DexPage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const { busy, note, act } = useAct(trainer.refetch)
  const partner = Number(trainer.profile?.partner ?? 0n)
  const types = typesCaught(trainer.owned)

  return (
    <div>
      <PageHeader title="Socédex">
        <p className="font-poster text-[26px] leading-none text-text-secondary">
          {trainer.owned.size}<span className="text-text-tertiary">/{SPECIES.length + 1}</span>
        </p>
      </PageHeader>

      <section aria-label="Progress toward Nexmon">
        <div className="flex items-baseline justify-between">
          <p className="font-sans text-[14px] font-extrabold text-text-primary">
            {types === 5 ? 'Nexmon is yours' : `${5 - types} type${types === 4 ? '' : 's'} to Nexmon`}
          </p>
          <p className="eyebrow">{types}/5 types</p>
        </div>
        <div className="grid grid-cols-5 gap-1.5 mt-2.5">
          {ROLES.filter((r) => r.role !== POOL.wild).map((r) => {
            const has = speciesInPool(r.role).some((s) => trainer.owned.has(s.id))
            return (
              <div key={r.role}>
                <div className="h-3 rounded-full" style={{ background: has ? TYPE_COLOR[r.role] : 'var(--fill-strong)' }} />
                <p className="font-sans text-[10px] font-extrabold uppercase tracking-[0.06em] mt-1.5 text-center" style={{ color: has ? TYPE_COLOR[r.role] : 'var(--text-3)' }}>
                  {r.type}
                </p>
              </div>
            )
          })}
        </div>
      </section>

      {note && (
        <p role="status" className="mt-6 rounded-2xl border-2 border-primary/40 bg-[var(--accent-primary-dim)] px-4 py-3 font-sans text-[14px] font-bold">{note}</p>
      )}

      <div className="mt-8 space-y-8">
        {SECTIONS.map(({ title, color, list }) => {
          const caught = list.filter((s) => trainer.owned.has(s.id)).length
          return (
            <section key={title}>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                <h2 className="font-sans text-[16px] font-black uppercase tracking-[0.04em]">{title}</h2>
                <span className="ml-auto font-mono text-[12px] text-text-tertiary">{caught}/{list.length}</span>
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                {list.map((s) => (
                  <DexCard
                    key={s.id}
                    species={s}
                    color={color}
                    owned={trainer.owned.has(s.id)}
                    partner={s.id === partner}
                    disabled={!!busy}
                    onPick={() => act(`p${s.id}`, () => post('/api/partner', { id: s.id }), `${s.name} is your partner now.`)}
                  />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

/* A collectible card: type-colored foil when caught, a dark silhouette slot when not. */
function DexCard({ species, color, owned, partner, disabled, onPick }: {
  species: SocemonSpecies
  color: string
  owned: boolean
  partner: boolean
  disabled: boolean
  onPick: () => void
}) {
  const legendary = species.id === NEXMON_ID
  return (
    <button
      disabled={!owned || partner || disabled}
      onClick={onPick}
      aria-label={owned ? `${species.name}${partner ? ', your partner' : ', make partner'}` : 'Not caught yet'}
      className={cn(
        'relative aspect-[3/4] rounded-[18px] overflow-hidden flex flex-col items-center justify-between p-2 transition-transform',
        owned ? 'active:scale-95' : 'border-2 border-dashed border-(--border-default)',
        partner && 'ring-[3px] ring-white ring-offset-2 ring-offset-bg-base',
      )}
      style={owned ? { background: `linear-gradient(160deg, ${color} 0%, color-mix(in srgb, ${color} 30%, #0D0A1A) 100%)` } : undefined}
    >
      <div className="w-full flex items-center justify-between">
        <span className={cn('font-poster text-[13px] leading-none', owned ? 'text-white/80' : 'text-text-tertiary')}>
          #{String(species.id).padStart(3, '0')}
        </span>
        {partner ? (
          <Star className="w-3.5 h-3.5 text-white fill-white" />
        ) : (
          <span className="w-2 h-2 rounded-full" style={{ background: legendary ? TIER_COLOR.legendary : TIER_COLOR[species.tier] }} />
        )}
      </div>
      <MonsterImage key={species.id} id={species.id} size={72} silhouette={!owned} />
      <p className={cn('w-full truncate text-center font-sans text-[11px] font-black uppercase tracking-[0.04em]', owned ? 'text-white' : 'text-text-tertiary')}>
        {owned ? species.name : '???'}
      </p>
    </button>
  )
}
