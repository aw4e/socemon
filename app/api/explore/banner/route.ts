import { put } from '@vercel/blob'
import { NextResponse, type NextRequest } from 'next/server'
import { HttpError, handle, requireUser } from '@/lib/api'
import { stored, trainerName } from '@/lib/explore-server'
import { sniffImageExt } from '@/lib/image-sniff'

const MAX_SIZE = 4 * 1024 * 1024

/** Stores an event banner in Vercel Blob. Only JPEG, PNG and WebP pass, judged by the file's bytes. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    if (!process.env.BLOB_READ_WRITE_TOKEN) throw new HttpError('Banner uploads are not set up yet. Post the event without one.', 503)
    await trainerName(user)
    await stored('explore-banner', user, 10)

    const file = (await req.formData().catch(() => null))?.get('file')
    if (!(file instanceof File)) throw new HttpError('No file', 400)
    if (file.size > MAX_SIZE) throw new HttpError('File too large (4 MB max)', 413)

    const bytes = new Uint8Array(await file.arrayBuffer())
    const ext = sniffImageExt(bytes)
    if (!ext) throw new HttpError('Only JPEG, PNG or WebP images are allowed', 400)

    const blob = await put(`event-banners/${user.toLowerCase()}-${Date.now()}.${ext}`, Buffer.from(bytes), {
      access: 'public',
      contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
    })
    return NextResponse.json({ url: blob.url })
  })
}
