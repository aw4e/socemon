import { wearableById } from '@/lib/avatar'
import { STARTER_ID, speciesById, type SocemonTier } from '@/lib/socemon'

/* What a trainer's NFTs do in games. Every hub game reads the same perks, so a wearable hunted at an event (or a
   sponsor's drop) pays off everywhere. Items with no entry here are style only. */

export interface Perks {
  lives: number
  /** extra pixels of opening between pipes */
  gap: number
  /** 1 is normal speed, lower is slower and easier */
  speed: number
  /** score per pipe */
  multiplier: number
  /** what each NFT added, for the start screen */
  sources: { name: string; text: string }[]
}

type Perk = Partial<Pick<Perks, 'lives' | 'gap' | 'multiplier'>> & { slow?: number }

const WEARABLE_PERKS: Record<number, Perk> = {
  102: { multiplier: 0.5 }, // Chrome Skin
  103: { multiplier: 1 }, // Void Skin
  130: { slow: 0.05 }, // Night Blazer
  131: { slow: 0.1 }, // Neon Jacket
  190: { slow: 0.15, lives: 1 }, // Blitz Jacket (Monad Blitz event drop)
  150: { gap: 10 }, // Snap Cap
  151: { lives: 1, gap: 15 }, // Digital Hood
  160: { gap: 10 }, // Round Glasses
  161: { gap: 25 }, // Cyber Visor
  170: { multiplier: 0.5 }, // Iced Coffee
  171: { multiplier: 1 }, // Plasma Blade
  180: { lives: 1 }, // Hero Cape
  181: { lives: 2 }, // Circuit Wings
}

/** The partner pet multiplies score by its tier. Soci, everyone's starter, adds nothing. */
const PET_BONUS: Record<SocemonTier, number> = { common: 0.1, rare: 0.25, epic: 0.5, legendary: 1, event: 0.5 }

function describe(p: Perk): string {
  return [
    p.lives && `+${p.lives} ${p.lives > 1 ? 'lives' : 'life'}`,
    p.gap && `+${p.gap} gap`,
    p.slow && `${Math.round(p.slow * 100)}% slower`,
    p.multiplier && `+${p.multiplier}× score`,
  ].filter(Boolean).join(', ')
}

export function perksFor(equipped: readonly number[], partner: number): Perks {
  const perks: Perks = { lives: 1, gap: 0, speed: 1, multiplier: 1, sources: [] }
  for (const id of equipped) {
    const p = WEARABLE_PERKS[id]
    if (!p) continue
    perks.lives += p.lives ?? 0
    perks.gap += p.gap ?? 0
    perks.speed -= p.slow ?? 0
    perks.multiplier += p.multiplier ?? 0
    perks.sources.push({ name: wearableById(id)?.name ?? `#${id}`, text: describe(p) })
  }
  const pet = partner === STARTER_ID ? undefined : speciesById(partner)
  if (pet) {
    perks.multiplier += PET_BONUS[pet.tier]
    perks.sources.push({ name: `${pet.name} (pet)`, text: describe({ multiplier: PET_BONUS[pet.tier] }) })
  }
  perks.speed = Math.max(0.6, Math.round(perks.speed * 100) / 100)
  perks.multiplier = Math.round(perks.multiplier * 100) / 100
  return perks
}

export const hasPerk = (id: number) => id in WEARABLE_PERKS
export const perkText = (id: number) => (WEARABLE_PERKS[id] ? describe(WEARABLE_PERKS[id]) : '')
