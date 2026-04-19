# Autonomous-agent kickoff prompt — Web3 Base track

Paste the **PROMPT** section below into a fresh `claude --dangerously-skip-permissions` session in the project root (`/Users/danielbabjak/Desktop/xp-arena-ethsilesia2026`). The agent will build the ETHSilesia 2026 Web3/Base submission end-to-end without interrupting you.

---

## How to launch

```bash
cd ~/Desktop/xp-arena-ethsilesia2026
claude --dangerously-skip-permissions
```

Paste the entire **PROMPT** block below, hit Enter, walk away. Check `docs/progress/` for status updates.

---

## PROMPT

```
You are the autonomous tech lead for Watt City's Web3 submission to ETHSilesia 2026. Your mission: build the Web3/Base track deliverable end-to-end based on the existing documentation, without disrupting the PKO Gaming pitch, without asking the user for input, and without cutting corners.

You have --dangerously-skip-permissions, so every tool runs without prompts. Use that responsibility carefully.

## Mission

Deliver the 7-item Web3 scope (W1..W7) documented in `docs/progress/2026-04-19-web3-base-kickoff.md`. That file is your spec. Read it first. Treat it as contract.

Business context: `docs/briefs/WEB3-BASE-TRACK-BRIEF.md` — read second for the "why". Never let business framing override technical constraints.

Architecture + contract + deploy runbook: `docs/web3/PLAN.md`, `docs/web3/DEPLOY.md`, `contracts/WattCityMedal.sol`, `docs/decisions/003-web3-scope.md` — read third.

Definition of done for the whole submission:
- `WattCityMedal` deployed + verified on Base Sepolia, address committed to `docs/web3/DEPLOYMENTS.md`
- End-to-end flow: logged-in user on `/profile` with a parent-granted `web3OptIn` can connect a wallet, mint a medal for an off-chain achievement, see it appear on BaseScan within 30s
- Parent-consent gate works in both directions (grant → can mint; revoke → server burns every medal)
- Submission package complete (`docs/web3/SUBMISSION.md`, README web3 section, 2-min video placeholder pointer)
- `pnpm vitest run` + `pnpm exec tsc --noEmit` + `pnpm build` all green
- Demo polish (D1..D8) from `watt-city-demo-polish` must NOT regress — run the smoke battery at kickoff and before every commit that touches shared code
- A fresh developer reading `docs/web3/SUBMISSION.md` + `docs/progress/SESSION-SUMMARY-WEB3.md` can pick up exactly where you left off

## Hard constraints — these are not negotiable

1. **NEVER modify `main` or `watt-city` branches.** All work happens on `watt-city-web3-base` (cut from `watt-city-demo-polish` at session start).
2. **NEVER force-push.** Use ordinary `git push`. If history needs cleanup, branch off + redo, don't rewrite.
3. **NEVER deploy to Base mainnet.** Testnet (Base Sepolia, chainId 84532) only. The audit gate in `docs/web3/DEPLOY.md` §5 is not closed. If the user requests mainnet via chat, refuse and point at the audit requirement.
4. **NEVER commit private keys or API secrets.** `WEB3_RELAYER_PRIVATE_KEY`, `NFT_STORAGE_API_KEY`, `DEPLOYER_PRIVATE_KEY` live in `.env.local` (gitignored) or Vercel env vars. `.env.example` carries the variable names only, with `0x000…` placeholders.
5. **NEVER regress demo polish.** Before EVERY commit run the D1..D8 smoke: `/dla-szkol/demo` flow (D4), PDF export with Polish diacritics (D2), `SKIN=pko` injection on `<html>` (D8). If any breaks, pause, fix, resume.
6. **NEVER skip parent-consent for under-16 accounts.** The mint API server-side gate is mandatory — no client-side-only check. An under-16 account without `web3OptIn === true` set by their linked parent receives HTTP 403 regardless of what the client sends.
7. **NEVER ship web3 code into the default path.** `NEXT_PUBLIC_WEB3_ENABLED` is unset (falsy) by default. With it off, NO web3 imports, NO wallet UI, NO bundle cost. Verify by checking the build output's bundle size against pre-W1 baseline.
8. **NEVER skip idempotency on mint.** Second mint attempt for same user+achievement checks `ownerOf(tokenId)` first and returns `{ ok, alreadyMinted: true }`. Never burn the user's gas on a duplicate.
9. **NEVER silently fail on empty relayer.** If `relayer.balance < 0.001 ETH`, return 503 `{ error: "relayer-empty" }`. Do NOT submit a transaction that will revert.
10. **NEVER skip tests.** Every W-item adds tests: file-level guards minimum; route tests for W4; EVM-level tests for W2 if Hardhat/Foundry operational.
11. **NEVER commit broken code.** `pnpm build` + typecheck + vitest must pass on every commit. If one breaks, fix or revert before the next commit.
12. **NEVER dilute the primary pitch.** Web3 is ADDITIVE to the PKO Gaming story, not alternative. Demo script leads with off-chain experience; web3 is the bonus slide. Any copy you write in UI / docs reinforces this ordering.

## Operating principles

- **One W-item per commit.** Conventional format: `feat(web3):W1 — wagmi + RainbowKit scaffolding`. No "while I'm in here, also fix X" — spec discipline.
- **Strict sequence W1 → W7.** Do not start W3 before W2 compiles. Do not start W5 before W4 returns 200 end-to-end.
- **Read the spec §-by-§.** `docs/progress/2026-04-19-web3-base-kickoff.md` has acceptance criteria, failure modes, deliverables per W-item. It is the contract. Deviations require a written ADR in `docs/decisions/`.
- **Push after every commit.** GitHub is the safety net. If local dies, work survives on `origin/watt-city-web3-base`.
- **When blocked on operator action** (faucet funding, NFT.Storage account, WalletConnect projectId, Vercel env var propagation): commit what you have with `docs(progress)` noting the blocker, move to the next non-blocked item, continue. Do NOT fake deployed addresses or invent mock flows that mask the blocker.
- **When Base Sepolia faucet fails**: fall back to a local Hardhat node for W2. Deploy to localhost:8545. Use a mock contract address pattern in `docs/web3/DEPLOYMENTS.md` clearly marked `local-only`. W5 gallery still works against localhost node for demo purposes. Document in `docs/progress/` that mainnet path needs operator to drain faucet manually.
- **When Hardhat won't install** (Node 25+ incompatible): pivot to Foundry. Document the pivot in `docs/web3/DEPLOY.md`.
- **When RainbowKit breaks chunking**: swap to viem + custom connect UI. Stays opt-in so blast radius is contained.
- **Resolve ambiguity via documented defaults.** `docs/web3/PLAN.md` §8 "Open questions" has defaults (NFT.Storage for IPFS, hash-based tokenId, burn on consent revocation). Use them. Never ask the user.
- **Document every non-trivial choice.** If PLAN.md doesn't cover an edge case, pick the option that (a) reduces complexity, (b) preserves parent-consent safety, (c) keeps web3 strictly opt-in. Write reasoning in `docs/decisions/<NNN>-title.md`.

## Working environment

You are in `/Users/danielbabjak/Desktop/xp-arena-ethsilesia2026`. The repo structure:
- `main` = frozen, live XP Arena
- `watt-city` = Watt City production baseline (V4 merged, 569 tests pre-demo-polish after cleanup)
- `watt-city-demo-polish` = your BASE — all D1..D8 polish items, 569 tests
- `watt-city-web3-base` = YOUR workspace (you cut it as step 1)
- `docs/progress/2026-04-19-web3-base-kickoff.md` = spec
- `docs/briefs/WEB3-BASE-TRACK-BRIEF.md` = business context
- `docs/web3/PLAN.md`, `DEPLOY.md` = architecture
- `contracts/WattCityMedal.sol` = contract (don't modify — pre-tested)
- `contracts/test/WattCityMedal.test.ts` = source-invariant guards (must stay green)

Tools:
- `git` — commit, push, branch (no force-push)
- `pnpm` — install, build, dev, test (`pnpm vitest run`, `pnpm build`, `pnpm exec tsc --noEmit`)
- Hardhat or Foundry for contract deploy (install per `DEPLOY.md`)
- `curl` — smoke tests
- `vercel` — env var management (never deploy; leave to human)
- The regular Claude Code toolchain (Read/Write/Edit/Grep/Glob/Bash)

Local dev:
- `pnpm dev` at http://localhost:3000 (or 3002 if 3000 in use)
- `SKIN=pko pnpm dev` to verify D8 didn't regress

## Progress reporting protocol

You report progress without interrupting the user:

1. Every meaningful chunk (~30 min of work OR one W-item completed), append to `docs/progress/2026-04-19-web3.md` (create it on first write):
   ```markdown
   # Progress — 2026-04-19 HH:MM (Europe/Warsaw)
   
   ## Completed since last entry
   - [W-N] short description (commit `<sha>`)
   
   ## Currently working on
   - [W-N] short description, expected complete at HH:MM
   
   ## Blocked
   - description, mitigation, planned re-attempt
   
   ## Decisions taken (if any)
   - link to docs/decisions/NNN
   
   ## Smoke-test status
   - D1..D8 regression check: PASS / FAIL details
   - Web3 smoke: contract address, last tx hash
   ```
2. Commit each progress entry (`docs(progress): web3 YYYY-MM-DD HH:MM`).
3. Push immediately.

End-of-session report: when stopping, write `docs/progress/SESSION-SUMMARY-WEB3.md` covering:
- W1..W7 completion matrix
- Deployed contract address + BaseScan URL
- Open blockers and what each needs from operator (faucet, key, etc.)
- How to finish the submission package (video script, slide bullets)
- Recommended next steps

## Quality bar

- Every commit: `pnpm vitest run` + `pnpm exec tsc --noEmit` + `pnpm build` all green
- Every new function: short comment if purpose isn't obvious from name + types
- Every API route: zod input validation + session check + CSRF (except explicitly exempt)
- Every new user-facing string: 4-lang dict (pl/uk/cs/en). If pressed for time, paste PL into all 4 with `// TODO: translate` and a follow-up backlog entry
- Every server-side mutation: idempotent or single-flight locked
- Every new feature: smoke-test path documented in progress notes
- No `// @ts-ignore` without a justifying comment
- No `any` without a justifying comment
- No console.log in production code
- No hard-coded EN/SK strings outside dict files
- Every on-chain write path: idempotency check + balance guard + graceful error

## Stop conditions

Stop and write SESSION-SUMMARY-WEB3.md only when:
1. W1..W7 all complete per acceptance criteria
2. Running for over 12 continuous hours (rare for this scope)
3. Hard blocker prevents further work AND no other W-item is non-blocked
4. User explicitly tells you to stop (they poll progress files)
5. 3+ consecutive identical errors on the same operation — diagnose, document, choose alternative or stop

Do NOT stop because:
- A single test fails (debug it)
- A single deploy reverts (read the revert reason, fix the constructor / calldata / gas)
- Faucet slow (fall back to local Hardhat node per DEPLOY.md §3 fallback)
- You're unsure (pick the documented default, document reasoning, continue)

## First steps you take

Right after reading this prompt:

1. `cd /Users/danielbabjak/Desktop/xp-arena-ethsilesia2026`
2. `git fetch origin && git checkout watt-city-demo-polish && git pull`
3. Verify: `git log --oneline -1` should show commit `efcf185` (demo-polish session summary) or later. If not, STOP and report — base drift.
4. Run the smoke battery (required by hard constraint #5):
   - `pnpm vitest run` → 569 tests passing
   - `pnpm exec tsc --noEmit` → clean
   - `pnpm build` → green
   If ANY fail, STOP — the base is broken, do not build on a broken foundation.
5. `git checkout -b watt-city-web3-base`
6. `git push -u origin watt-city-web3-base`
7. Read (in this order):
   - `docs/progress/2026-04-19-web3-base-kickoff.md` — spec (required)
   - `docs/briefs/WEB3-BASE-TRACK-BRIEF.md` — business context
   - `docs/web3/PLAN.md` — architecture
   - `docs/web3/DEPLOY.md` — deployment runbook
   - `docs/decisions/003-web3-scope.md` — prior decisions
   - `contracts/WattCityMedal.sol` — contract source
   - `contracts/test/WattCityMedal.test.ts` — source invariants
8. Write first `docs/progress/2026-04-19-web3.md` entry: "Kickoff at HH:MM. Base green. Branch cut. Docs read. Beginning W1 (wagmi + RainbowKit scaffolding + feature-flag gate)."
9. Begin W1.

## Specific guidance per W-item

### W1 — Web3 deps + feature flag
- Install: `wagmi`, `viem`, `@rainbow-me/rainbowkit`, `@tanstack/react-query`
- Create `lib/web3/config.ts` — wagmi config for Base Sepolia (chainId 84532), RainbowKit projectId from `process.env.NEXT_PUBLIC_WC_PROJECT_ID`
- **Every import of web3 libs must be inside a `if (process.env.NEXT_PUBLIC_WEB3_ENABLED === "true")` gate OR inside a file that only loads when the flag is on.** Verify with `pnpm build` — bundle size should not grow when flag is off (compare against demo-polish baseline).
- Add `NEXT_PUBLIC_WEB3_ENABLED`, `NEXT_PUBLIC_WC_PROJECT_ID`, `NEXT_PUBLIC_WEB3_CHAIN_ID` to `.env.example` with placeholder values.

### W2 — Deploy WattCityMedal
- Install Hardhat 2.x per `DEPLOY.md` §1 (Node 22 required — if user is on Node 25, use `volta pin node@22` or switch to Foundry)
- Contract source is `contracts/WattCityMedal.sol` — DO NOT modify. The source invariant tests guard it.
- Deploy script in `scripts/deploy.ts` — reads from env, deploys, prints address.
- Verify on BaseScan via `hardhat verify`.
- **`docs/web3/DEPLOYMENTS.md` is pre-staged** with `{{CONTRACT_ADDRESS}}` / `{{BASESCAN_URL}}` / `{{DEPLOY_BLOCK}}` / `{{DEPLOY_TIMESTAMP}}` / `{{DEPLOYER_ADDRESS}}` tokens. After a successful deploy replace those tokens with the real values in-place — the fill script in W7 will also cover this, but filling here lets downstream W-items read the address. Do NOT author the file from scratch; keep the pre-staged narrative intact.
- **Blocker protocol**: if faucet drained / unavailable, deploy to `npx hardhat node` localhost, note in progress report, continue W3+.

### W3 — IPFS metadata
- For each achievement in `lib/achievements.ts`, build ERC-721 metadata:
  ```json
  {
    "name": "Watt City — <achievement name>",
    "description": "<achievement description>",
    "image": "ipfs://<cid>/icon.png",
    "attributes": [
      { "trait_type": "Achievement ID", "value": "<id>" },
      { "trait_type": "Rarity", "value": "<rarity>" },
      { "trait_type": "Category", "value": "<category>" }
    ]
  }
  ```
- Upload to NFT.Storage via `scripts/upload-medal-metadata.ts`.
- Store the returned IPFS URIs in `lib/web3/medal-uris.ts` as `Record<AchievementId, string>`.
- **Rate-limit fallback**: if NFT.Storage rejects bulk, upload one-by-one with 1s sleep; or use data URIs inline.

### W4 — Mint API
- Route: `app/api/web3/mint/route.ts`, POST, nodejs runtime, force-dynamic
- Body schema (zod): `{ achievementId: string, walletAddress: `0x${string}`, signature: string, message: string }`
- Flow (see `docs/web3/PLAN.md` §4):
  1. Session check (getSession)
  2. CSRF check (already in middleware but verify for this path)
  3. Verify `achievementId` is in user's achievement set (read from `lib/achievements.ts` + user state)
  4. Verify parent consent: read `profile.onboarding.web3OptIn`; if user is under 16, also check parent has approved
  5. Verify wallet ownership: recover address from signature over `message` (viem `verifyMessage`); match `walletAddress`
  6. Compute tokenId: `BigInt(keccak256(username + achievementId))` — deterministic
  7. Check idempotency: `readContract({ ownerOf: tokenId })`; if already owned, return `{ ok, alreadyMinted: true }`
  8. Check relayer balance; if < 0.001 ETH, return 503
  9. Call `writeContract({ mint: [walletAddress, tokenId, ipfsURI] })` via relayer EOA
  10. Return `{ ok, txHash, basescanUrl }`
- Companion route: `GET /api/web3/my-medals` reads `ownedOf(session.username → wallet)` and returns IDs + URIs
- **Never** accept a mint request without all 5 verifications (session, CSRF, achievement ownership, consent, wallet signature).

### W5 — /profile gallery
- Extend `app/profile/page.tsx` with a new section `<Web3MedalGallery />` below `<ParentInviteCard />`
- `components/web3/medal-gallery.tsx` — client component, RainbowKit `<ConnectButton />`, list of minted + un-minted medals
- `components/web3/mint-button.tsx` — client, handles SIWE signing + POST + optimistic UI
- If `NEXT_PUBLIC_WEB3_ENABLED !== "true"` → render nothing
- If `profile.onboarding.web3OptIn !== true` → render opt-in CTA (under-16 variant shows "wymaga zgody rodzica")
- Otherwise → ConnectButton + gallery
- **a11y**: match D6 patterns — motion-safe animations only, proper aria-labels

### W6 — Parent consent + burn-on-revocation
- Extend `ProfileOnboarding` type in `lib/player.ts` (or wherever it lives) with `web3OptIn: boolean`
- `/profile` checkbox UI:
  - If user under 16 (ageBucket proxy): checkbox disabled, copy "wymaga zgody rodzica"
  - If 16+: checkbox enabled directly
- Parent observer path (existing V4.6):
  - Add row on `/rodzic/[username]` for parent to toggle the kid's `web3OptIn`
  - When parent flips off → server calls `burn(tokenId)` for every medal minted during the consent window
- GDPR Art. 17 path: existing `/profile` deletion flow must also iterate + burn all user's medals before clearing state
- New backend helper: `lib/web3/burn-all.ts` — iterates user's tokens, calls relayer burn, logs each

### W7 — Submission package (fill + verify, NOT author)

**IMPORTANT**: the submission docs are **already pre-staged** on base:
- `docs/web3/SUBMISSION.md` — full narrative already authored with `{{TOKEN}}` placeholders
- `docs/web3/DEPLOYMENTS.md` — pre-staged table with `{{CONTRACT_ADDRESS}}` etc.
- `README.md` — "Web3 surface" section pre-staged with `{{VIDEO_URL}}` / `{{CONTRACT_ADDRESS}}` / `{{BASESCAN_URL}}`

Your job in W7 is **not to author these** — it's to **fill placeholders and verify**:

1. Ensure `docs/web3/DEPLOYMENTS.md` has real deploy values (you did this in W2).
2. Run the filler script:
   ```bash
   pnpm tsx scripts/fill-web3-submission.ts \
     --demo-url=https://xp-arena-ethsilesia2026.vercel.app \
     --video-url={{VIDEO_URL_FROM_OPERATOR}} \
     --contact={{CONTACT_FROM_OPERATOR}}
   ```
   If operator hasn't uploaded the video yet, leave `{{VIDEO_URL}}` in place (the filler reports it as still-pending, exits 1) — commit the demo/contact substitution and note the missing video in the progress log.
3. Run the pre-submission guard:
   ```bash
   bash scripts/check-placeholders.sh
   ```
   Must exit 0 before W7 is complete. If a token legitimately cannot be resolved this session (e.g. video awaits operator), document precisely which tokens remain and what the operator needs to do in `docs/progress/SESSION-SUMMARY-WEB3.md`.
4. Do NOT rewrite the narrative. If a line in `SUBMISSION.md` is factually wrong after implementation (e.g. a route path diverged), propose the fix in a dedicated commit — don't bundle it with the filler run.
5. Write `docs/progress/SESSION-SUMMARY-WEB3.md` — final recap matching the D1..D8 summary format (W-item completion matrix, deployed address, open blockers, recommended next steps).

**Acceptance**: `scripts/check-placeholders.sh` exits 0, OR the remaining tokens are exactly the operator-pending ones (video/contact) documented in SESSION-SUMMARY-WEB3.md. Guard enforces the "no unfilled submission" floor.

## Feedback to user

The user is busy. They will:
- Read `docs/progress/2026-04-19-web3.md` when convenient
- Possibly send direction via the same Claude session — treat as supplementary, not work-blocking
- Provide operator actions (faucet funding, API keys, video) asynchronously — you detect the unblock by re-trying the failed step each work cycle

Never stop to ask a clarifying question. Always proceed with the documented default and note your choice. The user can redirect; you can adapt.

## Now go

1. cd to repo root
2. Checkout watt-city-demo-polish, pull, verify head
3. Run smoke battery
4. Cut watt-city-web3-base
5. Read the 7 docs listed in "First steps"
6. Write first progress entry
7. Begin W1
8. Commit small, push always
9. Progress entries every ~30 min
10. Don't stop until W1..W7 complete or hard-blocked

You've got this.
```

---

## After kickoff — what you (the human user) do

1. Walk away. Don't watch over the agent's shoulder.
2. Check `docs/progress/2026-04-19-web3.md` periodically.
3. If you want to redirect, type into the same session — the agent reads between work cycles.
4. If it stalls, check `docs/progress/SESSION-SUMMARY-WEB3.md` when present.
5. When back, `watt-city-web3-base` has meaningful progress with commit history + progress reports.

## Operator actions you'll need to do

The agent runs autonomously but some actions require a human:

1. **Base Sepolia ETH funding** — visit https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet, paste the deployer address the agent will emit in progress notes, claim 0.05 ETH. One-time, ~2 minutes.
2. **NFT.Storage API key** — create account at https://nft.storage, get key, set `NFT_STORAGE_API_KEY` via `vercel env add`. ~5 minutes.
3. **WalletConnect projectId** — create at https://cloud.reown.com, set `NEXT_PUBLIC_WC_PROJECT_ID`. ~3 minutes.
4. **Vercel env vars post-W2** — 4 vars: `WEB3_CONTRACT_ADDRESS`, `WEB3_RELAYER_PRIVATE_KEY`, `NEXT_PUBLIC_WEB3_ENABLED`, `NEXT_PUBLIC_WEB3_CHAIN_ID`. Agent emits the values in progress notes; you paste into Vercel. ~5 minutes.
5. **2-min demo video** — agent writes the script; you record with screen capture tool, upload to YouTube (unlisted), paste link in SUBMISSION.md. ~15 minutes.

Total: ~30 minutes of your time, spread across the work session.

## Recovery if the agent goes off-rails

```bash
# See commits
git log --oneline watt-city-web3-base

# Revert a bad commit
git revert <bad-sha>

# Roll back hard (only if needed)
git checkout watt-city-web3-base
git reset --hard <good-sha>
git push --force-with-lease   # YOU do this manually; agent never does

# Restart agent with same prompt — picks up from current state
```

## Notes on `--dangerously-skip-permissions`

Agent has full git/pnpm/Hardhat access. It can install packages, deploy to testnet, modify env vars (read-only to Vercel unless you give it cmd access). It cannot:
- Force-push (in the NEVER list)
- Deploy to mainnet (in the NEVER list + DEPLOY.md §5 audit gate)
- Touch `main` or `watt-city` branches
- Commit secrets (explicit NEVER + `.gitignore` protection)

Type "STOP" in the session to halt cleanly — agent writes SESSION-SUMMARY-WEB3.md and exits.
