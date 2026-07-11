import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAnalyticsPath, parseAnalyticsEvent } from "../lib/analytics.ts";

test("normalizes safe paths without queries or trailing slashes", () => {
  assert.equal(normalizeAnalyticsPath("/calculators/salary/?utm_source=test"), "/calculators/salary");
  assert.equal(normalizeAnalyticsPath("/"), "/");
});

test("rejects external, internal, and oversized paths", () => {
  assert.equal(normalizeAnalyticsPath("https://example.com/"), null);
  assert.equal(normalizeAnalyticsPath("/analytics"), null);
  assert.equal(normalizeAnalyticsPath("/api/analytics"), null);
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
});
