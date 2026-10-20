import Link from 'next/link'
import { LogoMark } from '@/components/brand/Logo'

export default function NotFound() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center gap-4 px-8 text-center">
      <LogoMark size={48} />
      <h1 className="font-display font-medium text-[26px] text-text-primary">Page not found</h1>
      <p className="font-sans text-[14px] text-text-secondary max-w-[280px]">
        This link may be wrong or the profile may no longer exist.
      </p>
      <Link href="/" className="font-sans text-[14px] font-medium text-text-accent">Back to Socemon</Link>
    </main>
  )
}
