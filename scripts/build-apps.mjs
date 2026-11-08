import { readFile, readdir, mkdir, cp, writeFile, stat, rm } from 'node:fs/promises';
import { resolve, join, relative } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

const root = resolve(import.meta.dirname, '..');
const catalog = JSON.parse(await readFile(join(root, 'apps/catalog.json'), 'utf8'));
if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.apps)) throw new Error('Unsupported app catalog');
const destination = join(root, 'dist/apps');
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
const outputs = [];
const slugs = new Set();
for (const app of catalog.apps) {
  if (!/^[a-z0-9-]+$/.test(app.slug) || slugs.has(app.slug)) throw new Error('Invalid or duplicate app slug');
  slugs.add(app.slug);
  if (['unavailable', 'external'].includes(app.mode)) continue;
  const cwd = join(root, 'apps', app.slug);
  for (const args of app.commands) {
    if (!Array.isArray(args) || !args.length || args.some(x => typeof x !== 'string')) throw new Error('Invalid build command');
    const result = spawnSync(args[0], args.slice(1), { cwd, stdio: 'inherit', env: process.env });
    if (result.status !== 0) throw new Error(`${app.title}: command failed`);
  }
  if (!['dist', 'dist-pages'].includes(app.output)) throw new Error('Unsupported output directory');
  const source = join(cwd, app.output);
  if (!(await stat(join(source, 'index.html'))).isFile()) throw new Error(`${app.title}: missing index.html`);
  await cp(source, join(destination, app.slug), { recursive: true });
  const files = [];
  async function fingerprint(dir) {
    for (const entry of (await readdir(dir, { withFileTypes: true })).sort((a,b)=>a.name.localeCompare(b.name))) {
      const path = join(dir, entry.name);
      if (entry.isSymbolicLink()) throw new Error('Symlinks are not supported in published app assets');
      if (entry.isDirectory()) await fingerprint(path);
      else {
        const content = await readFile(path);
        files.push({ path: relative(join(destination, app.slug), path).split('\\').join('/'), bytes: content.length, sha256: createHash('sha256').update(content).digest('hex') });
      }
    }
  }
  await fingerprint(join(destination, app.slug));
  const manifest = { schemaVersion: 1, app: app.slug, mode: app.mode, files };
  await writeFile(join(destination, app.slug, 'resource-manifest.json'), JSON.stringify(manifest, null, 2));
  outputs.push({ app: app.slug, resources: files.length });
}
await cp(join(root, 'apps/gallery.html'), join(destination, 'index.html'));
await writeFile(join(destination, 'catalog.json'), JSON.stringify(catalog, null, 2));
console.log('Published app resource manifests:', outputs);
