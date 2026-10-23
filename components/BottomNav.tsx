'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Gamepad2, House, ScanLine, Ticket, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/app', label: 'Home', Icon: House },
  { href: '/app/game', label: 'Game', Icon: Gamepad2 },
  { href: '/app/qr', label: 'Scan', Icon: ScanLine },
  { href: '/app/event', label: 'Event', Icon: Ticket },
  { href: '/app/me', label: 'Me', Icon: User },
] as const

/* Floating game tab bar. Scan is the raised purple button because connecting is the main thing you do at an event.
   `requests` puts a badge on Home while connection requests wait for approval. */
export function BottomNav({ requests }: { requests: number }) {
  const path = usePathname()
  return (
    <nav
      aria-label="App"
      className="bottom-nav fixed left-1/2 -translate-x-1/2 z-30 w-[calc(100%-1.5rem)] max-w-[424px] rounded-[26px] bg-bg-surface border border-(--border-default) shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
    >
      <ul className="grid grid-cols-5 h-[68px] px-1">
        {TABS.map(({ href, label, Icon }) => {
          const active = path === href || (href === '/app/game' && path.startsWith('/app/game'))
          if (href === '/app/qr') {
            return (
              <li key={href} className="flex justify-center">
                <Link
                  href={href}
                  aria-label={label}
                  aria-current={active ? 'page' : undefined}
                  className="-mt-7 w-[60px] h-[60px] rounded-[20px] bg-primary text-white flex items-center justify-center shadow-[0_5px_0_var(--primary-shadow),0_10px_24px_rgba(131,110,249,0.45)] active:translate-y-1 active:shadow-[0_1px_0_var(--primary-shadow)] transition-transform"
                >
                  <Icon className="w-7 h-7" strokeWidth={2.4} />
                </Link>
              </li>
            )
          }
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-1 w-full font-sans text-[10px] font-extrabold uppercase tracking-[0.06em] transition-colors',
                  active ? 'text-text-primary' : 'text-text-tertiary',
                )}
              >
                <Icon className={cn('w-[22px] h-[22px]', active && 'text-primary')} strokeWidth={active ? 2.5 : 2} />
                {label}
                {href === '/app' && requests > 0 && (
                  <span className="absolute top-2 left-1/2 ml-2 min-w-[18px] h-[18px] px-1 rounded-full bg-sys-error text-white text-[10px] font-black leading-[18px] text-center">
                    {requests}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
