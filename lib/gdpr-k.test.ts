import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import {
  ageBucketFromBirthYear,
  requiresParentalConsent,
  containsPII,
  writeAgeBucket,
  readAgeBucket,
  openConsentRequest,
  grantConsent,
  hasParentalConsent,
  readConsentAudit,
} from "./gdpr-k";

async function reset(u: string) {
  await kvDel(`xp:user:${u}:age-bucket`);
  await kvDel(`xp:user:${u}:birth-year`);
  await kvDel(`xp:consent-granted:${u}`);
  await kvDel(`xp:parental-consent:${u}`);
}

describe("ageBucketFromBirthYear", () => {
  const now = new Date(Date.UTC(2026, 3, 19));
  it("returns under-13 for a 10-year-old", () => {
    expect(ageBucketFromBirthYear(2016, now)).toBe("under-13");
  });
  it("returns 13-15 for a 14-year-old", () => {
    expect(ageBucketFromBirthYear(2012, now)).toBe("13-15");
  });
  it("returns 16-plus for a 16-year-old exact", () => {
    expect(ageBucketFromBirthYear(2010, now)).toBe("16-plus");
  });
  it("16-plus does NOT require consent; under-16 does", () => {
    expect(requiresParentalConsent("16-plus")).toBe(false);
    expect(requiresParentalConsent("13-15")).toBe(true);
    expect(requiresParentalConsent("under-13")).toBe(true);
  });
});

describe("containsPII", () => {
  it("flags an email", () => {
    expect(containsPII("daniel@example.com")).toBe("email");
  });
  it("flags a PL phone number", () => {
    expect(containsPII("+48 500 123 456")).toBe("phone");
  });
  it("flags a 'First Last' name pair", () => {
    expect(containsPII("Daniel Babjak")).toBe("name-pair");
  });
  it("accepts a nickname", () => {
    expect(containsPII("pixelfox42")).toBeNull();
  });
});

describe("age bucket persistence", () => {
  beforeEach(async () => {
    await reset("alice");
  });
  it("writeAgeBucket + readAgeBucket round-trip", async () => {
    await writeAgeBucket("alice", 2015);
    expect(await readAgeBucket("alice")).toBe("under-13");
  });
});

describe("parental consent flow", () => {
  beforeEach(async () => {
    await reset("kid1");
  });

  it("open + grant sets the granted record + audit entry", async () => {
    const pending = await openConsentRequest("kid1", "mom@example.com");
    const g = await grantConsent(pending.token);
    expect(g.ok).toBe(true);
    if (!g.ok) return;
    expect(g.child).toBe("kid1");
    expect(await hasParentalConsent("kid1")).toBe(true);
    const audit = await readConsentAudit("kid1");
    expect(audit.find((a) => a.kind === "granted")).toBeTruthy();
  });

  it("granting twice with the same token is rejected", async () => {
    const pending = await openConsentRequest("kid1", "mom@example.com");
    await grantConsent(pending.token);
    const second = await grantConsent(pending.token);
    expect(second.ok).toBe(false);
  });

  it("unknown token rejected", async () => {
    const r = await grantConsent("not-a-real-token");
    expect(r.ok).toBe(false);
  });
});
