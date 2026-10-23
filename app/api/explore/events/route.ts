import { NextResponse, type NextRequest } from 'next/server'
import { FieldValue } from 'firebase-admin/firestore'
import { HttpError, handle, readBody, requireUser } from '@/lib/api'
import { adminDb } from '@/lib/firebase-admin'
import { canModerate, stored, toIso, trainerName } from '@/lib/explore-server'
import { isHttpUrl, posterId, type ExploreEvent } from '@/lib/explore'

const MAX_TITLE_LEN = 100
const MAX_LINK_LEN = 2048
const DAY_MS = 86_400_000
/* banners are only accepted from our own Vercel Blob folder, the one /api/explore/banner writes to */
const BANNER_URL = /^https:\/\/[a-z0-9]+\.public\.blob\.vercel-storage\.com\/event-banners\//

/** The newest 100 events. */
export function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const snap = await adminDb().collection('events').orderBy('createdAt', 'desc').limit(100).get()
    const me = posterId(user)
    const events = snap.docs.flatMap((d): ExploreEvent[] => {
      const e = d.data()
      if (!e.link || !e.title) return []
      return [{
        id: d.id, title: e.title, link: e.link, bannerUrl: e.bannerUrl ?? undefined,
        hostName: e.hostName ?? 'Someone', mine: e.hostUid === me, createdAt: toIso(e.createdAt),
      }]
    })
    return NextResponse.json({ events, canModerate: await canModerate(user) }, { headers: { 'Cache-Control': 'no-store' } })
  })
}

/** Posts an event: a title, an optional banner and the link where people actually join. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    await stored('explore-event', user, 10, DAY_MS)

    const body = await readBody(req)
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    const link = typeof body.link === 'string' ? body.link.trim() : ''
    const bannerUrl = typeof body.bannerUrl === 'string' ? body.bannerUrl.trim() : ''
    if (!title || title.length > MAX_TITLE_LEN) throw new HttpError(`Title must be 1-${MAX_TITLE_LEN} characters`, 400)
    if (!link || link.length > MAX_LINK_LEN || !isHttpUrl(link)) throw new HttpError('Link must be a valid http(s) URL', 400)
    if (bannerUrl && (bannerUrl.length > MAX_LINK_LEN || !BANNER_URL.test(bannerUrl))) {
      throw new HttpError('Banner must be an image uploaded through the app', 400)
    }

    const ref = adminDb().collection('events').doc()
    await ref.set({
      title, link, bannerUrl: bannerUrl || null,
      hostUid: posterId(user), hostName: await trainerName(user),
      createdAt: FieldValue.serverTimestamp(),
    })
    return NextResponse.json({ ok: true, id: ref.id })
  })
}
