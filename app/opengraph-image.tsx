import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'

/* Generated instead of a static PNG so the social preview never drifts from the brand name and the mascot in public/brand. */
export const alt = 'Socemon'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const mark = `data:image/png;base64,${(await readFile(join(process.cwd(), 'public/brand/mark.png'))).toString('base64')}`
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 64,
          background: 'linear-gradient(160deg, #6EF0E1 0%, #28A0EB 100%)', color: '#FFFFFF',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={mark} width={400} height={400} alt="" />
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 140, fontWeight: 800, letterSpacing: -4, lineHeight: 1 }}>Socemon</div>
          <div style={{ fontSize: 38, color: '#0B3A66', marginTop: 20, fontWeight: 700 }}>Social on Monad. Catch your network.</div>
        </div>
      </div>
    ),
    size,
  )
}
