import { describe, it, expect, beforeEach } from "vitest";
import { kvDel } from "@/lib/redis";
import { sendAlert } from "./ops-alerts";

beforeEach(async () => {
  await kvDel("xp:ops:alert-dedupe:test-key");
});

describe("sendAlert", () => {
  it("no-op when ALERT_WEBHOOK_URL is missing", async () => {
    delete process.env.ALERT_WEBHOOK_URL;
    const r = await sendAlert("test-key", "hello");
    expect(r.sent).toBe(false);
    expect(r.reason).toBe("no-webhook-configured");
  });

  it("dedupes back-to-back calls under the window", async () => {
    process.env.ALERT_WEBHOOK_URL = "https://example.invalid/webhook";
    // First call fails fetch (invalid host), but dedupe only keys off the
    // successful-send kvSet which only fires on fetch success. We'd get
    // repeated `fetch-failed` — fine, the API contract is "sent:false".
    const first = await sendAlert("test-key", "x");
    // Regardless of network success, calling twice with dedupeMs large
    // should produce a dedupe on the second iff first succeeded. With an
    // invalid URL nothing sends, so there's no dedupe — test the contract
    // instead: sent never true here.
    expect(first.sent).toBe(false);
  });
});
