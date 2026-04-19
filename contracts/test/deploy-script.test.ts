import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/* W2 guard — Foundry deploy toolchain must stay in sync with the
 * contract so the operator can run the runbook in docs/web3/DEPLOYMENTS.md
 * verbatim. Source-invariant EVM tests (WattCityMedal.t.sol) are run
 * separately by `forge test`; this guard only pins the files + shape
 * so they can't silently drift away. */

const ROOT = join(__dirname, "..", "..");

describe("W2 — Foundry deploy toolchain", () => {
  it("foundry.toml points src at contracts/ and pins solc 0.8.24", () => {
    const path = join(ROOT, "foundry.toml");
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, "utf8");
    expect(src).toMatch(/src\s*=\s*"contracts"/);
    expect(src).toMatch(/solc_version\s*=\s*"0\.8\.24"/);
    expect(src).toMatch(/base_sepolia/);
  });

  it("Deploy.s.sol deploys WattCityMedal with no constructor args", () => {
    const path = join(ROOT, "contracts/script/Deploy.s.sol");
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, "utf8");
    expect(src).toMatch(/import\s*\{[^}]*WattCityMedal[^}]*\}/);
    expect(src).toMatch(/new WattCityMedal\(\)/);
    // vm.startBroadcast / stopBroadcast so CREATE goes on-chain.
    expect(src).toMatch(/vm\.startBroadcast\(\)/);
    expect(src).toMatch(/vm\.stopBroadcast\(\)/);
  });

  it("WattCityMedal.t.sol has EVM-level coverage for the high-risk paths", () => {
    const path = join(ROOT, "contracts/test/WattCityMedal.t.sol");
    expect(existsSync(path)).toBe(true);
    const src = readFileSync(path, "utf8");
    // At minimum: soulbound, mint-non-owner, burn-non-owner,
    // duplicate-mint, transferOwnership rotate.
    for (const fn of [
      "test_transferFrom_always_reverts",
      "test_safeTransferFrom_always_reverts",
      "test_mint_from_non_owner_reverts",
      "test_burn_from_non_owner_reverts",
      "test_mint_duplicate_tokenId_reverts",
      "test_transferOwnership_rotates_owner",
    ]) {
      expect(src, `missing ${fn}`).toMatch(new RegExp(fn));
    }
  });

  it("DEPLOYMENTS.md documents the Base Sepolia runbook + local fallback", () => {
    const src = readFileSync(
      join(ROOT, "docs/web3/DEPLOYMENTS.md"),
      "utf8",
    );
    expect(src).toMatch(/Base Sepolia/);
    expect(src).toMatch(/forge script contracts\/script\/Deploy\.s\.sol/);
    expect(src).toMatch(/anvil/);
    expect(src).toMatch(/0x5FbDB2315678afecb367f032d93F642f64180aa3/);
  });

  it(".env.example documents the Foundry + BaseScan deploy env vars", () => {
    const src = readFileSync(join(ROOT, ".env.example"), "utf8");
    expect(src).toMatch(/BASE_SEPOLIA_RPC_URL=/);
    expect(src).toMatch(/BASESCAN_API_KEY=/);
    expect(src).toMatch(/DEPLOYER_PRIVATE_KEY=0x0+$/m);
  });
});
