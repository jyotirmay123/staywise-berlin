import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile,access,readdir} from 'node:fs/promises';
import {initialState} from '../dist/data.js';
import {validateState} from '../dist/engine.js';
const dist=new URL('../dist/',import.meta.url);
const base=new URL('https://example.test/staywise-berlin/apps/immoledger/');

test('every HTML asset, stylesheet asset and module dependency resolves beneath the nested Pages path',async()=>{
 const queue=['index.html'],seen=new Set();
 while(queue.length){const file=queue.shift();if(seen.has(file))continue;seen.add(file);const text=await readFile(new URL(file,dist),'utf8'),refs=[];
  if(file.endsWith('.html'))for(const match of text.matchAll(/(?:src|href)="([^"]+)"/g))if(!match[1].startsWith('data:'))refs.push(match[1]);
  if(file.endsWith('.js'))for(const match of text.matchAll(/\bfrom\s*['"]([^'"]+)['"]/g))refs.push(match[1]);
  if(file.endsWith('.css'))for(const match of text.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g))refs.push(match[1]);
  for(const ref of refs){assert.ok(!/^(?:\/|https?:|\/\/)/.test(ref),`${file}: asset must be relative: ${ref}`);const resolved=new URL(ref,new URL(file,base));assert.ok(resolved.pathname.startsWith(base.pathname),`${file}: asset escapes app folder`);const relative=resolved.pathname.slice(base.pathname.length);await access(new URL(relative,dist));queue.push(relative);}
 }
 for(const required of ['app.js','engine.js','storage.js','data.js','styles.css','planning-ui.js','display.js','risk.js','payroll.js','scenario.js'])assert.ok(seen.has(required),`Module not verified: ${required}`);
});
test('public defaults are explicitly fictional and do not assert verified property or risk facts',()=>{const s=initialState();assert.equal(validateState(s),true);assert.equal(s.demo,true);for(const p of s.properties){assert.match(p.name,/^Demo /);assert.match(p.location,/Illustrative/);assert.match(p.afaEvidence,/Fictional demo/);assert.ok(Object.values(p.confirmations).every(v=>v===false));}assert.equal(s.risk.vacancyStressPercent,null);assert.equal(s.risk.salaryStressPercent,null);});
test('deployment directory contains only the reviewed static app files',async()=>{const actual=(await readdir(dist)).sort();assert.deepEqual(actual,['app.js','data.js','display.js','engine.js','index.html','payroll.js','planning-ui.js','risk.js','scenario.js','storage.js','styles.css'].sort());const css=await readFile(new URL('styles.css',dist),'utf8');assert.doesNotMatch(css,/@import|https?:\/\//);});
