import { describe, it, expect } from "vitest";
import {
  isTestAccount,
  filterPublicEntries,
  takeFiltered,
} from "./account-filter";

describe("isTestAccount", () => {
  it("matches gp_, pr_, smoke, prod_smoke, review prefixes", () => {
    expect(isTestAccount("gp_alice")).toBe(true);
    expect(isTestAccount("pr_bob")).toBe(true);
    expect(isTestAccount("smoke_charlie")).toBe(true);
    expect(isTestAccount("smokeAccount")).toBe(true);
    expect(isTestAccount("prod_smoke_walker")).toBe(true);
    expect(isTestAccount("review_carter")).toBe(true);
  });

  it("matches e2e_, test_, qa_, playwright prefixes", () => {
    expect(isTestAccount("e2e_eve")).toBe(true);
    expect(isTestAccount("test_dan")).toBe(true);
    expect(isTestAccount("qa_grace")).toBe(true);
    expect(isTestAccount("playwright_user")).toBe(true);
  });

  it("matches the _bot suffix used by bot-protection spec", () => {
    expect(isTestAccount("foo_bot")).toBe(true);
  });

  it("is case-insensitive on the prefix", () => {
    expect(isTestAccount("GP_alice")).toBe(true);
    expect(isTestAccount("Smoke_X")).toBe(true);
  });

  it("does not match real-looking usernames", () => {
    expect(isTestAccount("anna")).toBe(false);
    expect(isTestAccount("jakub_p")).toBe(false);
    expect(isTestAccount("sko_user")).toBe(false);
    expect(isTestAccount("przemek")).toBe(false);
    expect(isTestAccount("")).toBe(false);
  });

  it("does not false-positive partial matches inside the username", () => {
    // The flagged tokens have to be at the start (or `_bot` at the end)
    expect(isTestAccount("nasmoke")).toBe(false);
    expect(isTestAccount("user_gp_x")).toBe(false);
    expect(isTestAccount("bot_user")).toBe(false);
  });
});

describe("filterPublicEntries", () => {
  it("removes test accounts from a leaderboard list", () => {
    const entries = [
      { username: "anna", xp: 100 },
      { username: "gp_smoke_1", xp: 90 },
      { username: "jakub", xp: 80 },
      { username: "pr_test", xp: 70 },
    ];
    const out = filterPublicEntries(entries);
    expect(out.map((e) => e.username)).toEqual(["anna", "jakub"]);
  });

  it("preserves order", () => {
    const entries = [
      { username: "z", xp: 3 },
      { username: "a", xp: 2 },
      { username: "m", xp: 1 },
    ];
    expect(filterPublicEntries(entries).map((e) => e.username)).toEqual([
      "z",
      "a",
      "m",
    ]);
  });
});

describe("takeFiltered", () => {
  it("returns up to n entries that survive the filter", () => {
    const raw = [
      { username: "gp_a", xp: 10 },
      { username: "anna", xp: 9 },
      { username: "pr_b", xp: 8 },
      { username: "jakub", xp: 7 },
      { username: "zofia", xp: 6 },
      { username: "mateusz", xp: 5 },
    ];
    expect(takeFiltered(raw, 3).map((e) => e.username)).toEqual([
      "anna",
      "jakub",
      "zofia",
    ]);
  });

  it("returns fewer than n when the source is too small", () => {
    const raw = [
      { username: "gp_a", xp: 10 },
      { username: "anna", xp: 9 },
    ];
    expect(takeFiltered(raw, 5)).toHaveLength(1);
  });

  it("returns [] for empty input", () => {
    expect(takeFiltered([], 5)).toEqual([]);
  });
});
