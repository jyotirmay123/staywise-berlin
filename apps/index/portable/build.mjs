import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.dirname(fileURLToPath(import.meta.url));
const output = path.join(root, "..", "dist-pages");
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const name of ["index.html", "styles.css", "app.js"]) {
  try { await cp(path.join(root, name), path.join(output, name)); }
  catch (error) { if (name !== "app.js" || error.code !== "ENOENT") throw error; }
}
const manifest = JSON.parse(await readFile(path.join(root, "..", "migration-manifest.json"), "utf8"));
await writeFile(path.join(output, "migration-manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
await writeFile(path.join(output, ".nojekyll"), "");
console.log(`Static deployment built: ${output}`);
