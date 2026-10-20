import { expect, test } from '@playwright/test'
import { POOL, ROLES, SPECIES, speciesById, speciesInPool, typeName } from '../lib/socemon'
import { encodeAbiParameters, encodeEventTopics, type Log } from 'viem'
import { SOCEMON_ABI, hatchResult } from '../lib/socemon-chain'
import { CHECKIN_WINDOW_MS, checkinToken, isEventLive, verifyCheckinToken } from '../lib/checkin'

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
    expect(hatchResult([hatched(5n)])).toEqual({ id: 5, nexmon: false })
    expect(hatchResult([hatched(4n), nexmon])).toEqual({ id: 4, nexmon: true })
  })

  test('throws when the receipt has no hatch event', () => {
    expect(() => hatchResult([nexmon])).toThrow(/EggHatched/)
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
