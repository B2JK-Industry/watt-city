import { afterEach, beforeEach, describe, expect, it } from "vitest";

/* Integration coverage for the public-leaderboard filter pipeline.
 *
 * The unit tests in `account-filter.test.ts` already prove
 * `isTestAccount` / `takeFiltered` semantics on synthetic input. This
 * file goes one step further and walks the same code path the live
 * `/leaderboard` and anonymous landing pages use:
 *
 *   awardXP(name, gameId, score)        // real Redis write (in-memory
 *                                       // fallback in dev/test)
 *   globalLeaderboard(N)                // real ZSET read
 *   takeFiltered(raw, n)                // public-surface filter
 *
 * Without this test the e2e suite was effectively asserting "no test
 * account showed up", which is true on a freshly-booted in-memory
 * store regardless of whether the filter works. The new assertions
 * seed banned usernames into the Redis fallback FIRST, then prove
 * the filter strips them on the way out.
 */

import { takeFiltered } from "./account-filter";
import {
  awardXP,
  gameLeaderboard,
  globalLeaderboard,
  removeUserFromAllBoards,
} from "./leaderboard";

const REAL_USERS = ["anna", "jakub", "zofia"] as const;
const BANNED_USERS = [
  "gp_alice", // golden-paths
  "pr_bob",   // production-ready
  "smoke_charlie",
  "prod_smoke_walker",
  "review_x",
  "e2e_eve",
  "test_dan",
  "qa_grace",
  "playwright_user",
  "noise_bot", // _bot suffix
] as const;
const ALL = [...REAL_USERS, ...BANNED_USERS] as const;

const GAME_ID = "filter-integration";

beforeEach(async () => {
  // Make sure a previous failing run can't leak into this one.
  await removeUserFromAllBoards(
    [...ALL].join("_") /* never matches */,
    [GAME_ID],
  );
  for (const u of ALL) {
    await removeUserFromAllBoards(u, [GAME_ID]);
  }
});

afterEach(async () => {
  for (const u of ALL) {
    await removeUserFromAllBoards(u, [GAME_ID]);
  }
});

describe("public-surface filter — render path", () => {
  it("strips banned usernames from globalLeaderboard before display", async () => {
    // Seed the in-memory ZSET with both real users and the full set
    // of banned-prefix usernames the test infrastructure injects.
    let score = 100;
    for (const u of [...REAL_USERS, ...BANNED_USERS]) {
      await awardXP(u, GAME_ID, score);
      score += 1; // distinct ranks → deterministic order
    }

    // Pull a deep slice (matches the over-fetch the live
    // app/leaderboard/page.tsx does — fetch 150, take 50).
    const raw = await globalLeaderboard(50);
    expect(raw.length).toBeGreaterThanOrEqual(REAL_USERS.length);

    // Sanity check: at least one banned account is in the raw read.
    // If it's not, the seed didn't take and the assertion below would
    // be a false positive.
    const rawNames = raw.map((e) => e.username);
    const seededBanned = BANNED_USERS.filter((u) => rawNames.includes(u));
    expect(seededBanned.length).toBeGreaterThan(0);

    // Apply the same filter the leaderboard page applies.
    const visible = takeFiltered(raw, 50);
    const visibleNames = visible.map((e) => e.username);

    // No banned username should survive into the rendered list.
    for (const banned of BANNED_USERS) {
      expect(
        visibleNames.includes(banned),
        `banned account '${banned}' leaked into the public leaderboard render`,
      ).toBe(false);
    }
    // All real users must still be present.
    for (const real of REAL_USERS) {
      expect(visibleNames.includes(real)).toBe(true);
    }
  });

  it("strips banned usernames from a per-game leaderboard too", async () => {
    let score = 50;
    for (const u of [...REAL_USERS, ...BANNED_USERS]) {
      await awardXP(u, GAME_ID, score);
      score += 1;
    }
    const raw = await gameLeaderboard(GAME_ID, 50);
    const visible = takeFiltered(raw, 50).map((e) => e.username);
    expect(visible).toEqual(expect.arrayContaining([...REAL_USERS]));
    for (const banned of BANNED_USERS) {
      expect(visible).not.toContain(banned);
    }
  });

  it("over-fetch + take respects requested cap when reals are scarce", async () => {
    // Seed only 2 real users + many banned. Asking for top 5 should
    // return exactly 2 (not pad with banned to fill the cap).
    await awardXP("anna", GAME_ID, 200);
    await awardXP("jakub", GAME_ID, 190);
    for (const u of BANNED_USERS) {
      await awardXP(u, GAME_ID, 180);
    }
    const raw = await globalLeaderboard(50);
    const top5 = takeFiltered(raw, 5).map((e) => e.username);
    expect(top5).toEqual(["anna", "jakub"]);
  });
});
