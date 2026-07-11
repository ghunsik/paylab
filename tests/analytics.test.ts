import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAnalyticsPath, parseAnalyticsEvent } from "../lib/analytics.ts";
import { TokenBucket } from "../lib/analytics-rate-limit.ts";
import {
  isSameOriginAnalyticsRequest,
  readLimitedJson,
} from "../lib/analytics-request.ts";

test("normalizes safe paths without queries or trailing slashes", () => {
  assert.equal(normalizeAnalyticsPath("/calculators/salary/?utm_source=test"), "/calculators/salary");
  assert.equal(normalizeAnalyticsPath("/"), "/");
});

test("rejects external, internal, and oversized paths", () => {
  assert.equal(normalizeAnalyticsPath("https://example.com/"), null);
  assert.equal(normalizeAnalyticsPath("/analytics"), null);
  assert.equal(normalizeAnalyticsPath("/api/analytics"), null);
  assert.equal(normalizeAnalyticsPath("/not-a-real-page"), null);
  assert.equal(normalizeAnalyticsPath("/calculators/not-real"), null);
  assert.equal(normalizeAnalyticsPath(`/${"a".repeat(200)}`), null);
});

test("accepts only supported anonymous aggregate events", () => {
  assert.deepEqual(
    parseAnalyticsEvent({ metric: "pageview", path: "/standards" }),
    { metric: "pageview", path: "/standards" },
  );
  assert.deepEqual(
    parseAnalyticsEvent({ metric: "calculation", path: "/calculators/salary" }),
    { metric: "calculation", path: "/calculators/salary" },
  );
  assert.equal(parseAnalyticsEvent({ metric: "visitor", path: "/" }), null);
  assert.equal(parseAnalyticsEvent({ metric: "calculation", path: "/" }), null);
  assert.equal(
    parseAnalyticsEvent({ metric: "pageview", path: "/", salary: 3_000_000 }),
    null,
  );
});

test("requires an exact same-origin analytics request", () => {
  const request = (origin?: string, fetchSite?: string) =>
    new Request("https://paylab.kr/api/analytics", {
      method: "POST",
      headers: {
        ...(origin ? { origin } : {}),
        ...(fetchSite ? { "sec-fetch-site": fetchSite } : {}),
      },
      body: "{}",
    });

  assert.equal(isSameOriginAnalyticsRequest(request("https://paylab.kr", "same-origin")), true);
  assert.equal(isSameOriginAnalyticsRequest(request()), false);
  assert.equal(isSameOriginAnalyticsRequest(request("https://paylab.kr.evil")), false);
  assert.equal(isSameOriginAnalyticsRequest(request("https://paylab.kr", "cross-site")), false);
  assert.equal(
    isSameOriginAnalyticsRequest(
      new Request("https://paylab-kr-renewal.tododok.chatgpt.site/api/analytics", {
        method: "POST",
        headers: { origin: "https://paylab.kr" },
        body: "{}",
      }),
    ),
    false,
  );
});

test("reads only small valid JSON bodies", async () => {
  const valid = new Request("https://paylab.kr/api/analytics", {
    method: "POST",
    body: JSON.stringify({ metric: "pageview", path: "/" }),
  });
  assert.deepEqual(await readLimitedJson(valid), {
    ok: true,
    value: { metric: "pageview", path: "/" },
  });

  const oversized = new Request("https://paylab.kr/api/analytics", {
    method: "POST",
    body: JSON.stringify({ value: "x".repeat(600) }),
  });
  assert.deepEqual(await readLimitedJson(oversized), { ok: false, reason: "too-large" });

  const declaredOversized = new Request("https://paylab.kr/api/analytics", {
    method: "POST",
    headers: { "content-length": "999" },
    body: "{}",
  });
  assert.deepEqual(await readLimitedJson(declaredOversized), {
    ok: false,
    reason: "too-large",
  });
});

test("token bucket blocks bursts and refills without identifiers", () => {
  const bucket = new TokenBucket({ capacity: 2, refillPerSecond: 1 }, 0);
  assert.equal(bucket.tryConsume(0), true);
  assert.equal(bucket.tryConsume(0), true);
  assert.equal(bucket.tryConsume(0), false);
  assert.equal(bucket.retryAfterSeconds(), 1);
  assert.equal(bucket.tryConsume(1_000), true);
});
