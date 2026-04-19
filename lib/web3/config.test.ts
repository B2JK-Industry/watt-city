import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

/* W1 guard — web3 libs must stay out of the default bundle.
 *
 * The invariant: no file that the default app shell renders (layout,
 * site-nav, home page, any non-web3 route) may import wagmi, viem, or
 * @rainbow-me/rainbowkit. Those belong strictly in lib/web3/,
 * components/web3/, app/api/web3/, scripts/, and contract tooling.
 *
 * Static grep is enough — if a regression adds `import "wagmi"` to
 * app/layout.tsx, CI catches it here before it hits the bundle.
 */

const WEB3_MODULE_PATTERNS = [
  /from\s+["']wagmi["']/,
  /from\s+["']wagmi\//,
  /from\s+["']viem["']/,
  /from\s+["']viem\//,
  /from\s+["']@rainbow-me\/rainbowkit["']/,
  /from\s+["']@rainbow-me\/rainbowkit\//,
];

const SHARED_SHELL_FILES = [
  "app/layout.tsx",
  "app/page.tsx",
  "components/site-nav.tsx",
  "components/city-scene.tsx",
];

function importsWeb3(path: string): boolean {
  let src: string;
  try {
    src = readFileSync(join(process.cwd(), path), "utf8");
  } catch {
    return false;
  }
  return WEB3_MODULE_PATTERNS.some((re) => re.test(src));
}

describe("W1 — web3 libs stay out of the default shell", () => {
  for (const file of SHARED_SHELL_FILES) {
    it(`${file} does not import web3 libs`, () => {
      expect(importsWeb3(file)).toBe(false);
    });
  }

  it("lib/web3/config.ts exists and targets Base Sepolia", () => {
    const src = readFileSync(
      join(process.cwd(), "lib/web3/config.ts"),
      "utf8",
    );
    expect(src).toMatch(/baseSepolia/);
    expect(src).toMatch(/84532/);
    expect(src).toMatch(/getDefaultConfig/);
  });

  it(".env.example documents the web3 env vars without leaking secrets", () => {
    const env = readFileSync(join(process.cwd(), ".env.example"), "utf8");
    expect(env).toMatch(/NEXT_PUBLIC_WEB3_ENABLED=\s*$/m);
    expect(env).toMatch(/NEXT_PUBLIC_WEB3_CHAIN_ID=84532/);
    expect(env).toMatch(/NEXT_PUBLIC_WC_PROJECT_ID=\s*$/m);
    expect(env).toMatch(/WEB3_CONTRACT_ADDRESS=0x0+$/m);
    // Relayer + deployer keys may appear only as zero-stubs in the example.
    expect(env).toMatch(/WEB3_RELAYER_PRIVATE_KEY=0x0+$/m);
    expect(env).toMatch(/DEPLOYER_PRIVATE_KEY=0x0+$/m);
  });
});
