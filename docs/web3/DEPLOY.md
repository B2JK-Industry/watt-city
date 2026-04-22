# Web3 deployment runbook — Phase 8

> Operator-led. Every step here involves funded wallets + irreversible
> on-chain actions. Do NOT run this against mainnet before the audit
> lands (Phase 8.1.7).
>
> **Status (2026-04-22)**: Foundry toolchain is the shipped path
> (see `foundry.toml` + `contracts/script/Deploy.s.sol`); the Hardhat
> commands below remain as an alternate route. Base Sepolia deploy is
> ready but still operator-blocked on faucet funding — substitute the
> published address via `scripts/fill-web3-submission.ts` once funded.

## 0. Prerequisites

- Node 22 LTS (Hardhat 3 / Node 25 incompatible as of 2026-04).
- A funded wallet with ETH on Base Sepolia (testnet) OR Base mainnet.
- An Alchemy / Infura / QuickNode API key for the target chain.
- (Optional) NFT.Storage API key for hosting medal metadata.

## 1. Set up the toolchain

```bash
# Install Hardhat 2.x (Node 25-compatible; Hardhat 3 requires ESM-only)
pnpm add -D hardhat@^2.22 @nomicfoundation/hardhat-toolbox@^5
pnpm add -D @openzeppelin/contracts

# OR use Foundry (faster):
#   curl -L https://foundry.paradigm.xyz | bash
#   foundryup

# Generate the Hardhat project scaffold (if you chose Hardhat)
pnpm dlx hardhat init --force
```

Copy `contracts/WattCityMedal.sol` into the generated Hardhat project's
`contracts/` folder. Use our statically-tested source verbatim.

## 2. Test locally

```bash
# Hardhat:
pnpm dlx hardhat compile
pnpm dlx hardhat test
```

Write at least one EVM-level test that asserts:
- Minting as a non-owner reverts.
- Transfer attempts revert with `Soulbound`.
- `burn()` decrements balanceOf correctly.

## 3. Deploy to Base Sepolia

```bash
# Configure .env (NEVER commit):
#   BASE_SEPOLIA_RPC=https://sepolia.base.org
#   DEPLOYER_PRIVATE_KEY=0x...  (funded with Sepolia ETH from a faucet)

# Hardhat deploy script:
pnpm dlx hardhat run scripts/deploy.ts --network baseSepolia
# Record the deployed address.

# Verify on BaseScan:
pnpm dlx hardhat verify --network baseSepolia <address>
```

Wire the deployed address into Watt City via Vercel env vars:

```
WEB3_CONTRACT_ADDRESS=0x...
NEXT_PUBLIC_WEB3_ENABLED=true
NEXT_PUBLIC_WEB3_CHAIN_ID=84532
WEB3_RELAYER_PRIVATE_KEY=0x...  # a DIFFERENT wallet from the deployer
```

Deploy the app. The `/profile` page now shows the on-chain medals
section for logged-in users.

## 4. Paymaster (Phase 8.1.6)

- Deploy a simple ERC-4337 paymaster with a daily spend cap.
- Fund it with ~0.05 ETH on Base Sepolia.
- Wire into `lib/web3/client.ts` `requestMint` to include the paymaster
  address in the user-op.

## 5. Base mainnet (Phase 8.1.7)

Only after:
- External security audit of `WattCityMedal.sol` (engagement window
  ~4 weeks, EUR 10-20k).
- Phase 4.3.1 KNF review clears "virtual asset" question.
- Paymaster tested on Sepolia for ≥ 4 weeks.

Run the same deploy script against `mainnet` network; lock the deployer
key in hardware. `NEXT_PUBLIC_WEB3_CHAIN_ID=8453`.

## 6. Operations

- **Relayer ETH top-up**: automate via a cron that queries relayer
  balance and alerts via `ALERT_WEBHOOK_URL` when < 0.01 ETH.
- **Quarterly key rotation**: deploy a new relayer, authorise it on the
  contract via `transferOwnership`, retire the old key.
- **Incident response**: if the relayer is compromised, call
  `transferOwnership` from a cold wallet to move to a new relayer.
  Compromised keys CAN'T be rolled back, but `onlyOwner`-gated mint
  limits the blast radius.

## 7. Burn on GDPR request

When a user invokes GDPR Art. 17 (right to erasure) AND they have
on-chain medals, the relayer calls `burn(tokenId)` for each medal.
Document in `docs/legal/DATA-RETENTION.md` that on-chain burns are
best-effort (the transaction log itself is public).

Entry points that reach this path (all route through
`lib/soft-delete.ts#hardErase` → `lib/web3/burn-all.ts#burnAllForUser`):

- `DELETE /api/me` — user-initiated erasure; flags for soft-delete,
  then sweep-deletions finalises via `hardErase()` after the 30-day
  grace window.
- `/api/cron/sweep-deletions` — soft-delete grace expiry; the canonical
  direct `hardErase()` caller.
- `/api/cron/sweep-inactive-kids` — 12-month inactive-kid auto-flag;
  reaches `hardErase()` transitively once the grace window runs.
- `/api/admin/purge-e2e-accounts` (added 2026-04-22) — admin cleanup
  of historic E2E leakage in the production leaderboard. Default
  `dryRun: true`; with `dryRun: false` each matched username goes
  through the full `hardErase` path, so any on-chain medals tied to
  those test accounts are burned as a side-effect.

## 8. Audit budget (operator)

- Static analysis (Slither / Mythril): free, run by the operator.
- External audit (OpenZeppelin / Trail of Bits / Spearbit): EUR 10-20k
  for a ~200-LOC contract.
- Bug bounty: post-deploy, USD 500-5000 scale pools via Immunefi.
