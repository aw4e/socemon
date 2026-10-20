<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/brand/lockup-horizontal-reversed.svg">
  <img src="public/brand/lockup-horizontal.svg" alt="Socemon" width="360">
</picture>

<br />
<br />

**Social on Monad. Catch your network.**

A digital NFC business card. Tap it on a phone and your profile opens with every link in one place.

<br />

[![Live](https://img.shields.io/badge/live-cardtena.aw4e.site-6A4DF4?style=for-the-badge)](https://cardtena.aw4e.site)
[![Version](https://img.shields.io/badge/version-1.0.0-1d1d1f?style=for-the-badge)](package.json)

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=flat-square&logo=firebase&logoColor=black)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat-square&logo=playwright&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)

<br />

[Features](#features) &nbsp;·&nbsp; [Getting started](#getting-started) &nbsp;·&nbsp; [Testing](#testing) &nbsp;·&nbsp; [Security](#security-model) &nbsp;·&nbsp; [Deployment](#deployment)

</div>

<br />

## About

Socemon (Social on Monad) turns real-world networking into a monster collection. Tap a physical Socemon card on a phone and it opens a profile page with all of your links. Every new person you connect with gives you an Egg of their type, events drop limited Socemon you can only catch by showing up, and the Event Wall shows every catch live on the big screen.

## Features

- **NFC cards.** Cards are provisioned in batches, written onto tags as a claim link, and claimed once by tapping. A claimed card opens its owner's public profile.
- **Public profile page (`/p/[username]`).** Only viewable with the card's share token, so it is reached by tapping the card or scanning its QR code. It is marked `noindex`.
- **Customizable page.** Pick a theme, accent color, font, button and photo style, reorder or hide sections and add text notes, with a live preview at `/design`.
- **Sign in with Google or a wallet.** Wallet sign-in verifies a signed one-time message. Wallets can also be linked to a Google account from Edit profile.
- **Connections.** Mutual taps and requests create connections with a snapshot of the other person's profile.
- **Explore.** Search people, browse and host events, and post or apply to jobs. Job pay is stored in the poster's currency and can be viewed converted to rupiah or dollars at the current rate.
- **Taps and badges.** Every tap is recorded, with badges for milestones.
- **Admin.** A super admin can generate cards, assign or revoke them, and manage other admins, with account suggestions while typing.
- **Installable.** Works as a PWA on phones.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router, Turbopack), React 19, TypeScript |
| Styling | Tailwind CSS 4, design tokens in `app/globals.css`, Framer Motion |
| Auth and data | Firebase Auth and Firestore, Firebase Admin SDK on the server |
| Wallets | Reown AppKit with wagmi and viem |
| Storage | Vercel Blob for avatars |
| Tests | Playwright |
| Hosting | Vercel |

## Getting started

Requirements: Node.js 20 or newer and a Firebase project with Auth (Google provider) and Firestore enabled.

```bash
npm install
cp .env.local.example .env.local   # then fill in the values below
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

### Environment variables

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_FIREBASE_*` | Web config from Firebase Console, Project settings. |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Project ID from the Reown (WalletConnect) dashboard. Add every site origin to its domain allowlist. |
| `FIREBASE_ADMIN_PROJECT_ID`, `FIREBASE_ADMIN_CLIENT_EMAIL`, `FIREBASE_ADMIN_PRIVATE_KEY` | Service account credentials, used only on the server. |
| `NEXT_PUBLIC_SITE_URL` | Public origin, for example `https://cardtena.aw4e.site`. Used for claim and profile links minted on the server. |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token for avatar uploads. |

Server secrets are never exposed with the `NEXT_PUBLIC_` prefix. A missing admin variable fails with a clear error on the first server request.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server. |
| `npm run build` and `npm start` | Production build and server. |
| `npm run test:e2e` | Run the Playwright suite. |
| `npm run provision-cards -- <count>` | Create unclaimed cards and print one claim link per line to write onto tags. |
| `npm run backfill-search-name` | Backfill the lowercase name field used by people search. |
| `node --env-file=.env.local scripts/scrub-claim-urls.mjs [--apply]` | Remove claim tokens from public card documents. Dry run unless `--apply` is passed. |

## Testing

```bash
npm run test:e2e
```

Playwright starts the dev server on port 3100 by default. If a dev server is already running, point the tests at it:

```bash
E2E_BASE_URL=http://localhost:3000 npm run test:e2e
```

In CI the suite builds the app and runs against `next start`. It covers API authentication, input validation and malformed bodies, security headers and CSP, `robots.txt`, signed-out pages, and the pure logic for page design and currency. Flows that need a signed-in user are not covered yet and would need the Firebase emulator.

### Security tests

Two extra suites check the security model directly:

```bash
npm run test:rules    # 177 cases against firestore.rules in the local Firestore emulator (needs Java)
npm run test:pentest  # penetration tests against the running API and public pages
```

`test:rules` never touches your real project. `test:pentest` creates throwaway accounts and records in the configured Firebase project, attacks the API as those accounts (privilege escalation, access to other people's data, injection, forged signatures, unsafe uploads, rate limits, stored XSS on the public page, information leaks) and deletes everything afterwards. It needs the admin credentials in `.env.local`, and `E2E_BASE_URL` points it at an already running server.

## Socemon on Monad

**Contract (Monad testnet, chain 10143):** [`0xcE14C7b651AC25128358116d272F915aBA042a1e`](https://testnet.monadscan.com/address/0xcE14C7b651AC25128358116d272F915aBA042a1e), verified source on Monadscan.

| Piece | Where |
| --- | --- |
| Contract | `contracts/src/Socemon.sol` (ERC-1155, Monad testnet `0xcE14C7b651AC25128358116d272F915aBA042a1e`) |
| Species catalog | `contracts/socemon.json`, read by the deploy script and by `lib/socemon.ts` |
| Server minter | `lib/socemon-chain.ts`, key in `MINTER_PRIVATE_KEY` (holds only `MINTER_ROLE`) |
| Check-in and Event Wall | `/api/events/[id]/checkin`, `/checkin/[eventId]`, `/wall/[eventId]` |

- **Soci**: every user with a linked wallet claims the starter. Soulbound.
- **Eggs**: each new connection (a mutual tap, or a request the other person approves) gives both people an Egg of the other person's type (Byte, Blaze, Prism, Gold, Echo, or Wild). Hatching mints a species weighted by remaining supply. Catch all five types and Nexmon joins you.
- **Event drops**: `npm run set-event-drop -- <eventId> 20` attaches Blitzmon to an event. The host opens the Event Wall, attendees scan its rotating QR, and the drop mints to their wallet. Event drops are the only tradeable Socemon.

```bash
npm run contracts:install   # forge-std and OpenZeppelin into contracts/lib
npm run test:contracts      # Foundry tests
```

## Project structure

```
app/            Routes: dashboard (/), /p, /card, /claim, /design, /settings, /admin
app/api/        Server routes using the Firebase Admin SDK
components/     UI by area: dashboard, explore, profile, admin, nav, ui
lib/            Shared logic: firestore access, page design, currency, rate limiting
e2e/            Playwright tests
scripts/        One-off admin scripts
docs/           Product context, design system and UI rules
firestore.rules Security rules
```

## Security model

- Clients read and write only what `firestore.rules` allows. Everything sensitive goes through `app/api` routes that verify the caller's ID token with the Admin SDK.
- A card's claim token lives in a private subcollection no client can read. The share token that unlocks a profile is only readable by fetching a single card, and clients cannot list cards.
- User photos must point at the app's Vercel Blob store. Badges, usernames, links, page design and wallet links are written only by the server after validation.
- Wallet links require a signature over a fresh one-time nonce. Requests are rate limited in Firestore, and input is validated before it reaches the database.
- The CSP and other security headers are set in `next.config.ts`.

## Deployment

The app deploys to Vercel. Set the environment variables above for Production, then push to `main` or run `vercel --prod`.

Some changes also need Firebase:

1. Publish rules after editing `firestore.rules`: `firebase deploy --only firestore:rules`.
2. Add a TTL policy on the `rateLimits` collection using the `expiresAt` field so old windows are cleaned up.
3. Add each deployed origin to Firebase Auth authorized domains and to the Reown domain allowlist.

## More documentation

- [Product context](docs/ProductContext.md)
- [Design system](docs/SocemonDesignSystem.md)
- [UI rules](docs/UIRules.md)
