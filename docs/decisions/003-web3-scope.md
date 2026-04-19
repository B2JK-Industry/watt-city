---
name: 003 — Web3 scope: soulbound medals, scaffold-only
description: Why Watt City ships web3 as code-only scaffolding, not a deployed contract
type: project
---

# ADR 003 — Web3 scope: soulbound medals, scaffold-only

**Date**: 2026-04-19
**Status**: accepted
**Supersedes**: nothing

## Context

Phase 8 of the backlog considers a web3 layer. Options ranged from "NFT
cosmetic skins" through "DAO token voting" to "soulbound achievement
medals". The autonomous agent's charter explicitly forbids:

- Deploying to any public blockchain (mainnet OR testnet).
- Spending any real gas.
- Holding or broadcasting any private key.
- Committing wallet credentials to this repo.

This narrows the set of things an agent can responsibly do in Phase 8.

## Decision

Ship everything that can be reviewed without executing a transaction:

- `docs/web3/PLAN.md` — architecture, chain comparison, mint flow.
- `contracts/WattCityMedal.sol` — the Solidity source, invariant-checked
  statically via `pnpm test`.
- `lib/web3/client.ts` — typed helpers that return mock values unless
  `NEXT_PUBLIC_WEB3_ENABLED=true` is set.
- `/profile` page — conditionally-rendered "On-chain medals" section
  that only mounts when `web3Enabled()` is true.
- `docs/web3/DEPLOY.md` — step-by-step deployment runbook for a human
  operator with a funded wallet.

Defer to the operator:

- Chain selection final confirmation (doc recommends Base; ADR
  documents the comparison; operator can pick differently).
- Hardhat v2 or Foundry test environment setup for full EVM-level
  contract coverage.
- Testnet deployment (Base Sepolia).
- Mainnet deployment + audit.
- Paymaster deployment for gas sponsorship.
- Frontend wallet-connect wiring (RainbowKit or Coinbase Smart Wallet).

Skip entirely:

- 8.2.1 NFT cosmetic skins — speculative, doesn't serve the educational
  mission.
- 8.2.2 DAO theme voting — governance overhead grossly outweighs the
  educational value for a kid product.
- 8.2.3 Cross-chain bridge — DEFERRED per backlog anyway.

## Why soulbound medals specifically?

- The off-chain Phase 2.8 achievements already describe the user's
  identity in the game. Mirroring them on-chain adds portability
  (another app can verify "this kid earned X in Watt City") WITHOUT
  introducing tradeable financial speculation.
- Soulbound = non-transferable = no secondary market = no incentive to
  turn a 10-year-old into a trader.
- The opt-in gate (plus parental consent for under-16) keeps the
  surface area small.

## Risks

- **Gas cost variance**: Base ≈ $0.01/mint in 2026-04, but traffic
  spikes can 10×. Paymaster budget caps the blast radius. The
  `PAYMASTER_DAILY_BUDGET_USD` env var lets the operator cap per-day
  exposure.
- **Regulatory uncertainty in PL**: minted medals MAY be argued as
  "virtual assets" under EU MiCA — the disclaimer `Watt City Medal ≠
  financial product` has to survive a KNF review (Phase 4.3.1 external
  task).
- **Key rotation**: relayer EOA is a single point of failure. The
  runbook documents quarterly rotation.

## When to revisit

- Ship the contract to Base Sepolia after the Phase 4.3.1 KNF review.
- Ship to Base mainnet only after: (a) external audit, (b) paymaster
  live, (c) pilot program (Phase 4.4) proves demand.
