'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, House, QrCode, Ticket, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const TABS = [
  { href: '/app', label: 'Home', Icon: House },
  { href: '/app/dex', label: 'Socédex', Icon: BookOpen },
  { href: '/app/qr', label: 'My QR', Icon: QrCode },
  { href: '/app/event', label: 'Event', Icon: Ticket },
  { href: '/app/me', label: 'Me', Icon: User },
] as const

/* Floating tab bar. My QR is the raised center button because connecting is the main thing you do at an event.
   `requests` puts a badge on Home while connection requests wait for approval. */
export function BottomNav({ requests }: { requests: number }) {
  const path = usePathname()
  return (
    <nav
      aria-label="App"
      className="bottom-nav fixed left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-[416px] material rounded-[28px] border border-(--border-subtle) shadow-lg"
    >
      <ul className="grid grid-cols-5 h-16 px-1">
        {TABS.map(({ href, label, Icon }) => {
          const active = path === href
          const center = href === '/app/qr'
          return (
            <li key={href} className="flex justify-center">
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex flex-col items-center justify-end gap-1 pb-2.5 w-full font-sans text-[10px] font-medium',
                  active ? 'text-text-primary' : 'text-text-tertiary',
                )}
              >
                {center ? (
                  <span className="-mt-7 w-14 h-14 rounded-full bg-primary text-primary-fg flex items-center justify-center shadow-lg">
                    <Icon className="w-6 h-6" />
                  </span>
                ) : (
                  <Icon className="w-[22px] h-[22px]" strokeWidth={active ? 2.2 : 1.7} />
                )}
                {label}
                {href === '/app' && requests > 0 && (
                  <span className="absolute top-1.5 left-1/2 ml-1.5 min-w-4 h-4 px-1 rounded-full bg-sys-error text-white text-[10px] leading-4 text-center">
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
