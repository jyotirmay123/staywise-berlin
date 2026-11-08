import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("defines Aster product shell and metadata", async () => {
  const [page, layout, application] = await Promise.all([
    readFile(new URL("app/page.tsx", root), "utf8"),
    readFile(new URL("app/layout.tsx", root), "utf8"),
    readFile(new URL("components/portfolio-app.tsx", root), "utf8"),
  ]);

  assert.match(page, /PortfolioApp/);
  assert.match(layout, /Aster — Portfolio, in perspective/);
  assert.match(layout, /manifest:\s*"\/manifest\.webmanifest"/);
  assert.match(application, /Your wealth, in perspective/);
  assert.match(application, /Portfolio overview/);
  assert.match(application, /Offline cache \+ account cloud/);
  assert.match(application, /Edit details/);
  assert.match(application, /Historical INR/);
  assert.match(application, /Previous:/);
  assert.match(application, /Portfolio timeline/);
  assert.match(application, /Starting snapshot/);
  assert.match(application, /Observed range/);
  assert.doesNotMatch(`${page}${layout}${application}`, /codex-preview|react-loading-skeleton/i);
});

test("ships installable and durable-state assets", async () => {
  const [manifest, serviceWorker, hosting, vaultMigration, accountMigration, packageJson] =
    await Promise.all([
      readFile(new URL("app/manifest.ts", root), "utf8"),
      readFile(new URL("public/sw.js", root), "utf8"),
      readFile(new URL(".openai/hosting.json", root), "utf8"),
      readFile(new URL("drizzle/0000_dear_scream.sql", root), "utf8"),
      readFile(new URL("drizzle/0001_faulty_jetstream.sql", root), "utf8"),
      readFile(new URL("package.json", root), "utf8"),
    ]);

  assert.match(manifest, /display:\s*"standalone"/);
  assert.match(manifest, /icon-512\.png/);
  assert.match(serviceWorker, /CACHE_NAME/);
  assert.match(JSON.parse(hosting).project_id, /^appgprj_/);
  assert.equal(JSON.parse(hosting).d1, "DB");
  assert.equal(JSON.parse(hosting).r2, null);
  assert.match(vaultMigration, /CREATE TABLE `portfolio_vaults`/);
  assert.match(accountMigration, /CREATE TABLE `account_portfolios`/);
  assert.match(packageJson, /"@capacitor\/android"/);
  await access(new URL("android/app/src/main/AndroidManifest.xml", root));
  await access(new URL("public/og.png", root));
});
