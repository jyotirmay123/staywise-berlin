import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

const base = process.env.PAGES_BASE_PATH || "/staywise-berlin/apps/pdf-manager/";
if (!base.startsWith("/") || !base.endsWith("/")) {
  throw new Error("PAGES_BASE_PATH must start and end with a slash.");
}

export default defineConfig({
  base,
  publicDir: false,
  plugins: [react(), {
    name: "local-pdf-resources",
    async generateBundle() {
      this.emitFile({ type: "asset", fileName: "favicon.svg", source: await readFile(resolve("public/favicon.svg")) });
      for (const folder of ["cmaps", "standard_fonts", "wasm"]) {
        const source = resolve("node_modules/pdfjs-dist", folder);
        for (const entry of await readdir(source, { withFileTypes: true })) {
          if (!entry.isFile()) continue;
          this.emitFile({ type: "asset", fileName: `pdfjs/${folder}/${entry.name}`, source: await readFile(resolve(source, entry.name)) });
        }
      }
    },
  }],
  define: { "import.meta.env.PDFJS_RESOURCE_BASE": JSON.stringify(`${base}pdfjs/`) },
  build: { outDir: "dist-pages", emptyOutDir: true, assetsInlineLimit: 0 },
});
