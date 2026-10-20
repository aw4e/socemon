'use client'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { EXPLORER_TX, STARTER_ID, TIER_COLOR, speciesById, typeName } from '@/lib/socemon'

export type RevealState =
  | { phase: 'pending'; label: string }
  | { phase: 'done'; monsterId: number; tx?: string; ms: number; extra?: string }
  | { phase: 'error'; message: string }

type Caught = { monsterId: number; tx?: string; ms?: number }

/** Runs a mint call behind the Reveal overlay and times it, so the UI can show how fast Monad confirmed. */
export function useCatch() {
  const [state, setState] = useState<RevealState | null>(null)

  async function run<R extends Caught>(label: string, call: () => Promise<R>, extra?: (result: R) => string | undefined) {
    setState({ phase: 'pending', label })
    const started = performance.now()
    try {
      const result = await call()
      setState({ phase: 'done', monsterId: result.monsterId, tx: result.tx, ms: result.ms ?? performance.now() - started, extra: extra?.(result) })
      return result
    } catch (err) {
      setState({ phase: 'error', message: err instanceof Error ? err.message : 'Something went wrong' })
      return null
    }
  }

  return { state, run, close: () => setState(null) }
}

/* Full-screen catch moment shared by Claim Soci, Hatch and event check-in. */
export function Reveal({ state, onClose }: { state: RevealState | null; onClose: () => void }) {
  return (
    <AnimatePresence>
      {state && (
        <motion.div
          key="reveal"
          role="dialog"
          aria-modal="true"
          aria-live="polite"
          className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 px-8 text-center backdrop-blur-md"
          style={{ background: 'rgba(8, 8, 12, 0.88)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {state.phase === 'pending' && <Pending label={state.label} />}
          {state.phase === 'done' && <Done {...state} onClose={onClose} />}
          {state.phase === 'error' && (
            <>
              <p className="font-display text-[22px] text-white">Not this time</p>
              <p className="font-sans text-[14px] text-white/70 max-w-xs">{state.message}</p>
              <Button variant="secondary" onClick={onClose} className="!text-white !border-white/30">Close</Button>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function Pending({ label }: { label: string }) {
  return (
    <>
      <motion.div
        aria-hidden
        className="w-28 h-36"
        style={{
          borderRadius: '50% 50% 46% 46% / 60% 60% 40% 40%',
          background: 'linear-gradient(180deg, #ffffff 0%, #d9d4ff 100%)',
          boxShadow: '0 0 60px rgba(131, 110, 249, 0.6)',
        }}
        animate={{ rotate: [0, -8, 8, -6, 6, 0] }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <p className="font-sans text-[15px] text-white/80">{label}</p>
    </>
  )
}

function Done({ monsterId, tx, ms, extra, onClose }: Extract<RevealState, { phase: 'done' }> & { onClose: () => void }) {
  const species = speciesById(monsterId)
  const color = TIER_COLOR[species?.tier ?? 'common']
  const label = monsterId === STARTER_ID ? 'Starter' : `${species?.tier} · ${typeName(species?.pool ?? 0)}`
  return (
    <>
      <motion.div
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', bounce: 0.45, duration: 0.7 }}
        className="rounded-full p-6"
        style={{ boxShadow: `0 0 80px 10px ${color}`, background: `radial-gradient(circle, ${color}55 0%, transparent 70%)` }}
      >
        <MonsterImage id={monsterId} size={200} />
      </motion.div>
      <div>
        <p className="font-sans text-[12px] uppercase tracking-[0.12em]" style={{ color }}>{label}</p>
        <p className="font-display text-[32px] text-white leading-tight mt-1">{species?.name ?? 'Socemon'}</p>
        {extra && <p className="font-sans text-[14px] text-white/80 mt-2 max-w-xs mx-auto">{extra}</p>}
      </div>
      <p className="font-mono text-[12px] text-white/60">
        Confirmed onchain in {(ms / 1000).toFixed(1)}s
        {tx && (
          <>
            {' · '}
            <a href={`${EXPLORER_TX}${tx}`} target="_blank" rel="noreferrer" className="underline inline-flex items-center gap-1">
              View tx <ExternalLink className="w-3 h-3" />
            </a>
          </>
        )}
      </p>
      <Button onClick={onClose}>Nice!</Button>
    </>
  )
}
