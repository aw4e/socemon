import { NextResponse, type NextRequest } from 'next/server'
import { handle, requireUser } from '@/lib/api'

export function GET(req: NextRequest) {
  return handle(async () => NextResponse.json({ address: await requireUser(req) }))
}
