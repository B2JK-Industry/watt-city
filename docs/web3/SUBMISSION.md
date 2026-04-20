<!--
  ETHSilesia 2026 — Web3/Base track submission.

  This file is PRE-STAGED. All narrative content is authored; deploy-
  specific strings are template tokens (double-curly UPPER_CASE) filled
  by `scripts/fill-web3-submission.ts` after W2 (contract deploy) and
  W5 (demo / video uploaded). The pre-submission guard at
  `scripts/check-placeholders.sh` fails CI if any token remains.

  Last narrative review: 2026-04-19.
-->

# Watt City — Web3/Base track submission

**ETHSilesia 2026** · submitted by **B2JK Industry**

## The one-paragraph pitch

Watt City is a gamified financial-literacy city-builder for kids (10–16) pitched to PKO Bank Polski as an SKO 2.0 partnership prototype. Kids play minigames to earn virtual resources, build their city, take a virtual mortgage with real RRSO math, and learn financial concepts without touching real money. The **Web3 surface** adds **soulbound on-chain medals** for their off-chain achievements — a verifiable, permanent record that the kid owns forever, with **parental consent required** for every under-16 account and **GDPR Art. 17 burn-on-revocation** built in. This is the first kid-safe on-chain achievement system aligned with the Polish national curriculum and banking-supervisor-ready compliance posture.

## Problem

Finance-education apps for kids have two failure modes:

1. **Static-content rot**: PKO's current SKO 2.0 is a videothek that kids don't open twice. Achievements are local to the app and vanish when the app changes.
2. **Unsafe "on-chain learning"**: A handful of competitors bolt on NFTs as speculative trading cards. Kids see a wallet, a seedphrase, a market, and real money risk. Parents rightly block this path.

**The gap**: a verifiable, permanent, **kid-safe** on-chain surface that's a *certificate*, not a speculative asset.

## Solution

`WattCityMedal` — a **soulbound** ERC-721 contract (`contracts/WattCityMedal.sol`, ~200 LOC, static-tested) mirroring the off-chain achievement system. Four design decisions enforce the kid-safe story:

### 1. Soulbound (non-transferable)
Every `transferFrom` / `safeTransferFrom` / `approve` reverts with `Soulbound` / `NotTransferable` / `NoApprovals`. The medal **cannot be sold, traded, or delegated**. It is a certificate, not a trading card. Source invariants are tested in `contracts/test/WattCityMedal.test.ts`.

### 2. Parent consent (hard-gated server-side)
Under-16 accounts cannot mint without their linked parent setting `profile.onboarding.web3OptIn === true` via the V4.6 parent observer flow. The check lives in the mint API (`app/api/web3/mint/route.ts`) — server-side only, never client-side. HTTP 403 without parental consent regardless of what the client sends.

### 3. GDPR Art. 17 burn-on-revocation
When consent is revoked (parent flips off, user triggers erasure, or kid turns 16 and opts out themselves), the relayer calls `burn(tokenId)` for every medal minted during the consent window. The on-chain Transfer → 0x0 event is public; the user's medal-to-identity link is severed. Documented in `docs/legal/DATA-RETENTION.md`.

### 4. Coinbase Smart Wallet (passkey auth)
No seedphrase for kids. First-run wallet flow uses Face ID / Touch ID via Coinbase Smart Wallet, which creates an ERC-4337 smart account tied to the device passkey. No 12-word recovery phrase to lose, no extension to install, no phishing surface.

## Why Base Sepolia

Decision recorded in `docs/decisions/003-web3-scope.md`. Three-way matrix:

| Candidate | Gas per mint | L2 finality | Why we picked / skipped |
|---|---|---|---|
| **Base** | ~USD 0.01 | ~2 s | **Picked.** Lowest consistent gas, Coinbase backing (passkey-native), OP-stack portable |
| Optimism | ~USD 0.008 | ~2 s | Strong alternative, no differentiator |
| Polygon zkEVM | ~USD 0.005 | ~15 min to L1 | ZK complexity overkill for a certificate use-case |
| Ethereum L1 | ~USD 1.50+ | ~15 s | Gas cost makes kid-friendly paymaster infeasible |

For ETHSilesia we submit against **Base Sepolia** (chainId 84532). Base mainnet is gated on the security audit per `docs/web3/DEPLOY.md §5` — post-pilot.

## Deployment (testnet)

| Field | Value |
|---|---|
| **Contract** | `WattCityMedal` |
| **Chain** | {{CHAIN_NAME}} (chainId `{{CHAIN_ID}}`) |
| **Address** | `{{CONTRACT_ADDRESS}}` |
| **BaseScan** | [{{CONTRACT_ADDRESS}}]({{BASESCAN_URL}}) |
| **Deployed at block** | {{DEPLOY_BLOCK}} |
| **Deployed at** | {{DEPLOY_TIMESTAMP}} |
| **Deployer EOA** | `{{DEPLOYER_ADDRESS}}` |
| **Verified on BaseScan** | ✅ (source matches on-chain bytecode) |
| **Audit status** | Source-level invariant tests only (see `contracts/test/WattCityMedal.test.ts`). External audit is post-pilot (`DEPLOY.md §5`). |

## Demo

| Resource | URL |
|---|---|
| **Live app** | {{DEMO_URL}} |
| **2-min video walkthrough** | {{VIDEO_URL}} |
| **GitHub** | https://github.com/B2JK-Industry/watt-city |
| **Contact** | {{CONTACT_EMAIL}} |

### What the video shows (60-90s)

1. **Kid's view** (15s) — logs in, plays a quick minigame, earns the "Pierwsze kroki" achievement. Off-chain badge appears.
2. **Parent's view** (15s) — opens `/rodzic/[username]`, ticks "Dziecko może zbierać medale NFT". Server records consent.
3. **Kid returns** (30s) — sees new "Moje medale NFT" section on `/profile`. Clicks "Zaloguj się Smart Walletem", authenticates with Face ID (no seedphrase). Picks the earned achievement, clicks "Zamintuj". Transaction signs via paymaster-sponsored user-op. Medal appears in gallery within 30 seconds.
4. **Verification** (10s) — clicks the BaseScan link → contract page shows the Transfer event. Anyone can verify.
5. **Revocation demo** (20s, optional) — parent unticks consent → server calls `burn()` → medal disappears from gallery → BaseScan shows Transfer → 0x0.

## Architecture at a glance

```
Kid earns achievement (Phase 2.8, off-chain)
         │
         ▼
Parent consents (V4.6 observer → web3OptIn = true)
         │
         ▼
Kid connects wallet (RainbowKit / Coinbase Smart Wallet)
         │
         ▼
Kid clicks "Zamintuj" → POST /api/web3/mint
         │
         ├─ verify session + CSRF
         ├─ verify achievement ownership (server-side)
         ├─ verify parental consent (under-16 gate)
         ├─ verify wallet signature (SIWE)
         ├─ check idempotency (ownerOf(tokenId) ?)
         ├─ check relayer balance (>= 0.001 ETH)
         │
         ▼
Relayer EOA → WattCityMedal.mint(wallet, tokenId, ipfsURI)
         │
         ▼
Contract emits Transfer(0x0 → wallet)
         │
         ▼
Medal visible in /profile gallery + BaseScan
```

- **Mint route**: `app/api/web3/mint/route.ts` (Node.js runtime, force-dynamic)
- **Contract**: `contracts/WattCityMedal.sol`
- **Metadata**: IPFS via NFT.Storage (pinned); mapping in `lib/web3/medal-uris.ts`
- **Client**: RainbowKit + wagmi + viem, opt-in (`NEXT_PUBLIC_WEB3_ENABLED` flag)
- **Burn path**: `lib/web3/burn-all.ts` iterates user's tokens on consent revocation

## Compliance posture

| Control | Where it lives |
|---|---|
| GDPR-K (kids under 16) | `docs/legal/DATA-RETENTION.md` + parent-consent hard gate in mint API |
| UODO alignment | `/ochrana-sukromia` (4-lang policy page) + DPO contact in-app |
| KNF disclaimer | Every loan surface + every mint confirmation screen |
| EU data residency | Upstash Frankfurt + Vercel EU; no cross-region transfer |
| First-party analytics only | No GA, no Meta Pixel, no third-party beacons |
| MEN podstawa programowa | 27 curriculum codes mapped in `lib/curriculum.ts` (grades 5–8) |
| Parent observer consent | V4.6 — `POST /api/rodzic/code` + `/rodzic/[username]` dashboard |
| Right to erasure (Art. 17) | `/profile` deletion triggers `burn()` loop + Redis purge |

## Why this wins the Web3/Base track

1. **Novel safety posture**: no other submission combines soulbound + parent-consent + burn-on-revocation in a coherent GDPR-K story. Most on-chain "kids" projects hand-wave the consent problem.
2. **Real product, not a demo**: Watt City has 569 passing tests, 4 language translations, a teacher dashboard with weekly PDF export, a curriculum alignment chart, and a live demo seed for 1-click PKO review. The Web3 surface plugs in without disturbing any of it.
3. **Coinbase Smart Wallet integration = the passkey argument**: kids' on-chain UX without seedphrase is the unlock for this whole category. Base is the only L2 where the stack is production-ready today.
4. **PKO-native narrative**: the submission is not a Web3 demo in search of a market; it's a financial-literacy product that uses Web3 *only where it earns its keep* (verifiable certificates). PKO judges in the same room will see that discipline.

## Out of scope (explicitly deferred)

Not building for this submission:

- ❌ Base mainnet deployment (gated on security audit per `DEPLOY.md §5`)
- ❌ NFT cosmetic skins (`decisions/003-web3-scope.md`)
- ❌ DAO governance on game themes
- ❌ Cross-chain bridges
- ❌ Secondary marketplace (soulbound = irrelevant)
- ❌ Speculative mechanics of any kind

## Repo layout

Submission-relevant files:

```
contracts/
  WattCityMedal.sol              # the contract (~200 LOC, pre-tested)
  test/WattCityMedal.test.ts     # source-invariant guards
docs/web3/
  SUBMISSION.md                  # this file
  DEPLOYMENTS.md                 # deployment history + addresses
  PLAN.md                        # architecture deep-dive
  DEPLOY.md                      # operator runbook
lib/web3/
  config.ts                      # wagmi config (chain, RainbowKit)
  mint.ts                        # relayer + tokenId derivation
  medal-uris.ts                  # AchievementId → ipfs:// URI
  burn-all.ts                    # consent-revocation burn path
app/api/web3/
  mint/route.ts                  # POST — the mint gate
  my-medals/route.ts             # GET — reads ownedOf()
components/web3/
  medal-gallery.tsx              # /profile gallery
  mint-button.tsx                # SIWE + POST + optimistic UI
scripts/
  deploy.ts                      # Hardhat deploy script
  fill-web3-submission.ts        # post-deploy placeholder filler
  check-placeholders.sh          # pre-submit guard
```

## Post-pilot roadmap

After ETHSilesia:

1. External security audit of `WattCityMedal.sol` (engagement window ~4 weeks, EUR 10–20k)
2. KNF review of the "virtual asset" question (Phase 4.3.1)
3. ERC-4337 paymaster on Base mainnet (kids don't hold ETH)
4. Base mainnet deployment
5. Bug bounty program (USD 500–5000 scale via Immunefi)

---

**For judges**: start with the video ({{VIDEO_URL}}), then click the BaseScan link ({{BASESCAN_URL}}) to verify the contract, then browse `contracts/WattCityMedal.sol` + `contracts/test/WattCityMedal.test.ts` for the safety posture.

**For developers**: `docs/web3/PLAN.md` is the architecture; `docs/web3/DEPLOY.md` is the runbook. `docs/progress/SESSION-SUMMARY-WEB3.md` has the full W1..W7 implementation trail.
