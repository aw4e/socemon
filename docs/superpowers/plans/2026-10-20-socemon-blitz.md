# Socemon Blitz Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah folder Cardtena ini menjadi repo Socemon mandiri untuk Monad Blitz: kontrak v2 yang menyimpan semua data, server relayer tanpa database, dan UI mobile sederhana (Home, profil publik, check-in, Event Wall).

**Architecture:** Kontrak Socemon v2 (ERC-1155 + AccessControl) menyimpan profil, request connect, Egg, monster, dan partner. Next.js 16 hanya punya route API yang mengirim tx dengan key minter (`MINTER_ROLE`) setelah user login SIWE (cookie JWT). Browser membaca semuanya langsung dari kontrak lewat wagmi multicall.

**Tech Stack:** Next.js 16.4, React 19, Tailwind 4, viem 2.54 (`viem/siwe`), wagmi 3.6, Reown AppKit 1.8, jose 6, qrcode, framer-motion, Foundry (solc 0.8.28, OpenZeppelin 5.6.1), Playwright test runner (tanpa browser).

**Spec:** `docs/superpowers/specs/2026-10-20-socemon-blitz-design.md`

## Global Constraints

- Monad testnet chain id `10143`, RPC `https://testnet-rpc.monad.xyz`, explorer `https://testnet.monadscan.com`.
- `eth_getLogs` di RPC publik dibatasi 100 blok per panggilan.
- Monad menagih gas limit, bukan gas terpakai: buffer estimasi 10%.
- Next 16: baca panduan di `node_modules/next/dist/docs/` sebelum memakai API Next. `cookies()` async; GET route handler dinamis secara default; segment config `dynamic` tidak dipakai.
- wagmi 3: pakai `useConnection` (bukan `useAccount`) dan `mutateAsync` (bukan `signMessageAsync`).
- Semua teks UI dalam bahasa Inggris; dokumen dan komunikasi dengan user dalam bahasa Indonesia.
- Jangan pernah mencetak private key atau secret; `.env.local` tetap di-gitignore.
- Tanpa baris atribusi di commit.
- Ponytail: kode seminimal mungkin; setiap batasan sengaja diberi komentar `ponytail:` dengan jalur upgrade-nya.
- Repo baru: `riorblade/socemon`, publik, riwayat git mulai bersih.
- Deployer: keystore Foundry `socemon-deployer` (`0xC2CA1Fcfd805e6Edfd8CA7788A4Ee630A78C8D7f`), password di `~/.foundry/socemon-deployer.password`. Minter: `0x1a627F3F4A838B4948adb1bFF2b5179a70707CA3`, key di `.env.local`.

## Review Focus

1. **Dua hatch bersamaan dengan satu Egg** (double tap, dua tab): satu 200 dan satu 409, bukan 500. Tx kedua bisa terkirim sebelum yang pertama ter-mine, jadi revert-nya baru terlihat di receipt. Diuji di `e2e/flow.spec.ts`.
2. **Wallet diganti setelah login:** server hanya memakai alamat dari sesi, dan UI meminta login ulang kalau wallet ≠ sesi (`useSession`). Dicek di review dan manual.
3. **QR check-in basi atau dipakai ulang:**
   - token basi → tanpa tiket
   - tiket sekali pakai
   - sudah punya drop → 409

   Diuji di `api.spec.ts` dan `flow.spec.ts`.
4. **Nama aneh** (emoji lebih dari 24 byte, spasi saja): 400 dengan pesan, sebelum ada tx. Diuji di `flow.spec.ts`.
5. **RPC publik kena rate limit di Wi-Fi venue:** read dibatch lewat multicall, polling 5 detik, ada `NEXT_PUBLIC_MONAD_RPC_URL` sebagai jalan keluar. Dicek di review.

---

### Task 1: Reset workspace, kerangka yang bisa di-build, dan repo baru

**Files:**
- Delete: `.git`, semua yang tidak ada di spec §7.1 (daftar lengkap di Step 2)
- Modify: `package.json`, `.gitignore`, `next.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/robots.ts`, `lib/socemon.ts`, `lib/utils.ts`, `lib/motion.ts`, `lib/wagmi.ts`, `components/providers/Web3Provider.tsx`, `playwright.config.ts`, `.env.local.example`
- Test: `e2e/socemon.spec.ts`

**Interfaces:**
- Produces: `ROLES` (`{ role, type, label }[]`, role 0..5) dan `typeName(pool)` dari `lib/socemon.ts`; `shortAddress(a)` dari `lib/utils.ts`; `wagmiConfig`, `wagmiAdapter`, `networks`, `projectId` dari `lib/wagmi.ts`.

- [ ] **Step 1: Pastikan tidak ada yang hilang**

```bash
cd /Users/kiel/Documents/Hacathon/Project-Cardtena
git fetch -q origin && for b in main feat/nft-wardrobe; do echo "$b $(git rev-list --count origin/$b..$b)"; done; git stash list | wc -l; git status --short
```

Expected: `main 0`, `feat/nft-wardrobe 0`, `0`, dan status hanya berisi `?? AGENTS.md` serta file spec/plan baru di `docs/superpowers/`.

- [ ] **Step 2: Hapus riwayat lama dan semua yang tidak dipakai**

```bash
cd /Users/kiel/Documents/Hacathon/Project-Cardtena
rm -rf .git .next test-results reference hooks contexts types scripts public/icons
rm -f design.md firebase.json firestore.rules tsconfig.tsbuildinfo
rm -rf app/admin app/card app/claim app/design app/p app/settings app/checkin app/wall
rm -rf app/api/admin app/api/auth app/api/avatar-upload app/api/cards app/api/connections app/api/events app/api/jobs app/api/rates app/api/users
rm -rf app/api/socemon/starter app/api/socemon/eggs app/api/socemon/partner
rm -rf components/admin components/cards components/dashboard components/explore components/nav components/profile
rm -f components/TapRecorder.tsx components/providers/FirebaseAnalytics.tsx components/socemon/SocemonCard.tsx
rm -f components/ui/Avatar.tsx components/ui/BottomSheet.tsx components/ui/Chip.tsx components/ui/LottieIcon.tsx components/ui/PressRow.tsx components/ui/SettingsButton.tsx
rm -f docs/ProductContext.md docs/SocemonDesignSystem.md docs/UIRules.md docs/superpowers/plans/2026-10-18-socemon.md docs/superpowers/specs/2026-10-18-socemon-design.md
rm -f e2e/api.spec.ts e2e/currency.spec.ts e2e/page-design.spec.ts e2e/pages.spec.ts e2e/pentest.spec.ts e2e/security.spec.ts
cd lib && rm -f admin-auth.ts admin-config.ts badge-catalog.ts currency.ts doc-id.ts firebase-admin.ts firebase.ts firestore-admin.ts firestore.ts http-error.ts link-url.ts page-design.ts pending-checkin.ts people-admin.ts profile-url.ts rate-limit.ts read-json.ts scroll.ts server-auth.ts socemon-wall.ts storage.ts taxonomy.ts use-rates.ts username.ts wallet-auth-message.ts
cd .. && find app components lib e2e docs -type f | sort
```

Expected: tersisa
- `app/`: `apple-icon.png`, `error.tsx`, `favicon.ico`, `global-error.tsx`, `globals.css`, `icon.svg`, `layout.tsx`, `manifest.ts`, `not-found.tsx`, `opengraph-image.tsx`, `page.tsx`, `robots.ts`, `api/socemon/[id]/route.ts`
- `components/`: `brand/Logo.tsx`, `providers/MotionProvider.tsx`, `providers/Web3Provider.tsx`, `socemon/MonsterImage.tsx`, `socemon/Reveal.tsx`, `ui/Button.tsx`, `ui/PageSpinner.tsx`
- `lib/`: `checkin.ts`, `motion.ts`, `socemon-chain.ts`, `socemon.ts`, `utils.ts`, `wagmi.ts`
- `e2e/socemon.spec.ts`
- `docs/`: spec dan plan 2026-10-20

- [ ] **Step 3: Pangkas dependency**

```bash
npm uninstall firebase firebase-admin @vercel/blob lottie-react react-icons @firebase/rules-unit-testing firebase-tools
```

Lalu ganti blok `scripts` dan `overrides` di `package.json` menjadi seperti di bawah, dan ubah `"version"` menjadi `"0.1.0"`:

```json
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "test": "E2E_BASE_URL=http://127.0.0.1:9 playwright test socemon",
    "test:api": "playwright test api",
    "test:flow": "playwright test flow",
    "contracts:install": "cd contracts && forge install --no-git foundry-rs/forge-std@v1.17.0 OpenZeppelin/openzeppelin-contracts@v5.6.1",
    "test:contracts": "cd contracts && forge test"
  },
```

```json
  "overrides": {
    "postcss": "^8.5.16",
    "ws": "^8.21.0"
  }
```

Run: `npm install 2>&1 | tail -3`
Expected: selesai tanpa error.

- [ ] **Step 4: Tulis test peran yang gagal**

Di `e2e/socemon.spec.ts`:
- Ganti import baris 2 menjadi `import { POOL, ROLES, SPECIES, speciesById, speciesInPool, typeName } from '../lib/socemon'`.
- Ganti test `'roles map to their type and everything else is Wild'` dengan:

```ts
  test('every role is its own Egg type, Wild is 0', () => {
    expect(ROLES.map((r) => r.role)).toEqual([0, 1, 2, 3, 4, 5])
    expect(ROLES.map((r) => typeName(r.role))).toEqual(['Wild', 'Byte', 'Blaze', 'Prism', 'Gold', 'Echo'])
    expect(ROLES.map((r) => r.label)).toEqual(['Other', 'Developer', 'Founder', 'Designer', 'Investor', 'Community'])
    expect(typeName(POOL.event)).toBe('Event')
    expect(typeName(POOL.bonus)).toBe('Legendary')
  })
```

- [ ] **Step 5: Jalankan dan lihat gagal**

Run: `npm test 2>&1 | tail -15`
Expected: FAIL. `ROLES` tidak diekspor, dan `lib/socemon.ts` masih mengimpor `@/types` yang sudah dihapus.

- [ ] **Step 6: Tulis ulang `lib/socemon.ts`**

```ts
import catalog from '@/contracts/socemon.json'

/* Species data lives in contracts/socemon.json so the deploy script and the app can never disagree on supply. */

export type SocemonTier = 'common' | 'rare' | 'epic' | 'legendary' | 'event'

export interface SocemonSpecies {
  id: number
  name: string
  pool: number
  tier: SocemonTier
  maxSupply: number
  transferable: boolean
}

export const POOL = { wild: 0, byte: 1, blaze: 2, prism: 3, gold: 4, echo: 5, event: 6, bonus: 7 } as const

export const STARTER_ID = 0
export const NEXMON_ID = 19

export const STARTER: SocemonSpecies = { id: STARTER_ID, name: 'Soci', pool: POOL.wild, tier: 'common', maxSupply: 0, transferable: false }
export const SPECIES = catalog as SocemonSpecies[]

/** A trainer's role is also the Egg type the other person gets when you connect (the contract's `role`, 0..5). */
export const ROLES = [
  { role: 0, type: 'Wild', label: 'Other' },
  { role: 1, type: 'Byte', label: 'Developer' },
  { role: 2, type: 'Blaze', label: 'Founder' },
  { role: 3, type: 'Prism', label: 'Designer' },
  { role: 4, type: 'Gold', label: 'Investor' },
  { role: 5, type: 'Echo', label: 'Community' },
] as const

export const TIER_COLOR: Record<SocemonTier, string> = {
  common: '#9CA3AF', rare: '#3B82F6', epic: '#A855F7', legendary: '#F59E0B', event: '#836EF9',
}

export const EXPLORER_TX = 'https://testnet.monadscan.com/tx/'

const POOL_NAMES: Record<number, string> = { [POOL.event]: 'Event', [POOL.bonus]: 'Legendary' }

export function typeName(pool: number): string {
  return ROLES.find((r) => r.role === pool)?.type ?? POOL_NAMES[pool] ?? 'Unknown'
}

export function speciesById(id: number): SocemonSpecies | undefined {
  return id === STARTER_ID ? STARTER : SPECIES.find((s) => s.id === id)
}

export const speciesInPool = (pool: number) => SPECIES.filter((s) => s.pool === pool)

export const imageFor = (id: number) => `/socemon/${id}.png`
```

- [ ] **Step 7: Rapikan file yang dibawa**

`lib/utils.ts`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const shortAddress = (address: string) => `${address.slice(0, 6)}…${address.slice(-4)}`
```

`lib/motion.ts`:

```ts
/** Spring preset for taps (critically damped). */
export const springSnappy = { type: 'spring', bounce: 0, duration: 0.3 } as const
```

`lib/wagmi.ts`:

```ts
import { cookieStorage, createStorage, http } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { monadTestnet, type AppKitNetwork } from '@reown/appkit/networks'

/* Without a project ID AppKit shows a "not configured" alert instead of crashing, so pages still build and render. */
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ?? ''

export const networks = [monadTestnet] as [AppKitNetwork, ...AppKitNetwork[]]

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId,
  networks,
  /* reads go straight to Monad; NEXT_PUBLIC_MONAD_RPC_URL is the way out when a crowded venue hits the public RPC's rate limit */
  transports: { [monadTestnet.id]: http(process.env.NEXT_PUBLIC_MONAD_RPC_URL || undefined) },
})

export const wagmiConfig = wagmiAdapter.wagmiConfig
```

Di `components/providers/Web3Provider.tsx`:
- ganti `description: 'Your digital NFC card. Everywhere.'` dengan `description: 'Social on Monad. Catch your network.'`
- ganti `projectId: projectId as string,` dengan `projectId,`

`app/layout.tsx`: hapus import `FirebaseAnalytics`, `AuthProvider`, dan `DashboardTabProvider`, lalu ganti fungsi `RootLayout` dengan:

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${outfit.variable} ${playfair.variable} ${geistMono.variable}`}>
      <body className="font-sans text-text-primary antialiased">
        <Web3Provider>
          <MotionProvider>
            <div className="app-column mx-auto w-full max-w-[448px] min-h-svh bg-bg-base overflow-x-clip">{children}</div>
          </MotionProvider>
        </Web3Provider>
      </body>
    </html>
  )
}
```

`app/robots.ts`:

```ts
import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: '*', allow: '/', disallow: ['/api/', '/wall', '/checkin'] } }
}
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next'
import path from 'path'

/* script-src and connect-src stay broad because AppKit and wallets talk to RPC and relay endpoints that cannot be
   listed in advance; this header is defense-in-depth, mainly frame-ancestors against clickjacking. */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' https: data: blob:",
  "font-src 'self' data: https://fonts.gstatic.com https://fonts.reown.com https://fonts.walletconnect.com",
  "connect-src 'self' https: wss:",
  "frame-src 'self' https:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ')

const config: NextConfig = {
  reactStrictMode: true,
  turbopack: { root: path.resolve(__dirname) },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/(checkin|wall)/:path*', headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }] },
    ]
  },
}

export default config
```

`playwright.config.ts`:

```ts
import { defineConfig } from '@playwright/test'

/* The API and onchain flow specs need the same secrets as the dev server */
try {
  process.loadEnvFile('.env.local')
} catch {}

const port = Number(process.env.E2E_PORT ?? 3100)
const baseURL = process.env.E2E_BASE_URL ?? `http://localhost:${port}`

export default defineConfig({
  testDir: './e2e',
  reporter: 'list',
  use: { baseURL },
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : { command: `npm run dev -- -p ${port}`, url: baseURL, reuseExistingServer: true, timeout: 240_000 },
})
```

`app/page.tsx` (sementara, diganti di Task 6):

```tsx
import { Logo } from '@/components/brand/Logo'

export default function HomePage() {
  return (
    <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-8 text-center">
      <Logo height={28} />
      <p className="font-sans text-[14px] text-text-secondary">Catch your network on Monad.</p>
    </main>
  )
}
```

`.env.local.example`:

```bash
# Reown AppKit project ID (free): https://dashboard.reown.com. Allowlist localhost and your deploy domain.
NEXT_PUBLIC_REOWN_PROJECT_ID=

# Socemon v2 on Monad testnet
NEXT_PUBLIC_SOCEMON_ADDRESS=
# Relayer key. It only holds MINTER_ROLE on the contract; keep it funded with testnet MON.
MINTER_PRIVATE_KEY=
# Optional private RPCs for when the public one rate-limits (server, browser)
MONAD_RPC_URL=
NEXT_PUBLIC_MONAD_RPC_URL=

# Secrets: openssl rand -hex 32
SESSION_SECRET=
CHECKIN_SECRET=
WALL_KEY=

# The one event this deployment runs. No EVENT_STARTS_AT means always live (local dev).
EVENT_NAME=Monad Blitz
EVENT_DROP_ID=20
EVENT_STARTS_AT=
EVENT_ENDS_AT=

# Optional: absolute site URL for NFT metadata images
NEXT_PUBLIC_SITE_URL=
```

Tambahkan satu baris `.superpowers/` di akhir `.gitignore`.

- [ ] **Step 8: Jalankan test, tsc, dan build**

Run: `npm test 2>&1 | tail -5 && npx tsc --noEmit && npm run build 2>&1 | tail -15`
Expected: semua test socemon PASS, tsc tanpa output, build sukses.

- [ ] **Step 9: Repo baru, commit pertama, publish**

```bash
cd /Users/kiel/Documents/Hacathon/Project-Cardtena
git init -q -b main && git add -A
git status --short | grep -E '\.env\.local$|broadcast/|contracts/cache|contracts/lib/|\.superpowers' && echo "STOP: secret or scratch staged" || echo clean
git commit -q -m "chore: start Socemon for Monad Blitz from the Cardtena codebase"
gh repo create riorblade/socemon --public --description "Socemon: catch your network on Monad. Built for Monad Blitz." --source=. --remote=origin --push
```

Expected: `clean`, commit terbuat, dan repo `https://github.com/riorblade/socemon` ter-push.

---

### Task 2: Kontrak Socemon v2

**Files:**
- Modify: `contracts/src/Socemon.sol`
- Test: `contracts/test/Socemon.t.sol`

**Interfaces:**
- Produces:
  - **Writes** (`onlyRole(MINTER_ROLE)`):
    - `register(address user, string displayName, uint8 role)`
    - `requestConnect(address from, address to)`
    - `approveConnect(address user, address from)`
    - `hatch(address user, uint8 pool) returns (uint256 id)`
    - `mintDrop(address user, uint256 id)`
    - `setPartner(address user, uint256 id)`
  - **Views:**
    - `profileOf(address) returns (Profile)` dengan struct `{string name; uint8 role; uint256 partner; bool registered}`
    - `eggsOf(address) returns (uint16[6])`
    - `pendingOf(address) returns (address[])`
    - `connectionsOf(address) returns (address[])`
    - `link(address,address) returns (uint8)`
    - `species(uint256)`
    - `typeMask(address)`
    - `poolSpecies(uint8)`
  - **Events dan errors:** sesuai spec §4.3–4.5.

- [ ] **Step 1: Tulis test yang gagal**

`contracts/test/Socemon.t.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {IAccessControl} from "@openzeppelin/contracts/access/IAccessControl.sol";
import {Socemon} from "../src/Socemon.sol";
import {Deploy} from "../script/Deploy.s.sol";

contract SocemonTest is Test {
    Socemon s;
    address minter = makeAddr("minter");
    address alice = makeAddr("alice");
    address bob = makeAddr("bob");
    address carol = makeAddr("carol");
    uint256 friends;

    function setUp() public {
        s = new Socemon(address(this), "https://socemon.test/api/socemon/");
        s.grantRole(s.MINTER_ROLE(), minter);
    }

    function _add(uint256 id, uint8 pool, uint32 maxSupply, bool transferable) internal {
        Socemon.SpeciesInit[] memory list = new Socemon.SpeciesInit[](1);
        list[0] = Socemon.SpeciesInit(id, pool, maxSupply, transferable);
        s.addSpecies(list);
    }

    function _seedRoleTypes() internal {
        for (uint8 pool = 1; pool <= 5; pool++) _add(pool, pool, 10, false);
    }

    function _register(address user, uint8 role) internal {
        vm.prank(minter);
        s.register(user, "Trainer", role);
    }

    /// One Egg of `pool` for a registered `user`, by connecting with a fresh trainer whose role is `pool`.
    function _egg(address user, uint8 pool) internal {
        address friend = makeAddr(string.concat("friend", vm.toString(friends++)));
        _register(friend, pool);
        vm.startPrank(minter);
        s.requestConnect(friend, user);
        s.approveConnect(user, friend);
        vm.stopPrank();
    }

    function _hatch(address user, uint8 pool) internal returns (uint256) {
        vm.prank(minter);
        return s.hatch(user, pool);
    }

    function test_registerStoresProfileAndMintsSoci() public {
        vm.expectEmit(true, false, false, true);
        emit Socemon.Registered(alice, "Alice", 1);
        vm.prank(minter);
        s.register(alice, "Alice", 1);
        Socemon.Profile memory p = s.profileOf(alice);
        assertEq(p.name, "Alice");
        assertEq(p.role, 1);
        assertEq(p.partner, 0);
        assertTrue(p.registered);
        assertEq(s.balanceOf(alice, 0), 1);
    }

    function test_registerRejectsRepeatsBadNamesAndBadRoles() public {
        _register(alice, 1);
        vm.startPrank(minter);
        vm.expectRevert(Socemon.AlreadyRegistered.selector);
        s.register(alice, "Again", 1);
        vm.expectRevert(Socemon.InvalidName.selector);
        s.register(bob, "", 1);
        vm.expectRevert(Socemon.InvalidName.selector);
        s.register(bob, "abcdefghijklmnopqrstuvwxy", 1);
        vm.expectRevert(Socemon.InvalidRole.selector);
        s.register(bob, "Bob", 6);
        s.register(bob, "abcdefghijklmnopqrstuvwx", 0);
        vm.stopPrank();
        assertTrue(s.profileOf(bob).registered);
    }

    function test_starterIsSoulbound() public {
        _register(alice, 0);
        vm.prank(alice);
        vm.expectRevert(Socemon.Soulbound.selector);
        s.safeTransferFrom(alice, bob, 0, 1, "");
    }

    function test_approvedRequestConnectsAndGivesEachTheOthersType() public {
        _register(alice, 1);
        _register(bob, 2);
        vm.startPrank(minter);
        vm.expectEmit(true, true, false, false);
        emit Socemon.ConnectRequested(alice, bob);
        s.requestConnect(alice, bob);
        assertEq(s.link(alice, bob), 1);
        assertEq(s.pendingOf(bob).length, 1);
        assertEq(s.pendingOf(bob)[0], alice);
        vm.expectEmit(true, true, false, false);
        emit Socemon.Connected(alice, bob);
        s.approveConnect(bob, alice);
        vm.stopPrank();

        assertEq(s.link(alice, bob), 2);
        assertEq(s.link(bob, alice), 2);
        assertEq(s.pendingOf(bob).length, 0);
        assertEq(s.connectionsOf(alice)[0], bob);
        assertEq(s.connectionsOf(bob)[0], alice);
        assertEq(s.eggsOf(alice)[2], 1);
        assertEq(s.eggsOf(bob)[1], 1);
        assertEq(s.eggsOf(alice)[1], 0);
    }

    function test_requestingSomeoneWhoAlreadyRequestedYouConnects() public {
        _register(alice, 3);
        _register(bob, 4);
        vm.startPrank(minter);
        s.requestConnect(alice, bob);
        s.requestConnect(bob, alice);
        vm.stopPrank();
        assertEq(s.link(alice, bob), 2);
        assertEq(s.link(bob, alice), 2);
        assertEq(s.pendingOf(bob).length, 0);
        assertEq(s.pendingOf(alice).length, 0);
        assertEq(s.eggsOf(alice)[4], 1);
        assertEq(s.eggsOf(bob)[3], 1);
    }

    function test_connectGuards() public {
        _register(alice, 0);
        _register(bob, 0);
        vm.startPrank(minter);
        vm.expectRevert(Socemon.SelfConnect.selector);
        s.requestConnect(alice, alice);
        vm.expectRevert(Socemon.NotRegistered.selector);
        s.requestConnect(alice, carol);
        vm.expectRevert(Socemon.NotRegistered.selector);
        s.requestConnect(carol, alice);
        vm.expectRevert(Socemon.NoRequest.selector);
        s.approveConnect(bob, alice);
        s.requestConnect(alice, bob);
        vm.expectRevert(Socemon.AlreadyRequested.selector);
        s.requestConnect(alice, bob);
        s.approveConnect(bob, alice);
        vm.expectRevert(Socemon.AlreadyConnected.selector);
        s.requestConnect(alice, bob);
        vm.expectRevert(Socemon.AlreadyConnected.selector);
        s.requestConnect(bob, alice);
        vm.expectRevert(Socemon.NoRequest.selector);
        s.approveConnect(bob, alice);
        vm.stopPrank();
    }

    function test_hatchUsesOneEggAndIsSoulbound() public {
        _add(1, 1, 10, false);
        _register(alice, 0);
        _egg(alice, 1);
        vm.expectEmit(true, false, false, true);
        emit Socemon.EggHatched(alice, 1, 1);
        assertEq(_hatch(alice, 1), 1);
        assertEq(s.balanceOf(alice, 1), 1);
        assertEq(s.eggsOf(alice)[1], 0);
        vm.prank(minter);
        vm.expectRevert(Socemon.NoEgg.selector);
        s.hatch(alice, 1);
        vm.prank(alice);
        vm.expectRevert(Socemon.Soulbound.selector);
        s.safeTransferFrom(alice, bob, 1, 1, "");
    }

    function test_soldOutPoolFallsBackToWildWithoutSettingTypeBit() public {
        _add(1, 1, 1, false);
        _add(16, 0, 10, false);
        _register(alice, 0);
        _register(bob, 0);
        _egg(alice, 1);
        _egg(bob, 1);
        _hatch(alice, 1);
        assertEq(_hatch(bob, 1), 16);
        assertEq(s.typeMask(bob), 0);
    }

    function test_everythingSoldOutRevertsAndKeepsTheEgg() public {
        _add(1, 1, 1, false);
        _register(alice, 0);
        _register(bob, 0);
        _egg(alice, 1);
        _egg(bob, 1);
        _hatch(alice, 1);
        vm.prank(minter);
        vm.expectRevert(Socemon.SoldOut.selector);
        s.hatch(bob, 1);
        assertEq(s.eggsOf(bob)[1], 1);
    }

    function test_supplyCapNeverExceeded() public {
        _add(1, 1, 3, false);
        _add(2, 1, 2, false);
        _register(alice, 0);
        for (uint256 i; i < 6; i++) _egg(alice, 1);
        for (uint256 i; i < 5; i++) _hatch(alice, 1);
        vm.prank(minter);
        vm.expectRevert(Socemon.SoldOut.selector);
        s.hatch(alice, 1);
        (, , uint32 minted1, , ) = s.species(1);
        (, , uint32 minted2, , ) = s.species(2);
        assertEq(minted1, 3);
        assertEq(minted2, 2);
    }

    function test_weightedByRemainingSupply() public {
        _add(1, 1, 900, false);
        _add(2, 1, 100, false);
        _register(alice, 0);
        uint256 rare;
        for (uint256 i; i < 300; i++) {
            _egg(alice, 1);
            vm.prevrandao(bytes32(i));
            if (_hatch(alice, 1) == 2) rare++;
        }
        // ~10% expected; wide bounds keep the test stable
        assertGt(rare, 10);
        assertLt(rare, 60);
    }

    function test_nexmonUnlocksOnceAfterAllFiveTypes() public {
        _seedRoleTypes();
        _add(19, 7, 100, false);
        _register(alice, 0);
        for (uint8 pool = 1; pool <= 5; pool++) _egg(alice, pool);
        _egg(alice, 5);
        for (uint8 pool = 1; pool <= 4; pool++) _hatch(alice, pool);
        assertEq(s.balanceOf(alice, 19), 0);
        vm.expectEmit(true, false, false, false);
        emit Socemon.NexmonUnlocked(alice);
        _hatch(alice, 5);
        _hatch(alice, 5);
        assertEq(s.balanceOf(alice, 19), 1);
        assertEq(s.typeMask(alice), 0x3E);
    }

    function test_nexmonSoldOutIsSkippedNotReverted() public {
        _seedRoleTypes();
        _add(19, 7, 0, false);
        _register(alice, 0);
        for (uint8 pool = 1; pool <= 5; pool++) _egg(alice, pool);
        for (uint8 pool = 1; pool <= 5; pool++) _hatch(alice, pool);
        assertEq(s.balanceOf(alice, 19), 0);
    }

    function test_eventAndBonusPoolsCannotBeHatched() public {
        _register(alice, 0);
        vm.startPrank(minter);
        vm.expectRevert(Socemon.InvalidPool.selector);
        s.hatch(alice, 6);
        vm.expectRevert(Socemon.InvalidPool.selector);
        s.hatch(alice, 7);
        vm.stopPrank();
    }

    function test_dropNeedsRegistrationOncePerWalletWithinSupplyAndTransferable() public {
        _add(20, 6, 1, true);
        _register(alice, 0);
        _register(bob, 0);
        vm.startPrank(minter);
        vm.expectRevert(Socemon.NotRegistered.selector);
        s.mintDrop(carol, 20);
        s.mintDrop(alice, 20);
        vm.expectRevert(Socemon.AlreadyHasDrop.selector);
        s.mintDrop(alice, 20);
        vm.expectRevert(Socemon.SoldOut.selector);
        s.mintDrop(bob, 20);
        vm.stopPrank();
        vm.prank(alice);
        s.safeTransferFrom(alice, bob, 20, 1, "");
        assertEq(s.balanceOf(bob, 20), 1);
    }

    function test_dropRejectsNonEventSpecies() public {
        _add(1, 1, 10, false);
        _register(alice, 0);
        vm.prank(minter);
        vm.expectRevert(Socemon.UnknownSpecies.selector);
        s.mintDrop(alice, 1);
    }

    function test_partnerMustBeOwned() public {
        _add(1, 1, 10, false);
        _register(alice, 0);
        vm.prank(minter);
        vm.expectRevert(Socemon.NotOwned.selector);
        s.setPartner(alice, 1);
        _egg(alice, 1);
        _hatch(alice, 1);
        vm.expectEmit(true, false, false, true);
        emit Socemon.PartnerSet(alice, 1);
        vm.prank(minter);
        s.setPartner(alice, 1);
        assertEq(s.profileOf(alice).partner, 1);
    }

    function test_addSpeciesRejectsStarterDuplicateAndBadPool() public {
        _add(1, 1, 10, false);
        Socemon.SpeciesInit[] memory list = new Socemon.SpeciesInit[](1);
        for (uint256 k; k < 3; k++) {
            list[0] = k == 0 ? Socemon.SpeciesInit(0, 1, 10, false)
                : k == 1 ? Socemon.SpeciesInit(1, 1, 10, false)
                : Socemon.SpeciesInit(30, 8, 10, false);
            vm.expectRevert(Socemon.InvalidSpecies.selector);
            s.addSpecies(list);
        }
    }

    function test_onlyMinterWritesAndOnlyAdminConfigures() public {
        bytes memory notMinter =
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, s.MINTER_ROLE());
        bytes memory notAdmin =
            abi.encodeWithSelector(IAccessControl.AccessControlUnauthorizedAccount.selector, alice, bytes32(0));
        vm.startPrank(alice);
        vm.expectRevert(notMinter);
        s.register(alice, "Alice", 0);
        vm.expectRevert(notMinter);
        s.requestConnect(alice, bob);
        vm.expectRevert(notMinter);
        s.approveConnect(alice, bob);
        vm.expectRevert(notMinter);
        s.hatch(alice, 1);
        vm.expectRevert(notMinter);
        s.mintDrop(alice, 20);
        vm.expectRevert(notMinter);
        s.setPartner(alice, 0);
        vm.expectRevert(notAdmin);
        s.addSpecies(new Socemon.SpeciesInit[](0));
        vm.expectRevert(notAdmin);
        s.setBaseURI("x");
        vm.stopPrank();
    }

    function test_uriAppendsId() public view {
        assertEq(s.uri(20), "https://socemon.test/api/socemon/20");
    }

    function test_catalogJsonSeedsEverySpecies() public {
        Socemon.SpeciesInit[] memory list = new Deploy().loadCatalog();
        assertEq(list.length, 20);
        s.addSpecies(list);
        (uint8 pool, uint32 maxSupply, , bool transferable, bool exists) = s.species(20);
        assertEq(pool, 6);
        assertEq(maxSupply, 100);
        assertTrue(transferable);
        assertTrue(exists);
        (pool, maxSupply, , transferable, exists) = s.species(3);
        assertEq(pool, 1);
        assertEq(maxSupply, 20);
        assertFalse(transferable);
        assertEq(s.poolSpecies(0).length, 3);
        for (uint8 p = 1; p <= 5; p++) assertEq(s.poolSpecies(p).length, 3);
        assertEq(s.poolSpecies(6).length, 0);
    }
}
```

- [ ] **Step 2: Jalankan dan lihat gagal**

Run: `cd contracts && forge test 2>&1 | tail -8`
Expected: FAIL kompilasi. Fungsi `register`, `profileOf`, dan error `NotRegistered` belum ada (kalau `contracts/lib` kosong, jalankan dulu `npm run contracts:install`).

- [ ] **Step 3: Tulis kontrak v2**

`contracts/src/Socemon.sol`:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC1155} from "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {Strings} from "@openzeppelin/contracts/utils/Strings.sol";

/// Socemon v2: the contract is the whole backend. Profiles, connection requests, Eggs and monsters live here, and only
/// the server relayer (MINTER_ROLE) writes, always on behalf of the user passed as the first argument.
/// ponytail: the relayer is fully trusted; move to EIP-712 user-signed intents when actions must be trustless.
contract Socemon is ERC1155, AccessControl {
    using Strings for uint256;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant STARTER_ID = 0;
    uint256 public constant NEXMON_ID = 19;
    uint8 public constant POOL_WILD = 0;
    uint8 public constant MAX_ROLE = 5;
    uint8 public constant POOL_EVENT = 6;
    uint8 public constant POOL_BONUS = 7;
    uint8 private constant ALL_TYPES = 0x3E; // bits 1..5, one per role type
    uint8 private constant REQUESTED = 1;
    uint8 private constant CONNECTED = 2;

    string public constant name = "Socemon";
    string public constant symbol = "SOCE";

    struct Species {
        uint8 pool;
        uint32 maxSupply;
        uint32 minted;
        bool transferable;
        bool exists;
    }

    struct SpeciesInit {
        uint256 id;
        uint8 pool;
        uint32 maxSupply;
        bool transferable;
    }

    /// `role` is also the Egg pool the other person gets: 0 Wild, 1 Byte, 2 Blaze, 3 Prism, 4 Gold, 5 Echo.
    struct Profile {
        string name;
        uint8 role;
        uint256 partner;
        bool registered;
    }

    mapping(uint256 => Species) public species;
    mapping(address => uint8) public typeMask;
    /// link[a][b]: 0 none, 1 a requested b, 2 connected (set both ways).
    mapping(address => mapping(address => uint8)) public link;
    mapping(uint8 => uint256[]) private _pools;
    mapping(address => Profile) private _profiles;
    mapping(address => address[]) private _incoming;
    mapping(address => address[]) private _connections;
    mapping(address => uint16[6]) private _eggs;
    string private _baseUri;
    uint256 private _nonce;

    event Registered(address indexed user, string name, uint8 role);
    event ConnectRequested(address indexed from, address indexed to);
    event Connected(address indexed a, address indexed b);
    event EggHatched(address indexed to, uint8 pool, uint256 id);
    event DropMinted(address indexed to, uint256 id);
    event NexmonUnlocked(address indexed to);
    event PartnerSet(address indexed user, uint256 id);

    error AlreadyConnected();
    error AlreadyHasDrop();
    error AlreadyRegistered();
    error AlreadyRequested();
    error InvalidName();
    error InvalidPool();
    error InvalidRole();
    error InvalidSpecies();
    error NoEgg();
    error NoRequest();
    error NotOwned();
    error NotRegistered();
    error SelfConnect();
    error SoldOut();
    error Soulbound();
    error UnknownSpecies();

    constructor(address admin, string memory baseUri) ERC1155("") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _baseUri = baseUri;
    }

    // ---- admin ----

    function addSpecies(SpeciesInit[] calldata list) external onlyRole(DEFAULT_ADMIN_ROLE) {
        for (uint256 i; i < list.length; i++) {
            SpeciesInit calldata s = list[i];
            if (s.id == STARTER_ID || species[s.id].exists || s.pool > POOL_BONUS) revert InvalidSpecies();
            species[s.id] = Species(s.pool, s.maxSupply, 0, s.transferable, true);
            if (s.pool < POOL_EVENT) _pools[s.pool].push(s.id);
        }
    }

    function setBaseURI(string calldata baseUri) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _baseUri = baseUri;
    }

    // ---- relayer writes ----

    function register(address user, string calldata displayName, uint8 role) external onlyRole(MINTER_ROLE) {
        Profile storage p = _profiles[user];
        if (p.registered) revert AlreadyRegistered();
        uint256 len = bytes(displayName).length;
        if (len == 0 || len > 24) revert InvalidName();
        if (role > MAX_ROLE) revert InvalidRole();
        p.name = displayName;
        p.role = role;
        p.registered = true;
        _mint(user, STARTER_ID, 1, "");
        emit Registered(user, displayName, role);
    }

    /// Asking someone who already asked you connects you both right away.
    function requestConnect(address from, address to) external onlyRole(MINTER_ROLE) {
        if (from == to) revert SelfConnect();
        if (!_profiles[from].registered || !_profiles[to].registered) revert NotRegistered();
        if (link[from][to] == CONNECTED) revert AlreadyConnected();
        if (link[from][to] == REQUESTED) revert AlreadyRequested();
        if (link[to][from] == REQUESTED) {
            _connect(to, from);
            return;
        }
        link[from][to] = REQUESTED;
        _incoming[to].push(from);
        emit ConnectRequested(from, to);
    }

    function approveConnect(address user, address from) external onlyRole(MINTER_ROLE) {
        if (link[from][user] != REQUESTED) revert NoRequest();
        _connect(from, user);
    }

    function hatch(address user, uint8 pool) external onlyRole(MINTER_ROLE) returns (uint256 id) {
        if (pool > MAX_ROLE) revert InvalidPool();
        if (_eggs[user][pool] == 0) revert NoEgg();
        _eggs[user][pool]--;

        id = _pick(pool, user);
        if (id == STARTER_ID && pool != POOL_WILD) id = _pick(POOL_WILD, user);
        if (id == STARTER_ID) revert SoldOut();

        Species storage s = species[id];
        s.minted++;
        _mint(user, id, 1, "");
        emit EggHatched(user, pool, id);

        if (s.pool != POOL_WILD) {
            uint8 mask = typeMask[user] | (uint8(1) << s.pool);
            typeMask[user] = mask;
            if (mask == ALL_TYPES) _maybeNexmon(user);
        }
    }

    function mintDrop(address user, uint256 id) external onlyRole(MINTER_ROLE) {
        if (!_profiles[user].registered) revert NotRegistered();
        Species storage s = species[id];
        if (!s.exists || s.pool != POOL_EVENT) revert UnknownSpecies();
        if (balanceOf(user, id) > 0) revert AlreadyHasDrop();
        if (s.minted >= s.maxSupply) revert SoldOut();
        s.minted++;
        _mint(user, id, 1, "");
        emit DropMinted(user, id);
    }

    function setPartner(address user, uint256 id) external onlyRole(MINTER_ROLE) {
        if (balanceOf(user, id) == 0) revert NotOwned();
        _profiles[user].partner = id;
        emit PartnerSet(user, id);
    }

    // ---- views ----

    function profileOf(address user) external view returns (Profile memory) {
        return _profiles[user];
    }

    function eggsOf(address user) external view returns (uint16[6] memory) {
        return _eggs[user];
    }

    function connectionsOf(address user) external view returns (address[] memory) {
        return _connections[user];
    }

    /// Requests still waiting for `user` to approve.
    function pendingOf(address user) external view returns (address[] memory out) {
        address[] storage all = _incoming[user];
        uint256 n;
        for (uint256 i; i < all.length; i++) {
            if (link[all[i]][user] == REQUESTED) n++;
        }
        out = new address[](n);
        n = 0;
        for (uint256 i; i < all.length; i++) {
            if (link[all[i]][user] == REQUESTED) out[n++] = all[i];
        }
    }

    function poolSpecies(uint8 pool) external view returns (uint256[] memory) {
        return _pools[pool];
    }

    function uri(uint256 id) public view override returns (string memory) {
        return string.concat(_baseUri, id.toString());
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC1155, AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    // ---- internals ----

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values) internal override {
        if (from != address(0) && to != address(0)) {
            for (uint256 i; i < ids.length; i++) {
                if (!species[ids[i]].transferable) revert Soulbound();
            }
        }
        super._update(from, to, ids, values);
    }

    /// Each side gets an Egg of the other side's role.
    function _connect(address a, address b) private {
        link[a][b] = CONNECTED;
        link[b][a] = CONNECTED;
        _connections[a].push(b);
        _connections[b].push(a);
        _eggs[a][_profiles[b].role]++;
        _eggs[b][_profiles[a].role]++;
        emit Connected(a, b);
    }

    function _maybeNexmon(address to) private {
        Species storage n = species[NEXMON_ID];
        if (!n.exists || n.minted >= n.maxSupply || balanceOf(to, NEXMON_ID) > 0) return;
        n.minted++;
        _mint(to, NEXMON_ID, 1, "");
        emit NexmonUnlocked(to);
    }

    /// Weighted by remaining supply. Returns STARTER_ID (never a pool member) when the pool is sold out.
    function _pick(uint8 pool, address to) private returns (uint256) {
        uint256[] storage ids = _pools[pool];
        uint256 total;
        for (uint256 i; i < ids.length; i++) {
            Species storage s = species[ids[i]];
            total += s.maxSupply - s.minted;
        }
        if (total == 0) return STARTER_ID;

        uint256 r = _random(to) % total;
        for (uint256 i; i < ids.length; i++) {
            Species storage s = species[ids[i]];
            uint256 left = s.maxSupply - s.minted;
            if (r < left) return ids[i];
            r -= left;
        }
        return STARTER_ID;
    }

    /// ponytail: prevrandao + nonce while the relayer picks the timing; swap for Pyth Entropy when hatches must be trustless.
    function _random(address to) private returns (uint256) {
        return uint256(keccak256(abi.encode(block.prevrandao, to, _nonce++)));
    }
}
```

- [ ] **Step 4: Jalankan dan lihat lulus**

Run: `cd contracts && forge test 2>&1 | tail -6`
Expected: `22 tests passed; 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add contracts/src/Socemon.sol contracts/test/Socemon.t.sol
git commit -m "feat(contract): Socemon v2 keeps profiles, requests and Eggs onchain"
```

---

### Task 3: Deploy v2 ke Monad testnet dan isi env

**Files:**
- Modify: `.env.local` (tidak di-commit)

**Interfaces:**
- Consumes: kontrak dari Task 2, `contracts/script/Deploy.s.sol` (tidak berubah: `run()` membaca env `SOCEMON_MINTER` dan `SOCEMON_BASE_URI`).
- Produces: `NEXT_PUBLIC_SOCEMON_ADDRESS` (alamat v2), `SESSION_SECRET`, `WALL_KEY`, `NEXT_PUBLIC_REOWN_PROJECT_ID=` (kosong, diisi user).

- [ ] **Step 1: Cek saldo dan isi dari faucet kalau kurang**

```bash
RPC=https://testnet-rpc.monad.xyz; DEPLOYER=0xC2CA1Fcfd805e6Edfd8CA7788A4Ee630A78C8D7f; MINTER=0x1a627F3F4A838B4948adb1bFF2b5179a70707CA3
cast balance $DEPLOYER --rpc-url $RPC --ether; cast balance $MINTER --rpc-url $RPC --ether
```

Untuk setiap alamat yang saldonya kurang dari 1.5 MON (deployer) atau 1 MON (minter), jalankan perintah ini sekali per MON yang dibutuhkan:

```bash
curl -sS -X POST https://agents.devnads.com/v1/faucet -H 'content-type: application/json' -d "{\"chainId\":10143,\"address\":\"$ADDRESS\"}"
```

Expected: deployer ≥ 1.5 MON dan minter ≥ 1 MON. Kalau faucet menolak, berhenti dan minta user mengisi lewat faucet.monad.xyz.

- [ ] **Step 2: Deploy**

```bash
cd /Users/kiel/Documents/Hacathon/Project-Cardtena/contracts
SOCEMON_MINTER=0x1a627F3F4A838B4948adb1bFF2b5179a70707CA3 SOCEMON_BASE_URI=http://localhost:3000/api/socemon/ \
  forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --account socemon-deployer \
  --password-file ~/.foundry/socemon-deployer.password --sender 0xC2CA1Fcfd805e6Edfd8CA7788A4Ee630A78C8D7f --broadcast \
  > ../.superpowers/sdd/2026-10-20-socemon-blitz/deploy.log 2>&1; tail -12 ../.superpowers/sdd/2026-10-20-socemon-blitz/deploy.log
```

Expected: `ONCHAIN EXECUTION COMPLETE & SUCCESSFUL` dan baris `socemon: contract Socemon 0x…`. Catat alamat itu sebagai `ADDR`.

- [ ] **Step 3: Cek onchain**

```bash
RPC=https://testnet-rpc.monad.xyz
cast call $ADDR 'name()(string)' --rpc-url $RPC
cast call $ADDR 'species(uint256)(uint8,uint32,uint32,bool,bool)' 20 --rpc-url $RPC
cast call $ADDR 'hasRole(bytes32,address)(bool)' $(cast keccak MINTER_ROLE) 0x1a627F3F4A838B4948adb1bFF2b5179a70707CA3 --rpc-url $RPC
cast call $ADDR 'profileOf(address)((string,uint8,uint256,bool))' 0x1a627F3F4A838B4948adb1bFF2b5179a70707CA3 --rpc-url $RPC
```

Expected: `"Socemon"`, lalu `6 100 0 true true`, lalu `true`, lalu `("", 0, 0, false)`.

- [ ] **Step 4: Verifikasi source**

```bash
cd /Users/kiel/Documents/Hacathon/Project-Cardtena/contracts
W=../.superpowers/sdd/2026-10-20-socemon-blitz
forge verify-contract $ADDR src/Socemon.sol:Socemon --chain 10143 --show-standard-json-input > $W/input.json
jq '.metadata' out/Socemon.sol/Socemon.json > $W/metadata.json
ARGS=$(cast abi-encode "constructor(address,string)" 0xC2CA1Fcfd805e6Edfd8CA7788A4Ee630A78C8D7f http://localhost:3000/api/socemon/)
jq -n --argjson input "$(cat $W/input.json)" --argjson meta "$(cat $W/metadata.json)" --arg addr "$ADDR" --arg args "${ARGS#0x}" \
  '{chainId: 10143, contractAddress: $addr, contractName: "src/Socemon.sol:Socemon", compilerVersion: "v0.8.28+commit.7893614a", standardJsonInput: $input, foundryMetadata: $meta, constructorArgs: $args}' > $W/verify.json
curl -sS -X POST https://agents.devnads.com/v1/verify -H "Content-Type: application/json" -d @$W/verify.json
```

Expected: respons sukses. Kalau API gagal, pakai fallback: `forge verify-contract $ADDR src/Socemon.sol:Socemon --chain 10143 --verifier sourcify --verifier-url "https://sourcify-api-monad.blockvision.org/"`.

- [ ] **Step 5: Isi env tanpa mencetak secret**

```bash
cd /Users/kiel/Documents/Hacathon/Project-Cardtena
sed -i '' "s/^NEXT_PUBLIC_SOCEMON_ADDRESS=.*/NEXT_PUBLIC_SOCEMON_ADDRESS=$ADDR/" .env.local
grep -q '^SESSION_SECRET=' .env.local || echo "SESSION_SECRET=$(openssl rand -hex 32)" >> .env.local
grep -q '^WALL_KEY=' .env.local || echo "WALL_KEY=$(openssl rand -hex 16)" >> .env.local
grep -q '^NEXT_PUBLIC_REOWN_PROJECT_ID=' .env.local || echo "NEXT_PUBLIC_REOWN_PROJECT_ID=" >> .env.local
grep -o '^[A-Z_]*=' .env.local; grep '^NEXT_PUBLIC_SOCEMON_ADDRESS=' .env.local
```

Expected: nama-nama variabel `MINTER_PRIVATE_KEY`, `NEXT_PUBLIC_SOCEMON_ADDRESS`, `CHECKIN_SECRET`, `SESSION_SECRET`, `WALL_KEY`, `NEXT_PUBLIC_REOWN_PROJECT_ID`, plus alamat v2. Tidak ada nilai secret yang tercetak.

---

### Task 4: Library server (ABI, relayer, error, sesi, helper route, event)

**Files:**
- Create: `lib/abi.ts`, `lib/errors.ts`, `lib/session.ts`, `lib/api.ts`
- Rename and rewrite: `lib/socemon-chain.ts` → `lib/chain.ts`
- Modify: `lib/checkin.ts`
- Test: `e2e/socemon.spec.ts`

**Interfaces:**
- **Consumes:** ABI v2 dari Task 2.
- **Produces:**
  - `lib/abi.ts`:
    - `SOCEMON_ABI`
    - `socemonAddress(): Address`
  - `lib/chain.ts`:
    - `publicClient`
    - `relay(functionName, args): Promise<{ receipt, tx, ms }>`
    - `revertName(err): string | null`
    - `hatchResult(logs): { monsterId: number; nexmon: boolean }`
  - `lib/errors.ts`:
    - `errorFor(revert: string | null): { status: number; error: string }`
  - `lib/session.ts`:
    - `SESSION_COOKIE`, `NONCE_COOKIE`, `TICKET_COOKIE`
    - `SESSION_TTL_S`, `NONCE_TTL_S`, `TICKET_TTL_S`
    - `sessionSecret()`
    - `signToken(secret, aud, sub, ttlSeconds)`
    - `readToken(secret, aud, token)`
    - `cookieOptions(maxAge)`
  - `lib/api.ts`:
    - `HttpError`
    - `requireUser(req): Promise<Address>`
    - `readBody(req)`
    - `int(value, max, field)`
    - `address(value, field)`
    - `handle(run)`
  - `lib/checkin.ts`:
    - `CHECKIN_EVENT = 'event'`
    - `currentEvent(env?, now?): { name, dropId, live }`

- [ ] **Step 1: Tulis test yang gagal**

Di `e2e/socemon.spec.ts`:
- Ganti tiga baris import viem/chain/checkin (baris 3–5) dengan:

```ts
import { encodeAbiParameters, encodeEventTopics, type Log } from 'viem'
import { SOCEMON_ABI } from '../lib/abi'
import { hatchResult } from '../lib/chain'
import { CHECKIN_WINDOW_MS, checkinToken, currentEvent, isEventLive, verifyCheckinToken } from '../lib/checkin'
import { errorFor } from '../lib/errors'
import { readToken, signToken } from '../lib/session'
```

- Di describe `hatch receipts`:
  - ganti `{ id: 5, nexmon: false }` dengan `{ monsterId: 5, nexmon: false }`
  - ganti `{ id: 4, nexmon: true }` dengan `{ monsterId: 4, nexmon: true }`
- Tambahkan di akhir file:

```ts
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
```

- [ ] **Step 2: Jalankan dan lihat gagal**

Run: `npm test 2>&1 | tail -10`
Expected: FAIL karena modul `../lib/abi`, `../lib/chain`, `../lib/errors`, dan `../lib/session` tidak ditemukan.

- [ ] **Step 3: Tulis library-nya**

`lib/abi.ts`:

```ts
import { parseAbi, type Address } from 'viem'

/* Shared by the browser (reads) and the server relayer (writes). Mirrors contracts/src/Socemon.sol. */
export const SOCEMON_ABI = parseAbi([
  'function register(address user, string displayName, uint8 role)',
  'function requestConnect(address from, address to)',
  'function approveConnect(address user, address from)',
  'function hatch(address user, uint8 pool) returns (uint256 id)',
  'function mintDrop(address user, uint256 id)',
  'function setPartner(address user, uint256 id)',
  'function profileOf(address user) view returns ((string name, uint8 role, uint256 partner, bool registered))',
  'function eggsOf(address user) view returns (uint16[6])',
  'function pendingOf(address user) view returns (address[])',
  'function connectionsOf(address user) view returns (address[])',
  'function link(address a, address b) view returns (uint8)',
  'function species(uint256 id) view returns (uint8 pool, uint32 maxSupply, uint32 minted, bool transferable, bool exists)',
  'function balanceOfBatch(address[] accounts, uint256[] ids) view returns (uint256[])',
  'event Registered(address indexed user, string name, uint8 role)',
  'event ConnectRequested(address indexed from, address indexed to)',
  'event Connected(address indexed a, address indexed b)',
  'event EggHatched(address indexed to, uint8 pool, uint256 id)',
  'event DropMinted(address indexed to, uint256 id)',
  'event NexmonUnlocked(address indexed to)',
  'event PartnerSet(address indexed user, uint256 id)',
  'error AlreadyConnected()',
  'error AlreadyHasDrop()',
  'error AlreadyRegistered()',
  'error AlreadyRequested()',
  'error InvalidName()',
  'error InvalidPool()',
  'error InvalidRole()',
  'error InvalidSpecies()',
  'error NoEgg()',
  'error NoRequest()',
  'error NotOwned()',
  'error NotRegistered()',
  'error SelfConnect()',
  'error SoldOut()',
  'error Soulbound()',
  'error UnknownSpecies()',
])

export function socemonAddress(): Address {
  const address = process.env.NEXT_PUBLIC_SOCEMON_ADDRESS
  if (!address) throw new Error('NEXT_PUBLIC_SOCEMON_ADDRESS is not set')
  return address as Address
}
```

`lib/errors.ts`:

```ts
/* Contract revert names → HTTP status and what the UI shows. Anything unknown is an RPC or chain failure, safe to retry. */
const REVERTS: Record<string, [number, string]> = {
  InvalidName: [400, 'Pick a name between 1 and 24 characters'],
  InvalidRole: [400, 'Pick one of the roles'],
  InvalidPool: [400, 'That Egg type does not exist'],
  SelfConnect: [400, 'That is you'],
  NotRegistered: [403, 'Both trainers need to claim Soci first'],
  NotOwned: [403, 'You have not caught that Socemon yet'],
  AlreadyRegistered: [409, 'You already have Soci'],
  AlreadyConnected: [409, 'You are already connected'],
  AlreadyRequested: [409, 'Request already sent'],
  NoRequest: [409, 'That request is no longer there'],
  NoEgg: [409, 'No Egg of that type left to hatch'],
  AlreadyHasDrop: [409, 'You already caught this event drop'],
  SoldOut: [409, 'Sold out'],
  UnknownSpecies: [409, 'This event has no drop'],
}

export function errorFor(revert: string | null): { status: number; error: string } {
  const hit = revert ? REVERTS[revert] : undefined
  return hit ? { status: hit[0], error: hit[1] } : { status: 502, error: 'Monad is busy, try again' }
}
```

`lib/session.ts`:

```ts
import { SignJWT, jwtVerify } from 'jose'

/* Stateless sessions: signed cookies instead of a session table. The audience keeps a check-in ticket from passing as a session. */

export const SESSION_COOKIE = 'socemon_session'
export const NONCE_COOKIE = 'socemon_nonce'
export const TICKET_COOKIE = 'socemon_ticket'
export const SESSION_TTL_S = 7 * 24 * 3600
export const NONCE_TTL_S = 5 * 60
export const TICKET_TTL_S = 10 * 60

type Audience = 'session' | 'ticket'

export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters')
  return secret
}

const keyOf = (secret: string) => new TextEncoder().encode(secret)

export function signToken(secret: string, aud: Audience, sub: string, ttlSeconds: number): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'HS256' })
    .setAudience(aud)
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(`${ttlSeconds}s`)
    .sign(keyOf(secret))
}

/** The token's subject, or null when it is missing, forged, expired or meant for another audience. */
export async function readToken(secret: string, aud: Audience, token: string | undefined): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, keyOf(secret), { algorithms: ['HS256'], audience: aud })
    return payload.sub ?? null
  } catch {
    return null
  }
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  maxAge,
  path: '/',
})
```

```bash
git mv lib/socemon-chain.ts lib/chain.ts
```

`lib/chain.ts` (seluruh isi diganti):

```ts
import {
  BaseError, ContractFunctionRevertedError, createPublicClient, createWalletClient, http, parseEventLogs,
  type ContractFunctionArgs, type ContractFunctionName, type Hex, type Log,
} from 'viem'
import { nonceManager, privateKeyToAccount } from 'viem/accounts'
import { monadTestnet } from 'viem/chains'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'

/* Server-side relayer. The minter key only holds MINTER_ROLE; the admin role stays on the deployer. */

const transport = http(process.env.MONAD_RPC_URL || 'https://testnet-rpc.monad.xyz')
export const publicClient = createPublicClient({ chain: monadTestnet, transport })

function makeWallet() {
  const key = process.env.MINTER_PRIVATE_KEY
  if (!key) throw new Error('MINTER_PRIVATE_KEY is not set')
  /* ponytail: nonceManager is per server instance; concurrent instances can collide, move to a tx queue if traffic grows */
  return createWalletClient({ account: privateKeyToAccount(key as Hex, { nonceManager }), chain: monadTestnet, transport })
}
let wallet: ReturnType<typeof makeWallet> | null = null

type Write = ContractFunctionName<typeof SOCEMON_ABI, 'nonpayable'>

/** Sends one write as the relayer and waits for its receipt. Monad bills the gas limit, so the buffer stays at 10%. */
export async function relay<F extends Write>(functionName: F, args: ContractFunctionArgs<typeof SOCEMON_ABI, 'nonpayable', F>) {
  const walletClient = (wallet ??= makeWallet())
  /* viem cannot narrow a generic function name; the signature above keeps every call site typed */
  const params = { address: socemonAddress(), abi: SOCEMON_ABI, functionName, args, account: walletClient.account } as never
  const started = Date.now()
  const gas = await publicClient.estimateContractGas(params)
  const receipt = await walletClient.writeContractSync({ ...(params as object), gas: gas + gas / 10n } as never)
  if (receipt.status !== 'success') {
    /* a concurrent request changed state between estimate and inclusion; re-simulating surfaces the revert name */
    await publicClient.simulateContract(params)
    throw new Error(`${functionName} reverted`)
  }
  return { receipt, tx: receipt.transactionHash, ms: Date.now() - started }
}

/** The custom error a Socemon call reverted with, e.g. 'SoldOut', or null for any other failure. */
export function revertName(err: unknown): string | null {
  if (!(err instanceof BaseError)) return null
  const reverted = err.walk((e) => e instanceof ContractFunctionRevertedError)
  return reverted instanceof ContractFunctionRevertedError ? (reverted.data?.errorName ?? null) : null
}

/** Reads the hatched species (and whether Nexmon unlocked) from a hatch receipt. */
export function hatchResult(logs: Log[]): { monsterId: number; nexmon: boolean } {
  const events = parseEventLogs({ abi: SOCEMON_ABI, logs })
  const hatched = events.find((e) => e.eventName === 'EggHatched')
  if (!hatched || hatched.eventName !== 'EggHatched') throw new Error('EggHatched missing from receipt')
  return { monsterId: Number(hatched.args.id), nexmon: events.some((e) => e.eventName === 'NexmonUnlocked') }
}
```

`lib/api.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { BaseError, getAddress, isAddress, type Address } from 'viem'
import { revertName } from '@/lib/chain'
import { errorFor } from '@/lib/errors'
import { SESSION_COOKIE, readToken, sessionSecret } from '@/lib/session'

export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message)
  }
}

/** The signed-in wallet, or a 401. */
export async function requireUser(req: NextRequest): Promise<Address> {
  const sub = await readToken(sessionSecret(), 'session', req.cookies.get(SESSION_COOKIE)?.value)
  if (!sub || !isAddress(sub)) throw new HttpError('Sign in first', 401)
  return getAddress(sub)
}

export async function readBody(req: Request): Promise<Record<string, unknown>> {
  const body: unknown = await req.json().catch(() => null)
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError('Invalid JSON body', 400)
  return body as Record<string, unknown>
}

export function int(value: unknown, max: number, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0 || value > max) throw new HttpError(`Invalid ${field}`, 400)
  return value
}

export function address(value: unknown, field: string): Address {
  if (typeof value !== 'string' || !isAddress(value, { strict: false })) throw new HttpError(`Invalid ${field}`, 400)
  return getAddress(value)
}

/** Runs a route body; HttpErrors and contract reverts become JSON errors, viem failures a retryable 502. */
export async function handle(run: () => Promise<Response>): Promise<Response> {
  try {
    return await run()
  } catch (err) {
    if (err instanceof HttpError) return NextResponse.json({ error: err.message }, { status: err.status })
    const { status, error } = err instanceof BaseError ? errorFor(revertName(err)) : { status: 500, error: 'Server error' }
    if (status >= 500) console.error('socemon route failed', err)
    return NextResponse.json({ error }, { status })
  }
}
```

Tambahkan di akhir `lib/checkin.ts`:

```ts
/** The check-in token's event id; each deployment runs one event, so a constant keeps the routes in step. */
export const CHECKIN_EVENT = 'event'

/** The one event this deployment runs, from env. No EVENT_STARTS_AT means always live (local dev). */
export function currentEvent(env: Record<string, string | undefined> = process.env, now = Date.now()) {
  const startsAt = env.EVENT_STARTS_AT ? new Date(env.EVENT_STARTS_AT) : null
  const endsAt = env.EVENT_ENDS_AT ? new Date(env.EVENT_ENDS_AT) : null
  return {
    name: env.EVENT_NAME || 'Monad Blitz',
    dropId: Number(env.EVENT_DROP_ID || 20),
    live: startsAt ? isEventLive({ startsAt, endsAt }, now) : true,
  }
}
```

- [ ] **Step 4: Jalankan dan lihat lulus**

Run: `npm test 2>&1 | tail -6 && npx tsc --noEmit`
Expected: semua test socemon PASS dan tsc bersih.

- [ ] **Step 5: Commit**

```bash
git add -A lib e2e/socemon.spec.ts
git commit -m "feat(server): relayer, revert mapping, stateless sessions and event config"
```

---

### Task 5: Route API (login, tulis, check-in, wall) dengan test smoke dan test onchain

**Files:**
- Create:
  - `app/api/auth/nonce/route.ts`
  - `app/api/auth/verify/route.ts`
  - `app/api/auth/me/route.ts`
  - `app/api/auth/logout/route.ts`
  - `app/api/register/route.ts`
  - `app/api/connect/route.ts`
  - `app/api/approve/route.ts`
  - `app/api/hatch/route.ts`
  - `app/api/partner/route.ts`
  - `app/api/checkin/ticket/route.ts`
  - `app/api/checkin/route.ts`
  - `app/api/wall/route.ts`
- Test: `e2e/api.spec.ts`, `e2e/flow.spec.ts`

**Interfaces:**
- **Consumes:** semua dari Task 4.
- **Produces:**
  - **Response body per route:**
    - `POST /api/register` → `{ tx, ms, monsterId: 0 }`
    - `POST /api/connect` → `{ tx, ms, status: 'requested' | 'connected' }`
    - `POST /api/approve` → `{ tx, ms }`
    - `POST /api/hatch` → `{ tx, ms, monsterId, nexmon }`
    - `POST /api/partner` → `{ tx, ms }`
    - `POST /api/checkin` → `{ tx, ms, monsterId }`
    - `POST /api/auth/verify` → `{ address }`
    - `GET /api/auth/me` → `{ address }`
    - `GET /api/wall?key&from` → `{ token, dropped, feed: { key, text, monsterId }[], cursor }`
  - **Error:** setiap error berbentuk `{ error }`.

- [ ] **Step 1: Tulis test smoke yang gagal**

`e2e/api.spec.ts`:

```ts
import { expect, test } from '@playwright/test'

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
```

`e2e/flow.spec.ts`:

```ts
import { expect, test, type APIRequestContext, type APIResponse } from '@playwright/test'
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts'
import { createSiweMessage } from 'viem/siwe'
import { CHECKIN_EVENT, checkinToken } from '../lib/checkin'

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

  const ticket = await B.get(`/api/checkin/ticket?t=${checkinToken(process.env.CHECKIN_SECRET!, CHECKIN_EVENT, Date.now())}`, { maxRedirects: 0 })
  expect(ticket.headers().location).toMatch(/\/checkin$/)
  expect((await ok(B.post('/api/checkin'))).monsterId).toBe(Number(process.env.EVENT_DROP_ID || 20))
  expect((await B.post('/api/checkin')).status()).toBe(403)

  const wall = await ok(A.get(`/api/wall?key=${process.env.WALL_KEY}`))
  expect(wall.dropped).toBeGreaterThan(0)
  expect(wall.feed.map((f: { text: string }) => f.text)).toContain('Flow B caught Blitzmon')
})
```

- [ ] **Step 2: Jalankan dan lihat gagal**

Run: `npm run test:api 2>&1 | tail -12`
Expected: FAIL. Route-nya belum ada (404, bukan 401/403/307), kecuali test metadata yang sudah lulus.

- [ ] **Step 3: Tulis route-nya**

`app/api/auth/nonce/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { generateSiweNonce } from 'viem/siwe'
import { NONCE_COOKIE, NONCE_TTL_S, cookieOptions } from '@/lib/session'

export function GET() {
  const nonce = generateSiweNonce()
  const res = NextResponse.json({ nonce })
  res.cookies.set(NONCE_COOKIE, nonce, cookieOptions(NONCE_TTL_S))
  return res
}
```

`app/api/auth/verify/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { getAddress, type Hex } from 'viem'
import { parseSiweMessage } from 'viem/siwe'
import { HttpError, handle, readBody } from '@/lib/api'
import { publicClient } from '@/lib/chain'
import { NONCE_COOKIE, SESSION_COOKIE, SESSION_TTL_S, cookieOptions, sessionSecret, signToken } from '@/lib/session'

/** Checks a SIWE signature against the nonce cookie and this host, then starts a 7-day session. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const { message, signature } = await readBody(req)
    if (typeof message !== 'string' || message.length > 2000 || typeof signature !== 'string' || !/^0x[0-9a-fA-F]+$/.test(signature)) {
      throw new HttpError('Invalid sign-in', 400)
    }
    const nonce = req.cookies.get(NONCE_COOKIE)?.value
    const { address } = parseSiweMessage(message)
    if (!nonce || !address) throw new HttpError('Sign-in expired, try again', 401)
    const valid = await publicClient.verifySiweMessage({ message, signature: signature as Hex, domain: req.nextUrl.host, nonce })
    if (!valid) throw new HttpError('Signature did not match', 401)

    const user = getAddress(address)
    const res = NextResponse.json({ address: user })
    res.cookies.set(SESSION_COOKIE, await signToken(sessionSecret(), 'session', user, SESSION_TTL_S), cookieOptions(SESSION_TTL_S))
    res.cookies.delete(NONCE_COOKIE)
    return res
  })
}
```

`app/api/auth/me/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { handle, requireUser } from '@/lib/api'

export function GET(req: NextRequest) {
  return handle(async () => NextResponse.json({ address: await requireUser(req) }))
}
```

`app/api/auth/logout/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { SESSION_COOKIE } from '@/lib/session'

export function POST() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
```

`app/api/register/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { HttpError, handle, int, readBody, requireUser } from '@/lib/api'
import { relay } from '@/lib/chain'
import { STARTER_ID } from '@/lib/socemon'

/** Saves the trainer's name and role onchain and mints Soci. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const body = await readBody(req)
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const bytes = new TextEncoder().encode(name).length
    if (bytes < 1 || bytes > 24) throw new HttpError('Pick a name between 1 and 24 characters', 400)
    const role = int(body.role, 5, 'role')
    const { tx, ms } = await relay('register', [user, name, role])
    return NextResponse.json({ tx, ms, monsterId: STARTER_ID })
  })
}
```

`app/api/connect/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { parseEventLogs } from 'viem'
import { address, handle, readBody, requireUser } from '@/lib/api'
import { SOCEMON_ABI } from '@/lib/abi'
import { relay } from '@/lib/chain'

/** Sends a connection request, or connects right away when the other trainer already asked. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const to = address((await readBody(req)).to, 'address')
    const { receipt, tx, ms } = await relay('requestConnect', [user, to])
    const connected = parseEventLogs({ abi: SOCEMON_ABI, logs: receipt.logs, eventName: 'Connected' }).length > 0
    return NextResponse.json({ tx, ms, status: connected ? 'connected' : 'requested' })
  })
}
```

`app/api/approve/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { address, handle, readBody, requireUser } from '@/lib/api'
import { relay } from '@/lib/chain'

/** Approves a request; both trainers get an Egg of the other's type. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const from = address((await readBody(req)).from, 'address')
    const { tx, ms } = await relay('approveConnect', [user, from])
    return NextResponse.json({ tx, ms })
  })
}
```

`app/api/hatch/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { handle, int, readBody, requireUser } from '@/lib/api'
import { hatchResult, relay } from '@/lib/chain'

export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const pool = int((await readBody(req)).pool, 5, 'Egg type')
    const { receipt, tx, ms } = await relay('hatch', [user, pool])
    return NextResponse.json({ tx, ms, ...hatchResult(receipt.logs) })
  })
}
```

`app/api/partner/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { handle, int, readBody, requireUser } from '@/lib/api'
import { relay } from '@/lib/chain'

export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    const id = int((await readBody(req)).id, 999, 'Socemon')
    const { tx, ms } = await relay('setPartner', [user, BigInt(id)])
    return NextResponse.json({ tx, ms })
  })
}
```

`app/api/checkin/ticket/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { CHECKIN_EVENT, checkinSecret, verifyCheckinToken } from '@/lib/checkin'
import { TICKET_COOKIE, TICKET_TTL_S, cookieOptions, sessionSecret, signToken } from '@/lib/session'

/** The Event Wall QR lands here: a fresh token becomes a 10-minute ticket cookie, so onboarding cannot outlast the QR.
    ponytail: the ticket is not bound to a wallet, so several accounts on one device can use it; bind it after sign-in if that matters. */
export async function GET(req: NextRequest) {
  const fresh = verifyCheckinToken(checkinSecret(), CHECKIN_EVENT, req.nextUrl.searchParams.get('t'), Date.now())
  const res = NextResponse.redirect(new URL(fresh ? '/checkin' : '/checkin?expired=1', req.url))
  if (fresh) res.cookies.set(TICKET_COOKIE, await signToken(sessionSecret(), 'ticket', CHECKIN_EVENT, TICKET_TTL_S), cookieOptions(TICKET_TTL_S))
  return res
}
```

`app/api/checkin/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import { HttpError, handle, requireUser } from '@/lib/api'
import { relay } from '@/lib/chain'
import { currentEvent } from '@/lib/checkin'
import { TICKET_COOKIE, readToken, sessionSecret } from '@/lib/session'

/** Trades the check-in ticket for the event drop. */
export function POST(req: NextRequest) {
  return handle(async () => {
    const user = await requireUser(req)
    if (!(await readToken(sessionSecret(), 'ticket', req.cookies.get(TICKET_COOKIE)?.value))) {
      throw new HttpError('Scan the QR on the Event Wall first', 403)
    }
    const event = currentEvent()
    if (!event.live) throw new HttpError(`${event.name} is not live right now`, 403)
    const { tx, ms } = await relay('mintDrop', [user, BigInt(event.dropId)])
    const res = NextResponse.json({ tx, ms, monsterId: event.dropId })
    res.cookies.delete(TICKET_COOKIE)
    return res
  })
}
```

`app/api/wall/route.ts`:

```ts
import { NextResponse, type NextRequest } from 'next/server'
import type { Address } from 'viem'
import { HttpError, handle } from '@/lib/api'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { publicClient } from '@/lib/chain'
import { CHECKIN_EVENT, checkinSecret, checkinToken, currentEvent } from '@/lib/checkin'
import { NEXMON_ID, STARTER_ID, speciesById } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

/* The Monad RPC caps eth_getLogs at 100 blocks, so the wall reads from its cursor and never more than that.
   ponytail: a wall offline for over ~40 seconds skips feed items (counts stay right); add an indexer if that matters. */
const MAX_RANGE = 99n

type Line = { key: string; user: Address; other?: Address; monsterId: number | null; verb: string }

/** Event Wall data: the current check-in token, the drop count, and every catch since the `from` block. */
export function GET(req: NextRequest) {
  return handle(async () => {
    const key = process.env.WALL_KEY
    if (!key || req.nextUrl.searchParams.get('key') !== key) throw new HttpError('Wrong wall key', 403)

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
```

- [ ] **Step 4: Jalankan smoke, tsc, dan flow onchain**

Run: `npx tsc --noEmit && npm run test:api 2>&1 | tail -8`
Expected: tsc bersih; 5 test api PASS.

Run: `npm run test:flow 2>&1 | tail -8`
Expected: 1 test PASS. Butuh minter punya saldo; biayanya sekitar 0.3 MON.

- [ ] **Step 5: Commit**

```bash
git add app/api e2e/api.spec.ts e2e/flow.spec.ts
git commit -m "feat(api): SIWE sign-in, relayed writes, check-in tickets and the Event Wall feed"
```

---

### Task 6: UI Home, Gate onboarding, dan profil publik

**Files:**
- Create: `lib/client.ts`, `components/Gate.tsx`, `app/u/[address]/page.tsx`
- Modify: `components/socemon/Reveal.tsx`, `app/page.tsx`

**Interfaces:**
- Consumes: route dari Task 5; `SOCEMON_ABI`, `socemonAddress` dari Task 4.
- Produces:
  - `lib/client.ts`:
    - `type Catch = { monsterId: number; tx: string; ms: number; nexmon?: boolean }`
    - `post<T>(path, body)`
    - `useSession(): { wallet, user, loading, signIn, signOut }`
    - `useTrainer(address, refetchInterval?): { loading, error, profile, eggs, pending, connections, owned: Set<number>, refetch }`
    - `useNames(addresses): (a) => string`
  - `components/Gate.tsx`: `Gate({ hero?, children: (user: Address) => ReactNode })`
  - `components/socemon/Reveal.tsx`: `useCatch().run(label, call: () => Promise<Catch-like>, extra?)` yang memakai `tx` dan `ms` dari server

- [ ] **Step 1: `lib/client.ts`**

```ts
import { useEffect, useState } from 'react'
import { zeroAddress, type Address } from 'viem'
import { monadTestnet } from 'viem/chains'
import { createSiweMessage } from 'viem/siwe'
import { useConnection, useReadContracts, useSignMessage } from 'wagmi'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { SPECIES } from '@/lib/socemon'
import { shortAddress } from '@/lib/utils'

/* Browser side of Socemon: reads go straight to the contract, writes go through the API relayer. */

export type Catch = { monsterId: number; tx: string; ms: number; nexmon?: boolean }

const SIGNED_OUT = 'socemon:signed-out'

/** POSTs JSON to an API route and throws its error message. A 401 tells every useSession to ask for sign-in again. */
export async function post<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  if (res.status === 401) window.dispatchEvent(new Event(SIGNED_OUT))
  if (!res.ok) throw new Error(data.error ?? 'Something went wrong')
  return data as T
}

/** The wallet AppKit has connected and the wallet the server session belongs to; `user` is set only when they match. */
export function useSession() {
  const { address: wallet } = useConnection()
  const { mutateAsync: signMessage } = useSignMessage()
  const [session, setSession] = useState<string | null | undefined>(undefined)

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setSession(data?.address ?? null))
      .catch(() => setSession(null))
    const signedOut = () => setSession(null)
    window.addEventListener(SIGNED_OUT, signedOut)
    return () => window.removeEventListener(SIGNED_OUT, signedOut)
  }, [])

  async function signIn() {
    if (!wallet) throw new Error('Connect a wallet first')
    const { nonce } = await (await fetch('/api/auth/nonce')).json()
    const message = createSiweMessage({
      address: wallet, chainId: monadTestnet.id, domain: window.location.host, nonce, uri: window.location.origin,
      version: '1', statement: 'Sign in to Socemon',
    })
    const signature = await signMessage({ message })
    setSession((await post<{ address: string }>('/api/auth/verify', { message, signature })).address)
  }

  async function signOut() {
    await post('/api/auth/logout', {})
    window.dispatchEvent(new Event(SIGNED_OUT))
  }

  const user = wallet && session && session.toLowerCase() === wallet.toLowerCase() ? wallet : null
  return { wallet, user, loading: session === undefined, signIn, signOut }
}

const DEX_IDS = Array.from({ length: SPECIES.length + 1 }, (_, i) => BigInt(i))

/** One multicall for everything a trainer page shows. Pass `refetchInterval` to keep requests and Eggs fresh. */
export function useTrainer(address: Address | null | undefined, refetchInterval?: number) {
  const contract = { address: socemonAddress(), abi: SOCEMON_ABI, chainId: monadTestnet.id } as const
  const who = address ?? zeroAddress
  const { data, error, isLoading, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...contract, functionName: 'profileOf', args: [who] },
      { ...contract, functionName: 'eggsOf', args: [who] },
      { ...contract, functionName: 'pendingOf', args: [who] },
      { ...contract, functionName: 'connectionsOf', args: [who] },
      { ...contract, functionName: 'balanceOfBatch', args: [DEX_IDS.map(() => who), DEX_IDS] },
    ],
    query: { enabled: !!address, refetchInterval },
  })
  return {
    loading: !!address && isLoading,
    error,
    profile: data?.[0],
    eggs: data?.[1],
    pending: data?.[2],
    connections: data?.[3],
    owned: new Set((data?.[4] ?? []).flatMap((n, id) => (n > 0n ? [id] : []))),
    refetch,
  }
}

/** Display names for a list of addresses, falling back to the short address. */
export function useNames(addresses: readonly Address[] | undefined) {
  const list = addresses ?? []
  const { data } = useReadContracts({
    allowFailure: false,
    contracts: list.map((a) => ({ address: socemonAddress(), abi: SOCEMON_ABI, chainId: monadTestnet.id, functionName: 'profileOf', args: [a] }) as const),
    query: { enabled: list.length > 0 },
  })
  return (a: Address) => (data?.[list.indexOf(a)] as { name: string } | undefined)?.name || shortAddress(a)
}
```

- [ ] **Step 2: Reveal memakai `tx` dan `ms` dari server**

Di `components/socemon/Reveal.tsx`:
- Ganti tipe `RevealState` dan `Caught` dengan:

```ts
export type RevealState =
  | { phase: 'pending'; label: string }
  | { phase: 'done'; monsterId: number; tx?: string; ms: number; extra?: string }
  | { phase: 'error'; message: string }

type Caught = { monsterId: number; tx?: string; ms?: number }
```

- Di `run`, ganti `setState({ phase: 'done', monsterId: result.monsterId, txHash: result.txHash, elapsedMs: performance.now() - started, extra: extra?.(result) })` dengan:

```ts
      setState({ phase: 'done', monsterId: result.monsterId, tx: result.tx, ms: result.ms ?? performance.now() - started, extra: extra?.(result) })
```

- Di `Done`:
  - ganti parameter `{ monsterId, txHash, elapsedMs, extra, onClose }` dengan `{ monsterId, tx, ms, extra, onClose }`
  - ganti `(elapsedMs / 1000)` dengan `(ms / 1000)`
  - ganti kedua `txHash` di blok link dengan `tx`

- [ ] **Step 3: `components/Gate.tsx`**

```tsx
'use client'
import { useState } from 'react'
import { useAppKit } from '@reown/appkit/react'
import type { Address } from 'viem'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, useSession, useTrainer, type Catch } from '@/lib/client'
import { ROLES } from '@/lib/socemon'
import { cn } from '@/lib/utils'

/* Connect a wallet, sign in once, claim Soci. `children` only renders for a signed-in, registered trainer. */
export function Gate({ hero, children }: { hero?: React.ReactNode; children: (user: Address) => React.ReactNode }) {
  const { open } = useAppKit()
  const session = useSession()
  const trainer = useTrainer(session.user)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function signIn() {
    setBusy(true)
    setError('')
    try {
      await session.signIn()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setBusy(false)
    }
  }

  if (session.loading || trainer.loading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-label="Loading">
        <div className="w-6 h-6 rounded-full border-[1.5px] border-text-tertiary border-t-text-primary animate-spin" />
      </div>
    )
  }
  if (session.user && trainer.profile?.registered) return <>{children(session.user)}</>

  return (
    <div className="flex flex-col items-center text-center gap-4 py-10">
      {hero}
      {!session.wallet ? (
        <Step title="Connect a wallet" body="Your Socemon are minted to this wallet on Monad. You never pay gas.">
          <Button size="lg" onClick={() => open()}>Connect wallet</Button>
        </Step>
      ) : !session.user ? (
        <Step title="Sign in" body="One signature, no gas. It proves this wallet is yours.">
          <Button size="lg" loading={busy} onClick={signIn}>Sign in</Button>
        </Step>
      ) : trainer.error ? (
        <Step title="Monad is busy" body="Could not read your trainer from the chain.">
          <Button size="lg" onClick={() => trainer.refetch()}>Try again</Button>
        </Step>
      ) : (
        <Register onDone={() => trainer.refetch()} />
      )}
      {error && <p role="alert" className="font-sans text-[13px] text-text-error">{error}</p>}
    </div>
  )
}

function Register({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState<number | null>(null)
  const reveal = useCatch()

  return (
    <Step title="Claim your starter" body="Your name shows on the Event Wall. Your role is the Egg type people get when they connect with you.">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={24}
        placeholder="Your name"
        aria-label="Your name"
        className="w-full h-12 rounded-2xl bg-[var(--fill)] px-4 font-sans text-[15px] text-text-primary outline-none"
      />
      <div className="grid grid-cols-2 gap-2 w-full">
        {ROLES.map((r) => (
          <button
            key={r.role}
            type="button"
            aria-pressed={role === r.role}
            onClick={() => setRole(r.role)}
            className={cn(
              'rounded-2xl border px-3 py-2.5 text-left',
              role === r.role ? 'border-primary bg-[var(--accent-primary-dim)]' : 'border-(--border-default)',
            )}
          >
            <span className="block font-sans text-[14px] text-text-primary">{r.label}</span>
            <span className="block font-sans text-[11px] text-text-tertiary">{r.type} type</span>
          </button>
        ))}
      </div>
      <Button
        size="lg"
        fullWidth
        disabled={!name.trim() || role === null}
        loading={reveal.state?.phase === 'pending'}
        onClick={() => reveal.run('Calling Soci…', () => post<Catch>('/api/register', { name: name.trim(), role }))}
      >
        Claim Soci
      </Button>
      <Reveal state={reveal.state} onClose={() => { reveal.close(); onDone() }} />
    </Step>
  )
}

function Step({ title, body, children }: { title: string; body: string; children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm flex flex-col items-center gap-3">
      <h2 className="font-display text-[24px] text-text-primary">{title}</h2>
      <p className="font-sans text-[14px] text-text-secondary">{body}</p>
      {children}
    </div>
  )
}
```

- [ ] **Step 4: `app/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import QRCode from 'qrcode'
import { Egg, LogOut, QrCode } from 'lucide-react'
import type { Address } from 'viem'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, useNames, useSession, useTrainer, type Catch } from '@/lib/client'
import { POOL, ROLES, SPECIES, STARTER, STARTER_ID, TIER_COLOR, speciesById, speciesInPool, typeName } from '@/lib/socemon'

const DEX = [
  { title: 'Starter', list: [STARTER] },
  ...[POOL.byte, POOL.blaze, POOL.prism, POOL.gold, POOL.echo, POOL.wild, POOL.bonus, POOL.event].map((pool) => ({
    title: typeName(pool),
    list: speciesInPool(pool),
  })),
]

const hero = (
  <>
    <Logo height={28} />
    <MonsterImage id={STARTER_ID} size={160} />
    <p className="font-display text-[30px] leading-tight text-text-primary">Catch your network.</p>
    <p className="font-sans text-[14px] text-text-secondary max-w-xs">
      Meet people, hatch their type, fill your Socédex. Every Socemon is an NFT on Monad.
    </p>
  </>
)

export default function HomePage() {
  return (
    <main className="px-5">
      <Gate hero={hero}>{(user) => <Home user={user} />}</Gate>
    </main>
  )
}

/* Everything a trainer does: partner, QR to connect, requests to approve, Eggs to hatch, and the Socédex. */
function Home({ user }: { user: Address }) {
  const { signOut } = useSession()
  const trainer = useTrainer(user, 5_000)
  const nameOf = useNames(trainer.pending)
  const reveal = useCatch()
  const [qr, setQr] = useState('')
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')

  const profile = trainer.profile
  const partner = Number(profile?.partner ?? 0n)
  const eggs = trainer.eggs ?? []
  const types = ROLES.slice(1).filter((r) => speciesInPool(r.role).some((s) => trainer.owned.has(s.id))).length

  async function act(key: string, call: () => Promise<unknown>, done: string) {
    setBusy(key)
    setNote('')
    try {
      await call()
      setNote(done)
      await trainer.refetch()
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy('')
    }
  }

  async function toggleQr() {
    setQr(qr ? '' : await QRCode.toDataURL(`${window.location.origin}/u/${user}`, { margin: 1, width: 560 }))
  }

  return (
    <div className="pb-10">
      <header className="flex items-center justify-between h-16">
        <Logo height={22} />
        <button onClick={signOut} aria-label="Sign out" className="p-2 -mr-2 text-text-tertiary">
          <LogOut className="w-5 h-5" />
        </button>
      </header>

      <section className="flex flex-col items-center text-center pt-2">
        <MonsterImage id={partner} size={180} />
        <p className="font-display text-[26px] text-text-primary mt-2">{profile?.name}</p>
        <p className="font-sans text-[13px] text-text-secondary">
          {ROLES[profile?.role ?? 0]?.label} · partner {speciesById(partner)?.name}
        </p>
        <Button variant="secondary" size="sm" className="mt-4" onClick={toggleQr}>
          <QrCode className="w-4 h-4" /> {qr ? 'Hide my QR' : 'My QR'}
        </Button>
        {qr && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} alt="QR code to your Socemon profile" className="mt-4 w-64 rounded-2xl bg-white p-3" />
            <p className="font-sans text-[12px] text-text-tertiary mt-2">Friends scan this to connect with you.</p>
          </>
        )}
      </section>

      {note && (
        <p role="status" className="mt-6 rounded-2xl bg-[var(--fill)] px-4 py-3 font-sans text-[13px] text-text-secondary">{note}</p>
      )}

      {!!trainer.pending?.length && (
        <section className="mt-8">
          <h2 className="eyebrow mb-3">Requests</h2>
          <ul className="space-y-2">
            {trainer.pending.map((from) => (
              <li key={from} className="flex items-center gap-3 rounded-[14px] bg-[var(--fill)] px-4 py-3">
                <p className="flex-1 min-w-0 font-sans text-[14px] text-text-primary truncate">{nameOf(from)}</p>
                <Button
                  size="sm"
                  loading={busy === from}
                  disabled={!!busy}
                  onClick={() => act(from, () => post('/api/approve', { from }), `Connected with ${nameOf(from)}. You both got an Egg.`)}
                >
                  Approve
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="eyebrow mb-3">Eggs</h2>
        {eggs.every((n) => n === 0) ? (
          <p className="font-sans text-[13px] text-text-secondary">
            Meet people. Every new connection gives you both an Egg of the other person&apos;s type.
          </p>
        ) : (
          <ul className="space-y-2">
            {eggs.map((count, pool) =>
              count > 0 ? (
                <li key={pool} className="flex items-center gap-3 rounded-[14px] bg-[var(--fill)] px-4 py-3">
                  <Egg className="w-5 h-5 text-text-accent shrink-0" />
                  <p className="flex-1 font-sans text-[14px] text-text-primary">{typeName(pool)} Egg × {count}</p>
                  <Button
                    size="sm"
                    disabled={!!busy || reveal.state?.phase === 'pending'}
                    onClick={() =>
                      reveal.run(`Hatching a ${typeName(pool)} Egg…`, () => post<Catch>('/api/hatch', { pool }), (r) =>
                        r.nexmon ? 'You met every type. Nexmon joined you too!' : undefined,
                      )
                    }
                  >
                    Hatch
                  </Button>
                </li>
              ) : null,
            )}
          </ul>
        )}
      </section>

      <p className="mt-8 font-mono text-[12px] text-text-tertiary text-center">
        {trainer.connections?.length ?? 0} connections · types {types}/5 · caught {trainer.owned.size}/{SPECIES.length + 1}
      </p>

      <section className="mt-6 space-y-6">
        <div>
          <h2 className="eyebrow">Socédex</h2>
          <p className="font-sans text-[12px] text-text-tertiary mt-1">Tap a Socemon you caught to make it your partner.</p>
        </div>
        {DEX.map(({ title, list }) => (
          <div key={title}>
            <p className="font-sans text-[11px] text-text-tertiary mb-2">{title}</p>
            <div className="grid grid-cols-3 gap-3">
              {list.map((s) => {
                const has = trainer.owned.has(s.id)
                return (
                  <button
                    key={s.id}
                    disabled={!has || !!busy || s.id === partner}
                    onClick={() => act(`p${s.id}`, () => post('/api/partner', { id: s.id }), `${s.name} is your partner now.`)}
                    className="flex flex-col items-center gap-1 rounded-[16px] bg-[var(--fill)] p-3 disabled:cursor-default"
                    style={s.id === partner ? { outline: `2px solid ${TIER_COLOR[s.tier]}` } : undefined}
                  >
                    <MonsterImage id={s.id} size={72} silhouette={!has} />
                    <p className="font-sans text-[12px] text-text-primary truncate max-w-full">{has ? s.name : '???'}</p>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <Reveal state={reveal.state} onClose={() => { reveal.close(); trainer.refetch() }} />
    </div>
  )
}
```

- [ ] **Step 5: `app/u/[address]/page.tsx`**

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { getAddress, isAddress, type Address } from 'viem'
import { monadTestnet } from 'viem/chains'
import { useReadContracts } from 'wagmi'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Button } from '@/components/ui/Button'
import { PageSpinner } from '@/components/ui/PageSpinner'
import { SOCEMON_ABI, socemonAddress } from '@/lib/abi'
import { post, useTrainer } from '@/lib/client'
import { ROLES, SPECIES, speciesById } from '@/lib/socemon'

/* What a friend sees after scanning your QR: your partner, your progress, and a Connect button. */
export default function TrainerPage() {
  const { address } = useParams<{ address: string }>()
  const target = isAddress(address, { strict: false }) ? getAddress(address) : null
  const trainer = useTrainer(target)
  const profile = trainer.profile

  if (target && trainer.loading) return <PageSpinner />
  if (!target || !profile?.registered) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-8 text-center">
        <h1 className="font-display text-[26px] text-text-primary">No trainer here yet</h1>
        <Link href="/" className="font-sans text-[14px] font-medium text-text-accent">Catch your own Socemon</Link>
      </main>
    )
  }

  const partner = Number(profile.partner)
  const role = ROLES[profile.role]
  return (
    <main className="px-5 pb-10">
      <header className="h-16 flex items-center">
        <Link href="/" aria-label="Socemon home"><Logo height={22} /></Link>
      </header>
      <section className="flex flex-col items-center text-center">
        <MonsterImage id={partner} size={180} />
        <h1 className="font-display text-[28px] text-text-primary mt-2">{profile.name}</h1>
        <p className="font-sans text-[13px] text-text-secondary">
          {role?.label} · {role?.type} type · partner {speciesById(partner)?.name}
        </p>
        <p className="font-mono text-[12px] text-text-tertiary mt-2">
          {trainer.owned.size}/{SPECIES.length + 1} caught · {trainer.connections?.length ?? 0} connections
        </p>
      </section>
      <section className="mt-6">
        <Gate>{(viewer) => <ConnectBox viewer={viewer} target={target} name={profile.name} />}</Gate>
      </section>
    </main>
  )
}

function ConnectBox({ viewer, target, name }: { viewer: Address; target: Address; name: string }) {
  const contract = { address: socemonAddress(), abi: SOCEMON_ABI, chainId: monadTestnet.id } as const
  const { data, refetch } = useReadContracts({
    allowFailure: false,
    contracts: [
      { ...contract, functionName: 'link', args: [viewer, target] },
      { ...contract, functionName: 'link', args: [target, viewer] },
    ],
    query: { refetchInterval: 5_000 },
  })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function connect() {
    setBusy(true)
    setError('')
    try {
      await post('/api/connect', { to: target })
      await refetch()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setBusy(false)
    }
  }

  const [mine, theirs] = data ?? [0, 0]
  if (viewer === target) {
    return (
      <p className="text-center font-sans text-[14px] text-text-secondary">
        This is your profile. <Link href="/" className="text-text-accent">Back home</Link>
      </p>
    )
  }
  if (mine === 2) return <p className="text-center font-sans text-[14px] text-text-secondary">You and {name} are connected. You both got an Egg.</p>
  if (mine === 1) return <p className="text-center font-sans text-[14px] text-text-secondary">Request sent. You both get an Egg once {name} approves.</p>
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Button size="lg" loading={busy} onClick={connect}>{theirs === 1 ? `Accept ${name}'s request` : `Connect with ${name}`}</Button>
      <p className="font-sans text-[12px] text-text-tertiary">
        {theirs === 1 ? 'They already asked, so this connects you both right away.' : `${name} approves, then you both get an Egg.`}
      </p>
      {error && <p role="alert" className="font-sans text-[13px] text-text-error">{error}</p>}
    </div>
  )
}
```

- [ ] **Step 6: Verifikasi**

Run: `npx tsc --noEmit && npm run build 2>&1 | tail -20`
Expected: tsc bersih; build sukses dengan route `/` dan `/u/[address]`.

Run (dev server port 3100 menyala): `for p in / /u/0x0000000000000000000000000000000000000001 /u/bukan-alamat; do curl -s -o /dev/null -w "%{http_code} $p\n" localhost:3100$p; done`
Expected: `200` untuk ketiganya.

Pemeriksaan wallet secara manual dicatat di Task 9, karena butuh Project ID Reown.

- [ ] **Step 7: Commit**

```bash
git add lib/client.ts components app/page.tsx app/u
git commit -m "feat(ui): sign-in gate, Home with Eggs and the Socédex, public trainer profile"
```

---

### Task 7: Halaman check-in dan Event Wall

**Files:**
- Create: `app/checkin/page.tsx`, `app/checkin/CheckinScreen.tsx`, `app/wall/page.tsx`, `app/wall/WallScreen.tsx`

**Interfaces:**
- Consumes:
  - `currentEvent()` dari Task 4
  - `GET /api/wall` dan `POST /api/checkin` dari Task 5
  - `Gate`, `post`, `useCatch`/`Reveal` dari Task 6

- [ ] **Step 1: Halaman check-in**

`app/checkin/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { currentEvent } from '@/lib/checkin'
import { CheckinScreen } from './CheckinScreen'

export const metadata: Metadata = { title: 'Check in', robots: { index: false, follow: false } }

export default async function CheckinPage({ searchParams }: { searchParams: Promise<{ expired?: string }> }) {
  const { expired } = await searchParams
  const event = currentEvent()
  return <CheckinScreen eventName={event.name} dropId={event.dropId} expired={expired === '1'} />
}
```

`app/checkin/CheckinScreen.tsx`:

```tsx
'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/brand/Logo'
import { Gate } from '@/components/Gate'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { Reveal, useCatch } from '@/components/socemon/Reveal'
import { Button } from '@/components/ui/Button'
import { post, type Catch } from '@/lib/client'
import { speciesById } from '@/lib/socemon'

/* Where the Event Wall QR lands once the ticket cookie is set: onboarding if needed, then the drop. */
export function CheckinScreen({ eventName, dropId, expired }: { eventName: string; dropId: number; expired: boolean }) {
  const reveal = useCatch()
  const [caught, setCaught] = useState(false)
  const drop = speciesById(dropId)

  const teaser = (
    <>
      <Logo height={24} />
      <MonsterImage id={dropId} size={160} silhouette={!caught} />
      <h1 className="font-display text-[28px] leading-tight text-text-primary">{eventName}</h1>
      <p className="font-sans text-[14px] text-text-secondary max-w-xs">
        Check in to catch {drop?.name ?? 'the event Socemon'}. Only {drop?.maxSupply} exist, and it is the only tradeable Socemon.
      </p>
    </>
  )

  if (expired) {
    return (
      <main className="flex flex-col items-center text-center gap-4 px-6 py-10">
        {teaser}
        <p role="alert" className="font-sans text-[14px] text-text-error">This QR expired. Scan the Event Wall again.</p>
      </main>
    )
  }

  async function catchDrop() {
    if (await reveal.run(`Catching ${drop?.name ?? 'the drop'}…`, () => post<Catch>('/api/checkin', {}))) setCaught(true)
  }

  return (
    <main className="px-6">
      <Gate hero={teaser}>
        {() => (
          <div className="flex flex-col items-center text-center gap-4 py-10">
            {teaser}
            {caught ? (
              <Link href="/" className="font-sans text-[15px] font-medium text-text-accent">See it in your Socédex</Link>
            ) : (
              <Button size="lg" loading={reveal.state?.phase === 'pending'} onClick={catchDrop}>Catch {drop?.name}</Button>
            )}
          </div>
        )}
      </Gate>
      <Reveal state={reveal.state} onClose={reveal.close} />
    </main>
  )
}
```

- [ ] **Step 2: Event Wall**

`app/wall/page.tsx`:

```tsx
import type { Metadata } from 'next'
import { currentEvent } from '@/lib/checkin'
import { WallScreen } from './WallScreen'

export const metadata: Metadata = { title: 'Event Wall', robots: { index: false, follow: false } }

export default async function WallPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams
  if (!process.env.WALL_KEY || key !== process.env.WALL_KEY) {
    return (
      <main className="min-h-svh flex flex-col items-center justify-center gap-3 px-8 text-center">
        <h1 className="font-display text-[26px] text-text-primary">Event Wall</h1>
        <p className="font-sans text-[14px] text-text-secondary max-w-xs">Open this page with the wall link from the host.</p>
      </main>
    )
  }
  const event = currentEvent()
  return <WallScreen wallKey={key} eventName={event.name} dropId={event.dropId} />
}
```

`app/wall/WallScreen.tsx`:

```tsx
'use client'
import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Handshake } from 'lucide-react'
import QRCode from 'qrcode'
import { Logo } from '@/components/brand/Logo'
import { MonsterImage } from '@/components/socemon/MonsterImage'
import { speciesById } from '@/lib/socemon'

type FeedItem = { key: string; text: string; monsterId: number | null }

const POLL_MS = 2_000
const FEED_SIZE = 30

/* Projector view: the rotating check-in QR, how many drops are left, and every catch as it lands onchain. */
export function WallScreen({ wallKey, eventName, dropId }: { wallKey: string; eventName: string; dropId: number }) {
  const [token, setToken] = useState('')
  const [qr, setQr] = useState('')
  const [dropped, setDropped] = useState<number | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const drop = speciesById(dropId)

  useEffect(() => {
    let cursor = ''
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    /* polls back to back, never overlapping, so a slow RPC cannot read the same blocks twice */
    async function poll() {
      try {
        const res = await fetch(`/api/wall?key=${encodeURIComponent(wallKey)}${cursor ? `&from=${cursor}` : ''}`)
        if (res.ok) {
          const data: { token: string; dropped: number; feed: FeedItem[]; cursor: string } = await res.json()
          if (cancelled) return
          cursor = data.cursor
          setToken(data.token)
          setDropped(data.dropped)
          if (data.feed.length) setFeed((f) => [...data.feed.reverse(), ...f].slice(0, FEED_SIZE))
        }
      } catch (err) {
        console.error('wall poll failed', err)
      }
      if (!cancelled) timer = setTimeout(poll, POLL_MS)
    }
    poll()
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [wallKey])

  useEffect(() => {
    if (token) QRCode.toDataURL(`${window.location.origin}/api/checkin/ticket?t=${encodeURIComponent(token)}`, { margin: 1, width: 720 }).then(setQr)
  }, [token])

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto text-white" style={{ background: '#07070B' }}>
      <div className="min-h-full grid grid-cols-1 lg:grid-cols-[minmax(320px,32%)_1fr] gap-10 p-10">
        <aside className="flex flex-col items-center gap-6 text-center lg:sticky lg:top-10 self-start">
          <Logo height={32} tone="dark" />
          <h1 className="font-display text-[34px] leading-tight">{eventName}</h1>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="Check-in QR code" className="w-full max-w-[360px] rounded-3xl bg-white p-4" />
          ) : (
            <div className="w-full max-w-[360px] aspect-square rounded-3xl bg-white/10" />
          )}
          <p className="font-sans text-[18px] text-white/80">Scan to check in and catch {drop?.name ?? 'the event Socemon'}</p>
          <div className="flex gap-10 font-mono">
            <div>
              <p className="text-[44px] leading-none">{dropped ?? '–'}</p>
              <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 mt-2">caught</p>
            </div>
            {drop && dropped != null && (
              <div>
                <p className="text-[44px] leading-none">{Math.max(0, drop.maxSupply - dropped)}</p>
                <p className="text-[12px] uppercase tracking-[0.12em] text-white/50 mt-2">{drop.name} left</p>
              </div>
            )}
          </div>
        </aside>

        <main aria-live="polite">
          {feed.length === 0 ? (
            <p className="font-sans text-[20px] text-white/50 text-center mt-24">Waiting for the first catch…</p>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {feed.map((item) => (
                  <motion.li
                    key={item.key}
                    layout
                    initial={{ x: 60, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', bounce: 0.3, duration: 0.6 }}
                    className="flex items-center gap-4 rounded-3xl bg-white/5 px-5 py-4"
                  >
                    {item.monsterId != null ? (
                      <MonsterImage id={item.monsterId} size={64} />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-white/10 flex items-center justify-center">
                        <Handshake className="w-8 h-8 text-white/70" />
                      </div>
                    )}
                    <p className="font-sans text-[20px]">{item.text}</p>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </main>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verifikasi**

Run: `npx tsc --noEmit && npm run build 2>&1 | tail -20`
Expected: tsc bersih; build sukses dengan `/checkin` dan `/wall` sebagai route dinamis (`ƒ`).

Run (dev server port 3100):

```bash
set -a; source .env.local; set +a
curl -s localhost:3100/wall | grep -o 'Open this page with the wall link'
curl -s "localhost:3100/wall?key=$WALL_KEY" | grep -o 'Scan to check in'
curl -s "localhost:3100/checkin?expired=1" | grep -o 'This QR expired'
curl -sI localhost:3100/wall | grep -i x-robots-tag
```

Expected: keempat baris muncul. Header `x-robots-tag` berisi `noindex`.

- [ ] **Step 4: Commit**

```bash
git add app/checkin app/wall
git commit -m "feat(ui): check-in page and the projector Event Wall"
```

---

### Task 8: Gambar monster lewat ChatGPT (Claude in Chrome)

**Files:**
- Create: `public/socemon/0.png` … `public/socemon/20.png`
- Test: `e2e/socemon.spec.ts`

- [ ] **Step 1: Tulis test yang gagal**

Tambahkan di akhir `e2e/socemon.spec.ts` (dan `import { readFileSync } from 'node:fs'` di atas):

```ts
test.describe('art', () => {
  test('every species has a 512px PNG with transparency', () => {
    for (let id = 0; id <= SPECIES.length; id++) {
      const png = readFileSync(`public/socemon/${id}.png`)
      expect(png.subarray(1, 4).toString(), `${id}`).toBe('PNG')
      expect([png.readUInt32BE(16), png.readUInt32BE(20)], `${id} size`).toEqual([512, 512])
      expect([4, 6], `${id} alpha`).toContain(png[25])
    }
  })
})
```

Run: `npm test 2>&1 | tail -5`
Expected: FAIL `ENOENT public/socemon/0.png`.

- [ ] **Step 2: Buka ChatGPT di Chrome**

1. Muat tool Chrome dalam satu ToolSearch: `tabs_context_mcp`, `tabs_create_mcp`, `navigate`, `computer`, `read_page`, `find`, `form_input`, `get_page_text`.
2. Buka tab baru ke `https://chatgpt.com/`.
3. Pastikan user sudah login. Kalau belum, berhenti dan minta user login.

- [ ] **Step 3: Generate Soci sebagai acuan gaya**

Kirim prompt ini di chat baru:

> Original cute creature for a monster-collecting game, official character artwork style: clean bold lineart, cel shading, soft gradients, vibrant colors, full body, three-quarter view, centered, single creature, no text, no logo, transparent background, square 1:1 image. Do not copy any existing Pokémon. Creature: "Soci", the starter. A small round Monad-purple (#836EF9) creature with big friendly eyes, stubby arms, and a tiny antenna shaped like a chain link.

Tunggu gambar selesai, lalu klik tombol download. Kemudian pindahkan:

```bash
mkdir -p public/socemon && f=$(ls -t ~/Downloads/*.png | head -1) && sips -Z 512 "$f" --out public/socemon/0.png >/dev/null && sips -g pixelWidth -g pixelHeight -g hasAlpha public/socemon/0.png
```

Expected: `pixelWidth: 512`, `pixelHeight: 512`, `hasAlpha: yes`. Kalau `hasAlpha: no` atau tidak persegi, minta ChatGPT membuat ulang dengan latar transparan dan rasio 1:1.

- [ ] **Step 4: Generate 20 monster lain di chat yang sama**

Untuk setiap baris tabel spec §9 (id 1..20), kirim prompt berikut dengan `<Name>` dan `<Brief>` diganti:

> Same art style as Soci above, transparent background, square 1:1, single creature, no text. Creature: "<Name>". <Brief>

Setelah setiap gambar: download, lalu jalankan perintah Step 3 dengan `0.png` diganti `<id>.png`, dan cek ukuran serta alpha. Kalau ChatGPT membatasi jumlah gambar, berhenti, laporkan id terakhir yang berhasil, dan minta user melanjutkan nanti.

- [ ] **Step 5: Jalankan test dan lihat lulus**

Run: `npm test 2>&1 | tail -5`
Expected: semua PASS, termasuk `every species has a 512px PNG with transparency`.

- [ ] **Step 6: Commit dan push**

```bash
git add public/socemon e2e/socemon.spec.ts
git commit -m "feat(art): 21 original Socemon portraits"
git push
```

---

### Task 9: README, verifikasi akhir, dan push

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Tulis ulang `README.md`**

Isi `<ADDR>` dengan alamat dari Task 3:

````markdown
# Socemon

Social on Monad. Catch your network.

Socemon is a monster collection you play in real life. Meet someone at an event, connect, and you both get an Egg of the other person's type. Hatch it, fill your Socédex, and show up at events for drops you can only catch there. Built for Monad Blitz.

**Contract (Monad testnet, chain 10143):** [`<ADDR>`](https://testnet.monadscan.com/address/<ADDR>)

## How it plays

- **Soci**: connect a wallet, sign in once, pick a name and a role, and claim your starter.
- **Connect**: show your QR. A friend scans it and taps Connect, you approve, and you both get an Egg of each other's type: Byte (developer), Blaze (founder), Prism (designer), Gold (investor), Echo (community) or Wild (anything else).
- **Hatch**: an Egg hatches a species of its type, weighted by remaining supply (500 common, 100 rare, 20 epic per type). Catch all five types and Nexmon (100 exist) joins you.
- **Event drops**: the host puts the Event Wall on the projector. Its QR rotates every 30 seconds, so only people in the room can use it. Scanning it catches Blitzmon (100 exist), the only tradeable Socemon. Organizers get verified attendance onchain.

## Fully onchain

The contract is the whole backend: profiles, connection requests, Eggs, monsters and partners. The server only relays transactions with a key that holds `MINTER_ROLE`, so attendees never need MON, and the browser reads everything straight from Monad. There is no database.

## Run it locally

```bash
npm install
cp .env.local.example .env.local   # fill it in
npm run dev
```

| Var | What |
| --- | --- |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Free at dashboard.reown.com; allowlist localhost and your domain |
| `NEXT_PUBLIC_SOCEMON_ADDRESS` | The deployed contract |
| `MINTER_PRIVATE_KEY` | Relayer key with `MINTER_ROLE`, funded with testnet MON |
| `SESSION_SECRET`, `CHECKIN_SECRET`, `WALL_KEY` | `openssl rand -hex 32` |
| `EVENT_NAME`, `EVENT_DROP_ID`, `EVENT_STARTS_AT`, `EVENT_ENDS_AT` | The event; no start time means always live |
| `MONAD_RPC_URL`, `NEXT_PUBLIC_MONAD_RPC_URL` | Optional private RPCs |

Open `/wall?key=<WALL_KEY>` on the projector.

## Tests

```bash
npm test                 # pure logic
npm run contracts:install && npm run test:contracts   # Foundry
npm run test:api         # API rejections against a dev server
npm run test:flow        # the whole loop onchain with two throwaway wallets (spends testnet MON)
```

## Deploy the contract

```bash
cd contracts
SOCEMON_MINTER=<relayer address> SOCEMON_BASE_URI=https://<host>/api/socemon/ \
  forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz --account <keystore> --sender <deployer> --broadcast
```

## Hosting

Vercel Hobby works as is: import the repo, add the env vars, add the domain to the Reown allowlist, and point the metadata at it with `setBaseURI("https://<host>/api/socemon/")` from the deployer. On a VPS, run `npm run build && npm start` behind a reverse proxy that forwards the Host header; sign-in checks it.

## Structure

```
contracts/   Socemon.sol, Foundry tests, deploy script, socemon.json (species catalog)
app/         Home (/), trainer profile (/u/[address]), /checkin, /wall, API routes
components/  Sign-in gate, monster art, catch reveal
lib/         ABI, relayer, sessions, check-in tokens, browser hooks
e2e/         Pure, API and onchain flow tests
```

Known limits and their upgrade paths are in `docs/superpowers/specs/2026-10-20-socemon-blitz-design.md` §10.
````

- [ ] **Step 2: Verifikasi lengkap**

```bash
npx tsc --noEmit && npm test 2>&1 | tail -3 && npm run test:contracts 2>&1 | tail -3 && npm run build 2>&1 | tail -5 && npm run test:api 2>&1 | tail -3
```

Expected: tsc bersih, semua test pure PASS, 22 test Foundry PASS, build sukses, 5 test api PASS.

- [ ] **Step 3: Commit dan push**

```bash
git add README.md
git commit -m "docs: README for Socemon on Monad Blitz"
git push
```

- [ ] **Step 4: Checklist manual untuk user**

Butuh `NEXT_PUBLIC_REOWN_PROJECT_ID`. Dua profil browser dengan dua wallet berbeda di `http://localhost:3000`, satu putaran penuh:

1. Connect → Sign in → nama + role → Reveal Soci.
2. Wallet A: My QR. Wallet B: buka `/u/<A>` → Connect.
3. A: Approve.
4. Keduanya punya Egg → Hatch.
5. Tap monster di Socédex → jadi partner.
6. `/wall?key=…` → scan QR-nya → Catch Blitzmon → feed wall bertambah.
````
