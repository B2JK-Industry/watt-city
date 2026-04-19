# Web3 Base-track session kickoff — 2026-04-19

**Target**: ETHSilesia 2026 — **Ethereum / Web3 Base track** submission.
**Base**: `watt-city-demo-polish@efcf185` (569 tests, prod build green, all 8 D-polish items shipped).
**Branch to cut**: `watt-city-web3-base` off `watt-city-demo-polish`.
**Ship target**: 7 items (W1 → W7). Strict sequence. One commit per W-item.

## Why this track

Phase 8 groundwork is already in the repo:
- `contracts/WattCityMedal.sol` — soulbound ERC-721, ~200 LOC, static-tested
- `contracts/test/WattCityMedal.test.ts` — source-invariant guards (soulbound, onlyOwner mint, no approvals)
- `docs/web3/PLAN.md` — chain-choice matrix (Base picked), mint-flow diagram, gas-sponsorship plan
- `docs/web3/DEPLOY.md` — Hardhat runbook, relayer rotation, GDPR Art. 17 burn path
- `docs/decisions/003-web3-scope.md` — soulbound-only, kid-safe narrative

Gap for submission: contract **not deployed**, no wallet UI, no mint route, no on-chain gallery. W1–W7 close that gap against **Base Sepolia testnet** (no mainnet — no audit ran yet, per `DEPLOY.md` §5).

## Scope — 7 items

### W1 — Web3 deps + env scaffolding
Add `wagmi`, `viem`, `@rainbow-me/rainbowkit`, `@tanstack/react-query`. Create `lib/web3/config.ts` with chain = Base Sepolia, RainbowKit projectId from `NEXT_PUBLIC_WC_PROJECT_ID`. Feature-gate everything behind `NEXT_PUBLIC_WEB3_ENABLED === "true"` so default builds stay web3-free (kids + schools default path untouched).

**Acceptance**: `pnpm build` green with flag off. With flag on, `lib/web3/config.ts` exports a typed wagmi config pointing at Base Sepolia (chainId 84532). Zero import of web3 libs when flag off (tree-shaken).

### W2 — Deploy `WattCityMedal` to Base Sepolia
Stand up a minimal Hardhat 2.x project (Node 22 LTS required per `DEPLOY.md` §0 — use `volta pin` or document node switch). Write a deployment script. Verify on BaseScan. Commit the deployed address + BaseScan link into `docs/web3/DEPLOYMENTS.md` (NEW).

Runbook already written — follow `docs/web3/DEPLOY.md` §1–§3 step-for-step. Deployer wallet funded from a Base Sepolia faucet (operator action — if operator can't fund, commit what's possible and mark this W-item **BLOCKED** with the faucet instruction noted).

**Acceptance**: `WEB3_CONTRACT_ADDRESS` lands in `.env.example` with a real verified deployment URL. `contracts/test/WattCityMedal.test.ts` still passes (source invariants unchanged). Deployed bytecode matches source on BaseScan.

**Fallback**: if funding faucet blocked at operator-level, deploy to a local Hardhat node + document the mock-deployment process so the rest of the flow (W4+) can be demoed against a live localhost contract during the pitch, with a note that mainnet migration is gated on the audit per `DEPLOY.md` §5.

### W3 — IPFS metadata for achievements
For each of the ~20 achievements in `lib/achievements.ts`, generate ERC-721 metadata JSON (`name`, `description`, `image`, `attributes[achievementId, rarity, category]`) and upload to NFT.Storage (env `NFT_STORAGE_API_KEY`). Store the returned IPFS URIs in `lib/web3/medal-uris.ts` as a typed map.

Icons: use the existing 48×48 achievement emoji badges from `components/achievement-icon.tsx` — render to PNG server-side via `@react-pdf/renderer`-adjacent approach OR just use emoji-as-text inside an SVG and rasterize once offline. Keep asset sizes small (<20 KB per image).

**Acceptance**: `lib/web3/medal-uris.ts` maps every `AchievementId` to a live `ipfs://…` URI. A curl against `https://ipfs.io/ipfs/<cid>` returns the JSON. Test file guards the mapping exhaustiveness (every achievement has a URI).

### W4 — Mint API + relayer wiring
New route `POST /api/web3/mint` (nodejs runtime, force-dynamic, session + CSRF gated):
1. Reads session → finds achievementId in body
2. Verifies user actually owns that achievement (Phase 2.8 sweep via `lib/achievements.ts`)
3. Verifies parent consent (W6 gate): `profile.onboarding.web3OptIn === true` required
4. Verifies wallet: body includes a signed message (SIWE-lite) proving the wallet holds the signing key
5. Computes tokenId deterministically: `BigInt(keccak256(username + achievementId))`
6. Calls `mint(wallet, tokenId, ipfsURI)` via relayer EOA (`WEB3_RELAYER_PRIVATE_KEY`)
7. Returns `{ ok, txHash, basescanUrl }`

**Acceptance**: end-to-end smoke against Sepolia — curl `/api/web3/mint` with a real wallet signature produces a transaction visible on BaseScan. Idempotency: same user+achievement replay returns `{ ok, alreadyMinted: true }` (read contract's `ownerOf(tokenId)` before mint).

**Cost guardrail**: relayer ETH balance check before mint. If < 0.001 ETH Sepolia, return 503 `{ error: "relayer-empty" }` instead of failing the tx.

### W5 — `/profile` "Moje medale" on-chain gallery
Extend `/profile` with a new section below ParentInviteCard:
- If `NEXT_PUBLIC_WEB3_ENABLED !== "true"`: render nothing.
- If user's `web3OptIn !== true`: render opt-in CTA (parent-gate message if under 16).
- Otherwise: RainbowKit `<ConnectButton>`. When connected, list user's owned medals (fetched via `readContract(ownedOf(address))`), each with icon, name, BaseScan link, IPFS metadata link.
- For every off-chain achievement the user owns but hasn't minted on-chain → "Zamintuj medal" button → POST `/api/web3/mint` → optimistic UI → refresh on confirmation.

**Acceptance**: logged-in demo-teacher-pl account with an earned achievement can connect a Coinbase Smart Wallet (passkey sign-in — no seedphrase), mint a medal, see it appear within 30 seconds on BaseScan and in the gallery.

### W6 — Parent consent + under-16 gate
Extend `profile.onboarding` with `web3OptIn: boolean`. UI path:
- New `/profile` section "Medale NFT (opcjonalne)" with consent checkbox.
- Under-16 (ageBucket `<2016` proxy): checkbox disabled with "wymaga zgody rodzica" note. Activates when a parent-linked account approves via their observer dashboard (new row on `/rodzic`).
- On revocation (checkbox flipped off OR parent revokes consent OR user invokes GDPR Art. 17): server calls `burn(tokenId)` for every medal minted during the consent window, per `DEPLOY.md` §7.

**Acceptance**: Under-16 test account (`ageBucket: 2015`) can NOT mint. Flip `web3OptIn` via parent approve → mint succeeds. Flip off → all previously-minted medals get `burn()` called and disappear from the gallery within one poll cycle.

### W7 — Submission package (fill + verify, NOT author)

**Docs already pre-staged** on the base branch — do NOT rewrite narrative:
- `docs/web3/SUBMISSION.md` — full content with `{{TOKEN}}` placeholders
- `docs/web3/DEPLOYMENTS.md` — pre-staged table (you filled the deploy row in W2)
- `README.md` — "Web3 surface" section with placeholders

W7 steps:
1. Run `pnpm tsx scripts/fill-web3-submission.ts --demo-url=<url> --video-url=<url> --contact=<email>` to substitute the operator-provided values
2. Run `bash scripts/check-placeholders.sh` — must exit 0 (or document the specific operator-pending tokens in the session summary)
3. Write `docs/progress/SESSION-SUMMARY-WEB3.md` matching the D1..D8 summary format: W-item completion matrix, deployed address, open blockers, recommended next steps
4. If the narrative is factually wrong after implementation (e.g. a route path diverged), fix it in a dedicated commit — don't bundle with the filler

Operator actions the filler depends on:
- `--demo-url` → Vercel preview or prod deployment URL
- `--video-url` → YouTube (unlisted OK) upload after screen-recording the demo
- `--contact` → operator email

**Acceptance**: `scripts/check-placeholders.sh` exits 0 (or the only remaining tokens are operator-pending video/contact, documented in SESSION-SUMMARY-WEB3.md). A fresh judge reads `docs/web3/SUBMISSION.md` + watches the video + clicks the BaseScan link and understands the whole pitch.

## Ship order & commit convention

Strict sequence: W1 → W7. Commit per item in conventional format: `feat(web3):W1 — wagmi + RainbowKit scaffolding`. After each commit run `pnpm vitest run` + `pnpm build`. If either fails, fix before proceeding.

## Hard constraints

1. **Never touch `main` or `watt-city`.** All work on `watt-city-web3-base`.
2. **Never force-push.** If history needs cleanup, branch off + redo.
3. **Testnet only.** Do NOT deploy to Base mainnet. The audit gate (`DEPLOY.md` §5) is not closed. If the operator asks for mainnet, refuse and point at the audit requirement.
4. **Never commit private keys.** `.env.local` is gitignored; deploy scripts read from env. Include `.env.example` with the var names and `0x000…` placeholders.
5. **Web3 is fully opt-in.** `NEXT_PUBLIC_WEB3_ENABLED` defaults to unset → no web3 UI, no web3 imports. Schools + demo flow stay pure-Web2.
6. **Under-16 parent consent.** No `mint()` call for a user whose `ageBucket` implies <16 without `web3OptIn === true` set by their linked parent (V4.6 observer flow).
7. **Relayer balance check before every mint.** If empty, 503 with a clear error — never silently fail on-chain.
8. **Existing 569 tests must stay green.** Every W-item adds tests (file-level guards minimum; EVM tests for W2 if operator has hardhat running).
9. **No dep >30 KB gzipped added to the web3-off path.** Web3 libs are fine on the opt-in path (RainbowKit is ~200 KB gzipped — acceptable for a feature gated off for 99% of users).
10. **Demo polish (D1–D8) must not regress.** Explicit smoke at start of session: run `/dla-szkol/demo` handshake flow, verify PDF export with Polish diacritics, verify `SKIN=pko` still propagates. If ANY regresses, pause and fix before W1.
11. **Respect `prefers-reduced-motion` in any new UI.** Matches D6 pattern.
12. **No Slovak or English leakage.** Polish canonical (match D1 cleanup).
13. **Every wallet-mutating action requires CSRF + session.** Match the existing middleware.

## Operating principles

- **Read `docs/web3/PLAN.md` + `DEPLOY.md` before touching code.** They're the specs. Follow §-by-§; deviations need written justification.
- **One W-item at a time.** No "while I'm in here, let me also fix…" — D-polish already taught us branching discipline.
- **If blocked on operator action (funding, signing, etc.)**: commit what you have, document the blocker in the commit body, move to the next non-blocked item. Don't fake deployment addresses.
- **Test before commit.** Tests failing at `HEAD~1` that you couldn't fix in-session get a `docs/progress/FOLLOW-UP-NEEDED.md` entry.
- **When unsure about gas/relayer costs**: err on the side of the more expensive option (larger buffer). Base Sepolia is free; mainnet would need a real budget conversation.
- **Parent-consent path is the headline story for the pitch.** Every UI + error message should reinforce "safe by design for kids". Don't dilute it.

## Quality bar

- **A non-web3-native ETHSilesia judge** should open the PR, read `SUBMISSION.md`, watch the 2-min video, click the BaseScan link, and understand the whole pitch in under 5 minutes.
- **A web3-native judge** should look at `WattCityMedal.sol` + the mint flow + the burn-on-revocation path and nod at the safety posture — not find an obvious footgun.
- **A PKO product manager** (they're also in the room) should see the Web3 feature as *additive* to the Watt City story, not a pivot. Demo the off-chain experience first, then "…and if parents opt in, the kid gets a verifiable on-chain receipt."

## Smoke — at start of session

Before W1:
1. `git checkout watt-city-demo-polish && git log --oneline -3` confirms head is `efcf185` or later.
2. `pnpm vitest run` → 569 passing.
3. `pnpm exec tsc --noEmit` → clean.
4. `pnpm build` → green.
5. `pnpm dev` → `/dla-szkol/demo` + POST `/api/dla-szkol/demo/start` round-trip works; `/api/klasa/<id>/report` returns a valid PDF with Polish diacritics.
6. `SKIN=pko pnpm dev` → `<html data-skin="pko" style="--accent:#d31f26...">` present on `/`.

If any step fails, STOP and report. Don't start W1.

## Failure modes — how to handle

| Failure | Recovery |
|---|---|
| Hardhat won't install on Node 25+ | Use Foundry instead (`foundryup`). Document the pivot in `DEPLOY.md`. |
| Base Sepolia faucet gives < 0.01 ETH | Mark W2 as operator-action needed. Proceed W3+ against a local Hardhat node. Commit the address of the local deployment and flag W2 incomplete. |
| NFT.Storage API rejects bulk uploads | Fall back to self-hosted IPFS (`ipfs-http-client` against a public gateway) OR inline metadata as data URIs (gas cost rises slightly, no impact for testnet). |
| RainbowKit pulls in a dep >200 KB gz that breaks the chunking | Swap to `viem` + custom connect UI. The web3 flag is off by default so the cost is fully contained to opt-in users. |
| Vercel env var propagation stalls | Document in `.env.example` + `DEPLOY.md`; the reviewer can flip `NEXT_PUBLIC_WEB3_ENABLED` in their own preview. |
| Contract deployment reverts | Re-run the source-invariant tests. If invariants hold, the issue is probably constructor args — check `scripts/deploy.ts` against `WattCityMedal.sol` constructor signature. |

## Out of scope (explicitly DEFERRED)

- Mainnet deployment (audit gate)
- Paymaster / gasless mint (Phase 8.1.6 per plan)
- NFT cosmetic skins (explicitly rejected in `decisions/003-web3-scope.md`)
- DAO governance on themes (same)
- Cross-chain bridges (same)
- Multi-wallet support beyond RainbowKit defaults
- Secondary marketplace integration (soulbound — irrelevant)

## Deliverables summary (what ships in the PR)

```
contracts/
  WattCityMedal.sol              (untouched, already present)
  test/WattCityMedal.test.ts     (untouched)
docs/
  web3/DEPLOYMENTS.md            PRE-STAGED — fill deploy row in W2, filler fills chain/id in W7
  web3/SUBMISSION.md             PRE-STAGED — narrative authored, fill {{TOKEN}}s in W7
  progress/SESSION-SUMMARY-WEB3.md  NEW — W1..W7 recap (write at end of W7)
lib/web3/
  config.ts                      NEW — wagmi/viem config, chain guard
  medal-uris.ts                  NEW — AchievementId → ipfs:// URI
  mint.ts                        NEW — relayer + tokenId derivation
  burn-all.ts                    NEW — consent-revocation iterator
app/api/web3/
  mint/route.ts                  NEW — POST, CSRF + session + consent
  my-medals/route.ts             NEW — GET, reads ownedOf()
app/profile/
  (extended)                     web3 section, gallery, mint buttons
components/web3/
  medal-gallery.tsx              NEW — client, RainbowKit integration
  mint-button.tsx                NEW — client, optimistic UI
scripts/
  hardhat.config.ts              NEW
  deploy.ts                      NEW — Base Sepolia deploy script
  upload-medal-metadata.ts       NEW — NFT.Storage bulk upload
  fill-web3-submission.ts        PRE-STAGED — post-deploy placeholder filler
  check-placeholders.sh          PRE-STAGED — pre-submission guard
README.md                        PRE-STAGED — web3 section with placeholders
.env.example                     EXTENDED — web3 env vars
README.md                        EXTENDED — web3 section
package.json                     EXTENDED — wagmi/viem/rainbowkit/hardhat
```

## Timeline estimate

Rough allocation (adjust to reality):
- W1: 30 min (scaffolding only)
- W2: 60–90 min (contract deploy + BaseScan verify) — **may block on faucet**
- W3: 45 min (bulk IPFS upload)
- W4: 90 min (mint route + SIWE + idempotency)
- W5: 120 min (gallery UI, RainbowKit integration, optimistic mint)
- W6: 60 min (consent gate + burn-on-revocation)
- W7: 60 min (docs + video script + README)

**Total**: ~8 hours realistic, half a day pessimistic with faucet delays.

## Success criteria

At submission time:
- ✅ `WattCityMedal` deployed + verified on Base Sepolia
- ✅ Demo flow: visit `/profile` → connect wallet → mint medal → see on BaseScan
- ✅ Parent-gate visible to judges as a *feature*, not friction
- ✅ GitHub repo public + links from submission portal
- ✅ `SUBMISSION.md` is the first thing a judge reads
- ✅ Demo polish regression-free — PKO pitch still ships

Let the web3 submission be additive to the PKO Gaming pitch, never a distraction from it.
