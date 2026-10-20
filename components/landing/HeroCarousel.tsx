'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { speciesById } from '@/lib/socemon'

/* ponytail: the three sample portraits; add slides as more art lands */
const SLIDES = [
  { id: 0, bg: '#4A37D1', line: 'Everyone starts with Soci. Sign in and it is yours.' },
  { id: 1, bg: '#1597B8', line: 'Byte type. Connect with a developer to hatch one.' },
  { id: 2, bg: '#2D46C8', line: 'A rare Byte. Only 100 will ever exist.' },
]
const EASE = 'cubic-bezier(0.4, 0, 0.2, 1)'
const SPEED = '650ms'

/* Poster hero: the active monster stands huge over giant ghost type, the others wait blurred at the sides, and the
   background crossfades to the active monster's color. Auto-advances until someone takes the arrows. */
export function HeroCarousel() {
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [mobile, setMobile] = useState(false)
  const n = SLIDES.length

  useEffect(() => {
    const query = window.matchMedia('(max-width: 640px)')
    const update = () => setMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(() => setActive((a) => (a + 1) % n), 4500)
    return () => clearInterval(timer)
  }, [paused, n])

  function go(step: number) {
    setPaused(true)
    setActive((a) => (a + step + n) % n)
  }

  const slide = SLIDES[active]
  const species = speciesById(slide.id)

  return (
    <section
      className="grain relative h-svh min-h-[620px] overflow-hidden text-white"
      style={{ background: slide.bg, transition: `background-color ${SPEED} ${EASE}` }}
    >
      <header className="relative z-30 mx-auto max-w-6xl flex items-center justify-between px-5 h-16">
        <Logo height={24} tone="dark" />
        <Link
          href="/app"
          className="h-10 px-5 inline-flex items-center rounded-2xl bg-white text-[#0D0A1A] font-sans text-[13px] font-extrabold uppercase tracking-[0.05em] shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none"
        >
          Launch app
        </Link>
      </header>

      <p
        aria-hidden
        className="absolute inset-x-0 top-[17%] text-center font-poster uppercase leading-none whitespace-nowrap select-none pointer-events-none"
        style={{ fontSize: 'clamp(104px, 26vw, 380px)', letterSpacing: '-0.02em' }}
      >
        Socemon
      </p>

      {SLIDES.map((s, i) => {
        const role = i === active ? 'center' : i === (active + 1) % n ? 'right' : 'left'
        const center = role === 'center'
        return (
          <div
            key={s.id}
            aria-hidden={!center}
            className="absolute"
            style={{
              left: center ? '50%' : role === 'left' ? (mobile ? '16%' : '22%') : (mobile ? '84%' : '78%'),
              bottom: center ? (mobile ? '24%' : '4%') : (mobile ? '40%' : '16%'),
              height: center ? (mobile ? 'min(46vh, 360px)' : 'min(66vh, 600px)') : (mobile ? '14vh' : 'min(24vh, 210px)'),
              aspectRatio: '1 / 1',
              transform: 'translateX(-50%)',
              filter: center ? 'none' : 'blur(3px)',
              opacity: center ? 1 : 0.8,
              zIndex: center ? 20 : 10,
              transition: ['left', 'bottom', 'height', 'filter', 'opacity'].map((p) => `${p} ${SPEED} ${EASE}`).join(', '),
            }}
          >
            <MonsterImage id={s.id} size={600} className="w-full h-full drop-shadow-[0_30px_40px_rgba(0,0,0,0.35)]" />
          </div>
        )
      })}

      <div className="absolute z-30 left-5 sm:left-12 bottom-6 sm:bottom-14 max-w-[300px]">
        <p className="font-poster text-[30px] sm:text-[40px] uppercase leading-none">{species?.name}</p>
        <p className="font-sans text-[15px] font-semibold text-white/85 mt-2">{slide.line}</p>
        <div className="flex gap-3 mt-5">
          <button onClick={() => go(-1)} aria-label="Previous Socemon" className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center transition hover:scale-105 hover:bg-white/15">
            <ArrowLeft className="w-6 h-6" strokeWidth={2.25} />
          </button>
          <button onClick={() => go(1)} aria-label="Next Socemon" className="w-14 h-14 rounded-full border-2 border-white flex items-center justify-center transition hover:scale-105 hover:bg-white/15">
            <ArrowRight className="w-6 h-6" strokeWidth={2.25} />
          </button>
        </div>
      </div>

      <Link
        href="/app"
        className="hidden sm:flex absolute z-30 right-12 bottom-14 items-center gap-3 font-poster uppercase leading-none opacity-95 hover:opacity-100"
        style={{ fontSize: 'clamp(28px, 4vw, 58px)' }}
      >
        Launch app <ArrowRight className="w-10 h-10" strokeWidth={2.25} />
      </Link>
    </section>
  )
}
