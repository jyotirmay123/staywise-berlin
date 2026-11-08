import 'fake-indexeddb/auto';
import test from 'node:test';
import assert from 'node:assert/strict';
import { localStore } from '../lib/local-store.ts';

test('import preserves the prior portfolio and commits both changes atomically',async()=>{
  const original={version:1,investments:[{id:'example',name:'Example',category:'Equity',currency:'EUR',expectedAnnualReturn:5,createdAt:'2026-01-01'}],valuations:[],lastFxRate:100,lastFxDate:'2026-01-01',dataUpdatedAt:'2026-01-01T00:00:00Z'};
  const incoming={...original,investments:[{...original.investments[0],name:'Updated example'}],dataUpdatedAt:'2026-02-01T00:00:00Z'};
  await localStore.savePortfolio(original);
  await localStore.importPortfolio(incoming);
  assert.deepEqual(await localStore.loadPortfolio(),incoming);
  assert.deepEqual(await localStore.loadImportBackup(),original);
  // Inject a storage failure after the backup put has been scheduled; neither write may commit.
  await assert.rejects(localStore.importPortfolio({...original,nonCloneable:()=>{}}));
  assert.deepEqual(await localStore.loadPortfolio(),incoming);
  assert.deepEqual(await localStore.loadImportBackup(),original);
});
