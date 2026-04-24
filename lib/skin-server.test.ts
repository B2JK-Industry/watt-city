import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

/** Module-level cookie state the mock reads from.  Tests manipulate this
 *  directly rather than threading a handle through each test.  Cleared in
 *  beforeEach so one test's state doesn't leak into the next. */
let cookieState: Record<string, string> = {};

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      name in cookieState ? { name, value: cookieState[name] } : undefined,
    set: (name: string, value: string) => {
      cookieState[name] = value;
    },
    delete: (name: string) => {
      delete cookieState[name];
    },
  }),
}));

import { getCurrentSkin, SKIN_COOKIE_NAME, isValidSkin } from "./skin-server";

describe("skin-server — getCurrentSkin cookie precedence", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    cookieState = {};
    delete process.env.SKIN;
    delete process.env.NEXT_PUBLIC_SKIN;
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns cookie value when cookie is valid ('pko')", async () => {
    cookieState[SKIN_COOKIE_NAME] = "pko";
    expect(await getCurrentSkin()).toBe("pko");
  });

  it("returns cookie value when cookie is valid ('core')", async () => {
    cookieState[SKIN_COOKIE_NAME] = "core";
    expect(await getCurrentSkin()).toBe("core");
  });

  it("falls back to env SKIN=pko when cookie absent", async () => {
    process.env.SKIN = "pko";
    expect(await getCurrentSkin()).toBe("pko");
  });

  it("falls back to 'core' when neither cookie nor env is set", async () => {
    expect(await getCurrentSkin()).toBe("core");
  });

  it("ignores invalid cookie values and falls back to env/default", async () => {
    cookieState[SKIN_COOKIE_NAME] = "purple";
    expect(await getCurrentSkin()).toBe("core");
    process.env.SKIN = "pko";
    expect(await getCurrentSkin()).toBe("pko");
  });

  it("cookie takes precedence over env — the whole point of the toggle", async () => {
    process.env.SKIN = "core";
    cookieState[SKIN_COOKIE_NAME] = "pko";
    expect(await getCurrentSkin()).toBe("pko");

    process.env.SKIN = "pko";
    cookieState[SKIN_COOKIE_NAME] = "core";
    expect(await getCurrentSkin()).toBe("core");
  });
});

describe("skin-server — isValidSkin", () => {
  it("accepts 'core' and 'pko'", () => {
    expect(isValidSkin("core")).toBe(true);
    expect(isValidSkin("pko")).toBe(true);
  });

  it("rejects everything else", () => {
    expect(isValidSkin("")).toBe(false);
    expect(isValidSkin("CORE")).toBe(false);
    expect(isValidSkin("pko ")).toBe(false);
    expect(isValidSkin("default")).toBe(false);
    expect(isValidSkin("purple")).toBe(false);
  });
});
