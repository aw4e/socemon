'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import type { Address } from 'viem'
import { Check, Gift } from 'lucide-react'
import { BoxReveal, type Opened } from '@/components/socemon/BoxReveal'
import { EggShape } from '@/components/socemon/EggShape'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, useProfiles, type Catch } from '@/lib/client'
import { TYPE_COLOR, typeName } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

/* Shown on both phones the moment a scan connects two trainers: what each of you just got, and the buttons to use it
   right here, so nobody has to go looking for the next step. */
export function Connected({ friend, onDone }: { friend: Address; onDone: () => void }) {
  const profile = useProfiles([friend])(friend)
  const reveal = useCatch()
  const [box, setBox] = useState<Opened | null>(null)
  const [hatched, setHatched] = useState(false)
  const [opened, setOpened] = useState(false)
  const name = profile?.name || shortAddress(friend)
  const pool = profile?.role ?? 0
  const color = TYPE_COLOR[pool]

  async function hatch() {
    if (await reveal.run(`Hatching a ${typeName(pool)} Egg…`, () => post<Catch>('/api/hatch', { pool }))) setHatched(true)
  }

  async function openBox() {
    setBox({ phase: 'opening' })
    try {
      const { itemId } = await post<{ itemId: number }>('/api/box', {})
      setBox({ phase: 'done', itemId })
      setOpened(true)
    } catch (err) {
      setBox({ phase: 'error', message: err instanceof Error ? err.message : 'Something went wrong' })
    }
  }

  return (
    <motion.div
      role="dialog"
      aria-modal="true"
      aria-label={`Connected with ${name}`}
      className="fixed inset-0 z-40 flex flex-col items-center justify-center gap-6 px-6 text-center bg-bg-base/95 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
        className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-[0_0_40px_rgba(131,110,249,0.6)]">
        <Check className="w-9 h-9 text-white" strokeWidth={3} />
      </motion.div>
      <div>
        <p className="eyebrow">Connected onchain</p>
        <h2 className="font-poster text-[44px] uppercase leading-[0.95] mt-2">You & {name}<br />are friends</h2>
        <p className="font-sans text-[15px] font-bold text-text-secondary mt-3">You both got a reward. Use them now:</p>
      </div>

      <div className="w-full max-w-sm grid gap-3">
        <Step done={hatched} icon={<EggShape color={color} size={34} />} title={`${typeName(pool)} Egg`} body={`From ${name}'s type`}>
          <Button size="sm" onClick={hatch} disabled={hatched} loading={reveal.state?.phase === 'pending'}>{hatched ? 'Hatched' : 'Hatch'}</Button>
        </Step>
        <Step done={opened} icon={<Gift className="w-9 h-9 text-primary" />} title="Blind box" body="A wearable for your avatar">
          <Button size="sm" onClick={openBox} disabled={opened || !!box}>{opened ? 'Opened' : 'Open'}</Button>
        </Step>
      </div>

      <Button variant="secondary" onClick={onDone}>{hatched && opened ? 'Done' : 'Later'}</Button>

      <Reveal state={reveal.state} onClose={reveal.close} />
      <BoxReveal state={box} onClose={() => setBox(null)} />
    </motion.div>
  )
}

function Step({ done, icon, title, body, children }: { done: boolean; icon: React.ReactNode; title: string; body: string; children: React.ReactNode }) {
  return (
    <div className={`flex items-center gap-4 rounded-[22px] bg-bg-surface border border-(--border-default) p-4 text-left ${done ? 'opacity-60' : ''}`}>
      <div className="w-12 flex justify-center shrink-0">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-[16px] font-black">{title}</p>
        <p className="font-sans text-[12px] font-bold text-text-tertiary">{body}</p>
      </div>
      {children}
    </div>
  )
}
