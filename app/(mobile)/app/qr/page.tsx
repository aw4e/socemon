'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Address } from 'viem'
import { Check, Copy, Share2 } from 'lucide-react'
import QRCode from 'qrcode'
import { PageHeader } from '@/components/PageHeader'
import { Connected } from '@/components/socemon/Connected'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Scanner } from '@/components/Scanner'
import { Button } from '@/components/ui/Button'
import { post, useTrainer, useUser } from '@/lib/client'
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
      <div role="tablist" aria-label="Scan or show your code" className="grid grid-cols-2 gap-1 p-1.5 rounded-[20px] bg-bg-surface border border-(--border-default) mb-6">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={mode === m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              'h-11 rounded-[14px] font-sans text-[13px] font-extrabold uppercase tracking-[0.06em] transition-all',
              mode === m.id ? 'bg-primary text-white shadow-[0_3px_0_var(--primary-shadow)]' : 'text-text-tertiary',
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
  const trainer = useTrainer(user)
  const [hint, setHint] = useState('')
  const [busy, setBusy] = useState(false)
  const [friend, setFriend] = useState<Address | null>(null)

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
    /* an old printed or shared profile link has no live code: open the profile to send a request */
    if (!scan.code) {
      router.push(`/u/${scan.address}`)
      return true
    }
    const to = scan.address
    setBusy(true)
    setHint('Connecting onchain…')
    post('/api/connect', { to, code: scan.code })
      .then(() => {
        setHint('')
        setFriend(to)
        trainer.refetch()
      })
      .catch((err) => setHint(err instanceof Error ? err.message : 'Something went wrong'))
      .finally(() => setBusy(false))
    return true
  }, [router, user, trainer])

  if (friend) return <Connected friend={friend} onDone={() => setFriend(null)} />
  if (busy) {
    return (
      <section className="flex flex-col items-center text-center gap-4 py-20" role="status">
        <div className="w-10 h-10 rounded-full border-[3px] border-(--border-default) border-t-primary animate-spin" />
        <p className="font-sans text-[15px] font-bold text-text-secondary">{hint}</p>
      </section>
    )
  }

  return (
    <section className="flex flex-col items-center text-center">
      <Scanner onScan={onScan} />
      <p role="status" className="font-sans text-[15px] font-bold text-text-secondary max-w-xs mt-5">
        {hint || 'Point at a friend’s Socemon code to connect, or at the Event Wall to check in.'}
      </p>
    </section>
  )
}

function CodeMode() {
  const user = useUser()
  const trainer = useTrainer(user, 2_000)
  const [qr, setQr] = useState('')
  const [friend, setFriend] = useState<Address | null>(null)
  const seen = useRef<Set<string> | null>(null)
  const [link, setLink] = useState('')
  const [canShare, setCanShare] = useState(false)
  const [copied, setCopied] = useState(false)
  const partner = Number(trainer.profile?.partner ?? 0n)

  useEffect(() => {
    const url = `${window.location.origin}/u/${user}`
    setLink(url)
    setCanShare('share' in navigator)
    /* the QR carries a code that rotates every 30s, so scanning it means you are here; the shared link stays plain */
    let timer: ReturnType<typeof setTimeout>
    async function refresh() {
      try {
        const { code } = await (await fetch('/api/meet')).json()
        setQr(await QRCode.toDataURL(`${url}?c=${encodeURIComponent(code)}`, { margin: 1, width: 640 }))
      } catch {}
      timer = setTimeout(refresh, 20_000)
    }
    refresh()
    return () => clearTimeout(timer)
  }, [user])

  useEffect(() => {
    const list = trainer.connections
    if (!list) return
    if (!seen.current) {
      seen.current = new Set(list)
      return
    }
    const fresh = list.find((a) => !seen.current!.has(a))
    list.forEach((a) => seen.current!.add(a))
    if (fresh) setFriend(fresh)
  }, [trainer.connections])

  if (friend) return <Connected friend={friend} onDone={() => setFriend(null)} />

  async function copy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2_000)
  }

  return (
    <section className="flex flex-col items-center text-center pt-14">
      <div className="relative w-full max-w-[300px] rounded-[30px] bg-white p-5 pt-14 shadow-[0_6px_0_rgba(255,255,255,0.12)]">
        <div className="absolute -top-16 left-1/2 -translate-x-1/2 animate-float">
          <MonsterImage key={partner} id={partner} size={112} />
        </div>
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR code to your Socemon profile" className="w-full" />
        ) : (
          <div className="w-full aspect-square rounded-2xl bg-black/5" />
        )}
        <p className="font-poster text-[30px] uppercase leading-none text-[#0D0A1A] mt-3 truncate">{trainer.profile?.name}</p>
        <div className="mt-2 border-t-2 border-dashed border-black/15 pt-2 font-sans text-[11px] font-extrabold uppercase tracking-[0.1em] text-black/45">
          Scan to connect · Socemon
        </div>
      </div>
      <p className="font-sans text-[15px] font-bold text-text-secondary max-w-xs mt-6">
        A friend scans this in their Socemon app and you are connected right away. You both get an Egg and a blind box.
      </p>
      <div className="flex gap-3 mt-5">
        <Button variant="secondary" size="sm" onClick={copy}>
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />} {copied ? 'Copied' : 'Copy link'}
        </Button>
        {canShare && (
          <Button variant="secondary" size="sm" onClick={() => navigator.share({ title: 'Connect on Socemon', url: link }).catch(() => {})}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
        )}
      </div>
      <Link href="/app/friends" className="font-sans text-[14px] font-extrabold uppercase tracking-[0.06em] text-text-accent mt-8">
        Your friends · {trainer.connections?.length ?? 0}
      </Link>
    </section>
  )
}
