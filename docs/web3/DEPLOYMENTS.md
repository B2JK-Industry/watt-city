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
- Audit: source-invariant tests only (`contracts/test/WattCityMedal.test.ts`); external audit is post-pilot per `DEPLOY.md §5`.

## Base mainnet (chainId 8453)

**Not deployed.** Gated on the security audit per `docs/web3/DEPLOY.md §5`. Post-pilot.

## Operational notes

- **Relayer EOA**: separate from deployer. Rotated quarterly. Private key in Vercel env as `WEB3_RELAYER_PRIVATE_KEY`. See `DEPLOY.md §6`.
- **Relayer balance alert**: `ALERT_WEBHOOK_URL` fires when relayer balance drops below 0.01 ETH. Operator tops up.
- **Incident response**: compromised relayer → cold wallet calls `transferOwnership` to a new relayer. Previous mints are not rolled back, but future mints require the new owner.

## Burn log (GDPR Art. 17 + consent revocations)

Burns are logged off-chain in Redis as `xp:web3:burn-log:<username>` (append-only). The on-chain Transfer → 0x0 events are public on BaseScan. Retention policy per `docs/legal/DATA-RETENTION.md`.
