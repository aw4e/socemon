import { NextResponse, type NextRequest } from 'next/server'
import type { Address } from 'viem'
import { HttpError, handle } from '@/lib/api'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { publicClient } from '@/lib/chain'
import { CHECKIN_EVENT, checkinSecret, checkinToken, currentEvent } from '@/lib/checkin'
import { SESSION_COOKIE, canOpenWall } from '@/lib/session'
import { NEXMON_ID, STARTER_ID, speciesById } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

/* The Monad RPC caps eth_getLogs at 100 blocks, so the wall reads from its cursor and never more than that.
   ponytail: a wall offline for over ~40 seconds skips feed items (counts stay right); add an indexer if that matters. */
const MAX_RANGE = 99n

type Line = { key: string; user: Address; other?: Address; monsterId: number | null; verb: string }

/** Event Wall data: the current check-in token, the drop count, and every catch since the `from` block. */
export function GET(req: NextRequest) {
  return handle(async () => {
    if (!(await canOpenWall(req.cookies.get(SESSION_COOKIE)?.value, req.nextUrl.searchParams.get('key')))) {
      throw new HttpError('Only event hosts can open the wall', 403)
    }

    const event = currentEvent()
    const contract = { address: socemonAddress(), abi: SOCEMON_ABI } as const
    const head = await publicClient.getBlockNumber()
    const from = req.nextUrl.searchParams.get('from') ?? ''
    const asked = /^\d{1,20}$/.test(from) ? BigInt(from) : 0n
    const fromBlock = asked > head - MAX_RANGE ? asked : head - MAX_RANGE

    const [logs, drop] = await Promise.all([
      fromBlock > head ? [] : publicClient.getContractEvents({ ...contract, fromBlock, toBlock: head }),
      publicClient.readContract({ ...contract, functionName: 'species', args: [BigInt(event.dropId)] }),
    ])

    const name = (id: number) => speciesById(id)?.name ?? 'a Socemon'
    const lines = logs.flatMap((log): Line[] => {
      const key = `${log.blockNumber}-${log.logIndex}`
      switch (log.eventName) {
        case 'Registered': return [{ key, user: log.args.user!, monsterId: STARTER_ID, verb: 'got Soci' }]
        case 'Connected': return [{ key, user: log.args.a!, other: log.args.b!, monsterId: null, verb: 'connected with' }]
        case 'EggHatched': return [{ key, user: log.args.to!, monsterId: Number(log.args.id), verb: `hatched ${name(Number(log.args.id))}` }]
        case 'DropMinted': return [{ key, user: log.args.to!, monsterId: Number(log.args.id), verb: `caught ${name(Number(log.args.id))}` }]
        case 'NexmonUnlocked': return [{ key, user: log.args.to!, monsterId: NEXMON_ID, verb: 'unlocked Nexmon' }]
        default: return []
      }
    })

    const people = [...new Set(lines.flatMap((l) => (l.other ? [l.user, l.other] : [l.user])))]
    const profiles = people.length
      ? ((await publicClient.multicall({
          allowFailure: false,
          contracts: people.map((p) => ({ ...contract, functionName: 'profileOf' as const, args: [p] as const })),
        })) as { name: string }[])
      : []
    const nameOf = new Map(people.map((p, i) => [p, profiles[i]?.name || shortAddress(p)]))

    return NextResponse.json({
      token: checkinToken(checkinSecret(), CHECKIN_EVENT, Date.now()),
      dropped: drop[2],
      feed: lines.map((l) => ({
        key: l.key,
        monsterId: l.monsterId,
        text: `${nameOf.get(l.user)} ${l.verb}${l.other ? ` ${nameOf.get(l.other)}` : ''}`,
      })),
      cursor: String(fromBlock > head ? fromBlock : head + 1n),
    })
  })
}
