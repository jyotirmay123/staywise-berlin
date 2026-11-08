import assert from "node:assert/strict";
import test from "node:test";

async function render(headers = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html", ...headers },
      redirect: "manual",
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
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

  assert.ok([303, 307, 308].includes(response.status));
  assert.equal(
    response.headers.get("location"),
    "http://localhost/signin-with-chatgpt?return_to=%2F",
  );
});

test("renders the private deployment directory for an authenticated user", async () => {
  const response = await render({
    "oai-authenticated-user-email": "jyotirmay@example.com",
    "oai-authenticated-user-full-name": "Jyotirmay%20Senapati",
    "oai-authenticated-user-full-name-encoding": "percent-encoded-utf-8",
  });

  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>Jyotirmay(?:’|&#x27;)s Sites<\/title>/i);
  assert.match(html, /Everything I(?:&#x27;|')ve built/);
  assert.match(html, /PDF Manager/);
  assert.match(html, /Aster Portfolio/);
  assert.match(html, /Jyotirmay Senapati/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});
