import { NextResponse, type NextRequest } from 'next/server'
import { HttpError, handle, readBody, requireUser } from '@/lib/api'
import { adminDb } from '@/lib/firebase-admin'
import { stored } from '@/lib/explore-server'
import { isDocId, posterId } from '@/lib/explore'

/** Opens or closes a listing. Only the poster can change it. */
export function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req)
    await stored('explore-job-update', user, 30)

    const { status } = await readBody(req)
    if (status !== 'open' && status !== 'closed') throw new HttpError('Invalid status', 400)

    const { id } = await params
    if (!isDocId(id)) throw new HttpError('Job not found', 404)
    const ref = adminDb().collection('jobs').doc(id)
    const snap = await ref.get()
    if (!snap.exists) throw new HttpError('Job not found', 404)
    if (snap.data()!.postedByUid !== posterId(user)) throw new HttpError('Only the poster can change this listing', 403)

    await ref.update({ status })
    return NextResponse.json({ ok: true })
  })
}
