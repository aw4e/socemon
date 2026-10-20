import { Logo } from '@/components/brand/Logo'

export default function HomePage() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-8 text-center">
      <Logo height={28} />
      <p className="font-sans text-[14px] text-text-secondary">Catch your network on Monad.</p>
    </main>
  )
}
