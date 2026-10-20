import { expect, test } from '@playwright/test'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createSiweMessage } from 'viem/siwe'

/* Runs against a dev server (npm run test:api starts one). No wallet needed: every case here is a rejection. */
const WRITES = ['/api/register', '/api/connect', '/api/approve', '/api/hatch', '/api/partner', '/api/checkin']

test('every write route needs a session', async ({ request }) => {
  for (const path of WRITES) expect((await request.post(path, { data: {} })).status(), path).toBe(401)
  expect((await request.get('/api/auth/me')).status()).toBe(401)
})

test('sign-in hands out a nonce cookie and rejects junk', async ({ request }) => {
  const nonce = await request.get('/api/auth/nonce')
  expect(nonce.status()).toBe(200)
  expect(nonce.headers()['set-cookie']).toContain('socemon_nonce=')
  expect((await request.post('/api/auth/verify', { data: { message: 'hi', signature: 'nope' } })).status()).toBe(400)
  expect((await request.post('/api/auth/verify', { data: '[' })).status()).toBe(400)
})

test('the wall needs its key', async ({ request }) => {
  expect((await request.get('/api/wall')).status()).toBe(403)
  expect((await request.get('/api/wall?key=wrong')).status()).toBe(403)
})

test('a stale check-in QR lands on the expired page without a ticket', async ({ request }) => {
  const res = await request.get('/api/checkin/ticket?t=stale', { maxRedirects: 0 })
  expect(res.status()).toBe(307)
  expect(res.headers().location).toContain('/checkin?expired=1')
  expect(res.headers()['set-cookie'] ?? '').not.toContain('socemon_ticket=')
})

test('NFT metadata exists for every species and nothing else', async ({ request }) => {
  const soci = await request.get('/api/socemon/0')
  expect(soci.status()).toBe(200)
  expect((await soci.json()).name).toBe('Soci')
  expect((await request.get('/api/socemon/20')).status()).toBe(200)
  for (const bad of ['21', 'abc', '-1']) expect((await request.get(`/api/socemon/${bad}`)).status(), bad).toBe(404)
})

test('sign-in refuses a nonce the server did not issue', async ({ request, baseURL }) => {
  const account = privateKeyToAccount(generatePrivateKey())
  const nonce = 'forgednonce12345'
  const message = createSiweMessage({
    address: account.address, chainId: 10143, domain: new URL(baseURL!).host, nonce, uri: baseURL!, version: '1',
    statement: 'Sign in to Socemon',
  })
  const res = await request.post('/api/auth/verify', {
    data: { message, signature: await account.signMessage({ message }) },
    headers: { cookie: `socemon_nonce=${nonce}` },
  })
  expect(res.status()).toBe(401)
})

test('every page renders and the landing leads into the app', async ({ request }) => {
  const pages = ['/', '/app', '/app/dex', '/app/qr', '/app/event', '/app/me', '/u/0x0000000000000000000000000000000000000001', '/checkin']
  for (const path of pages) expect((await request.get(path)).status(), path).toBe(200)
  const landing = await (await request.get('/')).text()
  expect(landing).toContain('Launch app')
  expect(landing).toContain('href="/app"')
})
