import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { HeroCarousel } from '@/components/landing/HeroCarousel'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { MONAD_PURPLE, POOL, ROLES, TIER_COLOR, TYPE_COLOR, speciesById } from '@/lib/socemon'

const STEPS = [
  { color: MONAD_PURPLE, title: 'Meet', body: 'Scan someone’s code at the event. They approve, and you both get an Egg of each other’s type.' },
  { color: TYPE_COLOR[POOL.byte], title: 'Hatch', body: 'Eggs hatch into one of 18 species, rarer ones weighted by supply. Catch all five types and Nexmon joins you.' },
  { color: TYPE_COLOR[POOL.blaze], title: 'Show up', body: 'Scan the Event Wall for the event drop. The code changes every 30 seconds, so only people in the room catch one.' },
]

const ORGANIZERS = [
  'A rotating QR on the projector proves every check-in happened in the room.',
  'Every check-in is an onchain event on Monad. Attendance you can verify.',
  'A limited, tradeable drop gives people a reason to come.',
  'Attendees never need gas or tokens. The relayer pays.',
]

/* ponytail: sample art only; the lineup grows as portraits land */
const LINEUP = [0, 1, 2]

/* Public landing: poster hero, how it plays, types, the first Socemon, and the pitch for event organizers. */
export default function LandingPage() {
  const contract = process.env.NEXT_PUBLIC_SOCEMON_ADDRESS
  return (
    <div className="bg-bg-base text-text-primary">
      <HeroCarousel />

      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow">How it plays</p>
        <ol className="mt-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-12 items-baseline border-t border-(--border-subtle) py-8 sm:py-10">
              <span className="font-poster leading-none" style={{ color: s.color, fontSize: 'clamp(64px, 12vw, 150px)' }}>
                0{i + 1}
              </span>
              <div>
                <h2 className="font-sans font-black text-[30px] sm:text-[44px] leading-tight tracking-[-0.02em]">{s.title}</h2>
                <p className="font-sans text-[16px] sm:text-[18px] font-semibold text-text-secondary mt-2 max-w-xl">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <h2 className="font-poster uppercase leading-[0.95]" style={{ fontSize: 'clamp(48px, 8vw, 104px)' }}>
          Your role is <span style={{ color: MONAD_PURPLE }}>your type</span>
        </h2>
        <p className="font-sans text-[17px] font-semibold text-text-secondary mt-4 max-w-xl">
          Pick what you do when you join. Everyone who connects with you gets an Egg of your type.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-10">
          {ROLES.map((r) => (
            <div key={r.role} className="rounded-[28px] px-5 pt-5 pb-4 text-[#0D0A1A] flex flex-col justify-between min-h-[150px]" style={{ background: TYPE_COLOR[r.role] }}>
              <p className="font-poster uppercase leading-none" style={{ fontSize: 'clamp(40px, 6vw, 64px)' }}>{r.type}</p>
              <p className="font-sans text-[14px] font-extrabold uppercase tracking-[0.06em] opacity-75">
                {r.role === POOL.wild ? 'Everyone else' : r.label}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden py-24">
        <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#836EF91f] to-transparent" />
        <div className="relative mx-auto max-w-6xl px-5">
          <h2 className="font-poster uppercase leading-[0.95] text-center" style={{ fontSize: 'clamp(48px, 8vw, 104px)' }}>
            Meet the first Socemon
          </h2>
          <div className="grid grid-cols-3 gap-2 sm:gap-8 mt-14 items-end">
            {LINEUP.map((id) => {
              const s = speciesById(id)
              return (
                <div key={id} className="flex flex-col items-center text-center">
                  <div className="animate-float" style={{ animationDelay: `${id * 0.4}s` }}>
                    <MonsterImage id={id} size={260} className="w-full h-auto max-w-[260px]" />
                  </div>
                  <p className="font-mono text-[12px] text-text-tertiary mt-4">#{String(id).padStart(3, '0')}</p>
                  <p className="font-sans font-black text-[20px] sm:text-[26px]">{s?.name}</p>
                  <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.08em]" style={{ color: id === 0 ? MONAD_PURPLE : TIER_COLOR[s?.tier ?? 'common'] }}>
                    {id === 0 ? 'Starter' : s?.tier}
                  </p>
                </div>
              )
            })}
          </div>
          <p className="font-sans text-[15px] font-semibold text-text-tertiary text-center mt-12">+ 18 more to discover, including the legendary Nexmon.</p>
        </div>
      </section>

      <section className="grain relative overflow-hidden text-white" style={{ background: MONAD_PURPLE }}>
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-24">
          <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.14em] text-white/70">For event organizers</p>
          <h2 className="font-poster uppercase leading-[0.9] mt-4" style={{ fontSize: 'clamp(64px, 13vw, 200px)' }}>
            Make them<br />show up.
          </h2>
          <ol className="mt-12 grid sm:grid-cols-2 gap-x-12">
            {ORGANIZERS.map((line, i) => (
              <li key={line} className="flex gap-4 border-t border-white/25 py-5">
                <span className="font-poster text-[28px] leading-none text-white/60">{i + 1}</span>
                <p className="font-sans text-[18px] font-bold leading-snug">{line}</p>
              </li>
            ))}
          </ol>
          <a
            href="https://github.com/riorblade/socemon"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 h-14 px-7 mt-12 rounded-2xl bg-white text-[#0D0A1A] font-sans text-[15px] font-extrabold uppercase tracking-[0.05em] shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none"
          >
            Run it at your event <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <footer className="relative overflow-hidden">
        <p aria-hidden className="font-poster uppercase leading-none text-center text-white/[0.05] select-none whitespace-nowrap -mb-4" style={{ fontSize: 'clamp(90px, 24vw, 360px)' }}>
          Socemon
        </p>
        <div className="mx-auto max-w-6xl px-5 pb-10 flex flex-wrap gap-x-6 gap-y-3 justify-between items-center font-sans text-[13px] font-bold text-text-tertiary">
          <span>Social on Monad · Built for Monad Blitz</span>
          <span className="flex gap-5">
            <Link href="/app" className="hover:text-text-primary">Launch app</Link>
            {contract && (
              <a href={`https://testnet.monadscan.com/address/${contract}`} target="_blank" rel="noreferrer" className="hover:text-text-primary">Contract</a>
            )}
            <a href="https://github.com/riorblade/socemon" target="_blank" rel="noreferrer" className="hover:text-text-primary">GitHub</a>
          </span>
        </div>
      </footer>
    </div>
  )
}
