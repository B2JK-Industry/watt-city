<!--
  Deployment registry — pre-staged. Agent W2 substitutes real values
  via `scripts/fill-web3-submission.ts`. Guard:
  `scripts/check-placeholders.sh` fails if any `{{…}}` remains before
  submission.
-->

# Watt City deployments

## {{CHAIN_NAME}} (testnet, chainId {{CHAIN_ID}})

| Contract | Address | BaseScan |
|---|---|---|
| WattCityMedal | `{{CONTRACT_ADDRESS}}` | [view]({{BASESCAN_URL}}) |

- Deployed at block: {{DEPLOY_BLOCK}}
- Deployed at: {{DEPLOY_TIMESTAMP}}
- Deployer EOA: `{{DEPLOYER_ADDRESS}}`
- Verified on BaseScan: ✅ (source matches on-chain bytecode)
- Audit: source-invariant tests only (`contracts/test/WattCityMedal.test.ts`) + 20 EVM-level Foundry tests (`contracts/test/WattCityMedal.t.sol`); external audit is post-pilot per `DEPLOY.md §5`.

### Operator action needed — Base Sepolia deploy

**Status**: **BLOCKED on operator funding**. Deploy script is ready; needs a funded EOA.

```bash
# Prereqs: fund DEPLOYER_PRIVATE_KEY wallet with ≥ 0.01 ETH on Base Sepolia
#   https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet

export BASE_SEPOLIA_RPC_URL=https://sepolia.base.org
export DEPLOYER_PRIVATE_KEY=0x...   # NEVER commit
export BASESCAN_API_KEY=...          # from basescan.org account

forge script contracts/script/Deploy.s.sol \
  --rpc-url $BASE_SEPOLIA_RPC_URL \
  --private-key $DEPLOYER_PRIVATE_KEY \
  --broadcast \
  --verify --etherscan-api-key $BASESCAN_API_KEY

# Paste the resulting address + BaseScan URL into the Base Sepolia
# table row above, then run:
#   pnpm tsx scripts/fill-web3-submission.ts
# to substitute tokens across SUBMISSION.md / README.md / this file.
```

## Local fallback deployment (anvil, chainId 31337)

While W2 is operator-blocked, W4+ and the demo flow run against a
local anvil node. The address is deterministic (first contract from
Foundry's default first-funded account), so configs can hard-code it
for dev.

| Contract | Address | RPC |
|---|---|---|
| WattCityMedal | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | http://127.0.0.1:8545 |

- Deployer EOA: `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` (anvil default account #0)
- Deploy tx hash: `0x11e00c7994a7cbe7b55eba08f0c5eb64039adf250486706220497a96874d40e3`
- Chain: local anvil (chainId 31337). **Not public.** Demo-only — replace with Base Sepolia before submission.

To reproduce:
```bash
anvil --port 8545 --block-time 1 &
forge script contracts/script/Deploy.s.sol \
  --rpc-url http://127.0.0.1:8545 \
  --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
  --broadcast
```

## Base mainnet (chainId 8453)

**Not deployed.** Gated on the security audit per `docs/web3/DEPLOY.md §5`. Post-pilot.

## Operational notes

- **Relayer EOA**: separate from deployer. Rotated quarterly. Private key in Vercel env as `WEB3_RELAYER_PRIVATE_KEY`. See `DEPLOY.md §6`.
- **Relayer balance alert**: `ALERT_WEBHOOK_URL` fires when relayer balance drops below 0.01 ETH. Operator tops up.
- **Incident response**: compromised relayer → cold wallet calls `transferOwnership` to a new relayer. Previous mints are not rolled back, but future mints require the new owner.

## Burn log (GDPR Art. 17 + consent revocations)

Burns are logged off-chain in Redis as `xp:web3:burn-log:<username>` (append-only). The on-chain Transfer → 0x0 events are public on BaseScan. Retention policy per `docs/legal/DATA-RETENTION.md`.
