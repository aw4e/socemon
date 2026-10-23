'use client'
import { useMemo } from 'react'
import Link from 'next/link'
import { Lock, Play, Sparkles } from 'lucide-react'
import { ItemGlyph } from '@/components/game/ItemGlyph'
import { PerkList } from '@/components/game/PerkList'
import { PageHeader } from '@/components/PageHeader'
import { renderAvatar } from '@/lib/avatar'
import { useTrainer, useUser, useWardrobe } from '@/lib/client'
import { ABILITIES, perksFor, rushKitFor } from '@/lib/game'

/* The Game hub: every game here reads the same NFT perks, so what you hunt at events and in blind boxes makes you
   stronger in all of them. Event sponsors can bring their own game to the hub. */
export default function GameHub() {
  const user = useUser()
  const trainer = useTrainer(user)
  const wardrobe = useWardrobe(user)
  const partner = Number(trainer.profile?.partner ?? 0n)
  const gearKey = wardrobe.equipped.join(',')
  const perks = useMemo(() => perksFor(gearKey ? gearKey.split(',').map(Number) : [], partner), [gearKey, partner])
  const kit = useMemo(() => rushKitFor(gearKey ? gearKey.split(',').map(Number) : [], partner), [gearKey, partner])
  const sprite = useMemo(() => renderAvatar(gearKey ? gearKey.split(',').map(Number) : [], undefined, true), [gearKey])

  return (
    <div>
      <PageHeader title="Game" />

      <Link
        href="/app/game/flap"
        className="grain relative block overflow-hidden rounded-[30px] p-5 text-white active:scale-[0.98] transition-transform"
        style={{ background: 'linear-gradient(165deg, #4A3AD0 0%, #2A1F86 50%, #120D33 100%)' }}
      >
        <div aria-hidden className="absolute -right-16 top-6 w-72 h-24 rotate-[-18deg] rounded-full opacity-60 blur-sm"
          style={{ background: 'linear-gradient(90deg, #836EF9, #5EC8FF, #FF8AD8)' }} />
        <div className="relative flex items-start justify-between">
          <div>
            <p className="font-sans text-[11px] font-black uppercase tracking-[0.14em] text-white/70">Featured · Tap to fly</p>
            <h2 className="font-poster text-[52px] uppercase leading-[0.9] mt-1">Blitz<br />Flap</h2>
          </div>
          {/* our own SVG built from static art, so inlining it is safe */}
          <div className="w-28 h-28 -mr-2 -mt-1 animate-float [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: sprite }} />
        </div>
        <p className="relative font-sans text-[13px] font-bold text-white/80 mt-2 max-w-[260px]">
          Fly your avatar through the pipes. Your NFTs are your strategy.
        </p>
        <div className="relative -mx-1">
          <PerkList perks={perks} />
        </div>
        <span className="relative mt-1 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-white text-[#1B1250] font-sans text-[14px] font-extrabold uppercase tracking-[0.05em] shadow-[0_4px_0_rgba(0,0,0,0.3)]">
          <Play className="w-4 h-4 fill-current" /> Play
        </span>
      </Link>

      <Link
        href="/app/game/rush"
        className="grain relative block overflow-hidden rounded-[30px] p-5 mt-4 text-white active:scale-[0.98] transition-transform"
        style={{ background: 'linear-gradient(165deg, #0E6C74 0%, #16113A 55%, #0B0820 100%)' }}
      >
        <p className="relative font-sans text-[11px] font-black uppercase tracking-[0.14em] text-white/70">Race · NFTs unlock moves</p>
        <h2 className="relative font-poster text-[52px] uppercase leading-[0.9] mt-1">Blitz<br />Rush</h2>
        <p className="relative font-sans text-[13px] font-bold text-white/80 mt-2 max-w-[280px]">
          Beat three rivals to the line. Rex is too fast to catch on skill alone.
        </p>
        <div className="relative flex flex-wrap gap-2 mt-3">
          {ABILITIES.map((a) => {
            const on = kit.abilities.includes(a)
            return (
              <span key={a.id} className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-full font-sans text-[12px] font-black ${on ? 'bg-white text-[#0B0820]' : 'bg-white/10 text-white/50'}`}>
                {on ? <ItemGlyph id={a.from} className="h-5 w-auto" /> : <Lock className="w-3.5 h-3.5" />} {a.name}
              </span>
            )
          })}
          {kit.shields > 0 && <span className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white text-[#0B0820] font-sans text-[12px] font-black"><ItemGlyph id={180} className="h-5 w-auto" /> Shield</span>}
        </div>
        <span className="relative mt-4 inline-flex items-center gap-2 h-12 px-6 rounded-2xl bg-white text-[#0B0820] font-sans text-[14px] font-extrabold uppercase tracking-[0.05em] shadow-[0_4px_0_rgba(0,0,0,0.3)]">
          <Play className="w-4 h-4 fill-current" /> Race
        </span>
      </Link>

      <section className="mt-6 rounded-[24px] border-2 border-dashed border-(--border-default) p-5 text-center">
        <Sparkles className="w-7 h-7 text-primary mx-auto" />
        <p className="font-sans text-[16px] font-black mt-2">More games from event sponsors</p>
        <p className="font-sans text-[13px] font-bold text-text-tertiary mt-1 max-w-xs mx-auto">
          Web3 games that sponsor an event drop their own skins and skills there. They work in the sponsor&apos;s game and here.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="eyebrow mb-3">How to get stronger</h2>
        <ul className="space-y-2">
          {[
            { href: '/app/qr', title: 'Meet people', body: 'Every new connection gives you a blind box with a wearable.' },
            { href: '/app/event', title: 'Check in at events', body: 'Event drops like the Blitz Jacket carry rare perks.' },
            { href: '/app/wardrobe', title: 'Gear up', body: 'Wear what you own. Only worn wearables count in games.' },
            { href: '/app/me#pet', title: 'Pick your pet', body: 'Rarer pets multiply your score.' },
          ].map((s) => (
            <li key={s.title}>
              <Link href={s.href} className="block rounded-[18px] bg-bg-surface border border-(--border-default) px-4 py-3">
                <p className="font-sans text-[15px] font-black">{s.title}</p>
                <p className="font-sans text-[12px] font-bold text-text-tertiary">{s.body}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
