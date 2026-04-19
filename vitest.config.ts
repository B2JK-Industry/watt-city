import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // `server-only` is Next.js's build-time guard. Under vitest the
      // guard fires on import even though the test runs in Node, so
      // we alias it to a no-op module. Runtime behaviour under `next
      // build` is unaffected.
      "server-only": path.resolve(__dirname, "lib/test-utils/server-only-shim.ts"),
    },
  },
  test: {
    include: ["**/*.test.ts", "**/*.test.tsx"],
    exclude: ["node_modules", "dist", ".next", "e2e", "playwright-report"],
  },
});
