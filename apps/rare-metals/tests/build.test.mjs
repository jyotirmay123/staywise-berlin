import test from 'node:test';import assert from 'node:assert/strict';import {spawnSync} from 'node:child_process';import {access,readFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url);
test('build leaves inventory to parent assembler so no manifest hashes its own replaced bytes',async()=>{
 const r=spawnSync(process.execPath,['scripts/build.mjs'],{cwd:root,encoding:'utf8'});assert.equal(r.status,0,r.stderr);
 await assert.rejects(access(new URL('dist/resource-manifest.json',root)));
 for(const p of ['index.html','src/app.mjs','src/worker.mjs','styles.css','data/metals.json'])assert.ok((await readFile(new URL('dist/'+p,root))).length);
});
