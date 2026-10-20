'use client'
import { useState } from 'react'
import { useAppKit } from '@reown/appkit/react'
import type { Address } from 'viem'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, useSession, useTrainer, type Catch } from '@/lib/client'
import { ROLES } from '@/lib/socemon'
import { cn } from '@/lib/utils'

/* Connect a wallet, sign in once, claim Soci. `children` only renders for a signed-in, registered trainer. */
export function Gate({ hero, children }: { hero?: React.ReactNode; children: (user: Address) => React.ReactNode }) {
  const { open } = useAppKit()
  const session = useSession()
  const trainer = useTrainer(session.user)
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

  if (session.loading || trainer.loading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Loading">
        <div className="w-6 h-6 rounded-full border-[1.5px] border-text-tertiary border-t-text-primary animate-spin" />
      </div>
    )
  }
  if (session.user && trainer.profile?.registered) return <>{children(session.user)}</>

  return (
    <div className="flex flex-col items-center text-center gap-4 py-10">
      {hero}
      {!session.wallet ? (
        <Step title="Connect a wallet" body="Your Socemon are minted to this wallet on Monad. You never pay gas.">
          <Button size="lg" onClick={() => open()}>Connect wallet</Button>
        </Step>
      ) : !session.user ? (
        <Step title="Sign in" body="One signature, no gas. It proves this wallet is yours.">
          <Button size="lg" loading={busy} onClick={signIn}>Sign in</Button>
        </Step>
      ) : trainer.error ? (
        <Step title="Monad is busy" body="Could not read your trainer from the chain.">
          <Button size="lg" onClick={() => trainer.refetch()}>Try again</Button>
        </Step>
      ) : (
        <Register onDone={() => trainer.refetch()} />
      )}
      {error && <p role="alert" className="font-sans text-[13px] text-text-error">{error}</p>}
    </div>
  )
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
        placeholder="Your name"
        aria-label="Your name"
        className="w-full h-12 rounded-2xl bg-[var(--fill)] px-4 font-sans text-[15px] text-text-primary outline-none"
      />
      <div className="grid grid-cols-2 gap-2 w-full">
        {ROLES.map((r) => (
          <button
            key={r.role}
            type="button"
            aria-pressed={role === r.role}
            onClick={() => setRole(r.role)}
            className={cn(
              'rounded-2xl border px-3 py-2.5 text-left',
              role === r.role ? 'border-primary bg-[var(--accent-primary-dim)]' : 'border-(--border-default)',
            )}
          >
            <span className="block font-sans text-[14px] text-text-primary">{r.label}</span>
            <span className="block font-sans text-[11px] text-text-tertiary">{r.type} type</span>
          </button>
        ))}
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
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <h2 className="font-display text-[24px] text-text-primary">{title}</h2>
      <p className="font-sans text-[14px] text-text-secondary">{body}</p>
      {children}
    </div>
  )
}
