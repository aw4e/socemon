# Socemon

Social on Monad. Catch your network.

Socemon brings community events and web3 games together. People come to an event because it drops a limited NFT. They want the NFT because it makes them stronger in games. The game that sponsored the drop gets new players who already hold its items. Built for Monad Blitz.

| | |
| --- | --- |
| **Live app** | https://socemon.vercel.app |
| **Games** | [Blitz Rush](https://socemon.vercel.app/app/game/rush) · [Blitz Flap](https://socemon.vercel.app/app/game/flap) |
| **Contract** (Monad testnet, chain 10143) | [`0x770a1800D94bFd295116D44044309A920C458333`](https://testnet.monadscan.com/address/0x770a1800D94bFd295116D44044309A920C458333), verified on [Monadscan](https://testnet.monadscan.com/address/0x770a1800D94bFd295116D44044309A920C458333) and [MonadVision](https://testnet.monadvision.com/address/0x770a1800D94bFd295116D44044309A920C458333) |
| **NFT metadata** | `https://socemon.vercel.app/api/socemon/{id}` (images at `/api/avatar/{id}`) |
| **Relayer** (pays gas for everyone, keep it funded) | `0x1a627F3F4A838B4948adb1bFF2b5179a70707CA3` |
| **Repo** | https://github.com/riorblade/socemon |

## The problem

Community events, the people who attend them, and the web3 games that sponsor them all want the same thing: people who show up and stay. Today each side loses.

**Communities struggle to fill the room and prove it.** RSVPs don't turn into attendance, check-in lists can be faked, and nobody can verify afterwards who was really there. Inside the room, most people stay with the friends they came with, because nothing gives them a reason to talk to strangers.

**Attendees walk away with souvenirs, not value.** Attendance NFTs and POAPs are collectibles that do nothing, so they are forgotten the day after. Getting one often means installing a wallet, finding gas and signing transactions, which loses most newcomers before they start.

**Web3 games pay a lot for users who leave.** Sponsoring an event usually buys a logo on a banner and no measurable result. Airdrops get farmed by bots and multi-wallet accounts, and the people who do claim have no reason to open the game again.

## Why Socemon solves it

Socemon turns the event drop into something useful: an NFT that changes how you play. Each side's problem then becomes another side's gain.

| Problem | What Socemon does | Why it works |
| --- | --- | --- |
| No reason to come | A limited drop that makes you stronger in games, only at the event (the Blitz Jacket: 200 exist, one per wallet) | People come for scarcity plus a use, not for a badge |
| No reason to talk to strangers | Meeting someone *is* the game: each new connection gives both of you an Egg of the other's role and a blind box. Collecting all five role types unlocks Nexmon | The incentive is to meet people unlike you: developers, founders, designers, investors, community |
| Fake check-ins and farmed drops | Check-in and friend codes rotate every 30 seconds, and drops are capped at one per wallet onchain | A screenshot or forwarded link goes stale before it is useful, so only people in the room claim |
| Attendance nobody can verify | Every sign-up, connection and check-in is an onchain event on Monad | Organizers and sponsors can audit the turnout themselves, with no trust in a spreadsheet |
| NFTs that do nothing | Wearables unlock moves and perks in every game on the hub (Blitz Boost, Fly, Slash, extra lives) | Holders keep logging in, because the item matters every time they play |
| Wallets and gas scare newcomers | Email and Google sign-in, and a relayer pays every transaction | Attendees never need MON or tokens. Joining takes one signature |
| Sponsorship with no measurable return | The sponsor's skin or skill lands in the wallets of people who were there, and it works in the sponsor's game too | The sponsor gets real, already-equipped players, and can count holders, equips and plays onchain |

**Why Monad.** Transactions confirm in about a second, so claiming a drop or opening a box feels instant while people are standing in the room. Fees are low enough that one relayer can sponsor every attendee: about 0.1 MON for a full evening of signing up, meeting people, hatching, opening, equipping and checking in.

## The ecosystem

| | They get | They bring |
| --- | --- | --- |
| **Communities** | A full room, and attendance verified onchain | The event, and the check-in QR on the projector |
| **Players** | Limited NFT skins and skills that make them stronger in games | Showing up, meeting people, checking in. No gas, no tokens |
| **Game sponsors** | New players who arrive already holding their items | The event drop: a skin or skill that works in their game |

## How it works

1. **Meet.** Sign in with a wallet, email or Google, pick a name and a role, and claim Soci, your starter. Open *Scan → My code*: a friend scans it and you connect on the spot. The code rotates every 30 seconds, so it proves you met in person. Both of you get an Egg of the other's type and a blind box, and both phones show Hatch and Open right away.
2. **Collect.** Eggs hatch Socemon (500 common, 100 rare, 20 epic per type; catch all five types and Nexmon joins you). Your Socemon is your pet. Blind boxes drop one of 21 tradeable wearables across nine avatar slots, rarer ones weighted by supply.
3. **Show up.** At the event, the host's Event Wall shows a check-in QR that rotates every 30 seconds. Scan it and claim the event drop, one per person.
4. **Play.** Wear your NFTs in the Game hub. They change how the games play.

## Monad Blitz drop: Blitz Jacket

The Monad Blitz Jogja Vol. 2 drop (24 October 2026, GSIH Jogja) is the **Blitz Jacket**, token id `190`.

- **200 exist.** One per wallet, and only from checking in at the event.
- **Tradeable** on Monad, and wearable in the avatar's Outer slot.
- Its art follows the event poster: deep purple, the iridescent swoosh, and the BLITZ lightning bolt.

What it does in games right now:

| Game | Blitz Jacket |
| --- | --- |
| Blitz Rush | Unlocks **Blitz Boost**: 2.5 s of lightning speed that smashes through barriers, every 9 s. It is the move that beats Rex, the rival you cannot catch on skill alone |
| Blitz Flap | +1 life and 15% slow-mo |

## Games

Every game reads what the avatar wears and which pet it has. The rules live in `lib/game.ts`, so a wearable pays off in every game on the hub.

**Blitz Rush** is a three-lane race against Volt, Nova and Rex. Tap or swipe to change lanes; a barrier crash kills your speed. Wearables unlock moves:

| Wearable | Move |
| --- | --- |
| Blitz Jacket (event) | Blitz Boost |
| Circuit Wings (legendary) | Fly over barriers |
| Plasma Blade (epic) | Slash the barrier ahead |
| Hero Cape (rare) | Shield against one crash |
| Neon Jacket, Night Blazer, pet | Higher top speed |

**Blitz Flap** flies your avatar through pipes with your pet trailing behind:

| Wearable | Perk |
| --- | --- |
| Circuit Wings / Hero Cape / Digital Crown / Blitz Jacket | Extra lives |
| Cyber Visor / Round Glasses / Snap Cap / Digital Crown | A wider gap |
| Neon Jacket / Night Blazer / Blitz Jacket | Slower, easier pipes |
| Plasma Blade / Void Skin / Iced Coffee / Chrome Skin | Score multiplier |
| Pet | Score multiplier by rarity |

Other wearables are style only. Best scores are kept on the device.

## NFTs

One ERC-1155 contract holds everything:

| Ids | What | Transfer |
| --- | --- | --- |
| `0` | Soci, the starter | Soulbound |
| `1`–`19` | Socemon species from Eggs; `19` is Nexmon | Soulbound |
| `20` | Blitzmon, the earlier event monster | Tradeable |
| `100`–`181` | Wearables from blind boxes (`contracts/wearables.json`) | Tradeable |
| `190` | Blitz Jacket, the Monad Blitz drop | Tradeable |
| `2^255 \| address` | Each trainer's avatar; its image shows what they wear | Soulbound |

Selling a worn wearable takes it off your avatar.

## Running an event

1. **Hosts:** put the host wallets in `EVENT_HOSTS` (comma-separated). A host who signs in sees **Show check-in QR** on the Event tab. Put that screen on the projector. `/wall?key=<WALL_KEY>` also works on a machine with no wallet.
2. **Drop:** set `EVENT_NAME` and `EVENT_DROP_ID`. Optionally set `EVENT_STARTS_AT` and `EVENT_ENDS_AT` to open check-in only during the event.
3. **Gas:** fund the relayer. Each attendee costs about 6–8 transactions (sign up, connect, hatch, open, equip, check in), roughly 0.1 MON. Plan about 25 MON for 200 people.

**A new event needs no new contract.** Add its drop from the deployer with `addItems([{ id, slot, maxSupply, drop: true }])` for a wearable, or `addSpecies` for a monster. Add the art in `lib/avatar.ts` and the entry in `contracts/wearables.json`, then point `EVENT_DROP_ID` at it.

## Fully onchain

The contract is the whole backend: profiles, connections, Eggs, blind boxes, monsters, wearables, what each avatar wears, and pets. The server only relays transactions with a key that holds `MINTER_ROLE`, so attendees never need MON, and the browser reads everything straight from Monad. There is no database.

## Run it locally

```bash
npm install
cp .env.local.example .env.local   # fill it in
npm run dev
```

| Var | What |
| --- | --- |
| `NEXT_PUBLIC_REOWN_PROJECT_ID` | Free at dashboard.reown.com; allowlist localhost and your domain. Email and social login are turned on there |
| `NEXT_PUBLIC_SOCEMON_ADDRESS` | The deployed contract |
| `MINTER_PRIVATE_KEY` | Relayer key with `MINTER_ROLE`, funded with testnet MON |
| `SESSION_SECRET`, `CHECKIN_SECRET`, `WALL_KEY` | `openssl rand -hex 32` |
| `EVENT_NAME`, `EVENT_DROP_ID`, `EVENT_STARTS_AT`, `EVENT_ENDS_AT` | The event; no start time means always live |
| `EVENT_HOSTS` | Wallets that can open the check-in screen, comma-separated |
| `MONAD_RPC_URL`, `NEXT_PUBLIC_MONAD_RPC_URL` | Optional private RPCs |

In development, `/app?as=<address>` previews the app as any registered trainer (read-only).

## Tests

```bash
npm test                 # pure logic: catalog, scan codes, perks, receipts
npm run contracts:install && npm run test:contracts   # Foundry
npm run test:api         # API rejections against a dev server
npm run test:flow        # the whole loop onchain with throwaway wallets (spends testnet MON)
```

## Deploy the contract

```bash
cd contracts
SOCEMON_MINTER=<relayer address> SOCEMON_BASE_URI=https://<host>/api/socemon/ \
  forge script script/Deploy.s.sol --rpc-url https://testnet-rpc.monad.xyz \
  --account <keystore> --sender <deployer> --with-gas-price 102gwei --slow --broadcast
```

The script seeds every species from `socemon.json` and every wearable from `wearables.json`. Keep the optimizer on (`foundry.toml`), or the contract goes over the 24 KB size limit. `--slow` matters on Monad: without it, forge sets gas limits too high and the deploy fails for lack of balance. A full deploy costs about 0.9 MON.

## Hosting

On Vercel, import the repo, add the env vars, add the domain to the Reown allowlist, and point the metadata at it with `setBaseURI("https://<host>/api/socemon/")` from the deployer. On a VPS, run `npm run build && npm start` behind a reverse proxy that forwards the Host header; sign-in checks it.

## Structure

```
contracts/   Socemon.sol, Foundry tests, deploy script, socemon.json (species), wearables.json (wearables)
app/         Landing (/), the app (/app: Home, Game, Scan, Event, Me), /app/wardrobe, /app/game/{rush,flap},
             trainer profile (/u/[address]), /checkin, /wall, API routes
components/  Sign-in gate, bottom nav, monster art, reveals, the connected screen, Socédex, game perk list
lib/         ABI, relayer, sessions, check-in and meet codes, avatar renderer, game rules, browser hooks
e2e/         Pure, API and onchain flow tests
```

Known limits and their upgrade paths are in `docs/superpowers/specs/2026-10-20-socemon-blitz-design.md` §10. The contract is not upgradeable; adding new contract logic means a redeploy, so the planned next step is a UUPS proxy.
