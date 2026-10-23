import { NextResponse, type NextRequest } from 'next/server'
import { handle, requireUser } from '@/lib/api'
import { meetCode } from '@/lib/checkin'

/** The rotating code inside "My code": scanning it proves you are standing next to its owner. */
export function GET(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    return NextResponse.json({ code: meetCode(user, Date.now()) }, { headers: { 'Cache-Control': 'no-store' } })
  })
}
