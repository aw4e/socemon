import catalog from '@/contracts/socemon.json'

/* Species data lives in contracts/socemon.json so the deploy script and the app can never disagree on supply. */

export type SocemonTier = 'common' | 'rare' | 'epic' | 'legendary' | 'event'

export interface SocemonSpecies {
  id: number
  name: string
  pool: number
  tier: SocemonTier
  maxSupply: number
  transferable: boolean
}

export const POOL = { wild: 0, byte: 1, blaze: 2, prism: 3, gold: 4, echo: 5, event: 6, bonus: 7 } as const

export const STARTER_ID = 0
export const NEXMON_ID = 19

export const STARTER: SocemonSpecies = { id: STARTER_ID, name: 'Soci', pool: POOL.wild, tier: 'common', maxSupply: 0, transferable: false }
export const SPECIES = catalog as SocemonSpecies[]

/** A trainer's role is also the Egg type the other person gets when you connect (the contract's `role`, 0..5). */
export const ROLES = [
  { role: 0, type: 'Wild', label: 'Other' },
  { role: 1, type: 'Byte', label: 'Developer' },
  { role: 2, type: 'Blaze', label: 'Founder' },
  { role: 3, type: 'Prism', label: 'Designer' },
  { role: 4, type: 'Gold', label: 'Investor' },
  { role: 5, type: 'Echo', label: 'Community' },
] as const

export const TIER_COLOR: Record<SocemonTier, string> = {
  common: '#9CA3AF', rare: '#3B82F6', epic: '#A855F7', legendary: '#F59E0B', event: '#836EF9',
}

export const EXPLORER_TX = 'https://testnet.monadscan.com/tx/'

const POOL_NAMES: Record<number, string> = { [POOL.event]: 'Event', [POOL.bonus]: 'Legendary' }

export function typeName(pool: number): string {
  return ROLES.find((r) => r.role === pool)?.type ?? POOL_NAMES[pool] ?? 'Unknown'
}

export function speciesById(id: number): SocemonSpecies | undefined {
  return id === STARTER_ID ? STARTER : SPECIES.find((s) => s.id === id)
}

export const speciesInPool = (pool: number) => SPECIES.filter((s) => s.pool === pool)

export const imageFor = (id: number) => `/socemon/${id}.png`

/** How many of the five role types a trainer has caught at least one species of (Nexmon needs all five). */
export const typesCaught = (owned: Set<number>) =>
  ROLES.filter((r) => r.role !== POOL.wild && speciesInPool(r.role).some((s) => owned.has(s.id))).length

/** One color per Egg type (pool): eggs, badges and monster stages wear it. Soci wears Monad purple. */
export const TYPE_COLOR: Record<number, string> = {
  [POOL.wild]: '#84CC16',
  [POOL.byte]: '#22D3EE',
  [POOL.blaze]: '#FF8A3D',
  [POOL.prism]: '#F472B6',
  [POOL.gold]: '#FBBF24',
  [POOL.echo]: '#2DD4BF',
  [POOL.event]: '#836EF9',
  [POOL.bonus]: '#FFD166',
}

export const MONAD_PURPLE = '#836EF9'

export const colorOf = (id: number) => (id === STARTER_ID ? MONAD_PURPLE : TYPE_COLOR[speciesById(id)?.pool ?? POOL.wild])
