'use client'

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: '#0B0C14', color: '#F4F4F5', fontFamily: 'system-ui, sans-serif' }}>
        <main style={{ minHeight: '100svh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 32, textAlign: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, margin: 0 }}>Something went wrong</h1>
          <button onClick={reset} style={{ height: 44, padding: '0 24px', borderRadius: 999, border: 0, background: '#fff', color: '#0C0C0E', fontSize: 15, fontWeight: 500, cursor: 'pointer' }}>
            Try again
          </button>
        </main>
      </body>
    </html>
  )
}
