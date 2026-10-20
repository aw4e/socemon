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
    <div className="relative w-full max-w-[320px] aspect-square rounded-3xl overflow-hidden bg-black">
      <video ref={video} className="w-full h-full object-cover" muted playsInline />
      <div aria-hidden className="absolute inset-8 rounded-2xl border-2 border-white/80" />
      {error && (
        <p role="alert" className="absolute inset-0 flex items-center justify-center p-6 text-center font-sans text-[14px] text-white/80 bg-black/80">
          {error}
        </p>
      )}
    </div>
  )
}
