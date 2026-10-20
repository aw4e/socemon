import Link from 'next/link'
import { ArrowRight, Egg, QrCode, Ticket } from 'lucide-react'
import { Logo } from '@/components/brand/Logo'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { POOL, ROLES, TIER_COLOR, speciesById } from '@/lib/socemon'

const STEPS = [
  { Icon: QrCode, title: 'Meet', body: 'Show your QR. A friend scans it and taps Connect, you approve, and you both get an Egg of each other’s type.' },
  { Icon: Egg, title: 'Hatch', body: 'Eggs hatch into one of 18 species, rarer ones weighted by supply. Catch all five types and Nexmon joins you.' },
  { Icon: Ticket, title: 'Show up', body: 'Scan the Event Wall to catch the event drop. Its QR changes every 30 seconds, so only people in the room get one.' },
]

const ORGANIZERS = [
  'A rotating QR on the projector, so every check-in happened in the room',
  'Every check-in is an onchain event on Monad: attendance you can verify',
  'A limited, tradeable drop gives people a reason to come',
  'Attendees never need gas or tokens; the relayer pays',
]

/* ponytail: sample art only; the rest of the roster fills in as portraits land */
const SAMPLES = [0, 1, 2]

const appButton = 'inline-flex items-center gap-2 rounded-full bg-primary text-primary-fg font-sans font-medium'

/* Public landing: what Socemon is, how it plays, and why event organizers want it. No wallet needed here. */
export default function LandingPage() {
  const contract = process.env.NEXT_PUBLIC_SOCEMON_ADDRESS
  return (
    <div className="min-h-svh bg-bg-base text-text-primary">
      <header className="mx-auto max-w-5xl flex items-center justify-between px-5 h-16">
        <Logo height={24} />
        <Link href="/app" className={`${appButton} h-9 px-4 text-[14px]`}>Launch app</Link>
      </header>

      <main className="mx-auto max-w-5xl px-5">
        <section className="grid md:grid-cols-[1.1fr_1fr] items-center gap-8 pt-10 pb-16">
          <div className="text-center md:text-left">
            <p className="eyebrow">Built for Monad Blitz</p>
            <h1 className="font-display text-[44px] md:text-[60px] leading-[1.05] tracking-[-0.03em] mt-3">
              Catch your <span className="serif-accent">network</span>.
            </h1>
            <p className="font-sans text-[16px] text-text-secondary mt-4 max-w-md mx-auto md:mx-0">
              Socemon turns the people you meet into monsters you collect. Every connection hatches an Egg, every event has
              its own drop, and all of it lives onchain on Monad.
            </p>
            <div className="flex flex-wrap gap-3 mt-7 justify-center md:justify-start">
              <Link href="/app" className={`${appButton} h-12 px-6 text-[15px]`}>
                Launch app <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how" className="inline-flex items-center h-12 px-6 rounded-full border border-(--border-default) font-sans text-[15px]">
                How it plays
              </a>
            </div>
          </div>
          <div className="flex justify-center">
            <div className="rounded-full p-6" style={{ background: `radial-gradient(circle, ${TIER_COLOR.event}40 0%, transparent 70%)` }}>
              <MonsterImage id={0} size={300} />
            </div>
          </div>
        </section>

        <section id="how" className="py-12 scroll-mt-16">
          <h2 className="font-display text-[30px] tracking-[-0.02em] text-center">How it plays</h2>
          <div className="grid md:grid-cols-3 gap-4 mt-8">
            {STEPS.map(({ Icon, title, body }, i) => (
              <div key={title} className="surface rounded-3xl p-6">
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-[var(--accent-primary-dim)] text-text-accent flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="font-mono text-[12px] text-text-tertiary">0{i + 1}</span>
                </div>
                <h3 className="font-display text-[22px] mt-4">{title}</h3>
                <p className="font-sans text-[14px] text-text-secondary mt-2">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <h2 className="font-display text-[30px] tracking-[-0.02em] text-center">Your role is your type</h2>
          <p className="font-sans text-[15px] text-text-secondary text-center mt-3 max-w-xl mx-auto">
            Pick what you do when you join. Everyone who connects with you gets an Egg of your type.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-8">
            {ROLES.map((r) => (
              <div key={r.role} className="surface rounded-2xl px-4 py-4 text-center">
                <p className="font-display text-[18px]">{r.type}</p>
                <p className="font-sans text-[12px] text-text-tertiary">{r.role === POOL.wild ? 'Everyone else' : r.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <h2 className="font-display text-[30px] tracking-[-0.02em] text-center">Meet the first Socemon</h2>
          <div className="grid grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
            {SAMPLES.map((id) => {
              const s = speciesById(id)
              return (
                <div key={id} className="flex flex-col items-center text-center">
                  <MonsterImage id={id} size={160} />
                  <p className="font-display text-[18px] mt-2">{s?.name}</p>
                  <p className="font-sans text-[12px]" style={{ color: TIER_COLOR[s?.tier ?? 'common'] }}>
                    {id === 0 ? 'Starter' : s?.tier}
                  </p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="py-12">
          <div className="rounded-[32px] p-8 md:p-12 text-white" style={{ background: 'linear-gradient(160deg, #0B0C14 0%, #1B1245 100%)' }}>
            <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-white/60">For event organizers</p>
            <h2 className="font-display text-[30px] md:text-[38px] leading-tight tracking-[-0.02em] mt-3 max-w-xl">
              Give people a reason to show up, and proof that they did.
            </h2>
            <ul className="mt-6 space-y-3 max-w-xl">
              {ORGANIZERS.map((line) => (
                <li key={line} className="flex gap-3 font-sans text-[15px] text-white/80">
                  <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[#836EF9] shrink-0" />
                  {line}
                </li>
              ))}
            </ul>
            <a
              href="https://github.com/riorblade/socemon"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 h-11 px-5 mt-8 rounded-full bg-white text-[#0B0C14] font-sans font-medium text-[14px]"
            >
              Run it at your event <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-5xl px-5 py-10 flex flex-wrap gap-x-6 gap-y-2 justify-between font-sans text-[13px] text-text-tertiary border-t border-(--border-subtle)">
        <span>Socemon · Social on Monad · Built for Monad Blitz</span>
        <span className="flex gap-4">
          {contract && (
            <a href={`https://testnet.monadscan.com/address/${contract}`} target="_blank" rel="noreferrer" className="hover:text-text-primary">
              Contract
            </a>
          )}
          <a href="https://github.com/riorblade/socemon" target="_blank" rel="noreferrer" className="hover:text-text-primary">
            GitHub
          </a>
        </span>
      </footer>
    </div>
  )
}
