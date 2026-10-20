'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getAddress, isAddress, type Address } from 'viem'
import { monadTestnet } from 'viem/chains'
import { useReadContracts } from 'wagmi'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { post, useTrainer } from '@/lib/client'
import { ROLES, SPECIES, speciesById } from '@/lib/socemon'

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
        <h1 className="font-display text-[26px] text-text-primary">Monad is busy</h1>
        <p className="font-sans text-[14px] text-text-secondary">Could not read this trainer from the chain.</p>
        <Button onClick={() => trainer.refetch()}>Try again</Button>
      </main>
    )
  }
  if (!target || !profile?.registered) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-8 text-center">
        <h1 className="font-display text-[26px] text-text-primary">No trainer here yet</h1>
        <Link href="/" className="font-sans text-[14px] font-medium text-text-accent">Catch your own Socemon</Link>
      </main>
    )
  }

  const partner = Number(profile.partner)
  const role = ROLES[profile.role]
  return (
    <main className="px-5 pb-10">
      <header className="h-16 flex items-center">
        <Link href="/" aria-label="Socemon home"><Logo height={22} /></Link>
      </header>
      <section className="flex flex-col items-center text-center">
        <MonsterImage id={partner} size={180} />
        <h1 className="font-display text-[28px] text-text-primary mt-2">{profile.name}</h1>
        <p className="font-sans text-[13px] text-text-secondary">
          {role?.label} · {role?.type} type · partner {speciesById(partner)?.name}
        </p>
        <p className="font-mono text-[12px] text-text-tertiary mt-2">
          {trainer.owned.size}/{SPECIES.length + 1} caught · {trainer.connections?.length ?? 0} connections
        </p>
      </section>
      <section className="mt-6">
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

  async function connect() {
    setBusy(true)
    setError('')
    try {
      await post('/api/connect', { to: target })
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const [mine, theirs] = data ?? [0, 0]
  if (viewer === target) {
    return (
      <p className="text-center font-sans text-[14px] text-text-secondary">
        This is your profile. <Link href="/" className="text-text-accent">Back home</Link>
      </p>
    )
  }
  if (mine === 2) return <p className="text-center font-sans text-[14px] text-text-secondary">You and {name} are connected. You both got an Egg.</p>
  if (mine === 1) return <p className="text-center font-sans text-[14px] text-text-secondary">Request sent. You both get an Egg once {name} approves.</p>
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Button size="lg" loading={busy} onClick={connect}>{theirs === 1 ? `Accept ${name}'s request` : `Connect with ${name}`}</Button>
      <p className="font-sans text-[12px] text-text-tertiary">
        {theirs === 1 ? 'They already asked, so this connects you both right away.' : `${name} approves, then you both get an Egg.`}
      </p>
      {error && <p role="alert" className="font-sans text-[13px] text-text-error">{error}</p>}
    </div>
  )
}
