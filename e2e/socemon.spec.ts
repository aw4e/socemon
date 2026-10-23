import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { POOL, ROLES, SPECIES, TYPE_COLOR, colorOf, imageFor, speciesById, speciesInPool, typeName, typesCaught } from '../lib/socemon'
import { encodeAbiParameters, encodeEventTopics, type Log } from 'viem'
import { SOCEMON_ABI } from '../lib/abi'
import { SLOT_NAMES, WEARABLES, renderAvatar, renderWearable } from '../lib/avatar'
import { boxResult, gasLimit, hatchResult } from '../lib/chain'
import { underLimit } from '../lib/ratelimit'
import { CHECKIN_WINDOW_MS, MEET_WINDOW_MS, checkinToken, currentEvent, isEventLive, isHost, meetCode, verifyCheckinToken, verifyMeetCode } from '../lib/checkin'
import { errorFor } from '../lib/errors'
import { perksFor, rushKitFor } from '../lib/game'
import { parseScan } from '../lib/scan'
import { readToken, signToken } from '../lib/session'

test.describe('socemon catalog', () => {
  test('ids are 1..20, unique, and match the spec table', () => {
    expect(SPECIES.map((s) => s.id)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
    for (let pool = 1; pool <= 5; pool++) {
      expect(speciesInPool(pool).map((s) => [s.tier, s.maxSupply, s.transferable])).toEqual([
        ['common', 500, false], ['rare', 100, false], ['epic', 20, false],
      ])
    }
    expect(speciesInPool(POOL.wild).map((s) => s.maxSupply)).toEqual([500, 500, 500])
    expect(speciesById(19)).toMatchObject({ name: 'Nexmon', pool: POOL.bonus, tier: 'legendary', maxSupply: 100, transferable: false })
    expect(speciesById(20)).toMatchObject({ name: 'Blitzmon', pool: POOL.event, tier: 'event', maxSupply: 100, transferable: true })
    expect(speciesById(0)?.name).toBe('Soci')
    expect(speciesById(21)).toBeUndefined()
  })

  test('every role is its own Egg type, Wild is 0', () => {
    expect(ROLES.map((r) => r.role)).toEqual([0, 1, 2, 3, 4, 5])
    expect(ROLES.map((r) => typeName(r.role))).toEqual(['Wild', 'Byte', 'Blaze', 'Prism', 'Gold', 'Echo'])
    expect(ROLES.map((r) => r.label)).toEqual(['Other', 'Developer', 'Founder', 'Designer', 'Investor', 'Community'])
    expect(typeName(POOL.event)).toBe('Event')
    expect(typeName(POOL.bonus)).toBe('Legendary')
  })

  test('every pool has a color and Soci wears Monad purple', () => {
    for (let pool = 0; pool <= 7; pool++) expect(TYPE_COLOR[pool], `pool ${pool}`).toMatch(/^#[0-9A-F]{6}$/i)
    expect(colorOf(0)).toBe('#836EF9')
    expect(colorOf(4)).toBe(TYPE_COLOR[POOL.blaze])
    expect(colorOf(20)).toBe(TYPE_COLOR[POOL.event])
  })

  test('types caught counts the five role types only', () => {
    expect(typesCaught(new Set())).toBe(0)
    expect(typesCaught(new Set([0, 16, 19, 20]))).toBe(0)
    expect(typesCaught(new Set([1, 2, 4, 15]))).toBe(3)
  })
})

test('My code QR codes last 5 to 10 minutes and only for their owner', () => {
  process.env.CHECKIN_SECRET ??= 'test-secret-test-secret-test-secret'
  const owner = '0xAbC0000000000000000000000000000000000001'
  const t = 1_800_000_000_000
  const code = meetCode(owner, t)
  expect(code).toHaveLength(22)
  expect(verifyMeetCode(owner.toLowerCase(), code, t + MEET_WINDOW_MS)).toBe(true)
  expect(verifyMeetCode(owner, code, t + 2 * MEET_WINDOW_MS + 1)).toBe(false)
  expect(verifyMeetCode('0x0000000000000000000000000000000000000002', code, t)).toBe(false)
  expect(verifyMeetCode(owner, 'stale', t)).toBe(false)
  expect(verifyMeetCode(owner, 'é'.repeat(22), t)).toBe(false) // 22 characters, 44 bytes: must be false, not a throw
})

test('only wallets in EVENT_HOSTS are hosts, any letter case', () => {
  const env = { EVENT_HOSTS: '0xAbC0000000000000000000000000000000000001, 0x0000000000000000000000000000000000000002' }
  expect(isHost('0xabc0000000000000000000000000000000000001', env)).toBe(true)
  expect(isHost('0x0000000000000000000000000000000000000002', env)).toBe(true)
  expect(isHost('0x0000000000000000000000000000000000000003', env)).toBe(false)
  expect(isHost(null, env)).toBe(false)
  expect(isHost('0x0000000000000000000000000000000000000002', {})).toBe(false)
})

test('game perks come from worn NFTs and the pet', () => {
  expect(perksFor([0, 0, 0, 0, 0, 0, 0, 0, 0], 0)).toEqual({ lives: 1, gap: 0, speed: 1, multiplier: 1, sources: [] })
  // Circuit Wings +2 lives, Cyber Visor +25 gap, Blitz Jacket +1 life and 15% slower, Plasma Blade +1x, Pitchfox (rare) +0.25x
  const p = perksFor([0, 0, 0, 190, 0, 0, 161, 171, 181], 5)
  expect(p).toMatchObject({ lives: 4, gap: 25, speed: 0.85, multiplier: 2.25 })
  expect(p.sources.map((s) => s.name)).toEqual(['Blitz Jacket', 'Cyber Visor', 'Plasma Blade', 'Circuit Wings', 'Pitchfox (pet)'])
  expect(perksFor([0, 110, 120, 0, 140], 0).sources).toEqual([]) // style-only wearables
})

test('Blitz Rush moves come from worn wearables', () => {
  expect(rushKitFor([0, 0, 0, 0, 0, 0, 0, 0, 0], 0)).toEqual({ abilities: [], shields: 0, topSpeed: 0, sources: [] })
  const kit = rushKitFor([0, 0, 0, 190, 0, 0, 0, 171, 180], 5)
  expect(kit.abilities.map((a) => a.id)).toEqual(['boost', 'slash'])
  expect(kit).toMatchObject({ shields: 1, topSpeed: 0.04 })
  expect(rushKitFor([0, 0, 0, 131, 0, 0, 0, 0, 181], 0)).toMatchObject({ topSpeed: 0.08, shields: 0 })
  expect(rushKitFor([0, 0, 0, 131, 0, 0, 0, 0, 181], 0).abilities.map((a) => a.id)).toEqual(['fly'])
})

test.describe('wearables', () => {
  test('ids are unique, slots valid, and every wearable draws something on the bare avatar', () => {
    expect(new Set(WEARABLES.map((w) => w.id)).size).toBe(WEARABLES.length)
    const bare = renderAvatar(Array(SLOT_NAMES.length).fill(0))
    for (const w of WEARABLES) {
      expect(w.slot, w.name).toBeLessThan(SLOT_NAMES.length)
      expect(renderWearable(w.id), w.name).not.toBe(bare)
    }
    expect(renderWearable(999)).toBeNull()
    expect(speciesById(190)).toMatchObject({ name: 'Blitz Jacket', pool: POOL.event, maxSupply: 200, transferable: true })
    expect(imageFor(190)).toBe('/api/avatar/190')
  })

  test('a hat or hood hides the hair under it', () => {
    const hair = renderAvatar([0, 0, 0, 0, 140])
    expect(hair).toContain('#4A3426')
    expect(renderAvatar([0, 0, 0, 0, 140, 150])).not.toContain('#4A3426')
  })
})

test.describe('hatch receipts', () => {
  const to = '0x00000000000000000000000000000000000000a1'
  /* encodeEventTopics types slots as Hex | Hex[] | null; every slot here is a plain Hex */
  const log = (topics: readonly unknown[], data: `0x${string}`): Log => ({
    address: '0x0000000000000000000000000000000000000001', topics: topics as [`0x${string}`, ...`0x${string}`[]], data,
    blockHash: null, blockNumber: null, logIndex: null, transactionHash: null, transactionIndex: null, removed: false,
  })
  const hatched = (id: bigint) => log(
    encodeEventTopics({ abi: SOCEMON_ABI, eventName: 'EggHatched', args: { to } }),
    encodeAbiParameters([{ type: 'uint8' }, { type: 'uint256' }], [2, id]),
  )
  const nexmon = log(encodeEventTopics({ abi: SOCEMON_ABI, eventName: 'NexmonUnlocked', args: { to } }), '0x')

  test('reads the hatched species and the Nexmon bonus', () => {
    expect(hatchResult([hatched(5n)])).toEqual({ monsterId: 5, nexmon: false })
    expect(hatchResult([hatched(4n), nexmon])).toEqual({ monsterId: 4, nexmon: true })
  })

  test('throws when the receipt has no hatch event', () => {
    expect(() => hatchResult([nexmon])).toThrow(/EggHatched/)
  })

  test('reads the wearable a blind box dropped', () => {
    const opened = log(encodeEventTopics({ abi: SOCEMON_ABI, eventName: 'BoxOpened', args: { to } }), encodeAbiParameters([{ type: 'uint256' }], [131n]))
    expect(boxResult([nexmon, opened])).toBe(131)
    expect(() => boxResult([nexmon])).toThrow(/BoxOpened/)
  })
})

test.describe('check-in tokens', () => {
  const secret = 'test-secret'
  const now = 1_800_000_000_000

  test('accepts the current and the previous window only', () => {
    const token = checkinToken(secret, 'e1', now)
    expect(verifyCheckinToken(secret, 'e1', token, now)).toBe(true)
    expect(verifyCheckinToken(secret, 'e1', token, now + CHECKIN_WINDOW_MS)).toBe(true)
    expect(verifyCheckinToken(secret, 'e1', token, now + 2 * CHECKIN_WINDOW_MS)).toBe(false)
  })

  test('rejects another event, another secret and junk', () => {
    const token = checkinToken(secret, 'e1', now)
    expect(verifyCheckinToken(secret, 'e2', token, now)).toBe(false)
    expect(verifyCheckinToken('other', 'e1', token, now)).toBe(false)
    for (const junk of [undefined, null, 1, '', 'x'.repeat(65), token.slice(1)]) {
      expect(verifyCheckinToken(secret, 'e1', junk, now)).toBe(false)
    }
  })

  test('an event is live from 30 minutes early until it ends', () => {
    const startsAt = new Date(now)
    const endsAt = new Date(now + 3 * 3600_000)
    expect(isEventLive({ startsAt, endsAt }, now - 31 * 60_000)).toBe(false)
    expect(isEventLive({ startsAt, endsAt }, now - 29 * 60_000)).toBe(true)
    expect(isEventLive({ startsAt, endsAt }, endsAt.getTime())).toBe(true)
    expect(isEventLive({ startsAt, endsAt }, endsAt.getTime() + 1)).toBe(false)
    expect(isEventLive({ startsAt }, now + 11 * 3600_000)).toBe(true)
    expect(isEventLive({ startsAt, endsAt: null }, now + 13 * 3600_000)).toBe(false)
  })
})

test.describe('the event', () => {
  const now = 1_800_000_000_000

  test('comes from env and is always live without a start time', () => {
    expect(currentEvent({}, now)).toEqual({ name: 'Monad Blitz', dropId: 20, live: true })
    const env = { EVENT_NAME: 'Blitz Jakarta', EVENT_DROP_ID: '20', EVENT_STARTS_AT: new Date(now + 3600_000).toISOString() }
    expect(currentEvent(env, now)).toEqual({ name: 'Blitz Jakarta', dropId: 20, live: false })
    expect(currentEvent(env, now + 3600_000).live).toBe(true)
  })
})

test.describe('api errors', () => {
  test('reverts map to plain statuses, anything else is a 502', () => {
    expect(errorFor('NoEgg').status).toBe(409)
    expect(errorFor('InvalidRole').status).toBe(400)
    expect(errorFor('NotRegistered').status).toBe(403)
    expect(errorFor(null)).toEqual({ status: 502, error: 'Monad is busy, try again' })
    expect(errorFor('SomethingNew').status).toBe(502)
  })

  test('every revert a user can hit has a message', () => {
    const userFacing = SOCEMON_ABI.flatMap((x) => (x.type === 'error' ? [x.name] : []))
      .filter((n) => n !== 'Soulbound' && n !== 'InvalidSpecies')
    expect(userFacing.length).toBeGreaterThan(10)
    for (const name of userFacing) expect(errorFor(name).status, name).toBeLessThan(500)
  })
})

test.describe('sessions', () => {
  const secret = 'x'.repeat(32)

  test('a token round-trips and rejects tampering, other secrets and other audiences', async () => {
    const token = await signToken(secret, 'session', '0xabc', 60)
    expect(await readToken(secret, 'session', token)).toBe('0xabc')
    expect(await readToken(secret, 'ticket', token)).toBeNull()
    expect(await readToken('y'.repeat(32), 'session', token)).toBeNull()
    expect(await readToken(secret, 'session', `${token.slice(0, -4)}AAAA`)).toBeNull()
    expect(await readToken(secret, 'session', undefined)).toBeNull()
  })
})

test.describe('art', () => {
  /* ponytail: sample art only (Soci, Bitlet, Codrake); MonsterImage shows the name for the rest. Add ids as art lands. */
  test('the sample species have a 512px PNG with transparency', () => {
    for (const id of [0, 1, 2]) {
      const png = readFileSync(`public/socemon/${id}.png`)
      expect(png.subarray(1, 4).toString(), `${id}`).toBe('PNG')
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], `${id} size`).toEqual([512, 512])
      expect([4, 6], `${id} alpha`).toContain(png[25])
    }
  })
})

test.describe('relayer gas', () => {
  /* measured on Monad: a hatch estimated while the roll lands on an owned species (142,991) can be included
     when it lands on a new one (161,483), because a fresh balance slot costs ~18k more */
  test('the limit covers a hatch that rolls a new species after estimating an owned one', () => {
    expect(gasLimit(142_991n)).toBeGreaterThan(161_483n)
  })
})

test.describe('scanning', () => {
  const origin = 'https://socemon.example'
  const a = '0x1a627F3F4A838B4948adb1bFF2b5179a70707CA3'

  test('profile links, bare addresses and wallet QR codes open a trainer', () => {
    expect(parseScan(`${origin}/u/${a}`, origin)).toEqual({ kind: 'trainer', address: a })
    expect(parseScan(`${origin}/u/${a.toLowerCase()}/`, origin)).toEqual({ kind: 'trainer', address: a })
    expect(parseScan(`  ${a.toLowerCase()} `, origin)).toEqual({ kind: 'trainer', address: a })
    expect(parseScan(`ethereum:${a}@10143`, origin)).toEqual({ kind: 'trainer', address: a })
  })

  test('a live My code QR carries its rotating code', () => {
    expect(parseScan(`${origin}/u/${a}?c=abc_123`, origin)).toEqual({ kind: 'trainer', address: a, code: 'abc_123' })
  })

  test('the Event Wall code goes to check-in', () => {
    expect(parseScan(`${origin}/api/checkin/ticket?t=abc`, origin)).toEqual({ kind: 'checkin', path: '/api/checkin/ticket?t=abc' })
  })

  test('anything else is ignored, so a planted QR never opens a foreign link', () => {
    const junk = ['', 'hello', `https://evil.example/u/${a}`, `${origin}/u/0x123`, `${origin}/api/checkin/ticket`, `${origin}/app`, 'javascript:alert(1)']
    for (const text of junk) expect(parseScan(text, origin), text).toBeNull()
  })
})

test('rate limiter lets max hits through per window, then resets', () => {
  const t = 1_000_000
  const hit = (now: number) => underLimit('rl-test', 3, 1000, now)
  expect([hit(t), hit(t), hit(t), hit(t)]).toEqual([true, true, true, false])
  expect(hit(t + 1000)).toBe(true)
})
