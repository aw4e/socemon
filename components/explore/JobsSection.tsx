'use client'
import { useCallback, useEffect, useId, useMemo, useState } from 'react'
import { Briefcase, ExternalLink, Plus } from 'lucide-react'
import { BottomSheet } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import {
  Chip, EmptyState, ErrorText, Field, FilterChips, FormSection, Notice, PreviewCard, SearchField, Segmented, SkeletonRows, StickyFooter,
  inputCls, invalidCls, textareaCls, useNotice,
} from '@/components/explore/controls'
import { request } from '@/lib/client'
import {
  CURRENCIES, JOB_CATEGORIES, JOB_EMPLOYMENTS, JOB_WORK_TYPES, MAX_SKILLS, PAY_PERIODS, formatPay, relativeTime, sanitizeSkills,
  type CurrencyCode, type ExploreJob, type JobCategory, type JobEmployment, type JobWorkType, type PayPeriod,
} from '@/lib/explore'

const categoryLabel = (c: JobCategory) => JOB_CATEGORIES.find((x) => x.value === c)?.label ?? c
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

function PayChip({ job }: { job: ExploreJob }) {
  if (job.pay) return <Chip label={formatPay(job.pay)} tone="success" />
  return job.compensation ? <Chip label={job.compensation} tone="success" /> : null
}

export function JobsSection() {
  const [jobs, setJobs] = useState<ExploreJob[]>([])
  const [loaded, setLoaded] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<JobCategory | null>(null)
  const [workType, setWorkType] = useState<JobWorkType | null>(null)
  const [posting, setPosting] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const { notice, setNotice } = useNotice()

  const load = useCallback(async () => {
    try {
      setJobs((await request<{ jobs: ExploreJob[] }>('GET', '/api/explore/jobs')).jobs)
      setLoadError('')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Could not load jobs')
    } finally {
      setLoaded(true)
    }
  }, [])
  useEffect(() => { load() }, [load])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return jobs.filter((j) => {
      if (category && j.category !== category) return false
      if (workType && j.workType !== workType) return false
      return !q || `${j.title} ${j.company} ${j.skills.join(' ')}`.toLowerCase().includes(q)
    })
  }, [jobs, query, category, workType])

  const open = jobs.find((j) => j.id === openId) ?? null

  return (
    <>
      <div className="flex items-center gap-2 mb-2">
        <SearchField value={query} onChange={setQuery} label="Search jobs" placeholder="Role, company or skill" />
        <Button size="sm" onClick={() => setPosting(true)} className="gap-1.5 shrink-0 h-12"><Plus className="w-4 h-4" /> Post</Button>
      </div>
      <div className="mb-3">
        <FilterChips label="Filter by role" options={JOB_CATEGORIES} value={category} onChange={setCategory} />
        <FilterChips label="Filter by work type" options={JOB_WORK_TYPES.map((w) => ({ value: w, label: cap(w) }))} value={workType} onChange={setWorkType} />
      </div>

      <Notice>{notice}</Notice>
      {loadError && <div className="mb-3"><ErrorText>{loadError}</ErrorText></div>}

      {!loaded ? (
        <SkeletonRows />
      ) : filtered.length === 0 && !loadError ? (
        <EmptyState
          icon={Briefcase}
          title={jobs.length === 0 ? 'No jobs yet' : 'Nothing matches'}
          hint={jobs.length === 0 ? 'Post a role and reach web3 talent in one step.' : 'Clear the search or a filter to see more roles.'}
          action={jobs.length === 0
            ? { label: 'Post a job', onClick: () => setPosting(true) }
            : { label: 'Clear filters', variant: 'secondary', onClick: () => { setQuery(''); setCategory(null); setWorkType(null) } }}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((j) => (
            <button key={j.id} type="button" onClick={() => setOpenId(j.id)} className="block w-full text-left rounded-3xl bg-bg-surface border-2 border-(--border-default) px-4 py-3.5 active:translate-y-0.5 transition-transform">
              <div className="flex items-start gap-2">
                <p className="flex-1 min-w-0 break-words font-sans text-[17px] font-extrabold leading-[1.25] text-text-primary">{j.title}</p>
                {j.status === 'closed' && <Chip label="Closed" tone="warning" />}
              </div>
              <p className="font-sans text-[13px] font-bold text-text-secondary mt-0.5 break-words">{j.company}{j.location ? ` · ${j.location}` : ''}</p>
              <div className="flex flex-wrap gap-1.5 mt-2.5">
                <Chip label={categoryLabel(j.category)} tone="accent" />
                <Chip label={j.workType} />
                <Chip label={j.employment} />
                {j.skills.slice(0, 3).map((s) => <Chip key={s} label={s} />)}
              </div>
              {(j.pay || j.compensation) && <div className="flex flex-wrap gap-1.5 mt-2"><PayChip job={j} /></div>}
              <p className="font-sans text-[11px] font-bold text-text-tertiary mt-2">{relativeTime(j.createdAt)}</p>
            </button>
          ))}
        </div>
      )}

      <PostJobSheet open={posting} onClose={() => setPosting(false)} onPosted={() => { setNotice('Job published.'); load() }} />
      <JobSheet job={open} onClose={() => setOpenId(null)} onNotice={setNotice} onChanged={load} />
    </>
  )
}

function JobSheet({ job, onClose, onNotice, onChanged }: { job: ExploreJob | null; onClose: () => void; onNotice: (m: string) => void; onChanged: () => void }) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirmClose, setConfirmClose] = useState(false)
  const jobId = job?.id
  useEffect(() => { setError(''); setConfirmClose(false) }, [jobId])

  async function toggleStatus() {
    if (!job) return
    setBusy(true)
    setError('')
    try {
      await request('PATCH', `/api/explore/jobs/${job.id}`, { status: job.status === 'open' ? 'closed' : 'open' })
      onNotice(job.status === 'open' ? 'Listing closed. Only you can see it now.' : 'Listing reopened.')
      setConfirmClose(false)
      onChanged()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <BottomSheet open={!!job} onClose={onClose}>
        {job && (
          <div className="pt-2 pb-2 space-y-3">
            <h2 className="font-poster text-[34px] uppercase leading-[1] text-text-primary break-words">{job.title}</h2>
            <p className="font-sans text-[14px] font-bold text-text-secondary break-words">{job.company}{job.location ? ` · ${job.location}` : ''}</p>
            <div className="flex flex-wrap gap-1.5">
              <Chip label={categoryLabel(job.category)} tone="accent" />
              <Chip label={job.workType} />
              <Chip label={job.employment} />
              <PayChip job={job} />
            </div>
            <p className="font-sans text-[14px] font-semibold text-text-secondary leading-relaxed whitespace-pre-wrap break-words">{job.description}</p>
            {job.skills.length > 0 && <div className="flex flex-wrap gap-1.5">{job.skills.map((s) => <Chip key={s} label={s} />)}</div>}
            <ErrorText>{error}</ErrorText>
            {job.status === 'open' ? (
              <a
                href={job.applyUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-primary-fg font-sans text-[14px] font-extrabold uppercase tracking-[0.05em] shadow-[0_4px_0_var(--primary-shadow)]"
              >
                {job.applyUrl.startsWith('mailto:') ? 'Apply by email' : 'Apply on their site'} <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <p className="font-sans text-[13px] font-bold text-text-tertiary">This listing is closed{job.mine ? ' and hidden from everyone else.' : '.'}</p>
            )}
            {job.mine && (
              <Button fullWidth variant="secondary" loading={busy} onClick={job.status === 'open' ? () => setConfirmClose(true) : toggleStatus}>
                {job.status === 'open' ? 'Close listing' : 'Reopen listing'}
              </Button>
            )}
          </div>
        )}
      </BottomSheet>
      <BottomSheet open={confirmClose && !!job} onClose={() => setConfirmClose(false)} title="Close listing?">
        <div className="pt-1 pb-2 space-y-4">
          <p className="font-sans text-[14px] font-semibold text-text-secondary leading-[1.45]">People will no longer see it or be able to apply. You can reopen it any time.</p>
          <ErrorText>{error}</ErrorText>
          <div className="flex gap-3">
            <Button fullWidth variant="secondary" disabled={busy} onClick={() => setConfirmClose(false)}>Keep open</Button>
            <Button fullWidth variant="destructive" loading={busy} onClick={toggleStatus}>Close</Button>
          </div>
        </div>
      </BottomSheet>
    </>
  )
}

type JobField = 'title' | 'company' | 'payMin' | 'payMax' | 'description' | 'applyUrl'
const FIELD_ORDER: JobField[] = ['title', 'company', 'payMin', 'payMax', 'description', 'applyUrl']
const FIELD_HINT: Record<JobField, string> = {
  title: 'Add a title to continue', company: 'Add the company or project to continue', payMin: 'Fix the pay to continue',
  payMax: 'Fix the pay range to continue', description: 'Add a description to continue', applyUrl: 'Add an apply link or email to continue',
}

function PostJobSheet({ open, onClose, onPosted }: { open: boolean; onClose: () => void; onPosted: () => void }) {
  const empty = useMemo(() => ({
    title: '', company: '', description: '', location: '', applyUrl: '', skills: '',
    payCurrency: 'USD' as CurrencyCode, payMin: '', payMax: '', payPeriod: 'month' as PayPeriod,
    category: 'frontend' as JobCategory, workType: 'remote' as JobWorkType, employment: 'full-time' as JobEmployment,
  }), [])
  const fid = useId()
  const [form, setForm] = useState(empty)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [touched, setTouched] = useState<Partial<Record<JobField, boolean>>>({})
  const [submitted, setSubmitted] = useState(false)

  const set = <K extends keyof typeof empty>(k: K, v: (typeof empty)[K]) => setForm((f) => ({ ...f, [k]: v }))
  const payMin = Number(form.payMin)
  const payMax = Number(form.payMax)

  const errors: Record<JobField, string> = {
    title: form.title.trim() ? '' : 'Add a title so people know the role.',
    company: form.company.trim() ? '' : 'Add the company or project name.',
    payMin: form.payMin && !(payMin > 0) ? 'Enter the pay as a number above zero.' : '',
    payMax: form.payMax && !(payMax >= payMin) ? 'The top of the pay range must be at least the bottom.' : '',
    description: form.description.trim() ? '' : 'Describe the work so people can decide to apply.',
    applyUrl: form.applyUrl.trim() ? '' : 'Add a link or email where people can apply.',
  }
  const firstInvalid = FIELD_ORDER.find((k) => errors[k])
  const shown = (k: JobField) => (touched[k] || submitted ? errors[k] : '')
  const ctl = (k: JobField) => ({
    id: `${fid}-${k}`,
    'aria-invalid': shown(k) ? true : undefined,
    'aria-describedby': `${fid}-${k}-msg`,
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
  })

  const pay = payMin > 0 ? { currency: form.payCurrency, min: payMin, max: payMax > payMin ? payMax : undefined, period: form.payPeriod } : undefined
  const place = form.location.trim()

  async function submit() {
    if (busy) return
    setSubmitted(true)
    if (firstInvalid) return void document.getElementById(`${fid}-${firstInvalid}`)?.focus()
    setBusy(true)
    setError('')
    const apply = form.applyUrl.trim()
    try {
      await request('POST', '/api/explore/jobs', {
        title: form.title, company: form.company, description: form.description,
        category: form.category, workType: form.workType, employment: form.employment,
        location: form.location || undefined, pay,
        skills: sanitizeSkills(form.skills.split(',')) ?? [],
        applyUrl: /^[a-z][a-z0-9+.-]*:/i.test(apply) ? apply : apply.includes('@') ? `mailto:${apply}` : `https://${apply}`,
      })
      setForm(empty)
      setTouched({})
      setSubmitted(false)
      onPosted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to post job')
    } finally {
      setBusy(false)
    }
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Post a job">
      <form className="pt-1 pb-2 space-y-8" noValidate onSubmit={(e) => { e.preventDefault(); submit() }}>
        <FormSection title="The role" hint="What you are hiring for.">
          <Field id={`${fid}-title`} label="Job title" required error={shown('title')} count={form.title.length} max={100}>
            <input {...ctl('title')} className={`${inputCls} ${invalidCls}`} value={form.title} maxLength={100} enterKeyHint="next" autoComplete="off" onChange={(e) => set('title', e.target.value)} placeholder="Senior Solidity engineer" />
          </Field>
          <Field id={`${fid}-company`} label="Company or project" required error={shown('company')} count={form.company.length} max={80}>
            <input {...ctl('company')} className={`${inputCls} ${invalidCls}`} value={form.company} maxLength={80} enterKeyHint="next" autoComplete="organization" onChange={(e) => set('company', e.target.value)} placeholder="Acme Labs" />
          </Field>
          <Field id={`${fid}-category`} label="Role type" hint="Used by the role filter on the Jobs list.">
            <select id={`${fid}-category`} aria-describedby={`${fid}-category-msg`} className={inputCls} value={form.category} onChange={(e) => set('category', e.target.value as JobCategory)}>
              {JOB_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </Field>
          <Field id={`${fid}-skills`} label="Skills" optional hint={`Separate with commas, up to ${MAX_SKILLS}.`}>
            <input id={`${fid}-skills`} aria-describedby={`${fid}-skills-msg`} className={inputCls} value={form.skills} enterKeyHint="next" autoComplete="off" onChange={(e) => set('skills', e.target.value)} placeholder="Solidity, Foundry, EVM" />
          </Field>
        </FormSection>

        <FormSection title="Where and how" hint="Where the work happens and the kind of contract.">
          <Segmented label="Work type" options={JOB_WORK_TYPES.map((w) => ({ value: w, label: cap(w) }))} value={form.workType} onChange={(v) => set('workType', v)} />
          <Segmented label="Employment" options={JOB_EMPLOYMENTS.map((w) => ({ value: w, label: cap(w) }))} value={form.employment} onChange={(v) => set('employment', v)} />
          <Field id={`${fid}-location`} label="Location" optional hint="City or region. Leave empty if it does not matter.">
            <input id={`${fid}-location`} aria-describedby={`${fid}-location-msg`} className={inputCls} value={form.location} maxLength={100} enterKeyHint="next" autoComplete="off" onChange={(e) => set('location', e.target.value)} placeholder="Jakarta" />
          </Field>
        </FormSection>

        <FormSection title="Pay" hint="Optional. Amounts are shown in the currency you pick and never converted.">
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${fid}-currency`} label="Currency">
              <select id={`${fid}-currency`} className={inputCls} value={form.payCurrency} onChange={(e) => set('payCurrency', e.target.value as CurrencyCode)}>
                {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field id={`${fid}-period`} label="Period">
              <select id={`${fid}-period`} className={inputCls} value={form.payPeriod} onChange={(e) => set('payPeriod', e.target.value as PayPeriod)}>
                {PAY_PERIODS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${fid}-payMin`} label="From" optional error={shown('payMin')}>
              <input {...ctl('payMin')} className={`${inputCls} ${invalidCls}`} value={form.payMin} inputMode="decimal" enterKeyHint="next" autoComplete="off" placeholder="3000" onChange={(e) => set('payMin', e.target.value.replace(/[^0-9.]/g, ''))} />
            </Field>
            <Field id={`${fid}-payMax`} label="To" optional error={shown('payMax')}>
              <input {...ctl('payMax')} className={`${inputCls} ${invalidCls}`} value={form.payMax} inputMode="decimal" enterKeyHint="next" autoComplete="off" placeholder="5000" onChange={(e) => set('payMax', e.target.value.replace(/[^0-9.]/g, ''))} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Details and apply" hint="The full description and where candidates go next.">
          <Field id={`${fid}-description`} label="Description" required error={shown('description')} count={form.description.length} max={4000}>
            <textarea {...ctl('description')} className={`${textareaCls} ${invalidCls}`} rows={5} value={form.description} maxLength={4000} autoComplete="off" onChange={(e) => set('description', e.target.value)} placeholder="What will they work on, and what do you need?" />
          </Field>
          <Field id={`${fid}-applyUrl`} label="Apply link or email" required error={shown('applyUrl')} hint="A web link or an email address.">
            <input {...ctl('applyUrl')} className={`${inputCls} ${invalidCls}`} type="text" inputMode="email" autoCapitalize="none" autoCorrect="off" spellCheck={false} enterKeyHint="done" autoComplete="off" value={form.applyUrl} onChange={(e) => set('applyUrl', e.target.value)} placeholder="jobs@project.xyz or https://..." />
          </Field>
        </FormSection>

        <PreviewCard>
          <p className={`font-sans text-[16px] font-extrabold leading-[1.3] break-words ${form.title.trim() ? 'text-text-primary' : 'text-text-tertiary'}`}>{form.title.trim() || 'Job title'}</p>
          <p className="font-sans text-[12px] font-bold text-text-secondary break-words">{form.company.trim() || 'Company or project'}{place ? ` · ${place}` : ''}</p>
          <div className="flex flex-wrap gap-1.5">
            <Chip label={categoryLabel(form.category)} tone="accent" />
            <Chip label={form.workType} />
            <Chip label={form.employment} />
            {pay && <Chip label={formatPay(pay)} tone="success" />}
          </div>
        </PreviewCard>

        <StickyFooter hint={firstInvalid ? FIELD_HINT[firstInvalid] : undefined}>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" fullWidth size="lg" loading={busy} aria-disabled={firstInvalid ? true : undefined} className={firstInvalid ? 'opacity-40' : undefined}>Publish job</Button>
        </StickyFooter>
      </form>
    </BottomSheet>
  )
}
