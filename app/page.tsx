import Link from 'next/link'
import { ArrowRight, Gamepad2, Ticket, Users } from 'lucide-react'
import { HeroCarousel } from '@/components/landing/HeroCarousel'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { MONAD_PURPLE, POOL, ROLES, TIER_COLOR, TYPE_COLOR, speciesById } from '@/lib/socemon'

const REPO = 'https://github.com/riorblade/socemon'

/* The flywheel: each side brings what the other two want. */
const ECOSYSTEM = [
  {
    Icon: Users,
    color: TYPE_COLOR[POOL.echo],
    who: 'Communities',
    get: 'A full room, and attendance verified onchain.',
    give: 'Host the event and put the check-in QR on the projector.',
  },
  {
    Icon: Ticket,
    color: MONAD_PURPLE,
    who: 'Players',
    get: 'Limited NFT skins and skills that make them stronger in games.',
    give: 'Show up, meet people, check in. No gas, no tokens.',
  },
  {
    Icon: Gamepad2,
    color: TYPE_COLOR[POOL.gold],
    who: 'Game sponsors',
    get: 'New players who arrive already holding their items.',
    give: 'Sponsor the event drop: a skin or skill that works in their game.',
  },
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
    pitch: 'Race three rivals across three lanes. The fastest one is out of reach on skill alone.',
    bg: 'linear-gradient(165deg, #0E6C74 0%, #16113A 60%, #0B0820 100%)',
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
    pitch: 'Tap to fly your own avatar through the pipes, your pet trailing behind.',
    bg: 'linear-gradient(165deg, #4A3AD0 0%, #2A1F86 55%, #120D33 100%)',
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

      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow">Why it exists</p>
        <h2 className="font-poster uppercase leading-[0.92] mt-3" style={{ fontSize: 'clamp(44px, 7.5vw, 96px)' }}>
          Events bring the people.<br /><span style={{ color: MONAD_PURPLE }}>Games give them a reason.</span>
        </h2>
        <p className="font-sans text-[17px] font-semibold text-text-secondary mt-5 max-w-2xl">
          People come to an event for the NFT. They want the NFT because it makes them stronger in games. The game that
          sponsored it gets new players. One loop, and everyone in it wins.
        </p>
        <div className="grid sm:grid-cols-3 gap-3 mt-10">
          {ECOSYSTEM.map(({ Icon, color, who, get, give }) => (
            <div key={who} className="rounded-[28px] bg-bg-surface border border-(--border-default) p-6">
              <Icon className="w-8 h-8" style={{ color }} />
              <p className="font-poster uppercase text-[34px] leading-none mt-4">{who}</p>
              <p className="eyebrow mt-5">They get</p>
              <p className="font-sans text-[16px] font-bold mt-1">{get}</p>
              <p className="eyebrow mt-4">They bring</p>
              <p className="font-sans text-[15px] font-semibold text-text-secondary mt-1">{give}</p>
            </div>
          ))}
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

      <section className="grain relative overflow-hidden text-white" style={{ background: 'linear-gradient(170deg, #2A1F86 0%, #120D33 70%)' }}>
        <div aria-hidden className="absolute -right-24 top-20 w-[640px] h-40 rotate-[-16deg] rounded-full opacity-50 blur-md"
          style={{ background: 'linear-gradient(90deg, #836EF9, #5EC8FF, #FF8AD8)' }} />
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-24 grid md:grid-cols-[1fr_auto] gap-10 items-center">
          <div>
            <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.14em] text-white/70">Monad Blitz Jogja Vol. 2 · event drop</p>
            <h2 className="font-poster uppercase leading-[0.9] mt-3" style={{ fontSize: 'clamp(56px, 10vw, 140px)' }}>Blitz Jacket</h2>
            <p className="font-sans text-[18px] font-bold mt-4 max-w-lg">
              Only 200 exist, one per person, and only for people who check in at the event. Wear it and it works in every game:
            </p>
            <ul className="mt-6 space-y-3 max-w-lg">
              <li className="rounded-2xl bg-white/10 px-4 py-3 font-sans text-[15px] font-bold">⚡ <b>Blitz Rush:</b> unlocks Blitz Boost, lightning speed that smashes through barriers. The move that beats Rex.</li>
              <li className="rounded-2xl bg-white/10 px-4 py-3 font-sans text-[15px] font-bold">🪽 <b>Blitz Flap:</b> +1 life and 15% slow-mo.</li>
              <li className="rounded-2xl bg-white/10 px-4 py-3 font-sans text-[15px] font-bold">🔁 Tradeable on Monad, so it holds its value after the event.</li>
            </ul>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/api/avatar/190" alt="An avatar wearing the Blitz Jacket" className="w-full max-w-[340px] rounded-[36px] shadow-[0_0_80px_rgba(131,110,249,0.6)] mx-auto" />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24">
        <p className="eyebrow">Game hub</p>
        <h2 className="font-poster uppercase leading-[0.95] mt-3" style={{ fontSize: 'clamp(48px, 8vw, 104px)' }}>
          Your NFTs are <span style={{ color: MONAD_PURPLE }}>your strategy</span>
        </h2>
        <p className="font-sans text-[17px] font-semibold text-text-secondary mt-4 max-w-2xl">
          Every game reads what your avatar wears. Two games are live, and more come from event sponsors.
        </p>
        <div className="grid md:grid-cols-2 gap-4 mt-10">
          {GAMES.map((g) => (
            <Link key={g.name} href={g.href} className="grain relative overflow-hidden rounded-[32px] p-6 text-white block active:scale-[0.99] transition-transform" style={{ background: g.bg }}>
              <p className="font-poster uppercase text-[56px] leading-none">{g.name}</p>
              <p className="font-sans text-[15px] font-bold text-white/80 mt-3 max-w-sm">{g.pitch}</p>
              <ul className="mt-5 space-y-2">
                {g.nft.map(([item, effect]) => (
                  <li key={item} className="flex justify-between gap-3 rounded-xl bg-black/25 px-3 py-2 font-sans text-[13px] font-bold">
                    <span>{item}</span>
                    <span className="text-[#5EE6B8] text-right">{effect}</span>
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-2 mt-5 font-sans text-[14px] font-extrabold uppercase tracking-[0.06em]">Play <ArrowRight className="w-4 h-4" /></span>
            </Link>
          ))}
        </div>
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
