'use client'
import { AnimatePresence, motion } from 'framer-motion'
import { Gift } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { SLOT_NAMES, wearableById } from '@/lib/avatar'
import { TIER_COLOR } from '@/lib/socemon'

export type Opened = { phase: 'opening' } | { phase: 'done'; itemId: number } | { phase: 'error'; message: string }

/* Full-screen blind box moment: the box shakes while openBox confirms, then the wearable pops out in its tier color. */
export function BoxReveal({ state, onClose }: { state: Opened | null; onClose: () => void }) {
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
