'use client'
import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { cn } from '@/lib/utils'

/* Slide-up sheet for forms and confirmations. Escape and the dim backdrop close it, Tab stays inside it, focus returns to
   whatever opened it, and the page behind it stops scrolling. */
export function BottomSheet({ open, onClose, title, children, className }: {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
}) {
  const reduceMotion = useReducedMotion()
  const sheetRef = useRef<HTMLDivElement>(null)
  /* callers pass inline arrows, so keep the latest in a ref and let the effect depend on `open` only */
  const onCloseRef = useRef(onClose)
  useEffect(() => { onCloseRef.current = onClose })

  useEffect(() => {
    if (!open) return
    const previousFocus = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const frame = requestAnimationFrame(() => sheetRef.current?.focus())

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return onCloseRef.current()
      if (e.key !== 'Tab') return
      const sheet = sheetRef.current
      if (!sheet) return
      const focusable = Array.from(sheet.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ))
      if (focusable.length === 0) {
        e.preventDefault()
        return sheet.focus()
      }
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      const active = document.activeElement
      if (e.shiftKey && (active === first || active === sheet)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      } else if (!sheet.contains(active)) {
        e.preventDefault()
        first.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => {
      cancelAnimationFrame(frame)
      document.body.style.overflow = overflow
      window.removeEventListener('keydown', onKey)
      previousFocus?.focus?.()
    }
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] bg-black/70" onClick={onClose}
          />
          <motion.div
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={reduceMotion ? { opacity: 0 } : { y: '100%' }}
            animate={reduceMotion ? { opacity: 1 } : { y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            className={cn(
              'fixed bottom-0 left-1/2 -translate-x-1/2 z-[70] flex flex-col w-full max-w-[448px] max-h-[88dvh]',
              'rounded-t-[28px] bg-bg-surface border-t-2 border-x-2 border-(--border-default) outline-none',
              className,
            )}
          >
            <div className="shrink-0 flex justify-center pt-3 pb-2">
              <div className="w-10 h-1.5 rounded-full bg-(--border-default)" />
            </div>
            {title && <h2 className="shrink-0 px-5 pb-4 font-poster text-[30px] uppercase leading-none text-text-primary">{title}</h2>}
            <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
