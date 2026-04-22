# Web3 architecture plan — Phase 8

> **Status (2026-04-22)**: W1..W7 shipped. `WattCityMedal` contract,
> Foundry test suite, mint API, burn-on-revocation, RainbowKit/wagmi
> client, `/profile` gallery, and the ETHSilesia submission package are
> all live in-repo. Base Sepolia deploy remained operator-blocked on
> faucet funding at W7 — local anvil address is pinned in
> `DEPLOYMENTS.md` for demo purposes. Base mainnet still gated on the
> external audit per `DEPLOY.md §5`.

## 1. Scope

Watt City's web3 surface is **soulbound medals** — non-transferable
tokens that mirror the Phase 2.8 achievements on-chain. Kids can opt in
to mint; otherwise they keep the off-chain badges and never see the
web3 UI. Under-16 accounts need parental consent (Phase 6.3) before we
even display the "connect wallet" CTA.

Explicitly NOT in scope:
- NFT cosmetic skins (8.2.1) — speculative.
- DAO theme voting (8.2.2) — adds governance complexity.
- Cross-chain bridge (8.2.3) — already DEFERRED per backlog.

## 2. Chain choice matrix

| Candidate | Gas per mint (2026 est.) | L2 finality | Ecosystem + tooling | Recommended? |
|---|---|---|---|---|
| Base | ~USD 0.01 | ~2 s | Coinbase backing, strong wallet compatibility, OP-stack | **Yes (default)** |
| Optimism | ~USD 0.008 | ~2 s | Mature, excellent docs, OP-stack | Strong alternative |
| Polygon zkEVM | ~USD 0.005 | ~15 min to L1 | Great for volume; ZK complexity is overkill | Skip for MVP |
| Ethereum L1 | ~USD 1.50+ | ~15 s | Highest trust, far too expensive | Skip |
| Arbitrum One | ~USD 0.01 | ~2 s | Large TVL, no strong differentiator for us | Deferred |

**Decision**: Base (see `docs/decisions/003-web3-scope.md`). Rationale:
lowest consistent gas, Coinbase Smart Wallet integration plays well with
kid-friendly UX (passkey-based, no seed phrase), OP-stack contracts port
to Optimism if we ever need to migrate.

## 3. Contract design

`contracts/WattCityMedal.sol` implements:

- ERC-721 interface for wallet compatibility.
- `_beforeTokenTransfer` reverts when `from != 0x0 && to != 0x0` — true
  soulbound, non-transferable.
- `mint(to, tokenId, uri)` admin-only (onlyOwner), callable from our
  trusted relayer after we verify the player owns the off-chain
  achievement.
- `tokenURI(id)` returns an IPFS URI of a JSON metadata doc
  (title / description / icon / achievementId).
- `burn(tokenId)` — owner-only, for GDPR Art. 17 compliance (the chain
  is "immutable" but a burn effectively removes the on-chain link).

Read-only helpers:
- `ownedOf(address)` returns all tokenIds a wallet holds.
- `achievementOf(tokenId)` returns the off-chain achievement ID string.

## 4. Mint flow

```
┌────────────────────────────────────────────────────────────────┐
│ 1. Kid earns the off-chain achievement (Phase 2.8 sweep)       │
│ 2. Parent-consent check: profile.onboarding.web3OptIn === true │
│ 3. Kid clicks "Zamintuj medal" on /profile                      │
│ 4. Browser → /api/web3/mint-request (sess-auth + CSRF)          │
│ 5. Server:                                                      │
│    - verifies achievement owned by this user                    │
│    - calls relayer EOA `mint(wallet, tokenId, ipfsURI)`         │
│    - relayer pays gas (paymaster later in Phase 8.1.6)          │
│ 6. Contract emits Transfer(0 → wallet); indexer picks up       │
│ 7. UI polls /api/web3/my-medals to show the chain-link icon    │
└────────────────────────────────────────────────────────────────┘
```

## 5. Wallet UX

We integrate [RainbowKit](https://www.rainbowkit.com) (or
Coinbase-native Smart Wallet) only in the opt-in flow — shipped in W5
as `components/web3/medal-gallery.tsx` + `mint-button.tsx`. Default
users never see a wallet button. Connecting a wallet is a **profile
setting** not a login requirement.

For kid accounts, Coinbase Smart Wallet's passkey-based sign-in is the
intended path — no seed phrase, no extension, tied to their device
passkey. This sidesteps the "kids should never see 12 words" security
anti-pattern.

## 6. Gas sponsorship (Phase 8.1.6, deferred)

Goal: kids don't buy or hold ETH. We deploy a paymaster on Base that
subsidises `mint()` calls from our relayer for a bounded daily gas
budget. Operator defines `PAYMASTER_DAILY_BUDGET_USD` env and tops up
the paymaster wallet. When the budget is consumed, mints degrade to
"opt-out, please contact us" until the next day.

## 7. Real-world integration checklist (for the operator)

See `docs/web3/DEPLOY.md` for deployment steps. Key env vars:
- `WEB3_RELAYER_PRIVATE_KEY` — EOA funded with ETH on Base for mint
  transactions. Rotate quarterly.
- `WEB3_CONTRACT_ADDRESS` — deployed WattCityMedal address.
- `NEXT_PUBLIC_WEB3_ENABLED` — set to `"true"` to activate the opt-in UI.
- `NEXT_PUBLIC_WEB3_CHAIN_ID` — 8453 for Base mainnet, 84532 for Base
  Sepolia testnet.

## 8. Open questions

- IPFS hosting: NFT.Storage (Filebase-backed, kid-friendly), Pinata, or
  self-hosted via a small node? Default: NFT.Storage.
- Achievement→tokenId mapping: hash of (achievementId + username) →
  uint256? Or per-user counter? Default: first option, deterministic.
- What happens on parental-consent revocation? Answer: burn every medal
  minted during the consent window. Burn is gas-paid by the relayer.
