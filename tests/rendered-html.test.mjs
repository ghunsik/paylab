import assert from "node:assert/strict";
import { register } from "node:module";
import test from "node:test";

register(new URL("./cloudflare-workers-loader.mjs", import.meta.url), import.meta.url);

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`https://paylab.kr${pathname}`, {
      headers: { accept: "text/html", host: "paylab.kr", "x-forwarded-proto": "https" },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the finished PAYLAB home page", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /PAYLAB/);
  assert.match(html, /월급 실수령액 계산기/);
  assert.match(html, /2027년에 바뀌는 숫자/);
  assert.match(html, /10,700원/);
  assert.match(html, /\/calculators\/severance/);
  assert.match(html, /\/calculators\/year-end-tax/);
  assert.match(html, /\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("applies strict security headers with matching script nonces", async () => {
  const response = await render();
  const policy = response.headers.get("content-security-policy") ?? "";
  const nonce = /'nonce-([A-Za-z0-9]+)'/.exec(policy)?.[1];

  assert.ok(nonce);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.doesNotMatch(policy, /unsafe-inline|unsafe-eval/);

  const html = await response.text();
  const inlineScripts = (html.match(/<script\b[^>]*>/g) ?? []).filter(
    (tag) => !/\bsrc=/.test(tag),
  );
  assert.ok(inlineScripts.length > 0);
  for (const tag of inlineScripts) {
    assert.match(tag, new RegExp(`\\bnonce=["']${nonce}["']`));
  }
});

test("calculator routes render unique content", async () => {
  const response = await render("/calculators/severance");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /퇴직금 계산기/);
  assert.match(html, /근로관계 종료일/);
  assert.match(html, /고용노동부 퇴직금 계산기/);
});

test("year-end tax calculator route renders its form and method", async () => {
  const response = await render("/calculators/year-end-tax");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /연말정산 환급액 계산기/);
  assert.match(html, /2026년 총급여/);
  assert.match(html, /이미 낸 소득세/);
  assert.match(html, /신용카드 등 소득공제/);
  assert.match(html, /연초 6세 이하/);
  assert.match(html, /의료비: 한도 없는 대상/);
  assert.match(html, /property="og:image" content="https:\/\/paylab\.kr\/og\.png\?v=2"/);
  assert.match(html, /특별재난지역 특례 대상 기부만 있어요/);
});

test("standards page lists both years and unresolved 2027 items", async () => {
  const response = await render("/standards");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /2,236,300원/);
  assert.match(html, /적용 근거를 추가로 확인할 항목/);
  assert.match(html, /2016년 12월 31일 이전 출생/);
});

test("pages carry no inline style attributes that the CSP would block", async () => {
  for (const path of ["/", "/calculators/year-end-tax", "/standards", "/methodology"]) {
    const html = await (await render(path)).text();
    assert.doesNotMatch(html, /<[a-z][^>]*\sstyle=/i, path);
  }
});
