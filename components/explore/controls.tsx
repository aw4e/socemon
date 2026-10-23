'use client'
import { useCallback, useEffect, useState } from 'react'
import { Check, CheckCircle2, Search, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { useDragScroll } from '@/lib/use-drag-scroll'

/* Small form and list pieces shared by the Explore sections, in the game's dark, chunky look. */

export const inputCls =
  'w-full h-12 px-4 rounded-2xl bg-bg-base border-2 border-(--border-default) font-sans text-[16px] font-semibold text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors'
export const textareaCls =
  'w-full px-4 py-3 rounded-2xl bg-bg-base border-2 border-(--border-default) font-sans text-[16px] font-semibold leading-[1.45] text-text-primary placeholder:text-text-tertiary outline-none focus:border-primary transition-colors resize-none'
export const invalidCls = 'aria-[invalid=true]:border-sys-error'

export function FormSection({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h3 className="eyebrow">{title}</h3>
        {hint && <p className="font-sans text-[12px] font-semibold leading-[1.4] text-text-tertiary">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

/** Label row with a Required / Optional tag, then the control, then an inline error or hint and an optional counter. */
export function Field({ id, label, required, optional, hint, error, count, max, children }: {
  id: string; label: string; required?: boolean; optional?: boolean; hint?: string; error?: string; count?: number; max?: number
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 mb-1.5 px-0.5">
        <label htmlFor={id} className="font-sans text-[13px] font-extrabold text-text-secondary min-w-0">{label}</label>
        {(required || optional) && (
          <span className={cn('shrink-0 font-sans text-[11px] font-bold', required ? 'text-text-accent' : 'text-text-tertiary')}>
            {required ? 'Required' : 'Optional'}
          </span>
        )}
      </div>
      {children}
      {(hint || error || max != null) && (
        <div className="flex items-start justify-between gap-3 mt-1.5 px-0.5">
          <div className="min-w-0 flex-1">
            {error ? (
              <p id={`${id}-msg`} role="alert" className="font-sans text-[12px] font-bold leading-[1.4] text-text-error break-words">{error}</p>
            ) : hint ? (
              <p id={`${id}-msg`} className="font-sans text-[12px] font-semibold leading-[1.4] text-text-tertiary break-words">{hint}</p>
            ) : null}
          </div>
          {max != null && <span className="shrink-0 font-sans text-[11px] font-bold tabular-nums text-text-tertiary">{count ?? 0}/{max}</span>}
        </div>
      )}
    </div>
  )
}

/** Single choice as chips, for four options or fewer. */
export function Segmented<T extends string>({ label, options, value, onChange }: {
  label: string; options: { value: T; label: string }[]; value: T; onChange: (next: T) => void
}) {
  return (
    <div>
      <p className="font-sans text-[13px] font-extrabold text-text-secondary mb-1.5 px-0.5">{label}</p>
      <div role="radiogroup" aria-label={label} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              'min-h-11 px-4 rounded-full font-sans text-[14px] font-extrabold cursor-pointer transition-colors border-2',
              value === o.value ? 'bg-primary border-primary text-white' : 'bg-(--fill) border-transparent text-text-secondary hover:bg-(--fill-strong)',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Pinned to the bottom of the sheet's scroll area; cancels the sheet's bottom padding so it sits flush. */
export function StickyFooter({ hint, children }: { hint?: string; children: React.ReactNode }) {
  return (
    <div className="sticky bottom-0 -mx-5 mt-8 -mb-[max(1.25rem,env(safe-area-inset-bottom))] px-5 pt-3 pb-[max(1rem,env(safe-area-inset-bottom))] bg-bg-surface border-t border-(--border-subtle) space-y-2">
      {hint && <p role="status" className="font-sans text-[12px] font-bold text-center text-text-tertiary">{hint}</p>}
      {children}
    </div>
  )
}

/** Compact "what viewers will see" card shown above the form. */
export function PreviewCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border-2 border-(--border-subtle) bg-(--fill) px-4 py-3.5 space-y-2 min-w-0">
      <p className="eyebrow">Preview</p>
      {children}
    </div>
  )
}

export function Chip({ label, tone = 'default' }: { label: string; tone?: 'default' | 'accent' | 'success' | 'warning' }) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-6 px-2.5 rounded-full font-sans text-[11px] font-extrabold uppercase tracking-[0.05em] whitespace-nowrap',
        tone === 'default' && 'bg-(--fill) text-text-secondary',
        tone === 'accent' && 'bg-(--accent-primary-dim) text-text-accent',
        tone === 'success' && 'bg-[#2DD4BF]/15 text-[#5EEAD4]',
        tone === 'warning' && 'bg-[#FBBF24]/15 text-[#FCD34D]',
      )}
    >
      {label}
    </span>
  )
}

export function SearchField({ value, onChange, placeholder, label }: { value: string; onChange: (next: string) => void; placeholder: string; label: string }) {
  return (
    <div role="search" className="flex-1 min-w-0 flex items-center gap-3 pl-4 pr-1 h-12 rounded-2xl bg-bg-surface border-2 border-(--border-default) focus-within:border-primary transition-colors">
      <Search className="w-4 h-4 text-text-tertiary shrink-0" />
      <input
        type="search" inputMode="search" enterKeyHint="search" autoComplete="off" autoCapitalize="none" autoCorrect="off" spellCheck={false}
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={label}
        className="flex-1 min-w-0 bg-transparent font-sans text-[16px] font-semibold text-text-primary placeholder:text-text-tertiary outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="w-11 h-11 shrink-0 flex items-center justify-center text-text-tertiary hover:text-text-primary">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}

/** One row of filter chips; tap the active one again to clear it. */
export function FilterChips<T extends string>({ options, value, onChange, label }: {
  options: { value: T; label: string }[]; value: T | null; onChange: (next: T | null) => void; label: string
}) {
  const scroll = useDragScroll()
  return (
    <div role="group" aria-label={label} {...scroll} className="flex gap-1 overflow-x-auto -mx-5 px-4 cursor-grab active:cursor-grabbing select-none">
      {options.map((o) => {
        const active = value === o.value
        return (
          <button key={o.value} type="button" aria-pressed={active} onClick={() => onChange(active ? null : o.value)} className="h-11 px-1 shrink-0 flex items-center">
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-3.5 h-9 rounded-full font-sans text-[13px] font-extrabold border-2 transition-colors',
                active ? 'bg-primary border-primary text-white' : 'bg-(--fill) border-transparent text-text-secondary hover:bg-(--fill-strong)',
              )}
            >
              {active && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
              {o.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

/** Auto-dismissing confirmation for actions that otherwise finish silently. */
export function useNotice(ms = 4000) {
  const [notice, setNotice] = useState('')
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(() => setNotice(''), ms)
    return () => clearTimeout(t)
  }, [notice, ms])
  const clear = useCallback(() => setNotice(''), [])
  return { notice, setNotice, clear }
}

export function Notice({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return (
    <p role="status" className="flex items-center gap-2 px-4 py-3 mb-4 rounded-2xl bg-[#2DD4BF]/12 font-sans text-[13px] font-bold text-[#5EEAD4]">
      <CheckCircle2 className="w-4 h-4 shrink-0" /> {children}
    </p>
  )
}

export function ErrorText({ children }: { children?: React.ReactNode }) {
  if (!children) return null
  return <p role="alert" className="font-sans text-[13px] font-bold text-text-error">{children}</p>
}

export function EmptyState({ icon: Icon, title, hint, action }: {
  icon: React.ElementType; title: string; hint?: string; action?: { label: string; onClick: () => void; variant?: 'primary' | 'secondary' }
}) {
  return (
    <div className="flex flex-col items-center text-center gap-2 py-14">
      <div className="w-14 h-14 rounded-full bg-(--fill) flex items-center justify-center mb-1">
        <Icon className="w-6 h-6 text-text-tertiary" strokeWidth={1.8} />
      </div>
      <p className="font-poster text-[26px] uppercase leading-none text-text-primary">{title}</p>
      {hint && <p className="font-sans text-[14px] font-semibold text-text-secondary max-w-[260px] leading-[1.4]">{hint}</p>}
      {action && <Button size="sm" variant={action.variant ?? 'primary'} onClick={action.onClick} className="mt-3">{action.label}</Button>}
    </div>
  )
}

export function SkeletonRows({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-2" role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: count }, (_, i) => <div key={i} className="h-[72px] rounded-2xl bg-(--fill) animate-pulse" />)}
    </div>
  )
}
