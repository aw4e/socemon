'use client'

import { createAppKit } from '@reown/appkit/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { WagmiProvider } from 'wagmi'
import { networks, projectId, wagmiAdapter, wagmiConfig } from '@/lib/wagmi'

const queryClient = new QueryClient()

/* WalletConnect warns when metadata.url differs from the page origin, so follow the live origin in the browser */
const siteUrl =
  typeof window !== 'undefined'
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000')

const metadata = {
  name: 'Socemon',
  description: 'Social on Monad. Catch your network.',
  url: siteUrl,
  icons: [`${siteUrl}/icon-512.png`],
}

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata,
  /* the analytics endpoint rejects non-allowlisted origins, so skip it on localhost */
  features: { analytics: process.env.NODE_ENV === 'production' },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-font-family': 'var(--font-outfit), -apple-system, BlinkMacSystemFont, system-ui, sans-serif',  },
})

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  )
}
