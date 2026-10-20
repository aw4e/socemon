import { ImageResponse } from 'next/og'

/* Generated instead of a static PNG so the social preview never drifts from the brand name. */
export const alt = 'Socemon'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'linear-gradient(160deg, #0B0C14 0%, #1B1245 100%)', color: '#F4F4F5',
        }}
      >
        <div style={{ fontSize: 132, fontWeight: 700, letterSpacing: -4 }}>Socemon</div>
        <div style={{ fontSize: 40, color: '#B7B0FF', marginTop: 12 }}>Social on Monad. Catch your network.</div>
      </div>
    ),
    size,
  )
}
