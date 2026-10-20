'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check, Copy, ExternalLink, LogOut } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Button } from '@/components/ui/Button'
import { socemonAddress } from '@/lib/abi'
import { useSession, useTrainer, useUser } from '@/lib/client'
import { ROLES, speciesById } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

const EXPLORER = 'https://testnet.monadscan.com/address/'

/* Your trainer card, wallet and links, and sign out. */
export default function MePage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const { signOut } = useSession()
  const [copied, setCopied] = useState(false)
  const profile = trainer.profile
  const partner = Number(profile?.partner ?? 0n)
  const role = ROLES[profile?.role ?? 0]

  async function copy() {
    await navigator.clipboard.writeText(user)
    setCopied(true)
    setTimeout(() => setCopied(false), 2_000)
  }

  const links = [
    { href: '/app/friends', label: 'Friends', external: false },
    { href: `/u/${user}`, label: 'Public profile', external: false },
    { href: `${EXPLORER}${user}`, label: 'My wallet on Monadscan', external: true },
    { href: `${EXPLORER}${socemonAddress()}`, label: 'Socemon contract', external: true },
  ]

  return (
    <div>
      <PageHeader title="Me" />

      <section className="rounded-3xl bg-[var(--fill)] p-5 flex items-center gap-4">
        <MonsterImage key={partner} id={partner} size={88} />
        <div className="min-w-0">
          <p className="font-display text-[22px] text-text-primary truncate">{profile?.name}</p>
          <p className="font-sans text-[13px] text-text-secondary">{role?.label} · {role?.type} type</p>
          <p className="font-sans text-[12px] text-text-tertiary">Partner: {speciesById(partner)?.name}</p>
        </div>
      </section>

      <section className="mt-6">
        <h2 className="eyebrow mb-2">Wallet</h2>
        <button onClick={copy} className="w-full flex items-center justify-between rounded-[14px] bg-[var(--fill)] px-4 py-3">
          <span className="font-mono text-[14px] text-text-primary">{shortAddress(user)}</span>
          {copied ? <Check className="w-4 h-4 text-text-accent" /> : <Copy className="w-4 h-4 text-text-tertiary" />}
        </button>
        <p className="font-sans text-[12px] text-text-tertiary mt-2">Your Socemon live in this wallet. Blitzmon can be traded; everything else is soulbound.</p>
      </section>

      <section className="mt-6">
        <h2 className="eyebrow mb-2">Links</h2>
        <ul className="space-y-2">
          {links.map((l) => (
            <li key={l.label}>
              <Link
                href={l.href}
                target={l.external ? '_blank' : undefined}
                rel={l.external ? 'noreferrer' : undefined}
                className="flex items-center justify-between rounded-[14px] bg-[var(--fill)] px-4 py-3 font-sans text-[14px] text-text-primary"
              >
                {l.label}
                {l.external && <ExternalLink className="w-4 h-4 text-text-tertiary" />}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <Button variant="secondary" fullWidth className="mt-8" onClick={signOut}>
        <LogOut className="w-4 h-4" /> Sign out
      </Button>
    </div>
  )
}
