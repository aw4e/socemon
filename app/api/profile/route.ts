import { NextResponse, type NextRequest } from 'next/server'
import { HttpError, address, clientIp, handle, readBody, requireUser } from '@/lib/api'
import { adminDb } from '@/lib/firebase-admin'
import { stored, trainerName } from '@/lib/explore-server'
import { MAX_BIO_LEN, resolveDesign, sanitizeLinks, sanitizePageDesign, type ProfileExtras } from '@/lib/profile-page'
import { sanitizeSkills } from '@/lib/explore'
import { underLimit } from '@/lib/ratelimit'
import { SESSION_COOKIE, readToken, sessionSecret } from '@/lib/session'

const doc = (addr: string) => adminDb().collection('socemonProfiles').doc(addr.toLowerCase())

/** A trainer's page extras. Public: it is what their profile page shows. Hidden links only come back to their owner. */
export function GET(req: NextRequest) {
  return handle(async () => {
    if (!underLimit(`profile:${clientIp(req)}`, 120, 60_000)) throw new HttpError('Too many requests', 429)
    const addr = address(req.nextUrl.searchParams.get('address'), 'address')
    const viewer = await readToken(sessionSecret(), 'session', req.cookies.get(SESSION_COOKIE)?.value)
    const mine = !!viewer && viewer.toLowerCase() === addr.toLowerCase()

    const d = (await doc(addr).get()).data()
    const extras: ProfileExtras = {
      bio: typeof d?.bio === 'string' ? d.bio : '',
      skills: sanitizeSkills(d?.skills ?? []) ?? [],
      links: (sanitizeLinks(d?.links ?? []) ?? []).filter((l) => mine || l.isVisible),
      design: resolveDesign(d?.pageDesign),
    }
    return NextResponse.json({ ...extras, mine }, { headers: { 'Cache-Control': 'no-store' } })
  })
}

/** Saves the caller's bio, skills, links and page design in one go. `pageDesign: null` resets the look to the defaults. */
export function PUT(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    await trainerName(user)
    await stored('profile-save', user, 30)

    const b = await readBody(req)
    const bio = typeof b.bio === 'string' ? b.bio.trim() : ''
    if (bio.length > MAX_BIO_LEN) throw new HttpError(`Bio can be up to ${MAX_BIO_LEN} characters`, 400)
    const skills = sanitizeSkills(b.skills ?? [])
    if (!skills) throw new HttpError('Invalid skills', 400)
    const links = sanitizeLinks(b.links ?? [])
    if (!links) throw new HttpError('Invalid links: use http(s), mailto or tel addresses, up to 20', 400)
    const design = b.pageDesign === null ? null : sanitizePageDesign(b.pageDesign ?? {})
    if (b.pageDesign !== null && !design) throw new HttpError('Invalid page design', 400)

    await doc(user).set({ address: user, bio, skills, links, pageDesign: design, updatedAt: new Date() }, { merge: true })
    return NextResponse.json({ ok: true })
  })
}
