'use client'
import { useEffect, useRef, useState } from 'react'
import type QrScanner from 'qr-scanner'

/* Live camera scanner. qr-scanner uses the browser's BarcodeDetector where it exists and a worker elsewhere (iOS Safari).
   `onScan` returns true when it handled the code, which stops the camera; otherwise scanning continues. */
export function Scanner({ onScan }: { onScan: (text: string) => boolean }) {
  const video = useRef<HTMLVideoElement>(null)
  const handler = useRef(onScan)
  const [error, setError] = useState('')

  useEffect(() => {
    handler.current = onScan
  }, [onScan])

  useEffect(() => {
    let scanner: QrScanner | null = null
    let cancelled = false
    if (!window.isSecureContext) {
      setError('The camera only works over https.')
      return
    }
    import('qr-scanner').then(({ default: QrScannerLib }) => {
      if (cancelled || !video.current) return
      scanner = new QrScannerLib(video.current, (result) => {
        if (handler.current(result.data)) scanner?.stop()
      }, {
        preferredCamera: 'environment',
        returnDetailedScanResult: true,
        maxScansPerSecond: 12,
        /* scan the whole frame, not the library's centre two-thirds: people hold the phone close until the code fills
           the screen, and a code bigger than that box never decodes. Downscaled so big frames stay fast. */
        calculateScanRegion: (v) => {
          const scale = Math.min(1, 800 / Math.max(v.videoWidth, v.videoHeight))
          return { x: 0, y: 0, width: v.videoWidth, height: v.videoHeight, downScaledWidth: Math.round(v.videoWidth * scale), downScaledHeight: Math.round(v.videoHeight * scale) }
        },
        onDecodeError: () => {},
      })
      scanner.start().catch((err: unknown) => {
        const name = err instanceof Error ? err.name : String(err)
        setError(
          name === 'NotAllowedError' ? 'Camera access is blocked. Allow it in your browser settings and reopen this tab.'
            : /camera not found|NotFoundError/i.test(name) ? 'No camera found on this device.'
            : 'Could not start the camera.',
        )
      })
    })
    return () => {
      cancelled = true
      scanner?.destroy()
    }
  }, [])

  return (
    <div className="relative w-full aspect-square rounded-[32px] overflow-hidden bg-[#06040D]">
      <video ref={video} className="w-full h-full object-cover" muted playsInline />
      <div aria-hidden className="absolute inset-[14%]">
        {CORNERS.map((c) => (
          <span key={c} className={`absolute w-11 h-11 border-white ${c}`} />
        ))}
        {!error && <span className="animate-sweep absolute inset-x-2 h-[3px] rounded-full bg-primary shadow-[0_0_18px_4px_rgba(131,110,249,0.8)]" />}
      </div>
      {error && (
        <p role="alert" className="absolute inset-0 flex items-center justify-center p-8 text-center font-sans text-[15px] font-bold text-white/85 bg-[#06040D]/85">
          {error}
        </p>
      )}
    </div>
  )
}

const CORNERS = [
  'top-0 left-0 border-t-[5px] border-l-[5px] rounded-tl-[22px]',
  'top-0 right-0 border-t-[5px] border-r-[5px] rounded-tr-[22px]',
  'bottom-0 left-0 border-b-[5px] border-l-[5px] rounded-bl-[22px]',
  'bottom-0 right-0 border-b-[5px] border-r-[5px] rounded-br-[22px]',
]
