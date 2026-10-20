'use client'
import { monadTestnet } from 'viem/chains'
import { useReadContracts } from 'wagmi'
import { PageHeader } from '@/components/PageHeader'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { useUser } from '@/lib/client'
import { TIER_COLOR, speciesById } from '@/lib/socemon'
import { cn } from '@/lib/utils'

/* The event tab: this deployment's drop, how many are left, and whether you already checked in. */
export function EventScreen({ name, dropId, live }: { name: string; dropId: number; live: boolean }) {
  const user = useUser()
  const drop = speciesById(dropId)
  const contract = { address: socemonAddress(), abi: SOCEMON_ABI, chainId: monadTestnet.id } as const
  const { data } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...contract, functionName: 'species', args: [BigInt(dropId)] },
      { ...contract, functionName: 'claimedDrop', args: [user, BigInt(dropId)] },
    ],
    query: { refetchInterval: 10_000 },
  })
  const minted = data?.[0][2]
  const claimed = data?.[1] ?? false
  const left = drop && minted != null ? Math.max(0, drop.maxSupply - minted) : null

  return (
    <div>
      <PageHeader title="Event" />

      <section className="rounded-3xl bg-[var(--fill)] p-5 flex flex-col items-center text-center">
        <span
          className={cn(
            'rounded-full px-3 py-1 font-mono text-[11px] uppercase tracking-[0.08em]',
            live ? 'bg-[var(--accent-primary-dim)] text-text-accent' : 'bg-[var(--fill)] text-text-tertiary',
          )}
        >
          {live ? 'Live now' : 'Not live'}
        </span>
        <h2 className="font-display text-[26px] leading-tight text-text-primary mt-3">{name}</h2>
        <div className="rounded-full p-4 mt-4" style={{ background: `radial-gradient(circle, ${TIER_COLOR.event}33 0%, transparent 70%)` }}>
          <MonsterImage id={dropId} size={150} silhouette={!claimed} />
        </div>
        <p className="font-display text-[22px] text-text-primary mt-2">{claimed ? drop?.name : '???'}</p>
        <p className="font-sans text-[12px] text-text-tertiary">Event drop · tradeable · only {drop?.maxSupply} exist</p>
        <p className="font-mono text-[28px] text-text-primary mt-4">{left ?? '–'}</p>
        <p className="font-sans text-[11px] text-text-tertiary">left of {drop?.maxSupply}</p>
      </section>

      <section className="mt-6 rounded-2xl border border-(--border-subtle) px-4 py-4">
        {claimed ? (
          <p className="font-sans text-[14px] text-text-primary">You checked in. {drop?.name} is in your Socédex, and your attendance is onchain.</p>
        ) : (
          <>
            <h3 className="font-sans text-[14px] font-medium text-text-primary">How to check in</h3>
            <ol className="mt-2 space-y-1.5 font-sans text-[13px] text-text-secondary list-decimal pl-5">
              <li>Find the Event Wall on the projector.</li>
              <li>Scan its QR with your phone camera. It changes every 30 seconds, so you have to be in the room.</li>
              <li>Tap Catch and {drop?.name ?? 'the drop'} is yours.</li>
            </ol>
          </>
        )}
      </section>
    </div>
  )
}
