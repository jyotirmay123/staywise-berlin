import assert from "node:assert/strict";
import { readFile, access } from "node:fs/promises";
import test from "node:test";
import vm from "node:vm";
import { parsePortfolioExport } from "../lib/portable-data.ts";
import { EMPTY_PORTFOLIO, portfolioValue } from "../lib/domain.ts";

const output = new URL("../dist-pages/", import.meta.url);
const base = "/staywise-berlin/apps/aster/";

const example = {
  ...EMPTY_PORTFOLIO, lastFxRate: 100, lastFxDate: "2026-01-01",
  investments: [{ id: "example", name: "Example fund", category: "Equity", currency: "EUR", expectedAnnualReturn: 5, createdAt: "2026-01-01T00:00:00Z" }],
  valuations: [{ id: "snapshot", investmentId: "example", amount: 100, currency: "EUR", eurInrRate: 100, valuedAt: "2026-01-01", note: "Illustrative test", createdAt: "2026-01-01T00:00:00Z" }],
};

test("portable JSON roundtrips existing v1 portfolios and excludes unrelated credentials", () => {
  assert.deepEqual(parsePortfolioExport(JSON.stringify(EMPTY_PORTFOLIO)), EMPTY_PORTFOLIO);
  const restored = parsePortfolioExport(JSON.stringify({ ...example, vaultKey: "unrelated" }));
  assert.deepEqual(restored, example);
  assert.equal(portfolioValue(restored, "INR"), 10000);
});

test("malformed imports fail before any data is replaced", () => {
  for (const data of [null, {}, { ...example, investments: [null] }, { ...example, lastFxRate: "100" }, { ...example, valuations: [{ ...example.valuations[0], investmentId: "missing" }] }, { ...example, valuations: [{ ...example.valuations[0], valuedAt: "2026-02-31" }] }, { ...example, investments: [...example.investments, ...example.investments] }]) {
    assert.throws(() => parsePortfolioExport(JSON.stringify(data)));
  }
});

test("static HTML and manifest keep every local resource in the app subdirectory", async () => {
  const html = await readFile(new URL("index.html", output), "utf8");
  const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", output), "utf8"));
  const references = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(references.length >= 5);
  for (const reference of references) {
    assert.ok(reference.startsWith(base), reference);
    await access(new URL(reference.slice(base.length), output));
  }
  for (const field of ["id", "scope", "start_url"]) assert.equal(manifest[field], base);
  for (const icon of manifest.icons) assert.ok(icon.src.startsWith(base));
});

test("offline worker precaches emitted JS/CSS and ignores siblings and external FX", async () => {
  const source = await readFile(new URL("sw.js", output), "utf8");
  const handlers = new Map();
  let installed;
  let deleted = [];
  let intercepted = false;
  const context = {
    URL, Promise,
    self: { location: { origin: "https://example.test" }, addEventListener: (name, fn) => handlers.set(name, fn), skipWaiting() {}, clients: { claim() {} } },
    caches: { open: async () => ({ addAll: async (files) => { installed = files; } }), keys: async () => ["sibling-cache", "aster-pages:/other/:old", `aster-pages:${base}:old`], delete: async (key) => { deleted.push(key); }, match: async () => new Response("cached") },
    fetch: async () => new Response("network"),
  };
  vm.runInNewContext(source, context);
  let pending;
  handlers.get("install")({ waitUntil(value) { pending = value; } });
  await pending;
  assert.ok(installed.some((name) => /assets\/.*\.js$/.test(name)));
  assert.ok(installed.some((name) => /assets\/.*\.css$/.test(name)));
  for (const reference of installed) await access(new URL(reference.slice(base.length), output));
  handlers.get("activate")({ waitUntil(value) { pending = value; } });
  await pending;
  assert.deepEqual(deleted, [`aster-pages:${base}:old`]);
  for (const url of ["https://example.test/staywise-berlin/apps/other/", "https://api.frankfurter.dev/v2/rate/EUR/INR"]) {
    handlers.get("fetch")({ request: { method: "GET", url }, respondWith() { intercepted = true; } });
  }
  assert.equal(intercepted, false);
});
