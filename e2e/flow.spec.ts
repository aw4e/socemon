import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createSiweMessage } from 'viem/siwe'
import { WEARABLES, renderAvatar } from '../lib/avatar'
import { CHECKIN_EVENT, checkinToken } from '../lib/checkin'
import { speciesById } from '../lib/socemon'

/* The whole server path on Monad testnet with two throwaway wallets. It spends the minter's MON (about ten
   transactions), so it only runs on demand: npm run test:flow */

async function signIn(request: APIRequestContext, baseURL: string) {
  const account = privateKeyToAccount(generatePrivateKey())
  const { nonce } = await (await request.get('/api/auth/nonce')).json()
  const message = createSiweMessage({
    address: account.address, chainId: 10143, domain: new URL(baseURL).host, nonce, uri: baseURL, version: '1',
    statement: 'Sign in to Socemon',
  })
  const res = await request.post('/api/auth/verify', { data: { message, signature: await account.signMessage({ message }) } })
  expect(res.status(), await res.text()).toBe(200)
  return account.address
}

async function ok(pending: Promise<APIResponse>) {
  const res = await pending
  expect(res.status(), await res.text()).toBe(200)
  return res.json()
}

test('two trainers meet, hatch and check in onchain', async ({ playwright, baseURL }) => {
  test.setTimeout(180_000)
  const A = await playwright.request.newContext({ baseURL })
  const B = await playwright.request.newContext({ baseURL })
  const a = await signIn(A, baseURL!)
  const b = await signIn(B, baseURL!)
  expect((await ok(A.get('/api/auth/me'))).address).toBe(a)

  expect((await A.post('/api/register', { data: { name: '🙂'.repeat(7), role: 1 } })).status()).toBe(400)
  expect((await A.post('/api/register', { data: { name: '   ', role: 1 } })).status()).toBe(400)
  expect((await ok(A.post('/api/register', { data: { name: 'Flow A', role: 1 } }))).monsterId).toBe(0)
  await ok(B.post('/api/register', { data: { name: 'Flow B', role: 2 } }))
  expect((await A.post('/api/register', { data: { name: 'Again', role: 1 } })).status()).toBe(409)

  expect((await ok(A.post('/api/connect', { data: { to: b } }))).status).toBe('requested')
  expect((await A.post('/api/connect', { data: { to: b } })).status()).toBe(409)
  await ok(B.post('/api/approve', { data: { from: a } }))

  /* A has exactly one Blaze Egg: two hatches at once must give one catch and one 409, never a 500 */
  const both = await Promise.all([A.post('/api/hatch', { data: { pool: 2 } }), A.post('/api/hatch', { data: { pool: 2 } })])
  expect(both.map((r) => r.status()).sort()).toEqual([200, 409])
  const hatched = await both.find((r) => r.status() === 200)!.json()
  expect([4, 5, 6, 16, 17, 18]).toContain(hatched.monsterId)
  await ok(A.post('/api/partner', { data: { id: hatched.monsterId } }))
  expect((await A.post('/api/partner', { data: { id: 19 } })).status()).toBe(403)

  /* the connection also gave A one blind box: open it, wear the drop, and the avatar image shows it */
  const { itemId } = await ok(A.post('/api/box'))
  const item = WEARABLES.find((w) => w.id === itemId)!
  expect(item).toBeTruthy()
  expect((await A.post('/api/box')).status()).toBe(409)
  expect((await A.post('/api/equip', { data: { slot: (item.slot + 1) % 9, id: itemId } })).status()).toBe(400)
  await ok(A.post('/api/equip', { data: { slot: item.slot, id: itemId } }))
  const avatar = await A.get(`/api/avatar/${a}`)
  expect(avatar.headers()['content-type']).toBe('image/svg+xml')
  const svg = await avatar.text()
  const worn = Array(9).fill(0)
  worn[item.slot] = itemId
  expect(svg).toBe(renderAvatar(worn, svg.match(/href="(data:[^"]+)"/)?.[1]))

  const ticket = await B.get(`/api/checkin/ticket?t=${checkinToken(process.env.CHECKIN_SECRET!, CHECKIN_EVENT, Date.now())}`, { maxRedirects: 0 })
  expect(ticket.headers().location).toMatch(/\/checkin$/)
  expect((await ok(B.post('/api/checkin'))).monsterId).toBe(Number(process.env.EVENT_DROP_ID || 20))
  expect((await B.post('/api/checkin')).status()).toBe(403)

  const wall = await ok(A.get(`/api/wall?key=${process.env.WALL_KEY}`))
  expect(wall.dropped).toBeGreaterThan(0)
  expect(wall.feed.map((f: { text: string }) => f.text)).toContain(`Flow B caught ${speciesById(Number(process.env.EVENT_DROP_ID || 20))?.name}`)
})
