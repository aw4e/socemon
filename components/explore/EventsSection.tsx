'use client'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import Image from 'next/image'
import { CalendarDays, ExternalLink, ImagePlus, Plus, Trash2, X } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { Chip, EmptyState, ErrorText, Field, FormSection, Notice, PreviewCard, SkeletonRows, StickyFooter, inputCls, invalidCls, useNotice } from '@/components/explore/controls'
import { DropPoster, type DropInfo } from '@/components/explore/DropPoster'
import { request } from '@/lib/client'
import { hostOf, isHttpUrl, type ExploreEvent } from '@/lib/explore'

function Banner({ src, className = '' }: { src?: string; className?: string }) {
  return (
    <div className={`relative w-full aspect-[16/9] overflow-hidden bg-(--fill) ${className}`}>
      {src
        ? <Image src={src} alt="" fill sizes="(max-width: 640px) 100vw, 480px" unoptimized className="object-cover" />
        : <CalendarDays className="absolute inset-0 m-auto w-8 h-8 text-text-tertiary" strokeWidth={1.6} />}
    </div>
  )
}

/** The live event's drop poster first, then every event the community has posted. */
export function EventsSection({ drop }: { drop: DropInfo }) {
  const [events, setEvents] = useState<ExploreEvent[]>([])
  const [moderator, setModerator] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [creating, setCreating] = useState(false)
  const [removing, setRemoving] = useState<ExploreEvent | null>(null)
  const { notice, setNotice } = useNotice()

  const load = useCallback(async () => {
    try {
      const data = await request<{ events: ExploreEvent[]; canModerate: boolean }>('GET', '/api/explore/events')
      setEvents(data.events)
      setModerator(data.canModerate)
      setLoadError('')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load events')
    } finally {
      setLoaded(true)
    }
  }, [])
  useEffect(() => { load() }, [load])

  return (
    <>
      <DropPoster {...drop} />

      <div className="flex items-center justify-between gap-3 mt-9 mb-4">
        <h2 className="font-poster text-[28px] uppercase leading-none">Community events</h2>
        <Button size="sm" onClick={() => setCreating(true)} className="gap-1.5 shrink-0"><Plus className="w-4 h-4" /> Add</Button>
      </div>

      <Notice>{notice}</Notice>
      {loadError && <div className="mb-3"><ErrorText>{loadError}</ErrorText></div>}

      {!loaded ? (
        <SkeletonRows />
      ) : events.length === 0 && !loadError ? (
        <EmptyState icon={CalendarDays} title="No events yet" hint="Share an event with a title, a banner and the link." action={{ label: 'Add event', onClick: () => setCreating(true) }} />
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <div key={e.id} className="relative rounded-3xl overflow-hidden bg-bg-surface border-2 border-(--border-default)">
              <a href={e.link} target="_blank" rel="noopener noreferrer" className="block">
                <Banner src={e.bannerUrl} />
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="flex-1 min-w-0">
                    <p className="break-words font-sans text-[17px] font-extrabold leading-[1.25] text-text-primary">{e.title}</p>
                    <p className="font-sans text-[12px] font-bold text-text-tertiary mt-1 truncate">{hostOf(e.link)} · by {e.hostName}</p>
                  </div>
                  <ExternalLink className="w-4 h-4 shrink-0 text-text-tertiary" aria-hidden />
                </div>
              </a>
              {(e.mine || moderator) && (
                <div className="absolute top-2 left-2 right-2 flex items-start justify-between pointer-events-none">
                  {e.mine ? <Chip label="Yours" tone="accent" /> : <span />}
                  <button
                    onClick={() => setRemoving(e)}
                    aria-label={`Remove ${e.title}`}
                    className="pointer-events-auto w-11 h-11 -mt-1.5 -mr-1.5 flex items-center justify-center rounded-full"
                  >
                    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-black/60 backdrop-blur"><Trash2 className="w-4 h-4 text-white" /></span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <CreateEventSheet open={creating} onClose={() => setCreating(false)} onCreated={() => { setNotice('Event added.'); load() }} />
      <RemoveEventSheet event={removing} onClose={() => setRemoving(null)} onRemoved={(title) => { setNotice(`${title} was removed.`); load() }} />
    </>
  )
}

function RemoveEventSheet({ event, onClose, onRemoved }: { event: ExploreEvent | null; onClose: () => void; onRemoved: (title: string) => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useEffect(() => { setError('') }, [event?.id])

  async function remove() {
    if (!event) return
    setBusy(true)
    setError('')
    try {
      await request('DELETE', `/api/explore/events/${event.id}`)
      onRemoved(event.title)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not remove the event')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={!!event} onClose={() => !busy && onClose()} title="Remove event?">
      <div className="pt-1 pb-2 space-y-4">
        <p className="font-sans text-[14px] font-semibold text-text-secondary leading-[1.45] break-words">
          {event?.title} will be removed for everyone. The event itself is not affected.
        </p>
        <ErrorText>{error}</ErrorText>
        <div className="flex gap-3">
          <Button fullWidth variant="secondary" disabled={busy} onClick={onClose}>Keep</Button>
          <Button fullWidth variant="destructive" loading={busy} onClick={remove}>Remove</Button>
        </div>
      </div>
    </BottomSheet>
  )
}

type EventField = 'title' | 'link'
const FIELD_ORDER: EventField[] = ['title', 'link']

function CreateEventSheet({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const fid = useId()
  const fileRef = useRef<HTMLInputElement>(null)
  const [form, setForm] = useState({ title: '', link: '', bannerUrl: '' })
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Partial<Record<EventField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (!open) return
    setForm({ title: '', link: '', bannerUrl: '' })
    setTouched({})
    setSubmitted(false)
    setError('')
  }, [open])

  const link = form.link.trim()
  const errors: Record<EventField, string> = {
    title: form.title.trim() ? '' : 'Add a title so people know what this is.',
    link: !link ? 'Add the link people should open.' : isHttpUrl(link) ? '' : 'Enter a full link starting with https://',
  }
  const hints: Record<EventField, string> = { title: 'Add a title to continue', link: 'Add a valid link to continue' }
  const firstInvalid = FIELD_ORDER.find((k) => errors[k])
  const shown = (k: EventField) => (touched[k] || submitted ? errors[k] : '')
  const ctl = (k: EventField) => ({
    id: `${fid}-${k}`,
    'aria-invalid': shown(k) ? true : undefined,
    'aria-describedby': `${fid}-${k}-msg`,
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
  })

  async function pickBanner(file: File | undefined) {
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const res = await fetch('/api/explore/banner', { method: 'POST', body })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Could not upload the banner')
      setForm((f) => ({ ...f, bannerUrl: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not upload the banner')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function submit() {
    if (busy || uploading) return
    setSubmitted(true)
    if (firstInvalid) return void document.getElementById(`${fid}-${firstInvalid}`)?.focus()
    setBusy(true)
    setError('')
    try {
      await request('POST', '/api/explore/events', { title: form.title, link, bannerUrl: form.bannerUrl || undefined })
      onCreated()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add event')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Add event">
      <form className="pt-1 pb-2 space-y-8" noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
        <FormSection title="Event" hint="People tap the card and land on your link.">
          <Field id={`${fid}-title`} label="Title" required error={shown('title')} count={form.title.length} max={100}>
            <input {...ctl('title')} className={`${inputCls} ${invalidCls}`} value={form.title} maxLength={100} enterKeyHint="next" autoComplete="off" onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Builders meetup" />
          </Field>
          <Field id={`${fid}-link`} label="Link" required error={shown('link')} hint="Where the event lives: registration page, Luma, Meetup, stream.">
            <input
              {...ctl('link')} className={`${inputCls} ${invalidCls}`} value={form.link} maxLength={2048} type="url" inputMode="url"
              enterKeyHint="done" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
              onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://lu.ma/your-event"
            />
          </Field>
        </FormSection>

        <FormSection title="Banner" hint="A wide photo works best. JPEG, PNG or WebP up to 4 MB.">
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Event banner" onChange={(e) => pickBanner(e.target.files?.[0])} />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="md" loading={uploading} onClick={() => fileRef.current?.click()} className="gap-2">
              {!uploading && <ImagePlus className="w-4 h-4" />}
              {form.bannerUrl ? 'Change' : 'Add banner'}
            </Button>
            {form.bannerUrl && (
              <Button type="button" variant="ghost" size="md" disabled={uploading} onClick={() => setForm((f) => ({ ...f, bannerUrl: '' }))} className="gap-2">
                <X className="w-4 h-4" /> Remove
              </Button>
            )}
          </div>
        </FormSection>

        <PreviewCard>
          <Banner src={form.bannerUrl || undefined} className="rounded-xl" />
          <p className={`font-sans text-[16px] font-extrabold leading-[1.3] break-words ${form.title.trim() ? 'text-text-primary' : 'text-text-tertiary'}`}>{form.title.trim() || 'Event title'}</p>
          <p className="font-sans text-[12px] font-bold text-text-tertiary truncate">{isHttpUrl(link) ? hostOf(link) : 'Link to come'}</p>
        </PreviewCard>

        <StickyFooter hint={firstInvalid ? hints[firstInvalid] : undefined}>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" fullWidth size="lg" loading={busy} aria-disabled={firstInvalid ? true : undefined} className={firstInvalid ? 'opacity-40' : undefined}>Publish event</Button>
        </StickyFooter>
      </form>
    </BottomSheet>
  )
}
