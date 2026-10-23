'use client'
import { monadTestnet } from 'viem/chains'
import { useReadContracts } from 'wagmi'
import { MonsterStage } from '@/components/socemon/MonsterStage'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { useUser } from '@/lib/client'
import Link from 'next/link'
import { QrCode } from 'lucide-react'
import { MONAD_PURPLE, isDropWearable, speciesById } from '@/lib/socemon'

const STEPS = [
  'Find the Event Wall on the projector.',
  'Scan its code with the Scan button. It changes every 30 seconds, so you have to be in the room.',
  'Tap the button. The drop is yours, and your attendance is onchain.',
]

/* The event tab as a drop poster: who the drop is (a silhouette until you catch it), how many are left, and how to check in. */
export function EventScreen({ name, dropId, live, host }: { name: string; dropId: number; live: boolean; host: boolean }) {
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
    <div className="pt-6">
      {host && (
        <Link
          href="/wall"
          className="mb-4 flex items-center justify-center gap-2 h-14 rounded-2xl bg-primary text-primary-fg font-sans text-[15px] font-extrabold uppercase tracking-[0.05em] shadow-[0_4px_0_var(--primary-shadow)]"
        >
          <QrCode className="w-5 h-5" /> Show check-in QR
        </Link>
      )}
      <section
        className="grain relative overflow-hidden rounded-[34px] px-5 pt-5 pb-7 text-white"
        style={{ background: `linear-gradient(170deg, ${MONAD_PURPLE} 0%, #3A2A9E 55%, #170F3D 100%)` }}
      >
        <div className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-2 rounded-full bg-black/25 px-3 py-1.5 font-sans text-[11px] font-black uppercase tracking-[0.12em]">
            <span className={live ? 'w-2 h-2 rounded-full bg-[#4ADE80] animate-pulse' : 'w-2 h-2 rounded-full bg-white/40'} />
            {live ? 'Live now' : 'Not live'}
          </span>
          <span className="font-sans text-[11px] font-black uppercase tracking-[0.12em] text-white/70">Event drop</span>
        </div>

        <div className="relative z-10 mt-2">
          <MonsterStage id={dropId} size={190} silhouette={!claimed} ghost={claimed ? drop?.name : '???'} />
        </div>

        <div className="relative z-10 flex items-end justify-between gap-4 mt-1">
          <div className="min-w-0">
            <p className="font-sans text-[12px] font-extrabold uppercase tracking-[0.12em] text-white/70 truncate">{name}</p>
            <p className="font-poster text-[46px] uppercase leading-none mt-1">{claimed ? drop?.name : 'Mystery drop'}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="font-poster text-[46px] leading-none">{left ?? '–'}</p>
            <p className="font-sans text-[11px] font-extrabold uppercase tracking-[0.1em] text-white/70">of {drop?.maxSupply} left</p>
          </div>
        </div>
      </section>

      {claimed ? (
        <p className="mt-6 font-sans text-[16px] font-bold text-text-secondary">
          {isDropWearable(dropId) ? (
            <>You checked in. The {drop?.name} is yours to trade or <Link href="/app/wardrobe" className="text-text-accent underline">wear in your Wardrobe</Link>.</>
          ) : (
            <>You checked in. {drop?.name} is in your Socédex, and it is the one Socemon you can trade.</>
          )}
        </p>
      ) : (
        <ol className="mt-7">
          {STEPS.map((step, i) => (
            <li key={step} className="flex gap-4 items-baseline border-t border-(--border-subtle) py-4">
              <span className="font-poster text-[40px] leading-none text-primary">{i + 1}</span>
              <p className="font-sans text-[16px] font-bold text-text-secondary">{step}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
