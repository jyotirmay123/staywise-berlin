import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

test("contains Hindi resin-art storefront and all requested categories", async () => {
  const source = await readFile(new URL("../app/storefront.tsx", import.meta.url), "utf8");
  assert.match(source, /रेज़िन रंग/);
  assert.match(source, /कीचेन्स/);
  assert.match(source, /रिंग्स/);
  assert.match(source, /नेकलेसेस/);
  assert.match(source, /हेयर क्लिप्स/);
  assert.match(source, /नेकलेस \+ इयररिंग सेट्स/);
  assert.doesNotMatch(source, /codex-preview|Your site is taking shape|react-loading-skeleton/);
});

test("contains customer and admin commerce routes", async () => {
  await Promise.all([
    access(new URL("../dist/server/index.js", import.meta.url)),
    access(new URL("../app/api/auth/register/route.ts", import.meta.url)),
    access(new URL("../app/api/orders/route.ts", import.meta.url)),
    access(new URL("../app/api/admin/products/route.ts", import.meta.url)),
    access(new URL("../app/api/admin/orders/route.ts", import.meta.url)),
    access(new URL("../app/api/admin/uploads/route.ts", import.meta.url)),
  ]);
});
