import { NextResponse, type NextRequest } from 'next/server'
import { handle, requireUser } from '@/lib/api'
import { adminDb } from '@/lib/firebase-admin'
import type { ExplorePerson } from '@/lib/explore'

/** The newest 300 trainers. Filtering by name and role happens in the browser; one event is a few hundred people, not millions. */
export function GET(req: NextRequest) {
  return handle(async () => {
    await requireUser(req)
    const snap = await adminDb().collection('socemonTrainers').orderBy('registeredAt', 'desc').limit(300).get()
    const people = snap.docs.flatMap((d): ExplorePerson[] => {
      const t = d.data()
      return t.address && t.name ? [{ address: t.address, name: t.name, role: t.role ?? 0 }] : []
    })
    return NextResponse.json({ people }, { headers: { 'Cache-Control': 'no-store' } })
  })
}
