'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, Copy, Share2 } from 'lucide-react'
import QRCode from 'qrcode'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/Button'
import { useNames, useTrainer, useUser } from '@/lib/client'

/* The center tab: your QR for friends to scan with their phone camera, and everyone you are connected with. */
export default function QrPage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const nameOf = useNames(trainer.connections)
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  const [link, setLink] = useState('')
  const [canShare, setCanShare] = useState(false)

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
    <div>
      <PageHeader title="My QR" />

      <section className="flex flex-col items-center text-center">
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="QR code to your Socemon profile" className="w-72 rounded-3xl bg-white p-4" />
        ) : (
          <div className="w-72 aspect-square rounded-3xl bg-[var(--fill)]" />
        )}
        <p className="font-display text-[22px] text-text-primary mt-4">{trainer.profile?.name}</p>
        <p className="font-sans text-[13px] text-text-secondary max-w-xs mt-1">
          Friends scan this with their phone camera and tap Connect. Approve them on Home and you both get an Egg.
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
      </section>

      <section className="mt-10">
        <h2 className="eyebrow mb-3">Connections · {trainer.connections?.length ?? 0}</h2>
        {!trainer.connections?.length ? (
          <p className="font-sans text-[13px] text-text-secondary">No connections yet. Your first one is a scan away.</p>
        ) : (
          <ul className="space-y-2">
            {[...trainer.connections].reverse().map((a) => (
              <li key={a}>
                <Link href={`/u/${a}`} className="flex items-center rounded-[14px] bg-[var(--fill)] px-4 py-3 font-sans text-[14px] text-text-primary">
                  {nameOf(a)}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
