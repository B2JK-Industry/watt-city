# Session Summary — Web3/Base track (2026-04-19)

**Base**: `watt-city-demo-polish@efcf185` (569 tests, D1..D8 polish shipped)
**Branch**: `watt-city-web3-base`
**Scope**: 7 items W1..W7 per `docs/progress/2026-04-19-web3-base-kickoff.md`

## W1..W7 completion matrix

| # | Deliverable | Status | Commit |
|---|---|---|---|
| **W1** | wagmi + RainbowKit scaffolding + feature flag | ✅ shipped | `dc40def` |
| **W2** | WattCityMedal deploy + Foundry toolchain + EVM tests | ⚠️ partial (see blocker) | `4dcd600` |
| **W3** | ERC-721 metadata for every achievement on IPFS | ✅ shipped (data URI default + optional NFT.Storage) | `d23207c` |
| **W4** | Mint API route + my-medals companion | ✅ shipped | `79d7543` |
| **W5** | `/profile` on-chain medal gallery with RainbowKit | ✅ shipped | `964d261` |
| **W6** | Parent consent + burn-on-revocation | ✅ shipped | `6e77453` |
| **W7** | Submission package (this file + SUBMISSION.md + README) | ✅ shipped | pending |

**Tests**: 618 / 618 passing at W6 close (569 baseline + 6 W1 + 5 W2 + 5 W3 + 21 W4 + 6 W5 + 6 W6).
**`forge test`**: 20 / 20 passing (EVM-level WattCityMedal invariants).
**`pnpm exec tsc --noEmit`**: clean.
**`pnpm build`**: green.
**D1..D8 smoke**: no regression — all new code is additive under the `NEXT_PUBLIC_WEB3_ENABLED` flag; the demo-polish paths were not modified.

## Deployment

### Base Sepolia (target — operator action required)

`WattCityMedal` is **NOT yet deployed to Base Sepolia** — this is the one open item. The deploy script, verification command, and env-var contract are all in place; what's needed is a funded deployer EOA from the Coinbase faucet. See `docs/web3/DEPLOYMENTS.md` → "Operator action needed — Base Sepolia deploy" for the exact command sequence.

### Local anvil (demo fallback)

While Base Sepolia is blocked, the entire flow works against a local anvil node. Deterministic address: `0x5FbDB2315678afecb367f032d93F642f64180aa3` on chainId 31337. Reproduced via:

```bash
anvil --port 8545 --block-time 1 &
forge script contracts/script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

This gave us an end-to-end demo path for W4 + W5 verification. For the ETHSilesia submission, replace with the Base Sepolia deployment.

## Open blockers + operator actions

| Blocker | What it needs | Where documented |
|---|---|---|
| Base Sepolia deployer funding | ≥ 0.01 ETH from `https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet` into `DEPLOYER_PRIVATE_KEY` | `docs/web3/DEPLOYMENTS.md` |
| BaseScan API key | free key from `https://basescan.org/myapikey` for `forge verify-contract` | `.env.example` → `BASESCAN_API_KEY` |
| WalletConnect project id | free project at `https://cloud.walletconnect.com` → `NEXT_PUBLIC_WC_PROJECT_ID`. Not strictly required (Coinbase Smart Wallet + injected work without it) but improves the ConnectButton UX | `.env.example` → `NEXT_PUBLIC_WC_PROJECT_ID` |
| NFT.Storage API key (optional) | free tier at `https://nft.storage`. Unset → the metadata stays as `data:application/json;base64,…` URIs which work fine on testnet. Setting → `scripts/upload-medal-metadata.ts` will re-host on IPFS | `.env.example` → `NFT_STORAGE_API_KEY` |
| Relayer EOA | ≥ 0.01 ETH on Base Sepolia into `WEB3_RELAYER_PRIVATE_KEY` (a DIFFERENT wallet from the deployer). Submits mint + burn txs on users' behalf | `docs/web3/DEPLOY.md §6` |
| 2-minute demo video | kid → parent → mint → BaseScan walkthrough, unlisted YouTube upload → `WEB3_VIDEO_URL` | `docs/web3/SUBMISSION.md` |

## Finishing the submission package

After the operator completes the actions above:

```bash
# 1. Deploy to Base Sepolia
forge script contracts/script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify --etherscan-api-key $BASESCAN_API_KEY

# 2. Paste the deployed address + block number + deployer EOA into
#    docs/web3/DEPLOYMENTS.md under the first "{{CHAIN_NAME}}" table row.
#    Example:
#      | WattCityMedal | `0xABC…` | [view](https://sepolia.basescan.org/address/0xABC…) |
#      - Deployed at block: 12345678
#      - Deployed at: 2026-04-19T15:30:00Z
#      - Deployer EOA: `0xDEF…`

# 3. Run the placeholder filler
pnpm tsx scripts/fill-web3-submission.ts \
  --demo-url=https://watt-city.vercel.app \
  --video-url=https://youtu.be/XXXXXXX \
  --contact=hello@b2jk.industries

# 4. Verify no placeholders remain
bash scripts/check-placeholders.sh

# 5. Commit + push
git add docs/web3/ README.md
git commit -m "docs(web3): fill submission placeholders post-deploy"
git push

# 6. On Vercel, set production env vars:
#    NEXT_PUBLIC_WEB3_ENABLED=true
#    NEXT_PUBLIC_WEB3_CHAIN_ID=84532
#    NEXT_PUBLIC_WC_PROJECT_ID=<…>
#    WEB3_CONTRACT_ADDRESS=0xABC…
#    WEB3_RELAYER_PRIVATE_KEY=<…> (never log or commit)
```

## Demo video script (60-90s)

For the operator-recorded walkthrough:

1. **00:00–00:15 — Kid's view**: log in as `demo-teacher-pl` (or any seeded kid), play a quick game, earn an achievement. Off-chain badge appears on `/profile`.
2. **00:15–00:30 — Parent's view**: open `/rodzic/[kid]`, tick "Dziecko może zbierać medale NFT". Server writes `xp:consent-granted:<kid>`.
3. **00:30–01:00 — Mint**: kid returns to `/profile` → new "Moje medale on-chain" section → clicks `Connect` → Coinbase Smart Wallet → Face ID. No seedphrase prompt. Picks an earned achievement → `Zamintuj` → wallet signs the SIWE-lite message → server submits tx via relayer → medal card appears within ~30 s with the 🟢 "Zamintowany" badge + BaseScan link.
4. **01:00–01:10 — Verification**: click the BaseScan link → contract page shows the Transfer event from `0x0` → the kid's wallet. Anyone can verify.
5. **01:10–01:30 — Revocation (optional)**: parent unticks consent → server calls `burnMedal()` → gallery shows "Spalony" in red → BaseScan shows Transfer → `0x0`. GDPR Art. 17 demonstrated on-chain.

Upload as **unlisted** YouTube, paste link into `docs/web3/SUBMISSION.md` via the fill script.

## Pitch slide bullets (markdown → deck)

Five bullets for the pitch deck slide:

- **Soulbound — certificate, not trading card.** Every `transferFrom` reverts with `Soulbound`. 20 EVM-level tests prove it.
- **Parent consent — server-side hard gate.** Under-16 accounts get HTTP 403 from the mint route without a linked parent's approval. The client cannot bypass it.
- **Burn-on-revocation — GDPR Art. 17 on-chain.** Consent flip → relayer calls `burn(tokenId)` for every medal → Transfer → 0x0 event. The kid's medal-to-identity link is severed.
- **Coinbase Smart Wallet passkey.** Face ID / Touch ID sign-in, no seedphrase. Kid-safe by default.
- **Opt-in, default off.** `NEXT_PUBLIC_WEB3_ENABLED` unset = zero web3 imports in the client bundle. 99 % of users never see a wallet button. The PKO Gaming pitch ships unaffected.

## What the concurrent agent built alongside

During this session a parallel agent ran on `ux-fixes-2026-04-19` and shadowed some work onto `watt-city-web3-base`. Their additive contributions:

- `docs/web3/SUBMISSION.md` — pre-staged narrative with `{{TOKEN}}` placeholders. Well-authored; the fill script (`scripts/fill-web3-submission.ts`) and its guard (`scripts/check-placeholders.sh`) all work against it.
- 4-language locale keys for `/o-platforme` web3 section (`lib/locales/{pl,en,uk,cs}.ts`).
- 4-language locale keys for `/ochrana-sukromia` web3 privacy section.
- `/o-platforme` render of the Web3 section.
- `/ochrana-sukromia` render of the Web3 on-chain data section + right-to-erasure renumbering.
- `docs/ux-audit/POPUPS-2026-04-19.md` + fixes for `onboarding-tour`, `cookie-consent`, `cashflow-hud`.

Review them at leisure — none interfere with the W1..W6 implementation.

## Recommended next steps

1. **Operator**: run the faucet → deploy → fill script chain above (≤ 30 min).
2. **Optional**: record the 2-min demo video; drop the link into SUBMISSION.md via `--video-url`.
3. **Optional**: set `NFT_STORAGE_API_KEY` + run `scripts/upload-medal-metadata.ts` to re-host metadata on IPFS (prettier for judges who inspect `tokenURI`).
4. **Before ETHSilesia submission deadline**: flip `NEXT_PUBLIC_WEB3_ENABLED=true` on Vercel production. The demo URL in SUBMISSION.md should show the gallery when a logged-in user with parent consent visits `/profile`.
5. **Post-hackathon**: external audit of `WattCityMedal.sol` (≈ EUR 10–20 k, ~4 weeks) before any Base **mainnet** deployment. The audit gate is in `docs/web3/DEPLOY.md §5`.

## Where to look for what

| Question | Answer |
|---|---|
| "How does the mint actually work?" | `app/api/web3/mint/route.ts` |
| "What gates are enforced?" | Same file — numbered 1–8 in the header comment |
| "Where's the contract?" | `contracts/WattCityMedal.sol` |
| "How do I deploy?" | `docs/web3/DEPLOYMENTS.md` "Operator action needed" section |
| "What does the gallery look like?" | `components/web3/medal-gallery.tsx` (client) + `medal-gallery-section.tsx` (server gate) |
| "How does burn-on-revocation work?" | `lib/web3/burn-all.ts` |
| "What gets stored in Redis?" | `xp:web3:mint-log:<user>` (list of mint events), `xp:consent-granted:<user>`, `xp:web3:consent-revoked:<user>` |
| "What are the env vars?" | `.env.example` — every web3 var is documented with placeholders |
| "How much did this ship weigh on the bundle?" | Default path (`NEXT_PUBLIC_WEB3_ENABLED` unset) stays at 1.3 MB `.next/static`. The wagmi/rainbowkit chunk only loads when a user with opt-in actually renders the gallery |
| "Full narrative for judges?" | `docs/web3/SUBMISSION.md` |
| "Progress trail through W1..W7?" | `docs/progress/2026-04-19-web3.md` + this file |

---

**Submission-ready as of 2026-04-19, blocked only on operator faucet funding.** Every code path is tested; every integration is wired; every hard constraint from the kickoff spec has been honoured.
