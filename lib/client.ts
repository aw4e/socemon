import { useEffect, useState } from 'react'
import { zeroAddress, type Address } from 'viem'
import { monadTestnet } from 'viem/chains'
import { createSiweMessage } from 'viem/siwe'
import { useConnection, useReadContracts, useSignMessage } from 'wagmi'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { SPECIES } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

/* Browser side of Socemon: reads go straight to the contract, writes go through the API relayer. */

export type Catch = { monsterId: number; tx: string; ms: number; nexmon?: boolean }

const SIGNED_OUT = 'socemon:signed-out'

/** POSTs JSON to an API route and throws its error message. A 401 tells every useSession to ask for sign-in again. */
export async function post<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) window.dispatchEvent(new Event(SIGNED_OUT))
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
  return data as T
}

/** The wallet AppKit has connected and the wallet the server session belongs to; `user` is set only when they match. */
export function useSession() {
  const { address: wallet } = useConnection()
  const { mutateAsync: signMessage } = useSignMessage()
  const [session, setSession] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSession(data?.address ?? null))
      .catch(() => setSession(null))
    const signedOut = () => setSession(null)
    window.addEventListener(SIGNED_OUT, signedOut)
    return () => window.removeEventListener(SIGNED_OUT, signedOut)
  }, [])

  async function signIn() {
    if (!wallet) throw new Error('Connect a wallet first')
    const { nonce } = await (await fetch('/api/auth/nonce')).json()
    const message = createSiweMessage({
      address: wallet, chainId: monadTestnet.id, domain: window.location.host, nonce, uri: window.location.origin,
      version: '1', statement: 'Sign in to Socemon',
    })
    const signature = await signMessage({ message })
    setSession((await post<{ address: string }>('/api/auth/verify', { message, signature })).address)
  }

  async function signOut() {
    await post('/api/auth/logout', {})
    window.dispatchEvent(new Event(SIGNED_OUT))
  }

  const user = wallet && session && session.toLowerCase() === wallet.toLowerCase() ? wallet : null
  return { wallet, user, loading: session === undefined, signIn, signOut }
}

const DEX_IDS = Array.from({ length: SPECIES.length + 1 }, (_, i) => BigInt(i))

/** One multicall for everything a trainer page shows. Pass `refetchInterval` to keep requests and Eggs fresh. */
export function useTrainer(address: Address | null | undefined, refetchInterval?: number) {
  const contract = { address: socemonAddress(), abi: SOCEMON_ABI, chainId: monadTestnet.id } as const
  const who = address ?? zeroAddress
  const { data, error, isLoading, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...contract, functionName: 'profileOf', args: [who] },
      { ...contract, functionName: 'eggsOf', args: [who] },
      { ...contract, functionName: 'pendingOf', args: [who] },
      { ...contract, functionName: 'connectionsOf', args: [who] },
      { ...contract, functionName: 'balanceOfBatch', args: [DEX_IDS.map(() => who), DEX_IDS] },
    ],
    query: { enabled: !!address, refetchInterval },
  })
  return {
    loading: !!address && isLoading,
    error,
    profile: data?.[0],
    eggs: data?.[1],
    pending: data?.[2],
    connections: data?.[3],
    owned: new Set((data?.[4] ?? []).flatMap((n, id) => (n > 0n ? [id] : []))),
    refetch,
  }
}

/** Display names for a list of addresses, falling back to the short address. */
export function useNames(addresses: readonly Address[] | undefined) {
  const list = addresses ?? []
  const { data } = useReadContracts({
    allowFailure: false,
    contracts: list.map((a) => ({ address: socemonAddress(), abi: SOCEMON_ABI, chainId: monadTestnet.id, functionName: 'profileOf', args: [a] }) as const),
    query: { enabled: list.length > 0 },
  })
  return (a: Address) => (data?.[list.indexOf(a)] as { name: string } | undefined)?.name || shortAddress(a)
}
