import { cn } from '@/lib/utils'

/* Socemon identity: Soci with the chain link (public/brand/mark.png, drawn like the monsters), and next to it SOCEMON in
   the poster type the page titles use ("ME", "EXPLORE"). `LogoMark` is the mascot alone. `tone="light"` is for light
   surfaces (dark letters); everything else suits the game's dark pages. */
export type LogoTone = 'auto' | 'light' | 'dark' | 'mono'

function Mark({ px, className, title }: { px: number; className?: string; title: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/brand/mark.png" width={px} height={px} alt={title} draggable={false} loading="lazy" decoding="async" className={cn('shrink-0 select-none object-contain', className)} />
  )
}

/** The mascot alone, `size` px square. */
export function LogoMark({ size = 24, className, title = 'Socemon' }: { size?: number; tone?: LogoTone; className?: string; title?: string }) {
  return <Mark px={size} className={className} title={title} />
}

/** The mascot with SOCEMON beside it. `height` is the size the callers were drawn for; the mascot is 1.5x that, the letters 1.25x. */
export function Logo({ height = 28, tone = 'auto', className, title = 'Socemon' }: { height?: number; tone?: LogoTone; className?: string; title?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 shrink-0', className)} role="img" aria-label={title}>
      <Mark px={Math.round(height * 1.5)} title="" />
      <span
        aria-hidden
        className="font-poster uppercase leading-none tracking-[0.01em]"
        style={{ fontSize: Math.round(height * 1.25), color: tone === 'light' ? '#1A1A1A' : 'var(--text-1)' }}
      >
        Socemon
      </span>
    </span>
  )
}
