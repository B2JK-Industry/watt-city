import { describe, it, expect } from "vitest";
import { isExemptPath } from "./csrf";

describe("CSRF exempt paths", () => {
  it("cron endpoints exempt", () => {
    expect(isExemptPath("/api/cron/rotate-if-due")).toBe(true);
  });
  it("admin endpoints exempt (bearer auth)", () => {
    expect(isExemptPath("/api/admin/player/alice")).toBe(true);
  });
  it("login and register exempt (they set the cookie)", () => {
    expect(isExemptPath("/api/auth/login")).toBe(true);
    expect(isExemptPath("/api/auth/register")).toBe(true);
  });
  it("lang cookie-setter exempt", () => {
    expect(isExemptPath("/api/lang")).toBe(true);
  });
  it("typical mutating route is NOT exempt", () => {
    expect(isExemptPath("/api/score")).toBe(false);
    expect(isExemptPath("/api/buildings/place")).toBe(false);
    expect(isExemptPath("/api/friends")).toBe(false);
  });
});
