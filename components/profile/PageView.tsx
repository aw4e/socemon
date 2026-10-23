import { ArrowUpRight } from 'lucide-react'
import { BrandIcon } from '@/components/profile/BrandIcon'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { ROLES, TYPE_COLOR } from '@/lib/socemon'
import {
  FONT_STACKS, isSafeLinkUrl, platformMeta, resolveColors,
  type PageDesign, type ResolvedColors, type SocialLink,
} from '@/lib/profile-page'

/* A trainer's public page, drawn from their PageDesign. The onchain facts (name, type, pet, counts) come in as `trainer`,
   what they wrote (bio, skills, links) as `extras`. No hooks and no server imports, so the editor reuses it for its live preview. */

export interface PageTrainer { name: string; role: number; partner: number; friends: number; types: string; caught: string }
export interface PageExtras { bio: string; skills: string[]; links: SocialLink[] }

const BUTTON_RADIUS = { rounded: '18px', pill: '999px', square: '6px' } as const
const AVATAR_RADIUS = { circle: '50%', rounded: '28%', square: '10%' } as const

export function PageView({ trainer, extras, design, footer }: { trainer: PageTrainer; extras: PageExtras; design: PageDesign; footer?: React.ReactNode }) {
  const c = resolveColors(design)
  const center = design.align === 'center'
  const links = extras.links.filter((l) => l.isVisible && isSafeLinkUrl(l.url)).sort((a, b) => a.position - b.position)

  return (
    <div
      className="min-h-svh w-full px-5 pt-10 pb-12 flex flex-col gap-7"
      style={{ background: c.background, color: c.text, fontFamily: FONT_STACKS[design.font] }}
    >
      {design.blocks.filter((b) => b.visible).map((block) => {
        switch (block.type) {
          case 'header': {
            const color = TYPE_COLOR[trainer.role] ?? TYPE_COLOR[0]
            return (
              <header key={block.id} className={center ? 'flex flex-col items-center text-center' : 'flex flex-col items-start'}>
                <div
                  className="w-32 h-32 flex items-center justify-center"
                  style={{ borderRadius: AVATAR_RADIUS[design.avatarShape], background: `${color}33`, boxShadow: `0 0 0 1px ${c.border}` }}
                >
                  <MonsterImage key={trainer.partner} id={trainer.partner} size={112} />
                </div>
                <h1 className="text-[32px] leading-[1.1] font-black tracking-[-0.01em] mt-4 break-words max-w-full">{trainer.name}</h1>
                <span
                  className="mt-2 inline-flex items-center h-6 px-3 rounded-full text-[11px] font-extrabold uppercase tracking-[0.08em]"
                  style={{ background: color, color: '#0D0A1A' }}
                >
                  {ROLES.find((r) => r.role === trainer.role)?.type}
                </span>
              </header>
            )
          }
          case 'bio':
            return extras.bio ? (
              <p key={block.id} className={`text-[15px] leading-[1.6] whitespace-pre-line break-words ${center ? 'text-center mx-auto max-w-[320px]' : ''}`} style={{ color: c.muted }}>
                {extras.bio}
              </p>
            ) : null
          case 'text':
            return block.text ? (
              <p key={block.id} className={`text-[15px] leading-[1.6] whitespace-pre-line break-words ${center ? 'text-center mx-auto max-w-[320px]' : ''}`}>
                {block.text}
              </p>
            ) : null
          case 'stats':
            return (
              <dl key={block.id} className={`flex gap-9 ${center ? 'justify-center' : ''}`}>
                <Stat value={trainer.friends} label="Friends" colors={c} center={center} />
                <Stat value={trainer.types} label="Types" colors={c} center={center} />
                <Stat value={trainer.caught} label="Caught" colors={c} center={center} />
              </dl>
            )
          case 'skills':
            return extras.skills.length ? (
              <div key={block.id} className={`flex flex-wrap gap-2 ${center ? 'justify-center' : ''}`}>
                {extras.skills.map((s) => (
                  <span key={s} className="px-3 py-1.5 text-[12px] font-bold rounded-full" style={{ background: c.surface, border: `1px solid ${c.border}` }}>{s}</span>
                ))}
              </div>
            ) : null
          case 'links':
            return links.length ? (
              <div key={block.id} className="flex flex-col gap-2.5">
                {links.map((link) => <LinkRow key={link.id} link={link} design={design} colors={c} />)}
              </div>
            ) : null
        }
      })}
      {footer}
    </div>
  )
}

function Stat({ value, label, colors, center }: { value: number | string; label: string; colors: ResolvedColors; center: boolean }) {
  return (
    <div className={`flex flex-col-reverse ${center ? 'items-center' : ''}`}>
      <dt className="text-[11px] mt-1.5 font-extrabold uppercase tracking-[0.1em]" style={{ color: colors.muted }}>{label}</dt>
      <dd className="text-[26px] font-black tabular-nums leading-none">{value}</dd>
    </div>
  )
}

/** Brands whose colour is near black vanish on a dark page (and near white ones on a light page): use the page's own text colour. */
function tint(hex: string, dark: boolean): string {
  const n = parseInt(hex.slice(1), 16)
  const lum = (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255
  return dark ? (lum < 0.25 ? '#F5F3FF' : hex) : (lum > 0.8 ? '#1A1A1A' : hex)
}

function LinkRow({ link, design, colors }: { link: SocialLink; design: PageDesign; colors: ResolvedColors }) {
  const meta = platformMeta(link.platform)
  const base: React.CSSProperties = { borderRadius: BUTTON_RADIUS[design.buttonShape] }
  const solid = design.buttonStyle === 'solid'
  const style: React.CSSProperties = solid
    ? { ...base, background: colors.accent, color: colors.accentFg, border: '1px solid transparent' }
    : design.buttonStyle === 'outline'
      ? { ...base, background: 'transparent', border: `1.5px solid ${colors.accent}`, color: colors.text }
      : design.buttonStyle === 'glass'
        ? { ...base, background: colors.surface, border: `1px solid ${colors.border}`, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }
        : { ...base, background: colors.surface, border: `1px solid ${colors.border}` }

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3.5 px-4 py-3.5 transition-transform duration-150 active:scale-[0.98]"
      style={style}
    >
      <span
        className="w-10 h-10 flex items-center justify-center shrink-0"
        style={{
          borderRadius: design.buttonShape === 'square' ? '6px' : '12px',
          background: solid ? 'rgba(255,255,255,0.22)' : `${tint(meta.color, colors.dark)}2b`,
          color: solid ? colors.accentFg : tint(meta.color, colors.dark),
        }}
        aria-hidden
      >
        <BrandIcon platform={link.platform} className="w-5 h-5" />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-extrabold">{meta.label}</span>
        <span className="block text-[12.5px] truncate" style={{ color: solid ? colors.accentFg : colors.muted, opacity: solid ? 0.8 : 1 }}>{link.label || link.url}</span>
      </span>
      <ArrowUpRight className="w-4 h-4 shrink-0 opacity-60" strokeWidth={2} />
    </a>
  )
}
