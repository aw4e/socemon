import { ROLES, TYPE_COLOR } from '@/lib/socemon'

/* A trainer's role and type as a pill tinted with the type color. */
export function TypeChip({ role, className = '' }: { role: number; className?: string }) {
  const r = ROLES[role] ?? ROLES[0]
  const color = TYPE_COLOR[r.role]
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-sans text-[12px] font-extrabold uppercase tracking-[0.06em] ${className}`}
      style={{ color, background: `${color}22` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {r.type} · {r.label}
    </span>
  )
}
