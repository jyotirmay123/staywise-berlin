import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, cp, rm, access } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';

async function fixture(t, app) {
  const root = await mkdtemp(join(tmpdir(), 'app-collection-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(join(root, 'scripts'), { recursive: true });
  await mkdir(join(root, 'apps/demo/dist'), { recursive: true });
  await cp(new URL('../scripts/build-apps.mjs', import.meta.url), join(root, 'scripts/build-apps.mjs'));
  await writeFile(join(root, 'apps/catalog.json'), JSON.stringify({schemaVersion:1,apps:[app]}));
  await writeFile(join(root, 'apps/gallery.html'), '<h1>Directory</h1>');
  await writeFile(join(root, 'apps/demo/dist/index.html'), '<script src="./app.js"></script>');
  await writeFile(join(root, 'apps/demo/dist/app.js'), 'console.log("demo")');
  return root;
}

test('assembly removes stale resources and fingerprints the exact deployed files', async t => {
  const root=await fixture(t,{slug:'demo',title:'Demo',mode:'local',commands:[],output:'dist'});
  await mkdir(join(root,'dist/apps/unavailable'),{recursive:true});
  await writeFile(join(root,'dist/apps/unavailable/private-old.json'),'stale');
  const run=spawnSync(process.execPath,[join(root,'scripts/build-apps.mjs')],{encoding:'utf8'});
  assert.equal(run.status,0,run.stderr);
  await assert.rejects(access(join(root,'dist/apps/unavailable')));
  const manifest=JSON.parse(await readFile(join(root,'dist/apps/demo/resource-manifest.json'),'utf8'));
  assert.equal(manifest.schemaVersion,1);
  assert.equal(manifest.app,'demo');
  assert.equal(manifest.files.length,2);
  for(const file of manifest.files){
    const bytes=await readFile(join(root,'dist/apps/demo',file.path));
    assert.equal(file.bytes,bytes.length);
    assert.equal(file.sha256,createHash('sha256').update(bytes).digest('hex'));
  }
  assert.equal(await readFile(join(root,'dist/apps/index.html'),'utf8'),'<h1>Directory</h1>');
});

test('invalid catalog paths cannot copy outside the collection',async t=>{
  const root=await fixture(t,{slug:'../escape',title:'Bad',mode:'local',commands:[],output:'dist'});
  const run=spawnSync(process.execPath,[join(root,'scripts/build-apps.mjs')],{encoding:'utf8'});
  assert.notEqual(run.status,0);
  assert.match(run.stderr,/Invalid or duplicate app slug/);
});
