'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { getAddress, isAddress, type Address } from 'viem'
import { monadTestnet } from 'viem/chains'
import { useReadContracts } from 'wagmi'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { MonsterStage } from '@/components/socemon/MonsterStage'
import { TypeChip } from '@/components/socemon/TypeChip'
import { Connected } from '@/components/socemon/Connected'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { post, useTrainer } from '@/lib/client'
import { SPECIES, typesCaught } from '@/lib/socemon'

/* What a friend sees after scanning your QR: your partner, your progress, and a Connect button. */
export default function TrainerPage() {
  const { address } = useParams<{ address: string }>()
  const target = isAddress(address, { strict: false }) ? getAddress(address) : null
  const trainer = useTrainer(target)
  const profile = trainer.profile

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

  const partner = Number(profile.partner)
  return (
    <main className="px-5 pb-10">
      <header className="h-16 flex items-center">
        <Link href="/" aria-label="Socemon home"><Logo height={22} tone="dark" /></Link>
      </header>
      <section className="flex flex-col items-center text-center">
        <p className="eyebrow">Trainer</p>
        <MonsterStage id={partner} size={200} />
        <h1 className="font-sans font-black text-[32px] leading-tight mt-1">{profile.name}</h1>
        <TypeChip role={profile.role} className="mt-2" />
      </section>
      <dl className="grid grid-cols-3 mt-7 divide-x divide-(--border-subtle)">
        {[
          { value: trainer.connections?.length ?? 0, label: 'Friends' },
          { value: `${typesCaught(trainer.owned)}/5`, label: 'Types' },
          { value: `${trainer.owned.size}/${SPECIES.length + 1}`, label: 'Caught' },
        ].map((s) => (
          <div key={s.label} className="flex flex-col-reverse items-center gap-1">
            <dt className="eyebrow">{s.label}</dt>
            <dd className="font-poster text-[32px] leading-none">{s.value}</dd>
          </div>
        ))}
      </dl>
      <section className="mt-8">
        <Gate>{(viewer) => <ConnectBox viewer={viewer} target={target} name={profile.name} />}</Gate>
      </section>
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
