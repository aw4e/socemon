/* A trainer's public page: the extras they write (bio, skills, links) and how the page looks (theme, fonts, layout).
   Shared by the editor, the public page and the save API, so what you preview is what gets stored. Modelled on Cardtena's
   page designer; the data lives in Firestore `socemonProfiles/{address}`, the name, type and monster stay onchain. */

export type Platform =
  | 'twitter' | 'instagram' | 'linkedin' | 'tiktok' | 'github' | 'youtube' | 'facebook'
  | 'telegram' | 'whatsapp' | 'discord' | 'website' | 'email' | 'custom'

export interface SocialLink { id: string; platform: Platform; label: string; url: string; isVisible: boolean; position: number }

export type PageThemeId = 'socemon' | 'midnight' | 'paper' | 'aurora' | 'sunset' | 'forest' | 'mono' | 'ocean' | 'rose' | 'custom'
export type PageFont = 'sans' | 'serif' | 'mono' | 'display'
export type PageButtonStyle = 'soft' | 'outline' | 'solid' | 'glass'
export type PageButtonShape = 'rounded' | 'pill' | 'square'
export type PageAvatarShape = 'circle' | 'rounded' | 'square'
export type PageAlign = 'center' | 'left'
export type PageBlockType = 'header' | 'bio' | 'stats' | 'skills' | 'links' | 'text'

export interface PageBlock { id: string; type: PageBlockType; visible: boolean; text?: string }
export interface PageDesign {
  theme: PageThemeId
  accent?: string
  bgFrom?: string
  bgTo?: string
  font: PageFont
  buttonStyle: PageButtonStyle
  buttonShape: PageButtonShape
  avatarShape: PageAvatarShape
  align: PageAlign
  blocks: PageBlock[]
}

/** What GET /api/profile returns: only the parts that are stored, never the onchain facts. */
export interface ProfileExtras { bio: string; skills: string[]; links: SocialLink[]; design: PageDesign }

export const PLATFORMS: { value: Platform; label: string; glyph: string; color: string; placeholder: string }[] = [
  { value: 'twitter', label: 'X / Twitter', glyph: 'X', color: '#8899A6', placeholder: 'yourname' },
  { value: 'instagram', label: 'Instagram', glyph: 'IG', color: '#E1306C', placeholder: 'yourname' },
  { value: 'linkedin', label: 'LinkedIn', glyph: 'in', color: '#0A66C2', placeholder: 'yourname' },
  { value: 'github', label: 'GitHub', glyph: 'GH', color: '#8B949E', placeholder: 'yourname' },
  { value: 'telegram', label: 'Telegram', glyph: 'TG', color: '#27A7E7', placeholder: 'yourname' },
  { value: 'discord', label: 'Discord', glyph: 'DC', color: '#5865F2', placeholder: 'invite-code' },
  { value: 'whatsapp', label: 'WhatsApp', glyph: 'WA', color: '#25D366', placeholder: '628123456789' },
  { value: 'youtube', label: 'YouTube', glyph: 'YT', color: '#FF0000', placeholder: 'yourchannel' },
  { value: 'tiktok', label: 'TikTok', glyph: 'TT', color: '#FF0050', placeholder: 'yourname' },
  { value: 'facebook', label: 'Facebook', glyph: 'FB', color: '#1877F2', placeholder: 'yourname' },
  { value: 'website', label: 'Website', glyph: 'WW', color: '#836EF9', placeholder: 'yoursite' },
  { value: 'email', label: 'Email', glyph: '@', color: '#059669', placeholder: 'you@mail.com' },
  { value: 'custom', label: 'Other link', glyph: '↗', color: '#B8B2D6', placeholder: 'site.com/page' },
]
const PLATFORM_IDS = PLATFORMS.map((p) => p.value)
export const platformMeta = (p: Platform) => PLATFORMS.find((x) => x.value === p) ?? PLATFORMS[PLATFORMS.length - 1]

export const MAX_LINKS = 20
export const MAX_BIO_LEN = 280
const MAX_LABEL_LEN = 100
const MAX_URL_LEN = 2048
export const MAX_BLOCKS = 12
export const MAX_TEXT_LEN = 280
const HEX = /^#[0-9a-f]{6}$/i
const ALLOWED_LINK_SCHEMES = ['http:', 'https:', 'mailto:', 'tel:']

/** True if `url` uses a scheme that is safe as an `href` (blocks javascript:, data:, and the like). */
export function isSafeLinkUrl(url: string): boolean {
  try {
    return ALLOWED_LINK_SCHEMES.includes(new URL(url).protocol)
  } catch {
    return false
  }
}

/** Where a bare username goes for each platform. */
const BASES: Partial<Record<Platform, string>> = {
  twitter: 'https://x.com/', instagram: 'https://instagram.com/', linkedin: 'https://linkedin.com/in/', github: 'https://github.com/',
  telegram: 'https://t.me/', tiktok: 'https://tiktok.com/@', youtube: 'https://youtube.com/@', facebook: 'https://facebook.com/',
  discord: 'https://discord.gg/',
}

/** Turns what the person typed into a full address, so they can write just a name: "aw4e" on GitHub becomes
    https://github.com/aw4e, "mysite" on Website becomes https://mysite.com, and "me@mail.com" on Email a mailto: link.
    Anything that already has a scheme or looks like a domain is kept. Empty stays empty. */
export function expandLink(platform: Platform, raw: string): string {
  const v = raw.trim()
  if (!v) return ''
  if (/^[a-z][a-z0-9+.-]*:/i.test(v)) return v
  if (platform === 'email') return `mailto:${v}`
  if (/^(www\.)?[a-z0-9-]+(\.[a-z0-9-]+)+([/?#].*)?$/i.test(v)) return `https://${v}`
  if (platform === 'whatsapp') {
    const digits = v.replace(/[^0-9]/g, '')
    return digits ? `https://wa.me/${digits}` : ''
  }
  const base = BASES[platform]
  const handle = v.replace(/^@/, '').replace(/\s+/g, '')
  if (base) return handle ? base + handle : ''
  return /^[a-z0-9-]+$/i.test(handle) ? `https://${handle}.com` : `https://${handle}`
}

/** Checks the links the browser sends. Null when anything is off. */
export function sanitizeLinks(raw: unknown): SocialLink[] | null {
  if (!Array.isArray(raw) || raw.length > MAX_LINKS) return null
  const out: SocialLink[] = []
  const seen = new Set<string>()
  for (const item of raw) {
    if (!item || typeof item !== 'object') return null
    const l = item as Record<string, unknown>
    if (typeof l.id !== 'string' || !/^[A-Za-z0-9_-]{1,64}$/.test(l.id) || seen.has(l.id)) return null
    if (typeof l.platform !== 'string' || !PLATFORM_IDS.includes(l.platform as Platform)) return null
    if (typeof l.label !== 'string' || l.label.length > MAX_LABEL_LEN) return null
    if (typeof l.url !== 'string' || l.url.length > MAX_URL_LEN || !isSafeLinkUrl(l.url)) return null
    if (typeof l.isVisible !== 'boolean') return null
    seen.add(l.id)
    out.push({ id: l.id, platform: l.platform as Platform, label: l.label.trim(), url: l.url, isVisible: l.isVisible, position: out.length })
  }
  return out
}

interface ThemeDef { label: string; from: string; to: string; angle: number; text: string; muted: string; accent: string; dark: boolean }

export const THEMES: Record<Exclude<PageThemeId, 'custom'>, ThemeDef> = {
  socemon:  { label: 'Socemon',  from: '#0D0A1A', to: '#241A4F', angle: 175, text: '#F5F3FF', muted: '#B8B2D6', accent: '#836EF9', dark: true },
  midnight: { label: 'Midnight', from: '#0B0C14', to: '#171826', angle: 180, text: '#F4F4F5', muted: '#A1A1AA', accent: '#8A75FF', dark: true },
  paper:    { label: 'Paper',    from: '#FAFAF8', to: '#EFECE6', angle: 180, text: '#1A1A1A', muted: '#6B7280', accent: '#5B3FE0', dark: false },
  aurora:   { label: 'Aurora',   from: '#08121F', to: '#1B1245', angle: 160, text: '#F1F5FF', muted: '#9BA8C7', accent: '#5EEAD4', dark: true },
  sunset:   { label: 'Sunset',   from: '#1F1020', to: '#6B2D3A', angle: 165, text: '#FFF4EC', muted: '#D9B5A8', accent: '#FFB067', dark: true },
  forest:   { label: 'Forest',   from: '#0A1712', to: '#16382B', angle: 170, text: '#EDFBF3', muted: '#9CC4B0', accent: '#6EE7A8', dark: true },
  mono:     { label: 'Mono',     from: '#000000', to: '#0C0C0C', angle: 180, text: '#FFFFFF', muted: '#8C8C8C', accent: '#FFFFFF', dark: true },
  ocean:    { label: 'Ocean',    from: '#EAF4FF', to: '#CDE3FF', angle: 170, text: '#0B1B33', muted: '#4A6285', accent: '#1D6FEA', dark: false },
  rose:     { label: 'Rose',     from: '#FFF3F4', to: '#FFDDE4', angle: 170, text: '#3B0A17', muted: '#8A5563', accent: '#E11D48', dark: false },
}

export const FONT_STACKS: Record<PageFont, string> = {
  sans: 'var(--font-sans)',
  serif: 'Georgia, "Times New Roman", serif',
  mono: 'var(--font-mono)',
  display: 'var(--font-poster), Impact, sans-serif',
}

export const BLOCK_LABELS: Record<PageBlockType, string> = {
  header: 'Monster & name', bio: 'Bio', stats: 'Friends & Socédex', skills: 'Skills', links: 'Links', text: 'Text note',
}

export const DEFAULT_DESIGN: PageDesign = {
  theme: 'socemon', font: 'sans', buttonStyle: 'soft', buttonShape: 'rounded', avatarShape: 'rounded', align: 'center',
  blocks: [
    { id: 'header', type: 'header', visible: true },
    { id: 'bio', type: 'bio', visible: true },
    { id: 'stats', type: 'stats', visible: true },
    { id: 'links', type: 'links', visible: true },
    { id: 'skills', type: 'skills', visible: true },
  ],
}

const BLOCK_TYPES: readonly PageBlockType[] = ['header', 'bio', 'stats', 'skills', 'links', 'text']

function pick<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T | null {
  if (value === undefined) return fallback
  return typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : null
}

/** Checks an untrusted design (the API body) and returns a safe, complete one. Null when anything is off. */
export function sanitizePageDesign(input: unknown): PageDesign | null {
  if (!input || typeof input !== 'object') return null
  const d = input as Record<string, unknown>
  const theme = pick<PageThemeId>(d.theme, [...(Object.keys(THEMES) as PageThemeId[]), 'custom'], DEFAULT_DESIGN.theme)
  const font = pick<PageFont>(d.font, ['sans', 'serif', 'mono', 'display'], DEFAULT_DESIGN.font)
  const buttonStyle = pick<PageButtonStyle>(d.buttonStyle, ['soft', 'outline', 'solid', 'glass'], DEFAULT_DESIGN.buttonStyle)
  const buttonShape = pick<PageButtonShape>(d.buttonShape, ['rounded', 'pill', 'square'], DEFAULT_DESIGN.buttonShape)
  const avatarShape = pick<PageAvatarShape>(d.avatarShape, ['circle', 'rounded', 'square'], DEFAULT_DESIGN.avatarShape)
  const align = pick<PageAlign>(d.align, ['center', 'left'], DEFAULT_DESIGN.align)
  if (!theme || !font || !buttonStyle || !buttonShape || !avatarShape || !align) return null

  const out: PageDesign = { theme, font, buttonStyle, buttonShape, avatarShape, align, blocks: [] }
  for (const key of ['accent', 'bgFrom', 'bgTo'] as const) {
    const v = d[key]
    if (v === undefined || v === null || v === '') continue
    if (typeof v !== 'string' || !HEX.test(v)) return null
    out[key] = v.toLowerCase()
  }

  if (d.blocks === undefined) {
    out.blocks = DEFAULT_DESIGN.blocks.map((b) => ({ ...b }))
    return out
  }
  if (!Array.isArray(d.blocks) || d.blocks.length > MAX_BLOCKS) return null
  const ids = new Set<string>()
  const types = new Set<PageBlockType>()
  for (const raw of d.blocks) {
    if (!raw || typeof raw !== 'object') return null
    const b = raw as Record<string, unknown>
    if (typeof b.id !== 'string' || !/^[a-z0-9_-]{1,24}$/i.test(b.id) || ids.has(b.id)) return null
    if (typeof b.type !== 'string' || !BLOCK_TYPES.includes(b.type as PageBlockType)) return null
    if (typeof b.visible !== 'boolean') return null
    const type = b.type as PageBlockType
    if (type !== 'text' && types.has(type)) return null
    ids.add(b.id)
    types.add(type)
    const block: PageBlock = { id: b.id, type, visible: b.visible }
    if (type === 'text') {
      if (typeof b.text !== 'string' || b.text.length > MAX_TEXT_LEN) return null
      block.text = b.text
    }
    out.blocks.push(block)
  }
  return out
}

/** Always a complete design; a profile that never customised anything gets the defaults. */
export const resolveDesign = (stored?: unknown): PageDesign => sanitizePageDesign(stored ?? {}) ?? DEFAULT_DESIGN

function luminance(hex: string): number {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

export interface ResolvedColors {
  background: string; text: string; muted: string; accent: string; accentFg: string; surface: string; border: string; dark: boolean
}

export function resolveColors(design: PageDesign): ResolvedColors {
  let base: ThemeDef
  if (design.theme === 'custom') {
    const from = design.bgFrom ?? '#0b0c14'
    const to = design.bgTo ?? from
    const dark = luminance(from) < 0.4
    base = dark
      ? { label: 'Custom', from, to, angle: 170, text: '#F4F4F5', muted: '#B0B0B8', accent: '#8A75FF', dark }
      : { label: 'Custom', from, to, angle: 170, text: '#1A1A1A', muted: '#5F6670', accent: '#5B3FE0', dark }
  } else {
    base = THEMES[design.theme]
  }
  const accent = design.accent ?? base.accent
  return {
    background: `linear-gradient(${base.angle}deg, ${base.from} 0%, ${base.to} 100%)`,
    text: base.text,
    muted: base.muted,
    accent,
    accentFg: luminance(accent) > 0.45 ? '#0C0C0E' : '#FFFFFF',
    surface: base.dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)',
    border: base.dark ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.10)',
    dark: base.dark,
  }
}
