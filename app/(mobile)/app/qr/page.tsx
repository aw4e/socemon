'use client'
import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, Copy, Share2 } from 'lucide-react'
import QRCode from 'qrcode'
import { PageHeader } from '@/components/PageHeader'
import { Scanner } from '@/components/Scanner'
import { Button } from '@/components/ui/Button'
import { useTrainer, useUser } from '@/lib/client'
import { parseScan } from '@/lib/scan'
import { cn } from '@/lib/utils'

const MODES = [
  { id: 'scan', label: 'Scan' },
  { id: 'code', label: 'My code' },
] as const

/* The center tab: scan a friend's code to connect (or the Event Wall to check in), or show your own. */
export default function QrPage() {
  const [mode, setMode] = useState<(typeof MODES)[number]['id']>('scan')
  return (
    <div>
      <PageHeader title={mode === 'scan' ? 'Scan' : 'My code'} />
      <div role="tablist" aria-label="Scan or show your code" className="grid grid-cols-2 p-1 rounded-full bg-[var(--fill)] mb-6">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'h-9 rounded-full font-sans text-[14px] transition-colors',
              mode === m.id ? 'bg-[var(--bg-surface)] text-text-primary shadow-sm' : 'text-text-tertiary',
            )}
          >
            {m.label}
          </button>
        ))}
      </div>
      {mode === 'scan' ? <ScanMode /> : <CodeMode />}
    </div>
  )
}

function ScanMode() {
  const user = useUser()
  const router = useRouter()
  const [hint, setHint] = useState('')

  const onScan = useCallback((text: string) => {
    const scan = parseScan(text, window.location.origin)
    if (!scan) {
      setHint('That is not a Socemon code.')
      return false
    }
    /* the ticket route sets a cookie and redirects, so it needs a full navigation */
    if (scan.kind === 'checkin') {
      window.location.assign(scan.path)
      return true
    }
    if (scan.address === user) {
      setHint('That is your own code.')
      return false
    }
    router.push(`/u/${scan.address}`)
    return true
  }, [router, user])

  return (
    <section className="flex flex-col items-center text-center">
      <Scanner onScan={onScan} />
      <p role="status" className="font-sans text-[13px] text-text-secondary max-w-xs mt-4">
        {hint || 'Point at a friend’s Socemon code to connect, or at the Event Wall to check in.'}
      </p>
    </section>
  )
}

function CodeMode() {
  const user = useUser()
  const trainer = useTrainer(user)
  const [qr, setQr] = useState('')
  const [link, setLink] = useState('')
  const [canShare, setCanShare] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const url = `${window.location.origin}/u/${user}`
    setLink(url)
    setCanShare('share' in navigator)
    QRCode.toDataURL(url, { margin: 1, width: 640 }).then(setQr)
  }, [user])

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2_000)
  }

  return (
    <section className="flex flex-col items-center text-center">
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="QR code to your Socemon profile" className="w-72 rounded-3xl bg-white p-4" />
      ) : (
        <div className="w-72 aspect-square rounded-3xl bg-[var(--fill)]" />
      )}
      <p className="font-display text-[22px] text-text-primary mt-4">{trainer.profile?.name}</p>
      <p className="font-sans text-[13px] text-text-secondary max-w-xs mt-1">
        A friend scans this in their Socemon app and taps Connect. Approve them on Home and you both get an Egg.
      </p>
      <div className="flex gap-2 mt-4">
        <Button variant="secondary" size="sm" onClick={copy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy link'}
        </Button>
        {canShare && (
          <Button variant="secondary" size="sm" onClick={() => navigator.share({ title: 'Connect on Socemon', url: link }).catch(() => {})}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
        )}
      </div>
      <Link href="/app/friends" className="font-sans text-[14px] font-medium text-text-accent mt-8">
        Your friends · {trainer.connections?.length ?? 0}
      </Link>
    </section>
  )
}
