import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* W5 guard — profile-level gallery hooks into the right API routes,
 * follows the feature-flag + consent gate, and keeps the message
 * shape in sync with lib/web3/signatures.ts (any drift and the route
 * will reject the signed message). */

const ROOT = join(__dirname, "..", "..");

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("W5 — medal gallery wiring", () => {
  it("profile page renders gallery only when web3 is enabled", () => {
    const page = read("app/profile/page.tsx");
    expect(page).toMatch(/web3Enabled\(\)/);
    expect(page).toMatch(/Web3MedalGallerySection/);
  });

  it("server-side gate reads consent signals before rendering client", () => {
    const section = read("components/web3/medal-gallery-section.tsx");
    expect(section).toMatch(/readWeb3OptIn/);
    expect(section).toMatch(/readAgeBucket/);
    expect(section).toMatch(/hasParentalConsent/);
    expect(section).toMatch(/requiresParentalConsent/);
    // Fallback CTAs must exist for both missing-opt-in + missing-parent.
    expect(section).toMatch(/optInRequired/);
    expect(section).toMatch(/parentConsentRequired/);
  });

  it("client gallery uses RainbowKit ConnectButton + wagmi hooks", () => {
    const gallery = read("components/web3/medal-gallery.tsx");
    expect(gallery).toMatch(/^"use client"/);
    expect(gallery).toMatch(/ConnectButton/);
    expect(gallery).toMatch(/useAccount/);
    expect(gallery).toMatch(/useSignMessage/);
  });

  it("client gallery POSTs to /api/web3/mint with CSRF header", () => {
    const gallery = read("components/web3/medal-gallery.tsx");
    expect(gallery).toMatch(/\/api\/web3\/mint/);
    expect(gallery).toMatch(/X-CSRF-Token/);
    expect(gallery).toMatch(/wc_csrf/);
  });

  it("mint message built on the client matches the server expectation", () => {
    const gallery = read("components/web3/medal-gallery.tsx");
    const serverSigs = read("lib/web3/signatures.ts");
    // Both sides must share every line of the canonical message so
    // verifyMintSignature accepts the signed payload.
    for (const line of [
      "Watt City — zgoda na mint medalu (soulbound).",
      `User: $`,
      `Achievement: $`,
      `Wallet: $`,
      `Issued: $`,
      `IssuedAt: $`,
    ]) {
      expect(gallery, `client missing "${line}"`).toMatch(line);
      expect(serverSigs, `server missing "${line}"`).toMatch(line);
    }
  });

  it("lazy loader + dynamic import keep web3 code off the default path", () => {
    const lazy = read("components/web3/medal-gallery-lazy.tsx");
    expect(lazy).toMatch(/^"use client"/);
    expect(lazy).toMatch(/dynamic/);
    expect(lazy).toMatch(/ssr:\s*false/);
  });
});
