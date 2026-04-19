import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* Phase 8 — static contract-invariant check.
 *
 * The WattCityMedal.sol source is the deployment artefact. Until the
 * operator sets up Hardhat v2 or Foundry (see docs/web3/DEPLOY.md),
 * we run deterministic source-level checks that the high-risk
 * invariants can't regress:
 *
 *   - `transferFrom` / `safeTransferFrom` always revert (soulbound)
 *   - `approve` / `setApprovalForAll` always revert (cannot delegate)
 *   - mint / burn gated by `onlyOwner`
 *   - ERC-165 interface IDs are ERC-165 + ERC-721 base only (no Metadata)
 *
 * Static checks won't catch every bug, but they catch the common
 * mistakes: un-soulbound the contract, accidentally allow approvals,
 * open mint to everyone. When the operator runs Hardhat/Foundry tests
 * we get full EVM-level coverage on top.
 */

const source = readFileSync(
  join(process.cwd(), "contracts/WattCityMedal.sol"),
  "utf8",
);

describe("WattCityMedal — source invariants", () => {
  it("soulbound: transferFrom / safeTransferFrom always revert", () => {
    const tf = source.match(/function transferFrom\([^)]*\)[^{]*\{([^}]+)\}/);
    const stf = source.match(/function safeTransferFrom\([^)]*\)[^{]*\{([^}]+)\}/g);
    expect(tf, "transferFrom body").toBeTruthy();
    expect(tf![1]).toMatch(/revert\s+Soulbound\(\)/);
    expect(stf, "safeTransferFrom bodies").toBeTruthy();
    for (const m of stf!) expect(m).toMatch(/revert\s+Soulbound\(\)/);
  });

  it("approvals disabled — approve + setApprovalForAll always revert", () => {
    const approveBody = source.match(/function approve\([^)]*\)[^{]*\{([^}]+)\}/);
    const setApprBody = source.match(/function setApprovalForAll\([^)]*\)[^{]*\{([^}]+)\}/);
    expect(approveBody![1]).toMatch(/revert\s+ApprovalsDisabled\(\)/);
    expect(setApprBody![1]).toMatch(/revert\s+ApprovalsDisabled\(\)/);
  });

  it("mint + burn are onlyOwner-gated", () => {
    const mint = source.match(/function mint\([\s\S]+?\)\s+external\s+onlyOwner/);
    const burn = source.match(/function burn\([\s\S]+?\)\s+external\s+onlyOwner/);
    expect(mint, "mint onlyOwner").toBeTruthy();
    expect(burn, "burn onlyOwner").toBeTruthy();
  });

  it("supportsInterface claims ERC-165 + ERC-721 base only (no Metadata)", () => {
    expect(source).toMatch(/0x01ffc9a7/); // ERC-165
    expect(source).toMatch(/0x80ac58cd/); // ERC-721
    expect(source).not.toMatch(/0x5b5e139f/); // ERC-721 Metadata — intentionally absent
  });

  it("ownership: transferOwnership present + onlyOwner", () => {
    expect(source).toMatch(/function transferOwnership\(address newOwner\)\s+external\s+onlyOwner/);
  });

  it("no selfdestruct anywhere", () => {
    expect(source).not.toMatch(/selfdestruct/);
  });

  it("no external call from onlyOwner modifier (reentrancy guard)", () => {
    const modifier = source.match(/modifier onlyOwner\(\)\s*\{([^}]+)\}/);
    expect(modifier![1]).not.toMatch(/\.call\(|\.transfer\(|\.send\(/);
  });
});
