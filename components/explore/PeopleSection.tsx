'use client'
import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronRight, UserSearch, Users } from 'lucide-react'
import { ErrorText, EmptyState, FilterChips, SearchField, SkeletonRows } from '@/components/explore/controls'
import { request, useUser } from '@/lib/client'
import type { ExplorePerson } from '@/lib/explore'
import { ROLES, TYPE_COLOR } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

const ROLE_OPTIONS = ROLES.map((r) => ({ value: String(r.role), label: r.label }))

/** Everyone who claimed Soci, newest first. A row opens the trainer's page, where Connect lives. */
export function PeopleSection() {
  const me = useUser()
  const [people, setPeople] = useState<ExplorePerson[]>([])
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [role, setRole] = useState<string | null>(null)

  useEffect(() => {
    request<{ people: ExplorePerson[] }>('GET', '/api/explore/people')
      .then((d) => setPeople(d.people))
      .catch((err) => setError(err instanceof Error ? err.message : 'Could not load trainers'))
      .finally(() => setLoaded(true))
  }, [])

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/^@/, '')
    return people.filter((p) => p.address.toLowerCase() !== me.toLowerCase()
      && (role === null || String(p.role) === role)
      && (!q || p.name.toLowerCase().includes(q) || p.address.toLowerCase().startsWith(q)))
  }, [people, query, role, me])

  return (
    <>
      <div className="mb-2"><SearchField value={query} onChange={setQuery} label="Search trainers" placeholder="Search name or address" /></div>
      <div className="mb-3"><FilterChips label="Filter by role" options={ROLE_OPTIONS} value={role} onChange={setRole} /></div>
      {error && <div className="mb-3"><ErrorText>{error}</ErrorText></div>}

      {!loaded ? (
        <SkeletonRows />
      ) : shown.length === 0 && !error ? (
        people.length === 0 ? (
          <EmptyState icon={Users} title="No trainers yet" hint="Trainers show up here as soon as they claim their starter." />
        ) : (
          <EmptyState icon={UserSearch} title="No one found" hint="Try another spelling or a different role." action={{ label: 'Clear filters', variant: 'secondary', onClick: () => { setQuery(''); setRole(null) } }} />
        )
      ) : (
        <ul className="space-y-2.5">
          {shown.map((p) => {
            const color = TYPE_COLOR[p.role] ?? TYPE_COLOR[0]
            return (
              <li key={p.address}>
                <Link href={`/u/${p.address}`} className="flex items-center gap-3 rounded-3xl bg-bg-surface border-2 border-(--border-default) px-4 py-3 active:translate-y-0.5 transition-transform">
                  <span
                    className="w-11 h-11 shrink-0 rounded-2xl flex items-center justify-center font-poster text-[22px] text-[#0D0A1A]"
                    style={{ background: color, boxShadow: `0 3px 0 color-mix(in srgb, ${color} 60%, #000)` }}
                    aria-hidden
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-[16px] font-extrabold text-text-primary truncate">{p.name}</p>
                    <p className="font-sans text-[12px] font-bold text-text-tertiary tabular-nums">{shortAddress(p.address)}</p>
                  </div>
                  <span className="font-sans text-[11px] font-extrabold uppercase tracking-[0.08em] shrink-0" style={{ color }}>
                    {ROLES.find((r) => r.role === p.role)?.type}
                  </span>
                  <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" aria-hidden />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </>
  )
}
