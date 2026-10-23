import Link from 'next/link'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { HeroCarousel } from '@/components/landing/HeroCarousel'
import { ScrambleIn, TiltText } from '@/components/landing/Motion'
import { BLITZ_HERO, FlapScene, Loop, RushScene } from '@/components/landing/Scenes'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { MONAD_PURPLE, POOL, ROLES, TIER_COLOR, TYPE_COLOR, speciesById } from '@/lib/socemon'

const REPO = 'https://github.com/riorblade/socemon'

/* The loop: each side brings what the other two want. */
const ECOSYSTEM = [
  { color: TYPE_COLOR[POOL.echo], who: 'Communities', get: 'A full room, attendance verified onchain.', give: 'The event, and the check-in QR on the projector.' },
  { color: MONAD_PURPLE, who: 'Players', get: 'Limited NFT skins and skills that win games.', give: 'Showing up and meeting people. No gas, no tokens.' },
  { color: TYPE_COLOR[POOL.gold], who: 'Game sponsors', get: 'New players already holding their items.', give: 'The event drop: a skin or skill for their game.' },
]

const STEPS = [
  { color: MONAD_PURPLE, title: 'Meet', body: 'Scan a friend’s code at the event. You connect on the spot, and both of you get an Egg and a blind box.' },
  { color: TYPE_COLOR[POOL.byte], title: 'Collect', body: 'Eggs hatch Socemon to keep as pets. Blind boxes drop wearables for your avatar, from common caps to legendary wings.' },
  { color: TYPE_COLOR[POOL.blaze], title: 'Show up', body: 'Scan the Event Wall for the event drop. The code changes every 30 seconds, so only people in the room get one.' },
  { color: TYPE_COLOR[POOL.prism], title: 'Play', body: 'Wear your NFTs in the Game hub. They are not just looks: they give extra lives, speed and new moves.' },
]

const GAMES = [
  {
    href: '/app/game/rush',
    name: 'Blitz Rush',
    Scene: RushScene,
    pitch: 'Race three rivals across three lanes. The fastest one is out of reach on skill alone.',
    nft: [
      ['⚡ Blitz Jacket', 'Blitz Boost: lightning speed through barriers'],
      ['🪽 Circuit Wings', 'Fly over barriers'],
      ['🗡️ Plasma Blade', 'Slash the barrier ahead'],
      ['🛡️ Hero Cape', 'Shrug off one crash'],
    ],
  },
  {
    href: '/app/game/flap',
    name: 'Blitz Flap',
    Scene: FlapScene,
    pitch: 'Tap to fly your own avatar through the pipes, your pet trailing behind.',
    nft: [
      ['🪽 Wings and capes', 'Extra lives'],
      ['🕶️ Visors and glasses', 'A wider gap'],
      ['⚡ Blitz Jacket', '+1 life and slow-mo'],
      ['🐾 Your pet', 'Score multiplier by rarity'],
    ],
  },
]

/* ponytail: sample art only; the lineup grows as portraits land */
const LINEUP = [0, 1, 2]

/* Public landing: the hero, why it exists (community × players × game sponsors), how it works, the Monad Blitz drop,
   the games where NFTs matter, and the pitch for hosts and sponsors. */
export default function LandingPage() {
  const contract = process.env.NEXT_PUBLIC_SOCEMON_ADDRESS
  return (
    <div className="bg-bg-base text-text-primary">
      <HeroCarousel />

      <section className="relative overflow-hidden py-28">
        <p aria-hidden className="absolute left-1/2 top-10 -translate-x-1/2 font-poster uppercase leading-none whitespace-nowrap select-none bg-clip-text text-transparent opacity-[0.07]"
          style={{ fontSize: 'clamp(140px, 30vw, 460px)', backgroundImage: 'linear-gradient(180deg, #fff, transparent)' }}>
          Show up
        </p>
        <div className="relative mx-auto max-w-6xl px-5">
          <p className="eyebrow">Why it exists</p>
          <h2 className="font-poster uppercase leading-[0.9] mt-4" style={{ fontSize: 'clamp(46px, 8.4vw, 118px)' }}>
            <ScrambleIn text="Events bring the people." className="block" />
            <ScrambleIn text="Games give them a reason." className="block bg-clip-text text-transparent" delay={350}
              style={{ backgroundImage: 'linear-gradient(90deg, #836EF9, #5EC8FF, #FF8AD8)' }} />
          </h2>

          <div className="grid lg:grid-cols-[1.05fr_1fr] gap-x-16 gap-y-6 mt-16 items-center">
            <Loop />
            <TiltText className="font-sans font-black tracking-[-0.02em] leading-[1.22] text-[clamp(24px,3vw,38px)]">
              People come to an event <span className="text-primary">for the NFT</span>. They want the NFT because it
              <span style={{ color: '#5EC8FF' }}> makes them stronger in games</span>. The game that sponsored it
              <span style={{ color: '#FBBF24' }}> gets new players</span>. One loop. Everyone in it wins.
            </TiltText>
          </div>

          <div className="mt-20">
            <div className="hidden sm:grid grid-cols-[1.1fr_1fr_1fr] gap-8 pb-3 font-sans text-[11px] font-extrabold uppercase tracking-[0.16em] text-text-tertiary">
              <span>Who</span><span>Gets</span><span>Brings</span>
            </div>
            {ECOSYSTEM.map((e) => (
              <div key={e.who} className="group grid sm:grid-cols-[1.1fr_1fr_1fr] gap-x-8 gap-y-2 border-t border-(--border-subtle) py-7 transition-colors hover:bg-white/[0.02]">
                <p className="font-poster uppercase leading-none text-[clamp(38px,5vw,64px)] transition-transform group-hover:translate-x-2" style={{ color: e.color }}>{e.who}</p>
                <p className="font-sans text-[17px] font-black self-center">{e.get}</p>
                <p className="font-sans text-[16px] font-semibold text-text-secondary self-center">{e.give}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-24">
        <p className="eyebrow">How it works</p>
        <ol className="mt-6">
          {STEPS.map((s, i) => (
            <li key={s.title} className="grid grid-cols-[auto_1fr] gap-x-6 sm:gap-x-12 items-baseline border-t border-(--border-subtle) py-8 sm:py-10">
              <span className="font-poster leading-none" style={{ color: s.color, fontSize: 'clamp(64px, 12vw, 150px)' }}>
                0{i + 1}
              </span>
              <div>
                <h3 className="font-sans font-black text-[30px] sm:text-[44px] leading-tight tracking-[-0.02em]">{s.title}</h3>
                <p className="font-sans text-[16px] sm:text-[18px] font-semibold text-text-secondary mt-2 max-w-xl">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="relative overflow-hidden bg-[#0B0820] text-white">
        <Marquee text="Monad Blitz Jogja Vol. 2 ⚡ Time to revenge ⚡ 24.10.2026 ⚡ GSIH Jogja ⚡" />
        <div className="relative mx-auto max-w-6xl px-5 py-24">
          <p aria-hidden className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-poster uppercase leading-none select-none bg-clip-text text-transparent opacity-25"
            style={{ fontSize: 'clamp(180px, 38vw, 560px)', backgroundImage: 'linear-gradient(90deg, #836EF9, #5EC8FF, #FF8AD8)' }}>
            Blitz
          </p>
          <div className="relative grid lg:grid-cols-[1fr_auto_1fr] gap-10 items-center">
            <div>
              <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.16em] text-white/60">The event drop</p>
              <h2 className="font-poster uppercase leading-[0.86] mt-3" style={{ fontSize: 'clamp(64px, 9vw, 128px)' }}>
                <ScrambleIn text="Blitz" className="block" />
                <ScrambleIn text="Jacket" className="block" delay={250} />
              </h2>
              <p className="font-sans text-[17px] font-bold text-white/75 mt-5 max-w-sm">
                Only for people who check in at Monad Blitz. Wear it and every game feels it.
              </p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={BLITZ_HERO} alt="An avatar wearing the Blitz Jacket" className="w-[min(78vw,360px)] mx-auto animate-float drop-shadow-[0_0_60px_rgba(131,110,249,0.65)]" />
            <dl className="grid grid-cols-3 lg:grid-cols-1 lg:justify-items-end">
              {[
                { v: '200', l: 'Will ever exist' },
                { v: '1', l: 'Per wallet' },
                { v: '2', l: 'Games it powers' },
              ].map((m, i) => (
                <div key={m.l} className={`lg:text-right py-3 ${i ? 'border-l lg:border-l-0 lg:border-t border-white/15 pl-4 lg:pl-0' : ''}`}>
                  <dd className="font-poster leading-none text-[clamp(52px,7vw,96px)]">{m.v}</dd>
                  <dt className="font-sans text-[11px] font-extrabold uppercase tracking-[0.14em] text-white/55 mt-1">{m.l}</dt>
                </div>
              ))}
            </dl>
          </div>

          <ul className="relative mt-16">
            {[
              { game: 'Blitz Rush', fx: 'Blitz Boost. Lightning speed that smashes through barriers, the move that beats Rex.' },
              { game: 'Blitz Flap', fx: 'One extra life and 15% slow-mo through the pipes.' },
              { game: 'Monad', fx: 'Tradeable. It keeps its value long after the lights go off.' },
            ].map((r) => (
              <li key={r.game} className="grid sm:grid-cols-[220px_1fr] gap-x-10 gap-y-1 border-t border-white/15 py-6">
                <span className="font-poster uppercase text-[30px] leading-none text-[#5EC8FF]">⚡ {r.game}</span>
                <span className="font-sans text-[18px] font-bold leading-snug">{r.fx}</span>
              </li>
            ))}
          </ul>
        </div>
        <Marquee text="Check in ⚡ Claim ⚡ Wear it ⚡ Win ⚡" reverse />
      </section>

      <section className="mx-auto max-w-6xl px-5 py-28">
        <p className="eyebrow">Game hub</p>
        <h2 className="font-poster uppercase leading-[0.9] mt-4" style={{ fontSize: 'clamp(50px, 9vw, 128px)' }}>
          <ScrambleIn text="Your NFTs are" className="block" />
          <ScrambleIn text="your strategy" className="block text-primary" delay={300} />
        </h2>
        <p className="font-sans text-[18px] font-semibold text-text-secondary mt-5 max-w-xl">
          Every game reads what your avatar wears. Not just looks: lives, speed and whole new moves.
        </p>

        {GAMES.map((g, i) => (
          <div key={g.name} className={`grid md:grid-cols-2 gap-12 items-center mt-24 ${i % 2 ? 'md:[&>*:first-child]:order-2' : ''}`}>
            <div>
              <p className="font-mono text-[13px] text-text-tertiary">0{i + 1} / 02</p>
              <h3 className="font-poster uppercase leading-[0.88] mt-2 text-[clamp(64px,9vw,120px)]">{g.name}</h3>
              <p className="font-sans text-[18px] font-bold text-text-secondary mt-4 max-w-md">{g.pitch}</p>
              <ul className="mt-8">
                {g.nft.map(([item, effect]) => (
                  <li key={item} className="flex items-baseline justify-between gap-6 border-t border-(--border-subtle) py-3.5">
                    <span className="font-sans text-[15px] font-black">{item}</span>
                    <span className="font-sans text-[14px] font-bold text-[#5EE6B8] text-right">{effect}</span>
                  </li>
                ))}
              </ul>
              <Link href={g.href} className="group inline-flex items-center gap-2 mt-8 font-poster uppercase text-[34px] leading-none border-b-4 border-primary pb-1">
                Play {g.name} <ArrowUpRight className="w-7 h-7 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1" />
              </Link>
            </div>
            <g.Scene />
          </div>
        ))}
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
          <p className="font-sans text-[15px] font-semibold text-text-tertiary text-center mt-12">+ 18 more to discover, including the legendary Nexmon. Your pet walks beside your avatar and multiplies your score.</p>
        </div>
      </section>

      <section className="grain relative overflow-hidden text-white" style={{ background: MONAD_PURPLE }}>
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-24">
          <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.14em] text-white/70">For communities and game sponsors</p>
          <h2 className="font-poster uppercase leading-[0.9] mt-4" style={{ fontSize: 'clamp(64px, 13vw, 200px)' }}>
            Make them<br />show up.
          </h2>
          <div className="mt-12 grid sm:grid-cols-2 gap-x-12">
            <ol>
              <li className="font-sans text-[12px] font-extrabold uppercase tracking-[0.14em] text-white/70 pb-3">Hosting an event</li>
              {[
                'A rotating QR on the projector proves every check-in happened in the room.',
                'Every check-in is an onchain event on Monad: attendance anyone can verify.',
                'Host wallets open the check-in screen from the app. No secret links.',
                'Attendees never need gas or tokens. The relayer pays.',
              ].map((line, i) => (
                <li key={line} className="flex gap-4 border-t border-white/25 py-5">
                  <span className="font-poster text-[28px] leading-none text-white/60">{i + 1}</span>
                  <p className="font-sans text-[17px] font-bold leading-snug">{line}</p>
                </li>
              ))}
            </ol>
            <ol>
              <li className="font-sans text-[12px] font-extrabold uppercase tracking-[0.14em] text-white/70 pb-3 mt-8 sm:mt-0">Sponsoring as a game</li>
              {[
                'Drop a limited skin or skill at the event, with the supply you choose.',
                'It lands in wallets of people who were really there.',
                'It works in your game and across the Socemon game hub.',
                'Every holder is a new player who already has a reason to log in.',
              ].map((line, i) => (
                <li key={line} className="flex gap-4 border-t border-white/25 py-5">
                  <span className="font-poster text-[28px] leading-none text-white/60">{i + 1}</span>
                  <p className="font-sans text-[17px] font-bold leading-snug">{line}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="flex flex-wrap gap-3 mt-12">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 h-14 px-7 rounded-2xl bg-white text-[#0D0A1A] font-sans text-[15px] font-extrabold uppercase tracking-[0.05em] shadow-[0_4px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none"
            >
              Launch app <ArrowRight className="w-5 h-5" />
            </Link>
            <a
              href={REPO}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 h-14 px-7 rounded-2xl border-2 border-white/60 font-sans text-[15px] font-extrabold uppercase tracking-[0.05em]"
            >
              Run it at your event
            </a>
          </div>
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
            <a href={REPO} target="_blank" rel="noreferrer" className="hover:text-text-primary">GitHub</a>
          </span>
        </div>
      </footer>
    </div>
  )
}

/** A full-width strip of poster type sliding forever, like the bands on an event stage. */
function Marquee({ text, reverse = false }: { text: string; reverse?: boolean }) {
  return (
    <div aria-hidden className="overflow-hidden py-3" style={{ background: 'linear-gradient(90deg, #836EF9, #5EC8FF, #FF8AD8)' }}>
      <div className="flex w-max animate-marquee" style={reverse ? { animationDirection: 'reverse' } : undefined}>
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i} className="font-poster uppercase text-[28px] leading-none text-[#0B0820] px-4 whitespace-nowrap">{text}</span>
        ))}
      </div>
    </div>
  )
}
