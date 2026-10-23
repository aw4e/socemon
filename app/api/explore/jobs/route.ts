import { NextResponse, type NextRequest } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { HttpError, handle, readBody, requireUser } from '@/lib/api'
import { adminDb } from '@/lib/firebase-admin'
import { stored, toIso, trainerName } from '@/lib/explore-server'
import {
  isApplyUrl, isJobCategory, isJobEmployment, isJobWorkType, posterId, sanitizePay, sanitizeSkills, type ExploreJob,
} from '@/lib/explore'

const MAX_TITLE_LEN = 100
const MAX_COMPANY_LEN = 80
const MAX_DESC_LEN = 4000
const MAX_SHORT_LEN = 100
const MAX_URL_LEN = 2048
const DAY_MS = 86_400_000
const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

/** The newest 200 listings. Closed ones only show to their poster. */
export function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const snap = await adminDb().collection('jobs').orderBy('createdAt', 'desc').limit(200).get()
    const me = posterId(user)
    const jobs = snap.docs.flatMap((d): ExploreJob[] => {
      const j = d.data()
      const mine = j.postedByUid === me
      if (j.status !== 'open' && !mine) return []
      if (!j.title || !j.company || !j.applyUrl) return []
      return [{
        id: d.id, title: j.title, company: j.company, description: j.description ?? '', category: j.category, workType: j.workType,
        employment: j.employment, location: j.location ?? undefined, compensation: j.compensation ?? undefined, pay: j.pay ?? undefined,
        skills: j.skills ?? [], applyUrl: j.applyUrl, status: j.status, mine, createdAt: toIso(j.createdAt),
      }]
    })
    return NextResponse.json({ jobs }, { headers: { 'Cache-Control': 'no-store' } })
  })
}

/** Posts a job listing. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    await stored('explore-job', user, 10, DAY_MS)
    await trainerName(user)

    const b = await readBody(req)
    const title = str(b.title), company = str(b.company), description = str(b.description)
    const location = str(b.location), applyUrl = str(b.applyUrl)
    const hasPay = b.pay !== undefined && b.pay !== null
    const pay = hasPay ? sanitizePay(b.pay) : null
    const skills = sanitizeSkills(b.skills ?? [])

    if (!title || title.length > MAX_TITLE_LEN) throw new HttpError('Title is required', 400)
    if (!company || company.length > MAX_COMPANY_LEN) throw new HttpError('Company is required', 400)
    if (!description || description.length > MAX_DESC_LEN) throw new HttpError('Description is required', 400)
    if (location.length > MAX_SHORT_LEN) throw new HttpError('Location is too long', 400)
    if (hasPay && !pay) throw new HttpError('Pay needs a currency, an amount above zero and a valid range', 400)
    if (!isJobCategory(b.category) || !isJobWorkType(b.workType) || !isJobEmployment(b.employment) || !skills) {
      throw new HttpError('Invalid category, work type, employment or skills', 400)
    }
    if (!applyUrl || applyUrl.length > MAX_URL_LEN || !isApplyUrl(applyUrl)) throw new HttpError('Apply link must be an https URL or mailto: address', 400)

    const ref = adminDb().collection('jobs').doc()
    await ref.set({
      title, company, description, applyUrl, skills,
      category: b.category, workType: b.workType, employment: b.employment,
      location: location || null, compensation: null, pay,
      postedByUid: posterId(user), status: 'open', createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ ok: true, id: ref.id })
  })
}
