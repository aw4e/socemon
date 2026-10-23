'use client'
import { useEffect, useState } from 'react'
import { useAppKit } from '@reown/appkit/react'
import { getAddress, isAddress, type Address } from 'viem'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, useSession, useTrainer, type Catch } from '@/lib/client'
import { ROLES, TYPE_COLOR } from '@/lib/socemon'
import { cn } from '@/lib/utils'

/* Connect a wallet, sign in once, claim Soci. `children` only renders for a signed-in, registered trainer. */
export function Gate({ hero, children }: { hero?: React.ReactNode; children: (user: Address) => React.ReactNode }) {
  const { open } = useAppKit()
  const session = useSession()
  const preview = useDevPreview()
  const user = preview ?? session.user
  const trainer = useTrainer(user)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setBusy(true)
    setError('')
    try {
      await session.signIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  if ((session.loading && !preview) || trainer.loading) {
    return (
      /* a whole screen when the gate guards a page (it has a hero); a small inline spinner inside a card */
      <div className={hero ? 'flex items-center justify-center min-h-svh' : 'flex items-center justify-center py-10'} role="status" aria-label="Loading">
        <div className="w-8 h-8 rounded-full border-[3px] border-(--border-default) border-t-primary animate-spin" />
      </div>
    )
  }
  if (user && trainer.profile?.registered) return <>{children(user)}</>

  return (
    <div className="flex flex-col items-center text-center gap-5 pt-6 pb-16">
      {hero}
      {!session.wallet ? (
        <Step title="Connect a wallet" body="Your Socemon are minted to this wallet on Monad. You never pay gas.">
          <Button size="lg" fullWidth onClick={() => open()}>Connect wallet</Button>
        </Step>
      ) : !session.user ? (
        <Step title="Sign in" body="One signature, no gas. It proves this wallet is yours.">
          <Button size="lg" fullWidth loading={busy} onClick={signIn}>Sign in</Button>
        </Step>
      ) : trainer.error ? (
        <Step title="Monad is busy" body="Could not read your trainer from the chain.">
          <Button size="lg" fullWidth onClick={() => trainer.refetch()}>Try again</Button>
        </Step>
      ) : (
        <Register onDone={() => trainer.refetch()} />
      )}
      {error && <p role="alert" className="font-sans text-[14px] font-bold text-text-error">{error}</p>}
    </div>
  )
}

/* ponytail: dev-only read-only preview, `?as=0x…` renders the app as that trainer so layouts can be checked without
   a wallet. Writes still need a real session. Dead code in production builds. */
function useDevPreview(): Address | null {
  const [as, setAs] = useState<Address | null>(null)
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return
    const param = new URLSearchParams(window.location.search).get('as')
    if (param && isAddress(param, { strict: false })) sessionStorage.setItem('socemon:as', getAddress(param))
    const saved = sessionStorage.getItem('socemon:as')
    if (saved && isAddress(saved)) setAs(saved)
  }, [])
  return as
}

function Register({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<number | null>(null)
  const reveal = useCatch()

  return (
    <Step title="Claim your starter" body="Your name shows on the Event Wall. Your role is the Egg type people get when they connect with you.">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={24}
        placeholder="Your trainer name"
        aria-label="Your trainer name"
        className="w-full h-14 rounded-2xl bg-bg-surface border-2 border-(--border-default) focus:border-primary px-5 font-sans text-[17px] font-bold text-text-primary placeholder:text-text-tertiary outline-none transition-colors"
      />
      <div className="grid grid-cols-2 gap-2.5 w-full" role="radiogroup" aria-label="Your role">
        {ROLES.map((r) => {
          const color = TYPE_COLOR[r.role]
          const picked = role === r.role
          return (
            <button
              key={r.role}
              type="button"
              role="radio"
              aria-checked={picked}
              onClick={() => setRole(r.role)}
              className={cn(
                'rounded-2xl px-4 pt-3 pb-2.5 text-left border-2 transition-[transform,background-color] active:translate-y-0.5',
                picked ? 'text-[#0D0A1A]' : 'bg-bg-surface border-(--border-default)',
              )}
              style={picked ? { background: color, borderColor: color, boxShadow: `0 4px 0 color-mix(in srgb, ${color} 60%, #000)` } : undefined}
            >
              <span className="block font-poster text-[26px] uppercase leading-none" style={picked ? undefined : { color }}>{r.type}</span>
              <span className={cn('block font-sans text-[12px] font-extrabold uppercase tracking-[0.06em] mt-1', picked ? 'opacity-75' : 'text-text-tertiary')}>
                {r.label}
              </span>
            </button>
          )
        })}
      </div>
      <Button
        size="lg"
        fullWidth
        disabled={!name.trim() || role === null}
        loading={reveal.state?.phase === 'pending'}
        onClick={() => reveal.run('Calling Soci…', () => post<Catch>('/api/register', { name: name.trim(), role }))}
      >
        Claim Soci
      </Button>
      <Reveal state={reveal.state} onClose={() => { reveal.close(); onDone() }} />
    </Step>
  )
}

function Step({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3.5">
      <h2 className="font-sans font-black text-[26px] leading-tight text-text-primary">{title}</h2>
      <p className="font-sans text-[15px] font-semibold text-text-secondary -mt-1 mb-1">{body}</p>
      {children}
    </div>
  )
}
