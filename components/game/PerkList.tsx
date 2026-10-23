import type { Perks } from '@/lib/game'

/* What the trainer's NFTs add to a game: the four stats, then which NFT gave what. */
export function PerkList({ perks }: { perks: Perks }) {
  return (
    <div className="w-full max-w-[280px] rounded-[20px] bg-white/8 border border-white/10 p-3 text-left my-2">
      <div className="grid grid-cols-4 text-center">
        {[
          { v: perks.lives, l: 'Lives' },
          { v: `+${perks.gap}`, l: 'Gap' },
          { v: `${Math.round(perks.speed * 100)}%`, l: 'Speed' },
          { v: `${perks.multiplier}×`, l: 'Score' },
        ].map((s) => (
          <div key={s.l}>
            <p className="font-poster text-[22px] leading-none text-white">{s.v}</p>
            <p className="font-sans text-[9px] font-extrabold uppercase tracking-[0.1em] text-white/50 mt-1">{s.l}</p>
          </div>
        ))}
      </div>
      <ul className="mt-3 space-y-1">
        {perks.sources.length ? (
          perks.sources.map((s) => (
            <li key={s.name} className="flex justify-between gap-2 font-sans text-[11px] font-bold">
              <span className="text-white truncate">{s.name}</span>
              <span className="text-[#5EE6B8] shrink-0">{s.text}</span>
            </li>
          ))
        ) : (
          <li className="font-sans text-[11px] font-bold text-white/50 text-center">No perks yet. Wear NFTs to get stronger.</li>
        )}
      </ul>
    </div>
  )
}
