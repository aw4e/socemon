/* Explore tab: what events, jobs and people look like, and how untrusted input is checked. Shared by the API routes and the
   screens. Posts live in Socemon's own Firestore (collections events, jobs, socemonTrainers); posters are recorded as
   `wallet:<address>` in hostUid and postedByUid. The fields match Cardtena's, so the shapes stay familiar. */

export type JobCategory = 'frontend' | 'backend' | 'fullstack' | 'smart-contract' | 'design' | 'product' | 'community' | 'marketing' | 'other'
export type JobWorkType = 'remote' | 'onsite' | 'hybrid'
export type JobEmployment = 'full-time' | 'part-time' | 'contract' | 'bounty'
export type PayPeriod = 'hour' | 'month' | 'year' | 'project'
export type CurrencyCode = 'USD' | 'IDR' | 'EUR' | 'SGD' | 'MYR' | 'GBP' | 'AUD' | 'JPY'

export interface JobPay { currency: CurrencyCode; min: number; max?: number; period: PayPeriod }

/** `mine` is decided by the server, so the browser never sees who else posted what. */
export interface ExploreEvent { id: string; title: string; link: string; bannerUrl?: string; hostName: string; mine: boolean; createdAt: string }
export interface ExploreJob {
  id: string; title: string; company: string; description: string; category: JobCategory; workType: JobWorkType
  employment: JobEmployment; location?: string; compensation?: string; pay?: JobPay; skills: string[]; applyUrl: string
  status: 'open' | 'closed'; mine: boolean; createdAt: string
}
export interface ExplorePerson { address: string; name: string; role: number }

export const JOB_CATEGORIES: { value: JobCategory; label: string }[] = [
  { value: 'frontend', label: 'Frontend' }, { value: 'backend', label: 'Backend' }, { value: 'fullstack', label: 'Fullstack' },
  { value: 'smart-contract', label: 'Smart Contract' }, { value: 'design', label: 'Design' }, { value: 'product', label: 'Product' },
  { value: 'community', label: 'Community' }, { value: 'marketing', label: 'Marketing' }, { value: 'other', label: 'Other' },
]
export const JOB_WORK_TYPES: JobWorkType[] = ['remote', 'onsite', 'hybrid']
export const JOB_EMPLOYMENTS: JobEmployment[] = ['full-time', 'part-time', 'contract', 'bounty']
export const CURRENCIES: CurrencyCode[] = ['USD', 'IDR', 'EUR', 'SGD', 'MYR', 'GBP', 'AUD', 'JPY']
export const PAY_PERIODS: { value: PayPeriod; label: string; suffix: string }[] = [
  { value: 'month', label: 'Per month', suffix: '/ month' }, { value: 'hour', label: 'Per hour', suffix: '/ hour' },
  { value: 'year', label: 'Per year', suffix: '/ year' }, { value: 'project', label: 'Per project', suffix: 'per project' },
]

export const MAX_SKILLS = 8
const MAX_SKILL_LEN = 24
const MAX_AMOUNT = 1e12

export const isJobCategory = (v: unknown): v is JobCategory => JOB_CATEGORIES.some((c) => c.value === v)
export const isJobWorkType = (v: unknown): v is JobWorkType => JOB_WORK_TYPES.includes(v as JobWorkType)
export const isJobEmployment = (v: unknown): v is JobEmployment => JOB_EMPLOYMENTS.includes(v as JobEmployment)
const isCurrency = (v: unknown): v is CurrencyCode => CURRENCIES.includes(v as CurrencyCode)
const isPeriod = (v: unknown): v is PayPeriod => PAY_PERIODS.some((p) => p.value === v)

export function isHttpUrl(v: string): boolean {
  try {
    const { protocol } = new URL(v)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

/** An apply target: a web link or an email address. */
export function isApplyUrl(v: string): boolean {
  try {
    const { protocol } = new URL(v)
    return protocol === 'https:' || protocol === 'mailto:'
  } catch {
    return false
  }
}

export const hostOf = (link: string) => {
  try {
    return new URL(link).host
  } catch {
    return link
  }
}

/** Trims, dedupes (case-insensitive) and caps a skills list. Null when the input is not a list of strings. */
export function sanitizeSkills(raw: unknown): string[] | null {
  if (!Array.isArray(raw) || !raw.every((s) => typeof s === 'string')) return null
  const seen = new Set<string>()
  const out: string[] = []
  for (const s of raw as string[]) {
    const v = s.trim().slice(0, MAX_SKILL_LEN)
    if (!v || seen.has(v.toLowerCase())) continue
    seen.add(v.toLowerCase())
    out.push(v)
  }
  return out.slice(0, MAX_SKILLS)
}

/** Checks an untrusted pay object. Null when anything is off. */
export function sanitizePay(input: unknown): JobPay | null {
  if (!input || typeof input !== 'object') return null
  const p = input as Record<string, unknown>
  const min = Number(p.min)
  if (!isCurrency(p.currency) || !isPeriod(p.period)) return null
  if (!Number.isFinite(min) || min <= 0 || min > MAX_AMOUNT) return null
  const pay: JobPay = { currency: p.currency, period: p.period, min }
  if (p.max !== undefined && p.max !== null && p.max !== '') {
    const max = Number(p.max)
    if (!Number.isFinite(max) || max < min || max > MAX_AMOUNT) return null
    if (max > min) pay.max = max
  }
  return pay
}

export function formatMoney(amount: number, currency: CurrencyCode): string {
  return new Intl.NumberFormat(currency === 'IDR' ? 'id-ID' : 'en-US', {
    style: 'currency', currency, maximumFractionDigits: currency === 'IDR' || currency === 'JPY' || amount >= 1000 ? 0 : 2,
  }).format(amount)
}

/** The pay as the poster entered it, e.g. "$5,000 to $7,000 / month". */
export function formatPay(pay: JobPay): string {
  const range = pay.max ? `${formatMoney(pay.min, pay.currency)} to ${formatMoney(pay.max, pay.currency)}` : formatMoney(pay.min, pay.currency)
  return `${range} ${PAY_PERIODS.find((p) => p.value === pay.period)?.suffix ?? ''}`
}

export const posterId = (address: string) => `wallet:${address.toLowerCase()}`

/** Firestore document ids built from user input must not hold '/' or be '.', '..' or '__x__': the SDK throws and the route answers 500. */
export const isDocId = (id: unknown): id is string =>
  typeof id === 'string' && /^[A-Za-z0-9_:.-]{1,128}$/.test(id) && id !== '.' && id !== '..' && !id.startsWith('__')

export function relativeTime(iso: string, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - new Date(iso).getTime()) / 1000))
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  return `${Math.floor(s / 86400)} d ago`
}
