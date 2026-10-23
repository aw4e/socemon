'use client'
import { useEffect, useState } from 'react'

export type Party = { who: string; color: string; get: string; give: string }

/* The three sides of the loop as a typographic index: outlined poster words, the active one floods with its color
   and its terms appear beside it. It cycles by itself until someone hovers or taps. */
export function EcosystemIndex({ parties }: { parties: Party[] }) {
  const [active, setActive] = useState(0)
  const [held, setHeld] = useState(false)

  useEffect(() => {
    if (held || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => setActive((a) => (a + 1) % parties.length), 3200)
    return () => clearInterval(t)
  }, [held, parties.length])

  const p = parties[active]
  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-x-12 gap-y-8 items-end" onMouseLeave={() => setHeld(false)}>
      <ul>
        {parties.map((party, i) => (
          <li key={party.who}>
            <button
              type="button"
              onMouseEnter={() => {
                setHeld(true)
                setActive(i)
              }}
              onClick={() => {
                setHeld(true)
                setActive(i)
              }}
              aria-pressed={active === i}
              className="group flex items-baseline gap-4 w-full text-left font-poster uppercase leading-[0.86] transition-[color,transform] duration-500"
              style={{
                fontSize: 'clamp(54px, 10.5vw, 168px)',
                color: active === i ? party.color : 'transparent',
                WebkitTextStroke: active === i ? '0px' : `1.5px color-mix(in srgb, ${party.color} 55%, transparent)`,
                transform: active === i ? 'translateX(0.18em)' : 'none',
              }}
            >
              <span className="font-mono text-[13px] tracking-[0.2em] self-start mt-[0.6em]" style={{ WebkitTextStroke: '0px', color: 'var(--text-3)' }}>
                0{i + 1}
              </span>
              {party.who}
            </button>
          </li>
        ))}
      </ul>
      <div key={p.who} className="font-mono lg:pb-6 animate-[fadeUp_.5s_ease]" aria-live="polite">
        <p className="text-[11px] tracking-[0.22em] uppercase" style={{ color: p.color }}>// They get</p>
        <p className="font-sans text-[22px] font-black leading-snug mt-2">{p.get}</p>
        <div className="h-px my-6" style={{ background: `linear-gradient(90deg, ${p.color}, transparent)` }} />
        <p className="text-[11px] tracking-[0.22em] uppercase text-text-tertiary">// They bring</p>
        <p className="font-sans text-[17px] font-semibold text-text-secondary leading-snug mt-2">{p.give}</p>
      </div>
    </div>
  )
}
