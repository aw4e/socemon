// Writes the event this deployment runs into Firestore: config/event (what the app reads) and, with --link, its card in Explore.
// Usage: node scripts/seed-event.mjs [--link https://lu.ma/your-event] [--banner https://...blob.vercel-storage.com/event-banners/x.png]
// Needs FIREBASE_ADMIN_* in .env.local. Safe to run again: it overwrites the same two documents.
import { cert, initializeApp } from 'firebase-admin/app'
import { FieldValue, getFirestore, Timestamp } from 'firebase-admin/firestore'

try { process.loadEnvFile('.env.local') } catch {}

const arg = (name) => { const i = process.argv.indexOf(name); return i > -1 ? process.argv[i + 1] : undefined }
const missing = ['FIREBASE_ADMIN_PROJECT_ID', 'FIREBASE_ADMIN_CLIENT_EMAIL', 'FIREBASE_ADMIN_PRIVATE_KEY'].filter((k) => !process.env[k])
if (missing.length) { console.error(`Missing in .env.local: ${missing.join(', ')}`); process.exit(1) }

initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
})
const db = getFirestore()

const EVENT = {
  name: 'Monad Blitz Jogja Vol. 2',
  dropId: 190, // the Blitz Jacket (id 20 is the Blitzmon monster)
  startsAt: Timestamp.fromDate(new Date('2026-10-24T07:00:00+07:00')),
  endsAt: Timestamp.fromDate(new Date('2026-10-24T19:00:00+07:00')),
  hosts: [], // wallet addresses allowed to open the Event Wall and remove posts; add them here or in the console
}

await db.collection('config').doc('event').set(EVENT, { merge: true })
console.log('config/event written:', EVENT.name, '24 Oct 2026, 07:00 to 19:00 WIB')

const link = arg('--link')
if (link) {
  if (!/^https?:\/\//.test(link)) { console.error('--link must start with http:// or https://'); process.exit(1) }
  await db.collection('events').doc('monad-blitz-jogja-vol-2').set({
    title: EVENT.name,
    link,
    bannerUrl: arg('--banner') ?? null,
    hostUid: 'wallet:socemon',
    hostName: 'Monad',
    createdAt: FieldValue.serverTimestamp(),
  })
  console.log('events/monad-blitz-jogja-vol-2 written:', link)
} else {
  console.log('No --link given, so the event has no card in Explore yet. Run again with --link <event page>.')
}
process.exit(0)
