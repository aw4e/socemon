import { getAddress, isAddress, type Address } from 'viem'

export type Scan = { kind: 'trainer'; address: Address } | { kind: 'checkin'; path: string }

const ADDRESS = /^0x[0-9a-fA-F]{40}$/

/** What a scanned QR means here: a trainer (this site's profile link, a bare address, or a wallet's ethereum: code) or the
    Event Wall check-in. Links to any other origin or path are ignored, so a planted QR can never open a foreign site. */
export function parseScan(text: string, origin: string): Scan | null {
  const raw = text.trim()
  const wallet = raw.match(/^ethereum:(0x[0-9a-fA-F]{40})/)?.[1]
  const bare = wallet ?? raw
  if (ADDRESS.test(bare) && isAddress(bare, { strict: false })) return { kind: 'trainer', address: getAddress(bare) }

  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  if (url.origin !== origin) return null
  const trainer = url.pathname.match(/^\/u\/(0x[0-9a-fA-F]{40})\/?$/)?.[1]
  if (trainer) return { kind: 'trainer', address: getAddress(trainer) }
  if (url.pathname === '/api/checkin/ticket' && url.searchParams.get('t')) return { kind: 'checkin', path: `${url.pathname}${url.search}` }
  return null
}
