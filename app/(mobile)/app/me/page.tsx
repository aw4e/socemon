'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight, Copy, ExternalLink, LogOut, Palette, Shirt } from 'lucide-react'
import { PageHeader } from '@/components/PageHeader'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Socedex } from '@/components/socemon/Socedex'
import { TypeChip } from '@/components/socemon/TypeChip'
import { Button } from '@/components/ui/Button'
import { socemonAddress } from '@/lib/abi'
import { useSession, useTrainer, useUser } from '@/lib/client'
import { SPECIES, colorOf, speciesById, typesCaught } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

const EXPLORER = 'https://testnet.monadscan.com/address/'

/* Your trainer ID card (holographic edge), your links, and sign out. */
export default function MePage() {
  const user = useUser()
  const trainer = useTrainer(user)
  const { signOut } = useSession()
  const [copied, setCopied] = useState(false)
  const profile = trainer.profile
  const partner = Number(profile?.partner ?? 0n)
  const color = colorOf(partner)

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
  const stats = [
    { value: trainer.connections?.length ?? 0, label: 'Friends' },
    { value: `${typesCaught(trainer.owned)}/5`, label: 'Types' },
    { value: `${trainer.owned.size}/${SPECIES.length + 1}`, label: 'Caught' },
  ]

  return (
    <div>
      <PageHeader title="Me" />

      <section className="holo relative overflow-hidden rounded-[30px] p-5">
        <div aria-hidden className="absolute -right-10 -top-10 w-48 h-48 rounded-full blur-3xl opacity-40" style={{ background: color }} />
        <div className="relative flex items-center justify-between">
          <p className="eyebrow">Trainer ID</p>
          <p className="font-mono text-[11px] text-text-tertiary">{shortAddress(user)}</p>
        </div>
        <div className="relative flex items-center gap-4 mt-3">
          <div className="w-24 h-24 rounded-[24px] flex items-center justify-center shrink-0" style={{ background: `${color}2e` }}>
            <MonsterImage key={partner} id={partner} size={88} />
          </div>
          <div className="min-w-0">
            <p className="font-sans text-[26px] font-black leading-tight truncate">{profile?.name}</p>
            {profile && <TypeChip role={profile.role} className="mt-1.5" />}
            <p className="font-sans text-[12px] font-bold text-text-tertiary mt-1.5">Pet · {speciesById(partner)?.name}</p>
          </div>
        </div>
        <dl className="relative grid grid-cols-3 mt-5 pt-4 border-t border-dashed border-(--border-default)">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col-reverse items-center">
              <dt className="eyebrow">{s.label}</dt>
              <dd className="font-poster text-[26px] leading-none">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <Link
        href="/app/me/edit"
        className="mt-5 flex items-center gap-4 rounded-[24px] bg-primary text-primary-fg p-4 shadow-[0_4px_0_var(--primary-shadow)] active:translate-y-1 active:shadow-none transition-transform"
      >
        <span className="w-12 h-12 shrink-0 rounded-2xl bg-white/20 flex items-center justify-center"><Palette className="w-6 h-6" /></span>
        <span className="flex-1 min-w-0">
          <span className="block font-sans text-[18px] font-black">Edit my page</span>
          <span className="block font-sans text-[12px] font-bold text-white/80">Add links, a bio, and pick how it looks</span>
        </span>
        <ChevronRight className="w-5 h-5" />
      </Link>

      <Link
        href="/app/wardrobe"
        className="mt-4 flex items-center gap-4 rounded-[24px] bg-bg-surface border border-(--border-default) p-3 pr-4"
      >
        <img src={`/api/avatar/${user}`} alt="Your avatar" className="w-20 h-20 rounded-[18px] shrink-0" />
        <span className="flex-1 min-w-0">
          <span className="eyebrow block">Avatar</span>
          <span className="font-sans text-[18px] font-black text-text-primary flex items-center gap-2">
            <Shirt className="w-5 h-5 text-primary" /> Wardrobe
          </span>
          <span className="font-sans text-[12px] font-bold text-text-tertiary">Open blind boxes and dress up</span>
        </span>
        <ChevronRight className="w-5 h-5 text-text-tertiary" />
      </Link>

      <section className="mt-9">
        <Socedex />
      </section>

      <button onClick={copy} className="mt-5 w-full flex items-center justify-between py-3 border-b border-(--border-subtle)">
        <span className="text-left">
          <span className="eyebrow block">Wallet</span>
          <span className="font-mono text-[15px] text-text-primary">{shortAddress(user)}</span>
        </span>
        {copied ? <Check className="w-5 h-5 text-text-accent" /> : <Copy className="w-5 h-5 text-text-tertiary" />}
      </button>

      <ul>
        {links.map((l) => (
          <li key={l.label}>
            <Link
              href={l.href}
              target={l.external ? '_blank' : undefined}
              rel={l.external ? 'noreferrer' : undefined}
              className="flex items-center justify-between py-4 border-b border-(--border-subtle) font-sans text-[16px] font-extrabold text-text-primary"
            >
              {l.label}
              {l.external ? <ExternalLink className="w-4 h-4 text-text-tertiary" /> : <ChevronRight className="w-5 h-5 text-text-tertiary" />}
            </Link>
          </li>
        ))}
      </ul>

      <p className="font-sans text-[13px] font-bold text-text-tertiary mt-5">
        Your Socemon and wearables live in this wallet. Wearables and event drops can be traded; everything else is soulbound.
      </p>

      <Button variant="secondary" fullWidth className="mt-6" onClick={signOut}>
        <LogOut className="w-4 h-4" /> Sign out
      </Button>
    </div>
  )
}
