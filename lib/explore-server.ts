import type { Address } from 'viem'
import { HttpError } from '@/lib/api'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { publicClient } from '@/lib/chain'
import { isHostWallet } from '@/lib/event'
import { underStoredLimit } from '@/lib/firestore-limit'

/** The trainer's name from the contract. Posting needs a registered trainer, the same bar as the rest of the app. */
export async function trainerName(user: Address): Promise<string> {
  const profile = await publicClient.readContract({ address: socemonAddress(), abi: SOCEMON_ABI, functionName: 'profileOf', args: [user] })
  if (!profile.registered) throw new HttpError('Claim your starter first', 403)
  return profile.name
}

/** Counts one hit against a Firestore-backed window and answers 429 once it is full. */
export async function stored(bucket: string, user: Address, max: number, windowMs?: number): Promise<void> {
  if (!(await underStoredLimit(`${bucket}:${user.toLowerCase()}`, max, windowMs))) throw new HttpError('Too many tries, wait a bit', 429)
}

/** Event hosts (EVENT_HOSTS) can take down anyone's post. */
export const canModerate = (user: Address) => isHostWallet(user)

export const toIso = (v: unknown): string => {
  if (v && typeof v === 'object' && 'toDate' in v) return (v as { toDate(): Date }).toDate().toISOString()
  return new Date().toISOString()
}
