'use client'
import { useEffect, useId, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowDown, ArrowUp, ChevronLeft, Eye, EyeOff, Link2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { BrandIcon } from '@/components/profile/BrandIcon'
import { PageView } from '@/components/profile/PageView'
import { ErrorText, Field, FormSection, Notice, Segmented, inputCls, invalidCls, textareaCls } from '@/components/explore/controls'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { request, useTrainer, useUser } from '@/lib/client'
import { MAX_SKILLS, sanitizeSkills } from '@/lib/explore'
import {
  BLOCK_LABELS, DEFAULT_DESIGN, MAX_BIO_LEN, MAX_BLOCKS, MAX_LINKS, MAX_TEXT_LEN, PLATFORMS, THEMES,
  expandLink, isSafeLinkUrl, platformMeta, resolveColors, sanitizeLinks,
  type PageAlign, type PageAvatarShape, type PageButtonShape, type PageButtonStyle, type PageDesign, type PageFont,
  type PageThemeId, type Platform, type ProfileExtras, type SocialLink,
} from '@/lib/profile-page'
import { SPECIES, typesCaught } from '@/lib/socemon'
import { cn } from '@/lib/utils'

type Tab = 'links' | 'about' | 'look'
const TABS: { id: Tab; label: string }[] = [{ id: 'links', label: 'Links' }, { id: 'about', label: 'About' }, { id: 'look', label: 'Look' }]
const ACCENTS = ['#836ef9', '#22d3ee', '#ff8a3d', '#f472b6', '#fbbf24', '#2dd4bf', '#84cc16', '#ffffff']

interface Draft { bio: string; skills: string; links: SocialLink[]; design: PageDesign }
const uid = () => Math.random().toString(36).slice(2, 10)

/* Edit your public page: links, about, and how it looks. One Save writes everything; the Preview is the real page. */
export function PageEditor() {
  const user = useUser()
  const trainer = useTrainer(user)
  const [saved, setSaved] = useState<Draft | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [tab, setTab] = useState<Tab>('links')
  const [loadError, setLoadError] = useState('')
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [previewing, setPreviewing] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)

  useEffect(() => {
    request<ProfileExtras>('GET', `/api/profile?address=${user}`)
      .then((d) => {
        const initial: Draft = { bio: d.bio, skills: d.skills.join(', '), links: d.links, design: d.design }
        setSaved(initial)
        setDraft(initial)
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Could not load your page'))
  }, [user])

  const dirty = useMemo(() => JSON.stringify(draft) !== JSON.stringify(saved), [draft, saved])
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), 3000)
    return () => clearTimeout(t)
  }, [notice])

  if (loadError) return <p role="alert" className="pt-10 text-center font-sans text-[15px] font-bold text-text-error">{loadError}</p>
  if (!draft || !trainer.profile) return <PageSpinner />

  const set = (patch: Partial<Draft>) => { setDraft((d) => (d ? { ...d, ...patch } : d)); setNotice('') }
  const setDesign = (patch: Partial<PageDesign>) => set({ design: { ...draft.design, ...patch } })

  /** What actually gets saved: addresses cleaned up, empty rows dropped, order renumbered. */
  function cleaned(): { bio: string; skills: string[]; links: SocialLink[]; pageDesign: PageDesign } | string {
    const links = draft!.links
      .filter((l) => l.url.trim())
      .map((l, position) => ({ ...l, url: expandLink(l.platform, l.url), position }))
    const bad = links.find((l) => !isSafeLinkUrl(l.url))
    if (bad) return `"${bad.label || bad.url}" is not a valid link. Use a web address, an email or a phone number.`
    if (!sanitizeLinks(links)) return 'Some links are invalid.'
    return { bio: draft!.bio.trim(), skills: sanitizeSkills(draft!.skills.split(',')) ?? [], links, pageDesign: draft!.design }
  }

  async function save() {
    const body = cleaned()
    if (typeof body === 'string') return setError(body)
    setSaving(true)
    setError('')
    try {
      await request('PUT', '/api/profile', body)
      const next: Draft = { bio: body.bio, skills: body.skills.join(', '), links: body.links, design: body.pageDesign }
      setSaved(next)
      setDraft(next)
      setNotice('Saved. Your page is live.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save. Try again.')
    } finally {
      setSaving(false)
    }
  }

  const profile = trainer.profile
  const view = {
    trainer: {
      name: profile.name, role: profile.role, partner: Number(profile.partner),
      friends: trainer.connections?.length ?? 0, types: `${typesCaught(trainer.owned)}/5`, caught: `${trainer.owned.size}/${SPECIES.length + 1}`,
    },
    extras: {
      bio: draft.bio, skills: sanitizeSkills(draft.skills.split(',')) ?? [],
      links: draft.links.filter((l) => l.url.trim()).map((l) => ({ ...l, url: expandLink(l.platform, l.url) })),
    },
    design: draft.design,
  }

  return (
    <div className="pb-28">
      <header className="flex items-center justify-between pt-6 pb-4">
        <Link href="/app/me" aria-label="Back to Me" className="w-11 h-11 -ml-2 flex items-center justify-center text-text-secondary"><ChevronLeft className="w-6 h-6" /></Link>
        <h1 className="font-poster text-[30px] uppercase leading-none">My page</h1>
        <button type="button" onClick={() => setPreviewing(true)} className="h-11 px-3 -mr-2 inline-flex items-center gap-1.5 font-sans text-[13px] font-extrabold uppercase tracking-[0.05em] text-text-accent">
          <Eye className="w-4 h-4" /> Preview
        </button>
      </header>

      <div role="tablist" aria-label="Page sections" className="grid grid-cols-3 gap-1 p-1 mb-6 rounded-[20px] bg-bg-surface border-2 border-(--border-default)">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'h-11 rounded-2xl font-sans text-[13px] font-extrabold uppercase tracking-[0.05em] transition-colors',
              tab === t.id ? 'bg-primary text-primary-fg shadow-[0_3px_0_var(--primary-shadow)]' : 'text-text-tertiary',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Notice>{notice}</Notice>

      {tab === 'links' && <LinksTab links={draft.links} onChange={(links) => set({ links })} />}
      {tab === 'about' && <AboutTab draft={draft} onChange={set} />}
      {tab === 'look' && <LookTab design={draft.design} onChange={setDesign} onReset={() => setConfirmReset(true)} />}

      <div className="fixed left-1/2 -translate-x-1/2 bottom-0 z-40 w-full max-w-[448px] px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-bg-base/95 backdrop-blur border-t border-(--border-subtle) space-y-2">
        <ErrorText>{error}</ErrorText>
        <Button fullWidth size="lg" loading={saving} disabled={!dirty} onClick={save}>{dirty ? 'Save my page' : 'Saved'}</Button>
      </div>

      <BottomSheet open={previewing} onClose={() => setPreviewing(false)} title="Preview">
        <div className="rounded-[24px] overflow-hidden border-2 border-(--border-default) mb-2"><PageView {...view} /></div>
      </BottomSheet>

      <BottomSheet open={confirmReset} onClose={() => setConfirmReset(false)} title="Reset the look?">
        <div className="pt-1 pb-2 space-y-4">
          <p className="font-sans text-[14px] font-semibold text-text-secondary leading-[1.45]">Theme, fonts and layout go back to Socemon's default. Your links and bio stay. Press Save to keep the change.</p>
          <div className="flex gap-3">
            <Button fullWidth variant="secondary" onClick={() => setConfirmReset(false)}>Keep mine</Button>
            <Button fullWidth variant="destructive" onClick={() => { setDesign(DEFAULT_DESIGN); setConfirmReset(false) }}>Reset</Button>
          </div>
        </div>
      </BottomSheet>
    </div>
  )
}

function LinksTab({ links, onChange }: { links: SocialLink[]; onChange: (next: SocialLink[]) => void }) {
  const fid = useId()
  const patch = (id: string, p: Partial<SocialLink>) => onChange(links.map((l) => (l.id === id ? { ...l, ...p } : l)))
  const move = (i: number, d: -1 | 1) => {
    const next = [...links]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange(next)
  }

  return (
    <FormSection title="Links" hint="Shown as buttons on your page, in this order. Hide one to keep it without showing it.">
      {links.length === 0 && (
        <p className="rounded-2xl border-2 border-dashed border-(--border-default) px-4 py-8 text-center font-sans text-[14px] font-bold text-text-tertiary">
          No links yet. Add your X, GitHub, Telegram, a website.
        </p>
      )}
      {links.map((l, i) => {
        const meta = platformMeta(l.platform)
        const full = expandLink(l.platform, l.url)
        const invalid = l.url.trim() !== '' && !isSafeLinkUrl(full)
        return (
          <div key={l.id} className={cn('rounded-3xl bg-bg-surface border-2 border-(--border-default) p-4 space-y-3', !l.isVisible && 'opacity-60')}>
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 shrink-0 rounded-xl flex items-center justify-center" style={{ background: `${meta.color}2b`, color: meta.color }}><BrandIcon platform={l.platform} className="w-5 h-5" /></span>
              <select
                aria-label="Platform"
                className={`${inputCls} flex-1 min-w-0`}
                value={l.platform}
                onChange={(e) => patch(l.id, { platform: e.target.value as Platform })}
              >
                {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
              <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" className="w-10 h-10 shrink-0 flex items-center justify-center text-text-tertiary disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
              <button type="button" onClick={() => move(i, 1)} disabled={i === links.length - 1} aria-label="Move down" className="w-10 h-10 shrink-0 flex items-center justify-center text-text-tertiary disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
            </div>
            <Field id={`${fid}-${l.id}-url`} label="Username or link" error={invalid ? 'That does not look like a valid name or link.' : undefined} hint={full && !invalid ? `Opens ${full}` : undefined}>
              <input
                id={`${fid}-${l.id}-url`} aria-invalid={invalid || undefined} className={`${inputCls} ${invalidCls}`} value={l.url} maxLength={2048}
                inputMode="text" autoCapitalize="none" autoCorrect="off" spellCheck={false} autoComplete="off" placeholder={meta.placeholder}
                onChange={(e) => patch(l.id, { url: e.target.value })}
              />
            </Field>
            <Field id={`${fid}-${l.id}-label`} label="Text under the name" optional count={l.label.length} max={100}>
              <input id={`${fid}-${l.id}-label`} className={inputCls} value={l.label} maxLength={100} autoComplete="off" placeholder="@yourhandle" onChange={(e) => patch(l.id, { label: e.target.value })} />
            </Field>
            <div className="flex items-center justify-between">
              <button type="button" onClick={() => patch(l.id, { isVisible: !l.isVisible })} className="h-10 inline-flex items-center gap-2 font-sans text-[13px] font-extrabold text-text-secondary">
                {l.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />} {l.isVisible ? 'Shown' : 'Hidden'}
              </button>
              <button type="button" onClick={() => onChange(links.filter((x) => x.id !== l.id))} className="h-10 inline-flex items-center gap-2 font-sans text-[13px] font-extrabold text-text-error">
                <Trash2 className="w-4 h-4" /> Remove
              </button>
            </div>
          </div>
        )
      })}
      <Button
        type="button" variant="secondary" fullWidth disabled={links.length >= MAX_LINKS} className="gap-2"
        onClick={() => onChange([...links, { id: uid(), platform: 'website', label: '', url: '', isVisible: true, position: links.length }])}
      >
        <Plus className="w-4 h-4" /> {links.length >= MAX_LINKS ? `Up to ${MAX_LINKS} links` : 'Add link'}
      </Button>
      {links.length > 0 && <p className="flex items-center gap-2 font-sans text-[12px] font-semibold text-text-tertiary"><Link2 className="w-3.5 h-3.5" /> Rows without an address are skipped when you save.</p>}
    </FormSection>
  )
}

function AboutTab({ draft, onChange }: { draft: Draft; onChange: (p: Partial<Draft>) => void }) {
  const fid = useId()
  return (
    <div className="space-y-8">
      <FormSection title="About you" hint="Your name, type and pet come from the chain, so you change those by playing.">
        <Field id={`${fid}-bio`} label="Bio" optional count={draft.bio.length} max={MAX_BIO_LEN}>
          <textarea id={`${fid}-bio`} className={textareaCls} rows={4} maxLength={MAX_BIO_LEN} value={draft.bio} placeholder="Building on Monad. Find me at the next meetup." onChange={(e) => onChange({ bio: e.target.value })} />
        </Field>
        <Field id={`${fid}-skills`} label="Skills" optional hint={`Separate with commas, up to ${MAX_SKILLS}.`}>
          <input id={`${fid}-skills`} className={inputCls} value={draft.skills} autoComplete="off" placeholder="Solidity, Design, Community" onChange={(e) => onChange({ skills: e.target.value })} />
        </Field>
      </FormSection>
    </div>
  )
}

function swatch(theme: Exclude<PageThemeId, 'custom'>) {
  const t = THEMES[theme]
  return `linear-gradient(${t.angle}deg, ${t.from}, ${t.to})`
}

function LookTab({ design, onChange, onReset }: { design: PageDesign; onChange: (p: Partial<PageDesign>) => void; onReset: () => void }) {
  const fid = useId()
  const colors = resolveColors(design)
  const blocks = design.blocks
  const moveBlock = (i: number, d: -1 | 1) => {
    const next = [...blocks]
    const j = i + d
    if (j < 0 || j >= next.length) return
    ;[next[i], next[j]] = [next[j], next[i]]
    onChange({ blocks: next })
  }
  const patchBlock = (id: string, p: Partial<(typeof blocks)[number]>) => onChange({ blocks: blocks.map((b) => (b.id === id ? { ...b, ...p } : b)) })

  return (
    <div className="space-y-9">
      <FormSection title="Theme" hint="The colours behind your page.">
        <div className="grid grid-cols-3 gap-2.5">
          {(Object.keys(THEMES) as Exclude<PageThemeId, 'custom'>[]).map((id) => (
            <button
              key={id} type="button" aria-pressed={design.theme === id} onClick={() => onChange({ theme: id, bgFrom: undefined, bgTo: undefined })}
              className={cn('h-20 rounded-2xl border-2 flex items-end p-2 text-left font-sans text-[11px] font-extrabold uppercase tracking-[0.06em]', design.theme === id ? 'border-primary' : 'border-(--border-default)')}
              style={{ background: swatch(id), color: THEMES[id].text }}
            >
              {THEMES[id].label}
            </button>
          ))}
          <button
            type="button" aria-pressed={design.theme === 'custom'} onClick={() => onChange({ theme: 'custom', bgFrom: design.bgFrom ?? '#0b0c14', bgTo: design.bgTo ?? '#241a4f' })}
            className={cn('h-20 rounded-2xl border-2 flex items-end p-2 text-left font-sans text-[11px] font-extrabold uppercase tracking-[0.06em] bg-bg-surface', design.theme === 'custom' ? 'border-primary' : 'border-(--border-default)')}
          >
            Custom
          </button>
        </div>
        {design.theme === 'custom' && (
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${fid}-from`} label="Top colour">
              <input id={`${fid}-from`} type="color" className="w-full h-12 rounded-2xl bg-bg-base border-2 border-(--border-default) p-1" value={design.bgFrom ?? '#0b0c14'} onChange={(e) => onChange({ bgFrom: e.target.value })} />
            </Field>
            <Field id={`${fid}-to`} label="Bottom colour">
              <input id={`${fid}-to`} type="color" className="w-full h-12 rounded-2xl bg-bg-base border-2 border-(--border-default) p-1" value={design.bgTo ?? '#241a4f'} onChange={(e) => onChange({ bgTo: e.target.value })} />
            </Field>
          </div>
        )}
        <div>
          <p className="font-sans text-[13px] font-extrabold text-text-secondary mb-1.5 px-0.5">Accent colour</p>
          <div className="flex flex-wrap items-center gap-2.5">
            {ACCENTS.map((a) => (
              <button
                key={a} type="button" aria-label={`Accent ${a}`} aria-pressed={colors.accent.toLowerCase() === a} onClick={() => onChange({ accent: a })}
                className={cn('w-10 h-10 rounded-full border-2', colors.accent.toLowerCase() === a ? 'border-text-primary' : 'border-(--border-default)')} style={{ background: a }}
              />
            ))}
            <input type="color" aria-label="Pick any accent colour" className="w-10 h-10 rounded-full bg-transparent border-2 border-(--border-default) p-0.5" value={colors.accent} onChange={(e) => onChange({ accent: e.target.value })} />
          </div>
        </div>
      </FormSection>

      <FormSection title="Style" hint="How the text, buttons and your monster look.">
        <Segmented<PageFont> label="Font" value={design.font} onChange={(font) => onChange({ font })} options={[{ value: 'sans', label: 'Round' }, { value: 'serif', label: 'Serif' }, { value: 'mono', label: 'Mono' }, { value: 'display', label: 'Poster' }]} />
        <Segmented<PageButtonStyle> label="Link buttons" value={design.buttonStyle} onChange={(buttonStyle) => onChange({ buttonStyle })} options={[{ value: 'soft', label: 'Soft' }, { value: 'outline', label: 'Outline' }, { value: 'solid', label: 'Solid' }, { value: 'glass', label: 'Glass' }]} />
        <Segmented<PageButtonShape> label="Button shape" value={design.buttonShape} onChange={(buttonShape) => onChange({ buttonShape })} options={[{ value: 'rounded', label: 'Rounded' }, { value: 'pill', label: 'Pill' }, { value: 'square', label: 'Square' }]} />
        <Segmented<PageAvatarShape> label="Monster frame" value={design.avatarShape} onChange={(avatarShape) => onChange({ avatarShape })} options={[{ value: 'circle', label: 'Circle' }, { value: 'rounded', label: 'Rounded' }, { value: 'square', label: 'Square' }]} />
        <Segmented<PageAlign> label="Alignment" value={design.align} onChange={(align) => onChange({ align })} options={[{ value: 'center', label: 'Centre' }, { value: 'left', label: 'Left' }]} />
      </FormSection>

      <FormSection title="Layout" hint="Reorder or hide the parts of your page. A text note is a free line of your own.">
        <ul className="space-y-2">
          {blocks.map((b, i) => (
            <li key={b.id} className={cn('rounded-2xl bg-bg-surface border-2 border-(--border-default) p-3', !b.visible && 'opacity-60')}>
              <div className="flex items-center gap-1">
                <span className="flex-1 min-w-0 pl-1 font-sans text-[14px] font-extrabold truncate">{BLOCK_LABELS[b.type]}</span>
                <button type="button" onClick={() => moveBlock(i, -1)} disabled={i === 0} aria-label={`Move ${BLOCK_LABELS[b.type]} up`} className="w-10 h-10 flex items-center justify-center text-text-tertiary disabled:opacity-30"><ArrowUp className="w-4 h-4" /></button>
                <button type="button" onClick={() => moveBlock(i, 1)} disabled={i === blocks.length - 1} aria-label={`Move ${BLOCK_LABELS[b.type]} down`} className="w-10 h-10 flex items-center justify-center text-text-tertiary disabled:opacity-30"><ArrowDown className="w-4 h-4" /></button>
                <button type="button" onClick={() => patchBlock(b.id, { visible: !b.visible })} aria-label={b.visible ? 'Hide' : 'Show'} aria-pressed={b.visible} className="w-10 h-10 flex items-center justify-center text-text-secondary">{b.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}</button>
                {b.type === 'text' && (
                  <button type="button" onClick={() => onChange({ blocks: blocks.filter((x) => x.id !== b.id) })} aria-label="Remove note" className="w-10 h-10 flex items-center justify-center text-text-error"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
              {b.type === 'text' && (
                <textarea
                  aria-label="Text note" className={`${textareaCls} mt-2`} rows={2} maxLength={MAX_TEXT_LEN} value={b.text ?? ''} placeholder="Say something on your page"
                  onChange={(e) => patchBlock(b.id, { text: e.target.value })}
                />
              )}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" disabled={blocks.length >= MAX_BLOCKS} className="gap-2" onClick={() => onChange({ blocks: [...blocks, { id: `t${uid().slice(0, 6)}`, type: 'text', visible: true, text: '' }] })}>
            <Plus className="w-4 h-4" /> Text note
          </Button>
          <Button type="button" variant="ghost" className="gap-2" onClick={onReset}><RotateCcw className="w-4 h-4" /> Reset look</Button>
        </div>
      </FormSection>
    </div>
  )
}
