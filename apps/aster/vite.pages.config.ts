import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const base = process.env.PAGES_BASE ?? "/staywise-berlin/apps/aster/";
if (!base.startsWith("/") || !base.endsWith("/")) throw new Error("PAGES_BASE must begin and end with /");

export default defineConfig({
  root: fileURLToPath(new URL("./pages", import.meta.url)),
  base,
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  build: { outDir: "../dist-pages", emptyOutDir: true },
  plugins: [react(), {
    name: "aster-pages-offline",
    generateBundle(_options, bundle) {
      const files = [...Object.keys(bundle), "icon-192.png", "icon-512.png", "manifest.webmanifest", "favicon.svg"];
      const version = createHash("sha256").update(JSON.stringify(files)).digest("hex").slice(0, 12);
      this.emitFile({ type: "asset", fileName: "manifest.webmanifest", source: JSON.stringify({
        id: base, name: "Aster Portfolio", short_name: "Aster", start_url: base, scope: base,
        display: "standalone", background_color: "#f4f0e7", theme_color: "#10261f",
        icons: [{ src: `${base}icon-192.png`, sizes: "192x192", type: "image/png" }, { src: `${base}icon-512.png`, sizes: "512x512", type: "image/png" }],
      }, null, 2) });
      this.emitFile({ type: "asset", fileName: "sw.js", source: `
const BASE = ${JSON.stringify(base)};
const CACHE_PREFIX = 'aster-pages:' + BASE + ':';
const CACHE_NAME = CACHE_PREFIX + ${JSON.stringify(version)};
const SHELL = ${JSON.stringify(files.map((name) => `${base}${name}`))};
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.pathname.startsWith(BASE)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).catch(() => caches.match(BASE + 'index.html')));
  } else {
    event.respondWith(caches.match(event.request).then((cached) => cached || fetch(event.request)));
  }
});
` });
    },
  }],
});
