import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PDFWorkbench } from "../app/workbench";

const base = "/staywise-berlin/apps/pdf-manager/";

test("Pages renders a public workbench with truthful privacy text", () => {
  const html = renderToStaticMarkup(<PDFWorkbench />);
  assert.match(html, /Public app, private files/);
  assert.match(html, /Documents stay in this tab/);
  assert.match(html, /Zero file storage/);
  assert.doesNotMatch(html, /ChatGPT|signout|signin|owner@example/);
});

test("Pages ships local PDF resources and base-relative entry assets", async () => {
  const html = await readFile(new URL("../dist-pages/index.html", import.meta.url), "utf8");
  assert.match(html, new RegExp(`src="${base}assets/`));
  assert.match(html, new RegExp(`href="${base}favicon.svg"`));
  const assets = await readdir(new URL("../dist-pages/assets/", import.meta.url));
  assert.ok(assets.some((name) => /^pdf\.worker.*\.mjs$/.test(name)), "local PDF worker missing");
  for (const folder of ["cmaps", "standard_fonts", "wasm"]) {
    const files = await readdir(new URL(`../dist-pages/pdfjs/${folder}/`, import.meta.url));
    assert.ok(files.length > 0, `${folder} resources missing`);
  }
  const js = (await Promise.all(assets.filter((name) => name.endsWith(".js")).map((name) => readFile(new URL(`../dist-pages/assets/${name}`, import.meta.url), "utf8")))).join("\n");
  assert.ok(js.includes(`${base}pdfjs/`));
  const loaderName = assets.find((name) => /^pdfjs-.*\.js$/.test(name));
  assert.ok(loaderName);
  const loader = await readFile(new URL(`../dist-pages/assets/${loaderName}`, import.meta.url), "utf8");
  assert.ok(loader.includes(`${base}assets/pdf.worker`));
  assert.match(html, /connect-src 'self'/);
  assert.doesNotMatch(js, /oai-authenticated-user-email|next\/headers/);
});
