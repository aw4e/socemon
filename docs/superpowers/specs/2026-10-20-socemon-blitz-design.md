# Socemon for Monad Blitz: standalone, fully onchain

Date: 2026-10-20. Supersedes the Firebase-based Socemon spec (2026-10-18, kept in the Cardtena repo `aw4e/Project-Cardtena`, branch `feat/nft-wardrobe`).

## 1. Purpose

Socemon ("Social on Monad") is a Pokémon-style monster collection for in-person events. You catch monsters by meeting people, and event-exclusive drops give people a reason to show up and give organizers verified attendance.

This spec turns Socemon into its own small repo for the Monad Blitz hackathon. Cardtena (NFC cards, profiles, jobs) stays the long-term product in its own repo and is not touched.

Success: a judge or attendee can, on their phone, connect a wallet, get Soci, connect with another attendee, hatch an Egg, and catch Blitzmon from the projector QR, with no database, no paid service, and no MON in their own wallet.

## 2. Decisions

| Topic | Decision |
| --- | --- |
| Data | Fully onchain. The contract stores profiles, connection requests, Eggs, monsters and partners. No database. |
| Writes | A server relayer sends every transaction with the minter key (`MINTER_ROLE`). Users never pay gas. |
| Identity | Wallet address. Sign-In with Ethereum (SIWE) once, then a 7-day session cookie. |
| Wallet UI | Reown AppKit (already a dependency; free project ID). |
| Events | One event per deployment, configured by env. The Event Wall is guarded by `WALL_KEY`. |
| Repo | New public repo `riorblade/socemon`, fresh git history, built in the current folder. |
| Hosting | Local dev first. Vercel Hobby later (the server is stateless); Hostinger VPS with `next start` as a fallback. |
| Art | Original Pokémon-style creatures generated in ChatGPT through Claude in Chrome (§9). |
| UI language | English. |

## 3. Architecture

```
Browser: AppKit wallet + SIWE session cookie
  ├─ reads  → contract view functions over the public Monad RPC (wagmi)
  └─ writes → POST /api/*  →  relayer (viem, minter key)  →  Socemon v2 on Monad testnet
```

The server holds no state. Every read the UI needs is a contract view function, so pages read the chain directly and the API only writes.

## 4. Contract: Socemon v2

A new deployment on Monad testnet (chain 10143) from the existing deployer keystore `socemon-deployer`. The v1 contract `0xcE14C7b651AC25128358116d272F915aBA042a1e` is abandoned.

Kept from v1: ERC-1155 + AccessControl, the species catalog from `contracts/socemon.json`, weighted random by remaining supply (prevrandao + nonce), soulbound everything except event drops, the Nexmon set bonus via `typeMask`, `name`/`symbol`, `uri(id) = baseURI + id`.

### 4.1 Roles and Egg types

`role` is a `uint8` and equals the Egg pool the *other* person receives:

| role | Type | Meaning |
| --- | --- | --- |
| 0 | Wild | other |
| 1 | Byte | developer |
| 2 | Blaze | founder |
| 3 | Prism | designer |
| 4 | Gold | investor |
| 5 | Echo | community |

### 4.2 State

- `Profile { string name; uint8 role; uint256 partner; bool registered }` per address.
- `link[a][b]`: `0` none, `1` a requested b, `2` connected (set both ways).
- `_incoming[user]`: addresses that requested `user` (append-only).
- `_connections[user]`: connected addresses.
- `_eggs[user][pool]` for pools 0..5.
- `claimedDrop[user][id]`: event drops are once per trainer, tracked apart from balances because drops are tradeable (a gifted Blitzmon must not block check-in, and giving one away must not allow a second claim).

### 4.3 Writes (all `onlyRole(MINTER_ROLE)`; the user is the first argument)

| Function | Effect | Reverts |
| --- | --- | --- |
| `register(user, name, role)` | Stores the profile, mints Soci (id 0), partner = 0 | `AlreadyRegistered`, `InvalidName` (not 1..24 bytes), `InvalidRole` (> 5) |
| `requestConnect(from, to)` | `link[from][to] = 1`, appends to `_incoming[to]`. If `to` already requested `from`, connects instead | `NotRegistered` (either side), `SelfConnect`, `AlreadyConnected`, `AlreadyRequested` |
| `approveConnect(user, from)` | Connects: `link` both ways = 2, both connection lists, `_eggs[user][role(from)]++`, `_eggs[from][role(user)]++` | `NoRequest` |
| `hatch(user, pool)` | Uses one Egg of `pool`, mints a species as in v1 (sold-out type pool falls back to Wild), Nexmon when all five types are owned | `InvalidPool` (> 5), `NoEgg`, `SoldOut` |
| `mintDrop(user, id)` | Mints an event species once per user | `NotRegistered`, `UnknownSpecies`, `AlreadyHasDrop`, `SoldOut` |
| `setPartner(user, id)` | Sets the partner shown on the profile | `NotOwned` |
| `addSpecies`, `setBaseURI` | Admin only (deployer), as in v1 | |

Every write is atomic, so a failed or repeated request never leaves half state. Hatching twice with one Egg makes the second transaction revert `NoEgg`.

### 4.4 Views

`profileOf(user)`, `eggsOf(user) returns uint16[6]`, `pendingOf(user) returns address[]` (filters `_incoming` to `link == 1`), `connectionsOf(user)`, `link(a, b)`, `species(id)`, `balanceOfBatch`, `poolSpecies(pool)`, `typeMask(user)`.

### 4.5 Events

`Registered(user, name, role)`, `ConnectRequested(from, to)`, `Connected(a, b)`, `EggHatched(to, pool, id)`, `DropMinted(to, id)`, `NexmonUnlocked(to)`, `PartnerSet(user, id)`.

## 5. Sign-in

1. `GET /api/auth/nonce`: a random nonce (`generateSiweNonce`) in an httpOnly cookie, 5 minutes.
2. The client builds the message with `viem/siwe` `createSiweMessage` (domain = host, chainId 10143, statement "Sign in to Socemon") and signs it with the connected wallet.
3. `POST /api/auth/verify { message, signature }`: parses the message, checks domain and nonce against the cookie, verifies with `publicClient.verifySiweMessage` (EOA and smart wallets), then sets `socemon_session`, a jose HS256 JWT (`sub` = address, 7 days, httpOnly, SameSite=Lax, Secure in production).
4. `GET /api/auth/me` returns `{ address }` or 401. `POST /api/auth/logout` clears the cookie.
5. When the connected wallet differs from the session address, the client signs in again.

## 6. App

### 6.1 Routes

| Route | Purpose |
| --- | --- |
| `/` | Gate (wallet → sign-in → register), then Home |
| `/u/[address]` | Public profile: name, type, partner, Socédex count, Connect button |
| `/checkin` | Exchanges the check-in ticket for the event drop |
| `/wall?key=…` | Event Wall for the projector |
| `GET /api/socemon/[id]` | ERC-1155 metadata (kept from v1) |
| `POST /api/register` `{ name, role }` | Relays `register` |
| `POST /api/connect` `{ to }` | Relays `requestConnect`; returns `{ status: 'requested' \| 'connected' }` |
| `POST /api/approve` `{ from }` | Relays `approveConnect` |
| `POST /api/hatch` `{ pool }` | Relays `hatch`; returns `{ id, nexmon, tx, ms }` |
| `POST /api/partner` `{ id }` | Relays `setPartner` |
| `GET /api/checkin/ticket?t=TOKEN` | Verifies the wall token, sets a 10-minute ticket cookie, redirects to `/checkin` |
| `POST /api/checkin` | Needs session + ticket + live event; relays `mintDrop`, clears the ticket |
| `GET /api/wall?key=…&from=N` | Wall data: token, expiry, drop count, feed since block N, next cursor |

Every write route returns `{ tx, ms }` so the Reveal overlay can show "Confirmed onchain in X.Xs" with an explorer link.

### 6.2 Flows

- **Onboarding**: connect wallet, sign once, enter name + role, claim Soci (Reveal).
- **Home**: partner (large), "My QR" (to `/u/<address>`), incoming requests with Approve, Eggs per type with Hatch, Socédex grid (silhouettes for missing species; tap an owned one to make it the partner). Reads refetch after each write and poll every 5 s for incoming requests.
- **Connect**: scan a friend's QR → `/u/<address>` → Connect → "Request sent", or "Connected" when they had already requested you. Unsigned visitors pass the gate first and return to the same profile.
- **Event**: the host opens `/wall?key=…`. The QR points to `/api/checkin/ticket?t=TOKEN` and refreshes every 10 s (tokens rotate every 30 s; current and previous windows are valid). The ticket cookie lets a new attendee finish onboarding before the token goes stale. `/checkin` then mints the drop (Reveal).
- **Event Wall feed**: polls `/api/wall` every 2 s. The server reads logs from the cursor to the head, capped at 100 blocks per call (the Monad RPC limit), and resolves names with a multicall of `profileOf`. The client keeps the last 30 items and shows toasts for drops, hatches and connections. Drop count = `species(dropId).minted`.

### 6.3 Errors

| Cause | HTTP | Shown |
| --- | --- | --- |
| No or bad session | 401 | Client signs in again |
| Bad input (`isAddress`, name 1..24 UTF-8 bytes after trimming, role/pool integer 0..5, id integer) | 400 | Field message |
| `InvalidName`, `InvalidRole`, `InvalidPool`, `SelfConnect` | 400 | Plain message |
| `NotRegistered`, `NotOwned`, wrong `WALL_KEY`, missing or expired ticket, event not live | 403 | Plain message |
| `AlreadyRegistered`, `AlreadyConnected`, `AlreadyRequested`, `NoRequest`, `NoEgg`, `AlreadyHasDrop`, `SoldOut`, `UnknownSpecies` | 409 | Plain message |
| RPC or transaction failure | 502 | "Monad is busy, try again" (retrying is safe) |

### 6.4 Environment

| Var | Source |
| --- | --- |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | User (free, dashboard.reown.com, allowlist localhost) |
| `NEXT_PUBLIC_SOCEMON_ADDRESS` | v2 deploy |
| `MINTER_PRIVATE_KEY` | Existing |
| `CHECKIN_SECRET` | Existing |
| `SESSION_SECRET`, `WALL_KEY` | Generated |
| `EVENT_NAME` (default "Monad Blitz"), `EVENT_DROP_ID` (default 20) | Optional |
| `EVENT_STARTS_AT`, `EVENT_ENDS_AT` (ISO) | Optional; unset means always live (local dev) |
| `MONAD_RPC_URL`, `NEXT_PUBLIC_SITE_URL` | Optional |

## 7. Workspace reset and repo

1. Keep `.env.local` and `.superpowers/` in place; the deployer keystore lives in `~/.foundry`. All Cardtena branches are already pushed (verified: 0 unpushed commits, no stash).
2. Delete `.git`.
3. Delete everything outside the kept list (§7.1), prune `package.json`, `npm install`.
4. Add `.superpowers/` to `.gitignore` (it was only excluded through `.git/info/exclude`).
5. `git init -b main`, first commit.
6. Once the build is green: `gh repo create riorblade/socemon --public --source=. --push`. Push again at the end.
7. The local folder keeps its name `Project-Cardtena`; renaming it mid-session would break the session.

### 7.1 Kept

- `contracts/` (v2 source, tests, deploy script, `socemon.json`, `foundry.toml`)
- `app/`: layout, globals.css, icons, manifest, opengraph image, robots, not-found, error pages, `api/socemon/[id]`; `page.tsx`, `checkin`, `wall` rewritten; `u/[address]` and the new API routes added
- `components/`: `brand/Logo`, `socemon/MonsterImage`, `socemon/Reveal`, `ui/Button`, the Web3 and motion providers
- `lib/`: `socemon.ts`, `checkin.ts`, `wagmi.ts`, `utils.ts`; `chain.ts` (relayer, from `socemon-chain.ts`) and `session.ts` added
- `public/`: icons, brand, `socemon/` art
- Tests: `e2e/socemon.spec.ts` plus a new API smoke spec, `playwright.config.ts`
- `README.md` (rewritten), `.monskills`, `.env.local.example` (rewritten), `AGENTS.md` (committed; `next dev` regenerates it), this spec and its plan

Removed: Firebase (client, admin, tools, rules, rules tests), Vercel Blob, lottie-react, react-icons, NFC cards, claim, jobs, explore, page design editor, admin, settings, the old dashboard tabs, contexts, hooks, old types, scripts, pentest and the old API/page suites, `reference/`, `design.md`, old docs.

## 8. Testing

- **Foundry**: every write and its reverts, mutual request auto-connect, Egg type follows the other person's role, Egg consumption, Nexmon set bonus, soulbound transfers, drop needs registration, `pendingOf` filtering, catalog JSON seeds every species.
- **Pure TS** (Playwright runner, no browser): catalog, check-in tokens, session JWT round trip and tampering, revert-name → HTTP mapping, hatch receipt parsing.
- **API smoke** against the dev server: every write route returns 401 without a session, the wall returns 403 without the key, metadata returns 200/404.
- **Manual**: two browser profiles with two wallets on localhost, one full loop: register → profile QR → connect → approve → hatch → partner → wall → check-in.

## 9. Monster art

21 original creatures (ids 0..20), never copies of existing Pokémon. Generated in the user's logged-in ChatGPT through Claude in Chrome, in one chat so the style stays consistent. Soci first, as the style anchor.

Shared style line, sent with Soci and repeated as "same style as before" afterwards:

> Original cute creature for a monster-collecting game, official character artwork style: clean bold lineart, cel shading, soft gradients, vibrant colors, full body, three-quarter view, centered, single creature, no text, no logo, transparent background, square.

| id | Name | Brief |
| --- | --- | --- |
| 0 | Soci | Starter. Small round Monad-purple (#836EF9) creature, big friendly eyes, stubby arms, a tiny antenna shaped like a chain link |
| 1 | Bitlet | Byte common. Tiny cube-bodied critter like a pixel, glowing cyan circuit lines, one antenna |
| 2 | Codrake | Byte rare. Small dragon with keyboard-key scales and curly-bracket horns, cyan and navy |
| 3 | Kernox | Byte epic. Large armored robotic beast, glowing chip core on the chest, circuit-trace wings |
| 4 | Emberoo | Blaze common. Small kangaroo-like critter with a flame-tipped tail, orange |
| 5 | Pitchfox | Blaze rare. Confident fox with flaming tails and a small scarf, holding a flame |
| 6 | Unicorvex | Blaze epic. Majestic fiery unicorn, blue-flame horn, mane like rocket exhaust |
| 7 | Huebit | Prism common. Small rabbit-like creature with paint-drip ears in pastel rainbow |
| 8 | Palettail | Prism rare. Chameleon whose tail is a painter's palette, color-shifting skin |
| 9 | Chromora | Prism epic. Elegant moth-phoenix with prismatic glass wings refracting rainbow light |
| 10 | Coinpup | Gold common. Puppy with gold-coin markings, holding a coin, gold and cream |
| 11 | Bullrock | Gold rare. Sturdy bull of gold-veined rock in a charging pose |
| 12 | Aurumane | Gold epic. Regal golden lion with a mane of gold coins and light rays |
| 13 | Chirpi | Echo common. Tiny round songbird with a speech-bubble crest, teal and pink |
| 14 | Megaphowl | Echo rare. Owl with megaphone-shaped ears and sound-wave feathers |
| 15 | Chorusaur | Echo epic. Large dinosaur with organ-pipe speakers along its back, roaring sound waves |
| 16 | Mossby | Wild. Small round moss-covered creature with a sprout on its head |
| 17 | Pebblit | Wild. Little sleepy pebble creature with tiny legs, grey-beige |
| 18 | Puddlet | Wild. Small translucent blue water-droplet creature, jelly-like |
| 19 | Nexmon | Legendary. Majestic creature combining all five types: cyan circuit lines, flame mane, prism wings, golden horns, sound-wave tail, Monad-purple glowing core |
| 20 | Blitzmon | Event. Lightning-fast Monad-purple creature with zigzag electric ears and tail, speed lines, a lightning-bolt emblem |

Pipeline: download each image, move it to `public/socemon/{id}.png`, downscale with macOS `sips -Z 512`, and check `sips -g hasAlpha`. An image without transparency is regenerated. A test asserts all 21 files exist as 512 px PNGs with alpha. If ChatGPT rate-limits image generation, the work stops and the user is told; `MonsterImage` falls back to the name meanwhile.

## 10. Known ceilings

| Ceiling | Upgrade path |
| --- | --- |
| The relayer is fully trusted; a leaked server key can forge user actions | EIP-712 user-signed intents verified onchain |
| Spam registrations or requests drain the minter's testnet MON | Rate limiting per session; faucet top-ups meanwhile |
| Two accounts can connect each other to farm Eggs | Require a mutual in-person proof (NFC tap) later |
| No decline; ignored requests stay pending | A `decline` function |
| Anyone in the room can script many throwaway wallets, each fetching a ticket from the projector token, and claim a drop per wallet (the ticket is a bearer cookie, so binding it to an address would not stop this) | Proof of personhood or a host-approved attendee list |
| The wall only sees logs while it polls; a wall offline for more than ~40 s skips feed items (counts stay correct) | An indexer |
| One event per deployment | An onchain event registry |
| Accounts under the 10 MON reserve are rate-limited by Monad; the minter needs a top-up before the demo | Keep the minter above 10 MON |
| prevrandao randomness while the relayer picks the timing | Pyth Entropy |

## 11. Out of scope

Physical NFC cards, a marketplace (Blitzmon trades through any wallet or NFT marketplace), multiple events, notifications, rate limiting, account deletion.
