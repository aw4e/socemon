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
  151: { lives: 1, gap: 15 }, // Digital Crown
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


/* ---- Blitz Rush: wearables unlock moves, not just numbers ---- */

export type AbilityId = 'boost' | 'fly' | 'slash'

export interface Ability {
  id: AbilityId
  name: string
  /** what it does, for the start screen */
  text: string
  /** seconds active */
  duration: number
  /** seconds before it can be used again */
  cooldown: number
  /** the wearable that grants it */
  from: number
}

export const ABILITIES: Ability[] = [
  { id: 'boost', name: 'Blitz Boost', text: 'Lightning speed, smash through barriers', duration: 2.5, cooldown: 9, from: 190 },
  { id: 'fly', name: 'Fly', text: 'Soar over barriers', duration: 1.4, cooldown: 7, from: 181 },
  { id: 'slash', name: 'Slash', text: 'Cut the next barrier in your lane', duration: 0.25, cooldown: 4, from: 171 },
]

export interface RushKit {
  abilities: Ability[]
  /** crashes the Hero Cape shrugs off */
  shields: number
  /** extra top speed, 0.1 is +10% */
  topSpeed: number
  sources: { name: string; text: string }[]
}

const TOP_SPEED: Record<number, number> = { 131: 0.08, 130: 0.04 } // Neon Jacket, Night Blazer
const PET_SPEED: Record<SocemonTier, number> = { common: 0.02, rare: 0.04, epic: 0.06, legendary: 0.1, event: 0.06 }

export function rushKitFor(equipped: readonly number[], partner: number): RushKit {
  const worn = new Set(equipped)
  const kit: RushKit = { abilities: ABILITIES.filter((a) => worn.has(a.from)), shields: 0, topSpeed: 0, sources: [] }
  for (const a of kit.abilities) kit.sources.push({ name: wearableById(a.from)?.name ?? a.name, text: a.name })
  if (worn.has(180)) {
    kit.shields = 1
    kit.sources.push({ name: 'Hero Cape', text: 'Shield' })
  }
  for (const id of worn) {
    if (!TOP_SPEED[id]) continue
    kit.topSpeed += TOP_SPEED[id]
    kit.sources.push({ name: wearableById(id)?.name ?? `#${id}`, text: `+${TOP_SPEED[id] * 100}% top speed` })
  }
  const pet = partner === STARTER_ID ? undefined : speciesById(partner)
  if (pet) {
    kit.topSpeed += PET_SPEED[pet.tier]
    kit.sources.push({ name: `${pet.name} (pet)`, text: `+${PET_SPEED[pet.tier] * 100}% top speed` })
  }
  kit.topSpeed = Math.round(kit.topSpeed * 100) / 100
  return kit
}
