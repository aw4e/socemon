'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Handshake } from 'lucide-react'
import QRCode from 'qrcode'
import { Logo } from '@/components/brand/Logo'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { speciesById } from '@/lib/socemon'

type FeedItem = { key: string; text: string; monsterId: number | null }

const POLL_MS = 2_000
const FEED_SIZE = 30

/* Projector view: the rotating check-in QR, how many drops are left, and every catch as it lands onchain. */
export function WallScreen({ wallKey, eventName, dropId }: { wallKey: string; eventName: string; dropId: number }) {
  const [token, setToken] = useState('')
  const [qr, setQr] = useState('')
  const [dropped, setDropped] = useState<number | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const drop = speciesById(dropId)

  useEffect(() => {
    let cursor = ''
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    /* polls back to back, never overlapping, so a slow RPC cannot read the same blocks twice */
    async function poll() {
      try {
        const res = await fetch(`/api/wall?key=${encodeURIComponent(wallKey)}${cursor ? `&from=${cursor}` : ''}`)
        if (res.ok) {
          const data: { token: string; dropped: number; feed: FeedItem[]; cursor: string } = await res.json()
          if (cancelled) return
          cursor = data.cursor
          setToken(data.token)
          setDropped(data.dropped)
          if (data.feed.length) setFeed((f) => [...data.feed.reverse(), ...f].slice(0, FEED_SIZE))
        }
      } catch (err) {
        console.error('wall poll failed', err)
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS)
    }
    poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [wallKey])

  useEffect(() => {
    if (token) QRCode.toDataURL(`${window.location.origin}/api/checkin/ticket?t=${encodeURIComponent(token)}`, { margin: 1, width: 720 }).then(setQr)
  }, [token])

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto text-white" style={{ background: '#07070B' }}>
      <div className="min-h-full grid grid-cols-1 lg:grid-cols-[minmax(320px,32%)_1fr] gap-10 p-10">
        <aside className="flex flex-col items-center gap-6 text-center lg:sticky lg:top-10 self-start">
          <Logo height={32} tone="dark" />
          <h1 className="font-poster text-[56px] uppercase leading-none">{eventName}</h1>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Check-in QR code" className="w-full max-w-[360px] rounded-3xl bg-white p-4" />
          ) : (
            <div className="w-full max-w-[360px] aspect-square rounded-3xl bg-white/10" />
          )}
          <p className="font-sans text-[20px] font-bold text-white/80">Scan with the Socemon app to catch {drop?.name ?? 'the event drop'}</p>
          <div className="flex gap-10">
            <div>
              <p className="font-poster text-[64px] leading-none">{dropped ?? '–'}</p>
              <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 mt-2">caught</p>
            </div>
            {drop && dropped != null && (
              <div>
                <p className="font-poster text-[64px] leading-none text-[#836EF9]">{Math.max(0, drop.maxSupply - dropped)}</p>
                <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 mt-2">{drop.name} left</p>
              </div>
            )}
          </div>
        </aside>

        <main aria-live="polite">
          {feed.length === 0 ? (
            <p className="font-poster text-[48px] uppercase text-white/30 text-center mt-24">Waiting for the first catch</p>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {feed.map((item) => (
                  <motion.li
                    key={item.key}
                    layout
                    initial={{ x: 60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                    className="flex items-center gap-4 rounded-3xl bg-white/5 px-5 py-4"
                  >
                    {item.monsterId != null ? (
                      <MonsterImage id={item.monsterId} size={64} />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Handshake className="w-8 h-8 text-white/70" />
                      </div>
                    )}
                    <p className="font-sans text-[22px] font-extrabold">{item.text}</p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}
