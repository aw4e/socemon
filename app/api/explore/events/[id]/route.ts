import { NextResponse, type NextRequest } from 'next/server'
import { HttpError, handle, requireUser } from '@/lib/api'
import { adminDb } from '@/lib/firebase-admin'
import { canModerate, stored } from '@/lib/explore-server'
import { isDocId, posterId } from '@/lib/explore'

/** Removes an event. Only its host (or an event host) can. */
export function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    const user = await requireUser(req)
    await stored('explore-event-delete', user, 20)

    const { id } = await params
    if (!isDocId(id)) throw new HttpError('Event not found', 404)
    const ref = adminDb().collection('events').doc(id)
    const snap = await ref.get()
    if (!snap.exists) throw new HttpError('Event not found', 404)
    if (snap.data()!.hostUid !== posterId(user) && !(await canModerate(user))) throw new HttpError('Only the host can remove this event', 403)

    await ref.delete()
    return NextResponse.json({ ok: true })
  })
}
