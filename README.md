# Socemon

Social on Monad. Catch your network.

Socemon is a monster collection you play in real life. Meet someone at an event, connect, and you both get an Egg of the other person's type. Hatch it, fill your Socédex, and show up at events for drops you can only catch there. Built for Monad Blitz.

**Contract (Monad testnet, chain 10143):** [`0x567A2Fcb2EF5e54d197a70F9037e7433561ce7Bd`](https://testnet.monadscan.com/address/0x567A2Fcb2EF5e54d197a70F9037e7433561ce7Bd), verified source.

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
app/         Landing (/), the app (/app, /app/dex, /app/qr, /app/event, /app/me), trainer profile (/u/[address]),
             /checkin, /wall, API routes
components/  Sign-in gate, bottom nav, monster art, catch reveal
lib/         ABI, relayer, sessions, check-in tokens, browser hooks
e2e/         Pure, API and onchain flow tests
```

Known limits and their upgrade paths are in `docs/superpowers/specs/2026-10-20-socemon-blitz-design.md` §10.
