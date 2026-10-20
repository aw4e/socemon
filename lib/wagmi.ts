import { cookieStorage, createStorage, http } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { monadTestnet, type AppKitNetwork } from '@reown/appkit/networks'

/* Without a project ID AppKit shows a "not configured" alert instead of crashing, so pages still build and render. */
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? ''

export const networks = [monadTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  /* reads go straight to Monad; NEXT_PUBLIC_MONAD_RPC_URL is the way out when a crowded venue hits the public RPC's rate limit */
  transports: { [monadTestnet.id]: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || undefined) },
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
