'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { getAddress, isAddress, type Address } from 'viem'
import { monadTestnet } from 'viem/chains'
import { useReadContracts } from 'wagmi'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { PageView } from '@/components/profile/PageView'
import { Connected } from '@/components/socemon/Connected'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { post, request, useTrainer } from '@/lib/client'
import { DEFAULT_DESIGN, resolveColors, type ProfileExtras } from '@/lib/profile-page'
import { recordScan } from '@/lib/scans'
import { SPECIES, typesCaught } from '@/lib/socemon'

/* What a friend sees after scanning your QR: your page (pet, bio, links, in the look you chose), your progress, and a Connect button. */
export default function TrainerPage() {
  const { address } = useParams<{ address: string }>()
  const target = isAddress(address, { strict: false }) ? getAddress(address) : null
  const trainer = useTrainer(target)
  const profile = trainer.profile
  const [extras, setExtras] = useState<ProfileExtras | null>(null)

  useEffect(() => {
    if (!target) return
    let cancelled = false
    /* the page works without them: a failed load just shows the default look and no links */
    request<ProfileExtras>('GET', `/api/profile?address=${target}`).then((d) => { if (!cancelled) setExtras(d) }).catch(() => {})
    return () => { cancelled = true }
  }, [target])

  if (target && trainer.loading) return <PageSpinner />
  if (target && trainer.error) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-8 text-center">
        <h1 className="font-poster text-[40px] uppercase leading-none">Monad is busy</h1>
        <p className="font-sans text-[15px] font-bold text-text-secondary">Could not read this trainer from the chain.</p>
        <Button onClick={() => trainer.refetch()}>Try again</Button>
      </main>
    )
  }
  if (!target || !profile?.registered) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-8 text-center">
        <h1 className="font-poster text-[40px] uppercase leading-none">No trainer here yet</h1>
        <Link href="/app" className="font-sans text-[14px] font-extrabold uppercase tracking-[0.06em] text-text-accent">Catch your own Socemon</Link>
      </main>
    )
  }

  return (
    <main>
      <PageView
        trainer={{
          name: profile.name, role: profile.role, partner: Number(profile.partner),
          friends: trainer.connections?.length ?? 0, types: `${typesCaught(trainer.owned)}/5`, caught: `${trainer.owned.size}/${SPECIES.length + 1}`,
        }}
        extras={extras ?? { bio: '', skills: [], links: [] }}
        design={extras?.design ?? DEFAULT_DESIGN}
        footer={
          <>
            {/* the Connect card keeps the game's own dark look, whatever theme the trainer picked */}
            <section className="rounded-[28px] bg-bg-base text-text-primary border-2 border-(--border-default) p-5">
              <Gate>{(viewer) => <ConnectBox viewer={viewer} target={target} name={profile.name} />}</Gate>
            </section>
            <Link href="/" aria-label="Socemon home" className="self-center opacity-80"><Logo height={20} tone={resolveColors(extras?.design ?? DEFAULT_DESIGN).dark ? 'dark' : 'light'} /></Link>
          </>
        }
      />
    </main>
  )
}

function ConnectBox({ viewer, target, name }: { viewer: Address; target: Address; name: string }) {
  const contract = { address: socemonAddress(), abi: SOCEMON_ABI, chainId: monadTestnet.id } as const
  const { data, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...contract, functionName: 'link', args: [viewer, target] },
      { ...contract, functionName: 'link', args: [target, viewer] },
    ],
    query: { refetchInterval: 5_000 },
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [friends, setFriends] = useState(false)
  const code = useSearchParams().get('c') ?? undefined
  /* a phone camera scan lands here with the live code and never passes through the in-app scanner */
  useEffect(() => { if (code && viewer !== target) recordScan(viewer, target) }, [code, viewer, target])

  async function connect() {
    setBusy(true)
    setError('')
    try {
      const { status } = await post<{ status: string }>('/api/connect', { to: target, code })
      await refetch()
      if (status === 'connected') setFriends(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const [mine, theirs] = data ?? [0, 0]
  if (friends) return <Connected friend={target} onDone={() => setFriends(false)} />
  if (viewer === target) {
    return (
      <p className="text-center font-sans text-[15px] font-bold text-text-secondary">
        This is your profile. <Link href="/app" className="text-text-accent">Back home</Link>
      </p>
    )
  }
  if (mine === 2) return <Status tone="done">Friends · you both got an Egg</Status>
  if (mine === 1) return <Status tone="wait">Request sent · waiting for {name}</Status>
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Button size="lg" fullWidth loading={busy} onClick={connect}>{theirs === 1 ? `Accept ${name}` : `Connect with ${name}`}</Button>
      <p className="font-sans text-[13px] font-bold text-text-tertiary">
        {theirs === 1 || code ? 'This connects you both right away.' : `${name} approves, then you both get an Egg.`}
      </p>
      {error && <p role="alert" className="font-sans text-[14px] font-bold text-text-error">{error}</p>}
    </div>
  )
}

function Status({ tone, children }: { tone: 'done' | 'wait'; children: React.ReactNode }) {
  return (
    <p
      className="flex items-center justify-center gap-2 h-14 rounded-2xl font-sans text-[14px] font-extrabold uppercase tracking-[0.05em]"
      style={tone === 'done' ? { background: '#4ADE8024', color: '#4ADE80' } : { background: 'var(--fill)', color: 'var(--text-2)' }}
    >
      {children}
    </p>
  )
}
