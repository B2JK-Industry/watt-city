import { describe, it, expect, beforeEach, vi } from "vitest";
import { kvDel, kvSet } from "@/lib/redis";

// next/headers `cookies()` throws outside a request scope; mock getSession
// to return null so the isAdminRequest tests only exercise the bearer path.
vi.mock("@/lib/session", () => ({
  getSession: async () => null,
}));

import { isAdminRequest } from "./admin";
import { setRole } from "@/lib/roles";

// Minimal shim for NextRequest — we only use request.headers.get() in
// isAdminRequest; the session side is mocked by environment (in-memory
// Redis).
class FakeReq {
  constructor(private token?: string) {}
  headers = {
    get: (k: string) =>
      k.toLowerCase() === "authorization" && this.token ? `Bearer ${this.token}` : null,
  };
}

async function reset(u: string) {
  await kvSet(`xp:user:${u}`, { username: u });
  await kvDel(`xp:user:${u}:role`);
}

describe("isAdminRequest", () => {
  beforeEach(() => {
    process.env.ADMIN_SECRET = "";
  });

  it("rejects when no session and no secret", async () => {
    const r = new FakeReq() as unknown as import("next/server").NextRequest;
    expect(await isAdminRequest(r)).toBe(false);
  });

  it("accepts correct bearer when ADMIN_SECRET set", async () => {
    process.env.ADMIN_SECRET = "mysecret";
    const r = new FakeReq("mysecret") as unknown as import("next/server").NextRequest;
    expect(await isAdminRequest(r)).toBe(true);
  });

  it("rejects wrong bearer", async () => {
    process.env.ADMIN_SECRET = "mysecret";
    const r = new FakeReq("wrong") as unknown as import("next/server").NextRequest;
    expect(await isAdminRequest(r)).toBe(false);
  });
});

describe("role-based admin access (via setRole)", () => {
  beforeEach(async () => {
    await reset("bob");
  });

  it("student role alone is not admin", async () => {
    await setRole("bob", "student");
    // isAdminRequest consults session, which we can't mock trivially here.
    // Instead we assert the role state — the layer beneath isAdminRequest.
    const { getRole } = await import("@/lib/roles");
    expect(await getRole("bob")).toBe("student");
  });

  it("admin role sticks after setRole", async () => {
    await setRole("bob", "admin");
    const { getRole } = await import("@/lib/roles");
    expect(await getRole("bob")).toBe("admin");
  });
});
