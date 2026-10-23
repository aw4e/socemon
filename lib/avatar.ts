import catalog from '@/contracts/wearables.json'
import type { SocemonTier } from '@/lib/socemon'

/*
  Avatar = one fixed 400x400 rig + wearable layers drawn on the same coordinates, so every item fits every avatar.
  Rig landmarks (keep new art on these): head 145..255 x 55..155, eyes (180,108) (220,108), torso 158..242 x 160..255,
  arms 134..158 / 242..266 x 166..244, hands (146,250) (254,250), legs 164..236 x 250..328, feet y 318..336.
  Draw order back to front: back, body, bottom, top, outer, hand item, hands, face, hair, head, eyewear, pet.
*/

export const SLOT_NAMES = ['Skin', 'Bottom', 'Top', 'Outer', 'Hair', 'Head', 'Eyewear', 'Hand', 'Back'] as const
export const SLOT = { skin: 0, bottom: 1, top: 2, outer: 3, hair: 4, head: 5, eyewear: 6, hand: 7, back: 8 } as const

export interface Wearable {
  id: number
  name: string
  slot: number
  tier: SocemonTier
  maxSupply: number
  /** Event drop from check-in instead of a blind box. */
  drop?: boolean
}

export const WEARABLES = catalog as Wearable[]
export const wearableById = (id: number) => WEARABLES.find((w) => w.id === id)

const O = '#15131F' // outline
const line = `stroke="${O}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"`
const TEAL = '#2DE2E6'

interface Skin { fill: string; shade: string; eye: string; extra?: string }

const DEFAULT_SKIN: Skin = { fill: '#F1C7A1', shade: '#DDA982', eye: '#1B1A2A' }

const SKINS: Record<number, Skin> = {
  100: { fill: '#D9A066', shade: '#BE8650', eye: '#1B1A2A' },
  101: { fill: '#7A4A2E', shade: '#623A23', eye: '#140F12' },
  102: { fill: 'url(#chrome)', shade: '#8C93A3', eye: '#0E1520' },
  103: {
    fill: '#1F2233', shade: '#151826', eye: TEAL,
    extra: `<g stroke="${TEAL}" stroke-width="2" fill="none" filter="url(#glow)" opacity=".85">
      <path d="M152 120 h10 l6 8 M248 120 h-10 l-6 8 M200 60 v14 l-8 8"/>
      <path d="M176 216 h16 l8 -8 h12 M168 232 h20"/></g>`,
  },
}

/** Layer art keyed by wearable id. Skins (slot 0) live in SKINS instead. */
const ART: Record<number, string> = {
  // ---- bottom ----
  110: `<path d="M160 242 H240 V326 H203 V266 H197 V326 H160 Z" fill="#3B5B8C" ${line}/>
    <path d="M178 250 v70 M222 250 v70" stroke="#5B7DB0" stroke-width="2" fill="none"/>
    <rect x="160" y="242" width="80" height="9" fill="#2A3F63" ${line}/>`,
  111: `<path d="M160 242 H240 V326 H203 V266 H197 V326 H160 Z" fill="#6B7046" ${line}/>
    <rect x="163" y="276" width="17" height="20" rx="3" fill="#585C38" ${line}/>
    <rect x="220" y="276" width="17" height="20" rx="3" fill="#585C38" ${line}/>
    <rect x="160" y="242" width="80" height="9" fill="#3E4128" ${line}/>`,

  // ---- top ----
  120: `<rect x="132" y="164" width="28" height="36" rx="11" fill="#836EF9" ${line}/>
    <rect x="240" y="164" width="28" height="36" rx="11" fill="#836EF9" ${line}/>
    <path d="M158 160 H242 V254 H158 Z" fill="#836EF9" ${line}/>
    <path d="M186 160 Q200 172 214 160" fill="#6B57E0" ${line}/>
    <rect x="188" y="194" width="24" height="24" rx="8" transform="rotate(45 200 206)" fill="none" stroke="#FFF" stroke-width="4"/>`,
  121: `<rect x="132" y="164" width="28" height="80" rx="12" fill="#F4F4F8" ${line}/>
    <rect x="240" y="164" width="28" height="80" rx="12" fill="#F4F4F8" ${line}/>
    <path d="M158 160 H242 V254 H158 Z" fill="#F4F4F8" ${line}/>
    <path d="M184 160 L200 176 L216 160 L214 172 L200 182 L186 172 Z" fill="#FFF" ${line}/>
    <path d="M196 178 L204 178 L208 232 L200 242 L192 232 Z" fill="#E23D4B" ${line}/>`,

  // ---- outer ----
  130: `<rect x="130" y="162" width="30" height="84" rx="12" fill="#22253A" ${line}/>
    <rect x="240" y="162" width="30" height="84" rx="12" fill="#22253A" ${line}/>
    <path d="M156 160 H190 L200 212 L195 256 H156 Z" fill="#22253A" ${line}/>
    <path d="M244 160 H210 L200 212 L205 256 H244 Z" fill="#22253A" ${line}/>
    <path d="M190 160 L178 186 L196 196 Z M210 160 L222 186 L204 196 Z" fill="#171927" ${line}/>
    <circle cx="206" cy="230" r="3.5" fill="#C9A14A"/><rect x="164" y="214" width="18" height="4" rx="2" fill="#C9A14A"/>`,
  131: `<rect x="130" y="162" width="30" height="84" rx="12" fill="#15171F" ${line}/>
    <rect x="240" y="162" width="30" height="84" rx="12" fill="#15171F" ${line}/>
    <path d="M156 160 H244 V256 H156 Z" fill="#15171F" ${line}/>
    <path d="M176 152 H224 L218 170 H182 Z" fill="#15171F" ${line}/>
    <g stroke="${TEAL}" stroke-width="2.5" fill="none" filter="url(#glow)">
      <path d="M200 170 V254 M166 176 L184 196 V246 M234 176 L216 196 V246 M136 214 H154 M246 214 H264 M182 162 H218"/></g>`,

  // Monad Blitz Jogja Vol. 2 event drop: the poster's deep purple, its iridescent swoosh and the BLITZ lightning bolt.
  190: `<rect x="130" y="162" width="30" height="84" rx="12" fill="url(#blitz)" ${line}/>
    <rect x="240" y="162" width="30" height="84" rx="12" fill="url(#blitz)" ${line}/>
    <path d="M138 170 V238 M262 170 V238" stroke="url(#iris)" stroke-width="5" stroke-linecap="round"/>
    <path d="M156 160 H244 V256 H156 Z" fill="url(#blitz)" ${line}/>
    <path d="M157 200 C186 206 214 232 243 236 V252 C212 248 184 222 157 216 Z" fill="url(#iris)"/>
    <path d="M176 152 H224 L218 170 H182 Z" fill="#120D33" ${line}/>
    <path d="M211 172 L190 210 H203 L193 240 L218 198 H205 Z" fill="#FFF" stroke="#120D33" stroke-width="2" stroke-linejoin="round"/>
    <rect x="167" y="176" width="13" height="13" rx="4" transform="rotate(45 173.5 182.5)" fill="none" stroke="#FFF" stroke-width="2.5"/>
    <text x="224" y="186" font-family="Arial Black, Arial, sans-serif" font-size="9" font-weight="900" fill="#FFF">VOL.2</text>
    <path d="M156 160 H244 V256 H156 Z" fill="none" ${line}/>`,

  // ---- hair ----
  140: `<path d="M140 98 L136 62 L154 70 L158 40 L178 58 L194 30 L208 56 L228 34 L236 62 L260 50 L262 98 C250 82 230 74 200 74 C170 74 152 82 140 98 Z" fill="#4A3426" ${line}/>`,
  141: `<path d="M136 146 C128 82 150 44 200 44 C250 44 272 82 264 146 L248 146 C250 114 242 90 226 80 C210 92 178 94 160 82 C152 98 150 122 152 146 Z" fill="#1E1B2E" ${line}/>
    <path d="M170 56 C186 50 214 50 230 56" stroke="#3A3552" stroke-width="3" fill="none"/>`,
  142: `<path d="M150 82 C158 62 176 56 200 56 C224 56 242 62 250 82 C236 74 220 72 200 72 C180 72 164 74 150 82 Z" fill="#000" opacity=".18"/>
    <path d="M186 72 L180 24 L194 38 L200 12 L207 38 L220 22 L214 72 Z" fill="url(#mohawk)" ${line}/>`,

  // ---- head ----
  150: `<path d="M142 92 C142 52 168 40 200 40 C232 40 258 52 258 92 Z" fill="#E23D4B" ${line}/>
    <path d="M140 90 H260 C264 90 266 100 258 102 H142 C134 100 136 90 140 90 Z" fill="#B82B38" ${line}/>
    <circle cx="200" cy="66" r="9" fill="#FFF" ${line}/><circle cx="200" cy="40" r="4" fill="#B82B38" ${line}/>`,
  151: `<path d="M118 178 C108 108 128 28 200 28 C272 28 292 108 282 178 C266 170 254 166 242 162 C258 140 262 108 255 88 C246 62 226 50 200 50 C174 50 154 62 145 88 C138 108 142 140 158 162 C146 166 134 170 118 178 Z" fill="#11131B" ${line}/>
    <path d="M145 88 C154 62 174 50 200 50 C226 50 246 62 255 88 C246 80 226 76 200 76 C174 76 154 80 145 88 Z" fill="#000" opacity=".55"/>
    <path d="M158 162 C142 140 138 108 145 88 C154 62 174 50 200 50 C226 50 246 62 255 88 C262 108 258 140 242 162" stroke="${TEAL}" stroke-width="2.5" fill="none" filter="url(#glow)"/>
    <path d="M192 36 L200 44 L208 36 M200 44 V52" stroke="${TEAL}" stroke-width="2" fill="none" filter="url(#glow)"/>`,

  // ---- eyewear ----
  160: `<g fill="#FFF" fill-opacity=".18" stroke="#2A2A2A" stroke-width="3.5">
      <circle cx="180" cy="108" r="14"/><circle cx="220" cy="108" r="14"/></g>
    <path d="M194 106 Q200 101 206 106 M166 106 H146 M234 106 H254" stroke="#2A2A2A" stroke-width="3" fill="none"/>`,
  161: `<rect x="146" y="95" width="108" height="26" rx="13" fill="url(#visor)" ${line} filter="url(#glow)"/>
    <path d="M160 102 H226" stroke="#FFF" stroke-width="3" stroke-linecap="round" opacity=".7"/>`,

  // ---- hand (drawn under the hands so the grip reads) ----
  170: `<path d="M241 218 H267 L263 270 H245 Z" fill="#E8D9BE" fill-opacity=".9" ${line}/>
    <path d="M243 236 H265 L263 268 H245 Z" fill="#8A5A3B"/>
    <rect x="238" y="212" width="32" height="8" rx="3" fill="#F7F7F7" ${line}/>
    <path d="M256 212 L262 192" stroke="#2DBE6C" stroke-width="5" stroke-linecap="round"/>`,
  171: `<rect x="248" y="112" width="12" height="130" rx="6" fill="${TEAL}" filter="url(#glow)"/>
    <rect x="251.5" y="118" width="5" height="120" rx="2.5" fill="#E9FFFF"/>
    <rect x="240" y="238" width="28" height="7" rx="3" fill="#3A3F4E" ${line}/>
    <rect x="249" y="244" width="10" height="26" rx="3" fill="#2A2E3A" ${line}/>`,

  // ---- back ----
  180: `<path d="M160 166 H240 L288 348 C250 360 150 360 112 348 Z" fill="#C8243A" ${line}/>
    <path d="M150 230 L128 340 M250 230 L272 340" stroke="#9E1A2C" stroke-width="3" fill="none"/>`,
  181: `<g id="wing"><path d="M172 190 C130 120 66 106 34 128 C64 146 74 166 70 188 C92 184 102 200 96 222 C122 212 148 216 170 234 Z" fill="#1A1D2B" ${line}/>
      <path d="M160 196 C130 158 96 140 58 134 M150 210 C126 186 104 176 84 176 M156 222 C140 210 120 204 104 206" stroke="${TEAL}" stroke-width="2.5" fill="none" filter="url(#glow)"/></g>
    <use href="#wing" transform="translate(400 0) scale(-1 1)"/>`,
}

const HIDES_HAIR_SLOT = SLOT.head // every hat or hood covers the hair under it

const DEFS = `<defs>
  <radialGradient id="bg" cx="50%" cy="42%" r="70%"><stop offset="0" stop-color="#14323A"/><stop offset="1" stop-color="#070A10"/></radialGradient>
  <linearGradient id="chrome" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F7FB"/><stop offset=".5" stop-color="#A9B1C1"/><stop offset="1" stop-color="#E2E7EF"/></linearGradient>
  <linearGradient id="mohawk" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#836EF9"/><stop offset="1" stop-color="#FF3DA5"/></linearGradient>
  <linearGradient id="visor" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0E6C74"/><stop offset=".5" stop-color="${TEAL}"/><stop offset="1" stop-color="#0E6C74"/></linearGradient>
  <linearGradient id="blitz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4A3AD0"/><stop offset=".55" stop-color="#2A1F86"/><stop offset="1" stop-color="#120D33"/></linearGradient>
  <linearGradient id="iris" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#836EF9"/><stop offset=".5" stop-color="#5EC8FF"/><stop offset="1" stop-color="#FF8AD8"/></linearGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>`

function body(s: Skin) {
  const skin = `fill="${s.fill}" ${line}`
  return `<rect x="164" y="250" width="34" height="78" rx="10" ${skin}/>
  <rect x="202" y="250" width="34" height="78" rx="10" ${skin}/>
  <path d="M162 242 H238 V266 H202 V258 H198 V266 H162 Z" fill="#5A5F73" ${line}/>
  <rect x="156" y="318" width="44" height="18" rx="9" fill="#2B2E3B" ${line}/>
  <rect x="200" y="318" width="44" height="18" rx="9" fill="#2B2E3B" ${line}/>
  <rect x="134" y="166" width="24" height="78" rx="12" ${skin}/>
  <rect x="242" y="166" width="24" height="78" rx="12" ${skin}/>
  <rect x="158" y="160" width="84" height="95" rx="16" ${skin}/>
  <rect x="188" y="148" width="24" height="16" fill="${s.shade}"/>
  <rect x="145" y="55" width="110" height="100" rx="30" ${skin}/>`
}

const hands = (s: Skin) =>
  `<circle cx="146" cy="250" r="12" fill="${s.fill}" ${line}/><circle cx="254" cy="250" r="12" fill="${s.fill}" ${line}/>`

const face = (s: Skin) => `<g fill="${s.eye}">
  <ellipse cx="180" cy="108" rx="7" ry="9"/><ellipse cx="220" cy="108" rx="7" ry="9"/></g>
  <circle cx="182.5" cy="104.5" r="2.5" fill="#FFF"/><circle cx="222.5" cy="104.5" r="2.5" fill="#FFF"/>
  <circle cx="166" cy="126" r="6" fill="#FF7A8A" opacity=".35"/><circle cx="234" cy="126" r="6" fill="#FF7A8A" opacity=".35"/>
  <path d="M190 129 Q200 137 210 129" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>${s.extra ?? ''}`

/**
 * `equipped` is equippedOf(user): one wearable id per slot, 0 for empty. `pet` is an image href (data URI for NFT
 * images, since marketplaces don't load external images inside an SVG). `bare` drops the backdrop and floor shadow, for
 * game sprites.
 */
export function renderAvatar(equipped: readonly (number | bigint)[], pet?: string, bare = false): string {
  const at = (slot: number) => Number(equipped[slot] ?? 0)
  const layer = (slot: number) => ART[at(slot)] ?? ''
  const skin = SKINS[at(SLOT.skin)] ?? DEFAULT_SKIN
  const hair = at(HIDES_HAIR_SLOT) ? '' : layer(SLOT.hair)

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">${DEFS}
  ${bare ? '' : '<rect width="400" height="400" fill="url(#bg)"/><ellipse cx="200" cy="340" rx="96" ry="14" fill="#000" opacity=".45"/>'}
  ${layer(SLOT.back)}${body(skin)}${layer(SLOT.bottom)}${layer(SLOT.top)}${layer(SLOT.outer)}
  ${layer(SLOT.hand)}${hands(skin)}${face(skin)}${hair}${layer(SLOT.head)}${layer(SLOT.eyewear)}
  ${pet ? `<ellipse cx="326" cy="364" rx="40" ry="8" fill="#000" opacity=".45"/><image href="${pet}" x="272" y="258" width="108" height="108"/>` : ''}
</svg>`
}

/** A bare avatar wearing just one wearable: that wearable's own NFT image. */
export function renderWearable(id: number): string | null {
  const w = wearableById(id)
  if (!w) return null
  const equipped = Array(SLOT_NAMES.length).fill(0)
  equipped[w.slot] = id
  return renderAvatar(equipped)
}

/** Where each slot's art sits on the rig, so an item can be drawn on its own (minX minY width height). */
const SLOT_VIEW = ['132 48 136 112', '150 236 100 100', '124 150 152 112', '124 146 152 116', '128 8 144 96', '112 22 176 92', '138 86 124 44', '228 104 54 176', '24 112 352 248']

/** Just the wearable, no body: a transparent glyph of the item itself, for lists and loadouts. Skins show the face. */
export function renderItem(id: number): string | null {
  const w = wearableById(id)
  if (!w) return null
  const art = w.slot === SLOT.skin ? `<rect x="145" y="55" width="110" height="100" rx="30" fill="${SKINS[id].fill}" ${line}/>${face(SKINS[id])}` : ART[id]
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${SLOT_VIEW[w.slot]}">${DEFS}${art}</svg>`
}
