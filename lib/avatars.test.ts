import { describe, it, expect } from "vitest";
import { AVATARS, avatarFor } from "./avatars";

describe("avatars", () => {
  it("has 10 entries", () => {
    expect(AVATARS.length).toBe(10);
  });
  it("avatarFor unknown → av-0", () => {
    const a = avatarFor("not-a-real-id");
    expect(a.id).toBe("av-0");
  });
  it("avatarFor av-5 returns the frog", () => {
    const a = avatarFor("av-5");
    expect(a.emoji).toBe("🐸");
  });
  it("avatarFor undefined → av-0", () => {
    expect(avatarFor(undefined).id).toBe("av-0");
  });
});
