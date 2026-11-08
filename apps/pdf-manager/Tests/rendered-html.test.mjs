import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(headers = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", ...headers },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
      IMAGES: {
        input() {
          throw new Error("Image optimization is not used in this test.");
        },
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("redirects anonymous visitors to ChatGPT sign-in", async () => {
  const response = await render();
  assert.ok([302, 303, 307, 308].includes(response.status));
  assert.match(
    response.headers.get("location") ?? "",
    /\/signin-with-chatgpt\?return_to=/,
  );
});

test("renders the private workbench for an authenticated ChatGPT user", async () => {
  const response = await render({
    "oai-authenticated-user-email": "owner@example.com",
    "oai-authenticated-user-full-name": "Private%20Owner",
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>PDF Manager/);
  assert.match(html, /Private Owner/);
  assert.match(html, /Browser-only processing/);
  assert.match(html, /Zero file storage/);
  assert.match(html, /One-hour maximum/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("keeps translation bidirectional and summaries English-only", async () => {
  const source = await readFile(
    new URL("../app/workbench.tsx", import.meta.url),
    "utf8",
  );
  assert.match(source, /\{ code: "en", label: "English" \}/);
  assert.match(source, /label="Document language"/);
  assert.match(source, /label="Target language"/);
  assert.match(
    source,
    /translateInBrowser\(extracted, sourceLanguage, "en"\)/,
  );
  assert.match(source, /title="English summary"/);
});
