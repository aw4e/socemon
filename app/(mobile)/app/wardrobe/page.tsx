'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Gift, Lock } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Button } from '@/components/ui/Button'
import { SLOT_NAMES, WEARABLES, renderAvatar, wearableById } from '@/lib/avatar'
import { post, useAct, useTrainer, useUser, useWardrobe } from '@/lib/client'
import { TIER_COLOR } from '@/lib/socemon'
import { cn } from '@/lib/utils'

type Opened = { phase: 'opening' } | { phase: 'done'; itemId: number } | { phase: 'error'; message: string }

/* Dress the avatar: open blind boxes from connections, then tap an owned wearable to put it on or take it off.
   Wearables you do not own yet stay visible as locked cards so there is something to hunt for. */
export default function WardrobePage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const wardrobe = useWardrobe(user)
  const { busy, note, act } = useAct(wardrobe.refetch)
  const [slot, setSlot] = useState(0)
  const [opened, setOpened] = useState<Opened | null>(null)

  const partner = Number(trainer.profile?.partner ?? 0n)
  const svg = renderAvatar(wardrobe.equipped)
  const items = WEARABLES.filter((w) => w.slot === slot)

  async function openBox() {
    setOpened({ phase: 'opening' })
    try {
      const { itemId } = await post<{ itemId: number }>('/api/box', {})
      setOpened({ phase: 'done', itemId })
      setSlot(wearableById(itemId)?.slot ?? slot)
      await wardrobe.refetch()
    } catch (err) {
      setOpened({ phase: 'error', message: err instanceof Error ? err.message : 'Something went wrong' })
    }
  }

  function toggle(id: number) {
    const wearing = wardrobe.equipped[slot] === id
    const name = wearableById(id)?.name
    act(`equip-${id}`, () => post('/api/equip', { slot, id: wearing ? 0 : id }), wearing ? `Took off ${name}` : `Wearing ${name}`)
  }

  return (
    <div>
      <PageHeader title="Wardrobe" />

      <div className="relative rounded-[30px] overflow-hidden border border-(--border-default) aspect-square">
        {/* our own SVG built from static art, so inlining it is safe */}
        <div className="absolute inset-0" dangerouslySetInnerHTML={{ __html: svg }} />
        {/* the pet sits where renderAvatar draws it in the NFT image (x 272, y 258, 108 of 400); MonsterImage covers missing art */}
        <div className="absolute w-[27%] aspect-square flex items-center justify-center" style={{ left: '68%', top: '64.5%' }}>
          <MonsterImage key={partner} id={partner} size={96} className="w-full h-full" />
        </div>
      </div>

      <section className="mt-4 flex items-center justify-between gap-3 rounded-[22px] bg-bg-surface border border-(--border-default) p-4">
        <div className="flex items-center gap-3">
          <Gift className="w-8 h-8 text-primary" />
          <div>
            <p className="font-poster text-[26px] leading-none">{wardrobe.boxes}</p>
            <p className="eyebrow">Blind boxes</p>
          </div>
        </div>
        <Button onClick={openBox} disabled={!wardrobe.boxes || !!opened}>Open</Button>
      </section>
      {!wardrobe.boxes && !wardrobe.loading && (
        <p className="font-sans text-[13px] font-bold text-text-tertiary mt-2">Every new connection gives you and your friend one box.</p>
      )}

      <div role="tablist" aria-label="Slot" className="mt-5 -mx-5 px-5 flex gap-2 overflow-x-auto">
        {SLOT_NAMES.map((name, i) => (
          <button
            key={name}
            role="tab"
            aria-selected={slot === i}
            onClick={() => setSlot(i)}
            className={cn(
              'shrink-0 h-9 px-4 rounded-full font-sans text-[12px] font-extrabold uppercase tracking-[0.05em] border-2',
              slot === i ? 'bg-primary text-white border-primary' : 'bg-bg-elevated text-text-secondary border-(--border-default)',
            )}
          >
            {name}
          </button>
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-3 gap-3">
        {items.map((w) => {
          const count = wardrobe.owned.get(w.id) ?? 0
          const wearing = wardrobe.equipped[slot] === w.id
          const color = TIER_COLOR[w.tier]
          return (
            <li key={w.id}>
              <button
                onClick={() => toggle(w.id)}
                disabled={!count || !!busy}
                aria-pressed={wearing}
                className={cn(
                  'relative w-full rounded-[18px] overflow-hidden border-[3px] text-left transition-transform active:scale-95 disabled:active:scale-100',
                  busy === `equip-${w.id}` && 'animate-pulse',
                )}
                style={{ borderColor: wearing ? color : 'var(--border-default)', boxShadow: wearing ? `0 0 18px ${color}88` : undefined }}
              >
                <img src={`/api/avatar/${w.id}`} alt="" className={cn('w-full aspect-square', !count && 'grayscale opacity-30')} />
                {!count && <Lock className="absolute top-2 right-2 w-4 h-4 text-text-tertiary" />}
                {count > 1 && <span className="absolute top-2 right-2 font-mono text-[11px] font-bold text-white">×{count}</span>}
                <span className="block px-2 py-1.5 bg-bg-surface">
                  <span className="block font-sans text-[11px] font-extrabold truncate">{w.name}</span>
                  <span className="block font-sans text-[10px] font-bold uppercase tracking-[0.08em]" style={{ color }}>
                    {wearing ? 'Wearing' : w.tier}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {note && <p aria-live="polite" className="font-sans text-[13px] font-bold text-text-secondary mt-3">{note}</p>}

      <BoxReveal state={opened} onClose={() => setOpened(null)} />
    </div>
  )
}

function BoxReveal({ state, onClose }: { state: Opened | null; onClose: () => void }) {
  const item = state?.phase === 'done' ? wearableById(state.itemId) : undefined
  const color = TIER_COLOR[item?.tier ?? 'common']
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-8 text-center backdrop-blur-md"
          style={{ background: 'rgba(8, 8, 12, 0.88)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {state.phase === 'opening' && (
            <>
              <motion.div animate={{ rotate: [0, -10, 10, -8, 8, 0] }} transition={{ duration: 0.8, repeat: Infinity }}>
                <Gift className="w-32 h-32 text-primary drop-shadow-[0_0_40px_rgba(131,110,249,0.7)]" strokeWidth={1.5} />
              </motion.div>
              <p className="font-sans text-[15px] text-white/80">Opening your box onchain…</p>
            </>
          )}
          {state.phase === 'done' && item && (
            <>
              <motion.img
                src={`/api/avatar/${item.id}`}
                alt=""
                className="w-60 h-60 rounded-[28px]"
                style={{ boxShadow: `0 0 80px 10px ${color}` }}
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', bounce: 0.45, duration: 0.7 }}
              />
              <div>
                <p className="font-sans text-[12px] uppercase tracking-[0.12em]" style={{ color }}>{item.tier} · {SLOT_NAMES[item.slot]}</p>
                <p className="font-poster text-[44px] uppercase text-white leading-none mt-2">{item.name}</p>
              </div>
              <Button onClick={onClose}>Nice!</Button>
            </>
          )}
          {state.phase === 'error' && (
            <>
              <p className="font-poster text-[40px] uppercase text-white leading-none">Not this time</p>
              <p className="font-sans text-[14px] text-white/70 max-w-xs">{state.message}</p>
              <Button variant="secondary" onClick={onClose} className="!text-white !border-white/30">Close</Button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
