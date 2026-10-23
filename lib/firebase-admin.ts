import { cert, getApps, initializeApp, type App } from 'firebase-admin/app'
import { getFirestore, type Firestore } from 'firebase-admin/firestore'

/* Server-only Firestore for the Explore tab: Socemon's own Firebase project. The browser never talks to Firestore, every
   read and write goes through /api/explore, so the project's security rules can deny everything.
   Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY (a service account key, server only). */

let db: Firestore | null = null

function adminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing
  const { FIREBASE_ADMIN_PROJECT_ID: projectId, FIREBASE_ADMIN_CLIENT_EMAIL: clientEmail, FIREBASE_ADMIN_PRIVATE_KEY: privateKey } = process.env
  if (projectId && clientEmail && privateKey) {
    return initializeApp({ credential: cert({ projectId, clientEmail, privateKey: privateKey.replace(/\\n/g, '\n') }) })
  }
  throw new Error('Firestore is not set up: set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY')
}

export const adminDb = (): Firestore => (db ??= getFirestore(adminApp()))
