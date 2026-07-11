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
  assert.match(html, /받을 돈을/);
  assert.match(html, /10초 실수령액 계산/);
  assert.match(html, /\/calculators\/severance/);
  assert.match(html, /\/og\.png/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("calculator routes render unique content", async () => {
  const response = await render("/calculators/severance");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /퇴직금 계산기/);
  assert.match(html, /근로관계 종료일/);
  assert.match(html, /고용노동부 퇴직금 계산기/);
});
