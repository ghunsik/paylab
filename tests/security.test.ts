import assert from "node:assert/strict";
import test from "node:test";
import {
  buildContentSecurityPolicy,
  canonicalOriginResponse,
  responseWithSecurityHeaders,
} from "../worker/security.ts";

test("redirects safe requests to the canonical origin", () => {
  const response = canonicalOriginResponse(
    new Request(
      "https://paylab-kr-renewal.tododok.chatgpt.site/calculators/salary?from=alias",
    ),
    true,
  );

  assert.equal(response?.status, 308);
  assert.equal(
    response?.headers.get("location"),
    "https://paylab.kr/calculators/salary?from=alias",
  );
  assert.equal(canonicalOriginResponse(new Request("https://paylab.kr/"), true), null);
});

test("does not forward unsafe methods from alternate origins", () => {
  const response = canonicalOriginResponse(
    new Request("https://www.paylab.kr/api/analytics", {
      method: "POST",
      body: "{}",
    }),
    true,
  );

  assert.equal(response?.status, 421);
  assert.equal(response?.headers.get("location"), null);
});

test("adds strict response security headers", () => {
  const policy = buildContentSecurityPolicy("abc123");
  const response = responseWithSecurityHeaders(
    new Response("ok"),
    policy,
    new URL("https://paylab.kr/"),
  );

  assert.equal(response.headers.get("content-security-policy"), policy);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.match(policy, /script-src 'self' 'nonce-abc123'/);
  assert.match(policy, /frame-ancestors 'none'/);
  assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/);
});
