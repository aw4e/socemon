import { NextResponse, type NextRequest } from 'next/server'
import { HttpError, handle, int, readBody, requireUser } from '@/lib/api'
import { relay } from '@/lib/chain'
import { STARTER_ID } from '@/lib/socemon'

/** Saves the trainer's name and role onchain and mints Soci. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const body = await readBody(req)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const bytes = new TextEncoder().encode(name).length
    if (bytes < 1 || bytes > 24) throw new HttpError('Pick a name between 1 and 24 characters', 400)
    const role = int(body.role, 5, 'role')
    const { tx, ms } = await relay('register', [user, name, role])
    return NextResponse.json({ tx, ms, monsterId: STARTER_ID })
  })
}
