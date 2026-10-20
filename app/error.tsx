'use client'

import { Button } from '@/components/ui/Button'

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center gap-4 px-8 text-center">
      <h1 className="font-poster text-[44px] uppercase leading-none text-text-primary">Something went wrong</h1>
      <p className="font-sans text-[14px] text-text-secondary max-w-[280px]">
        An unexpected error happened. Try again, and if it persists come back in a few minutes.
      </p>
      <Button onClick={reset}>Try again</Button>
    </main>
  )
}
