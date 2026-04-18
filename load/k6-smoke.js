/* Phase 6.7.6 — k6 load-test script.
 *
 * Stages:
 *   ramp-up over 1 min to 50 vus
 *   sustain 50 vus for 3 min
 *   ramp-up to 500 vus for 2 min  (peak)
 *   sustain 500 vus for 3 min
 *   ramp-down to 0 over 1 min
 *
 * Assertions:
 *   - 95th-percentile latency < 200ms on cacheable GETs
 *   - 95th-percentile latency < 800ms on ledger-mutating POSTs
 *   - Error rate < 1%
 *
 * Run against STAGING only (never prod) with:
 *   k6 run -e BASE_URL=https://staging.watt-city.example load/k6-smoke.js
 *
 * Do NOT commit real usernames to this script — it generates throwaway
 * accounts per VU via a timestamp-suffixed username.
 */

import http from "k6/http";
import { sleep, check } from "k6";
import { Trend } from "k6/metrics";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const landingLatency = new Trend("landing_latency");

export const options = {
  thresholds: {
    "http_req_duration{path:landing}": ["p(95)<200"],
    "http_req_duration{path:register}": ["p(95)<800"],
    "http_req_duration{path:score}": ["p(95)<800"],
    http_req_failed: ["rate<0.01"],
  },
  stages: [
    { duration: "1m", target: 50 },
    { duration: "3m", target: 50 },
    { duration: "2m", target: 500 },
    { duration: "3m", target: 500 },
    { duration: "1m", target: 0 },
  ],
};

function randomName() {
  const ts = Date.now();
  const salt = Math.floor(Math.random() * 1_000_000);
  return `loadtest_${ts}_${salt}`;
}

export default function run() {
  // 1) Landing page — cacheable, cheap.
  const landing = http.get(`${BASE}/`, { tags: { path: "landing" } });
  check(landing, { "landing 200": (r) => r.status === 200 });
  landingLatency.add(landing.timings.duration);
  sleep(1);

  // 2) Register — mutating, exercises auth + GDPR-K path.
  const u = randomName();
  const reg = http.post(
    `${BASE}/api/auth/register`,
    JSON.stringify({
      username: u,
      password: "loadtest-password-1",
      birthYear: 2000,
    }),
    { headers: { "content-type": "application/json" }, tags: { path: "register" } },
  );
  check(reg, { "register ok": (r) => r.status === 200 || r.status === 400 });
  sleep(1);

  // 3) Score submit on an evergreen game — exercises ledger write + leaderboard.
  if (reg.status === 200) {
    const cookie = reg.headers["Set-Cookie"] ?? reg.headers["set-cookie"];
    const score = http.post(
      `${BASE}/api/score`,
      JSON.stringify({ gameId: "finance-quiz", xp: 50 }),
      {
        headers: {
          "content-type": "application/json",
          Cookie: cookie ?? "",
        },
        tags: { path: "score" },
      },
    );
    check(score, { "score ok": (r) => r.status === 200 });
  }
  sleep(1);
}
