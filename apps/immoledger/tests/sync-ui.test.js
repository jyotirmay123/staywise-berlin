import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/github-api.js';
import {initialState} from '../dist/data.js';
import {deserializeScenario} from '../dist/storage.js';

async function session(t,options={}){
 const api=await fixture(t),module=await import('../dist/sync-ui.js');let value=initialState(),dirty=false;
 value.properties[0].name='Current browser';
 const stored=new Map(),toasts=[];
 const ui=module.createSyncUI({fetcher:api.fetcher,getState:()=>value,replaceState:next=>{value=next;},hasUnsaved:()=>dirty,beforeSync:()=>true,storage:{getItem:k=>stored.get(k),setItem:(k,v)=>{if(options.blocked)throw new Error('Quota');stored.set(k,v);}},confirm:()=>options.confirm!==false,toast:message=>toasts.push(message),onChange(){},pollMs:0});
 t.after(()=>ui.disconnect());
 return {api,ui,stored,toasts,get value(){return value;},setDirty(v){dirty=v;},edit(name){value.properties[0].name=name;ui.changed();}};
}
test('connecting never replaces local data; explicit load backs it up before enabling sync',async t=>{
 const s=await session(t);await s.ui.connect('synthetic-token');assert.equal(s.value.properties[0].name,'Current browser');assert.equal(s.api.writes,0);
 await s.ui.load();assert.equal(s.value.properties[0].name,'Demo apartment A');assert.equal(deserializeScenario(s.stored.get('immoledger.sync.previous.v1')).properties[0].name,'Current browser');assert.equal(s.ui.active,true);
});
test('saved edits upload automatically and clean polling observes another client',async t=>{
 const s=await session(t);await s.ui.connect('synthetic-token');await s.ui.publish();s.edit('Newest browser value');await s.ui.flush();assert.equal(s.api.saved.scenario.properties[0].name,'Newest browser value');
 const next=initialState();next.properties[0].name='Other device';s.api.edit(JSON.stringify({revision:10,scenario:next}));await s.ui.poll();assert.equal(s.value.properties[0].name,'Other device');
});
test('polling never discards unsaved forms or failed local uploads',async t=>{
 const s=await session(t);await s.ui.connect('synthetic-token');await s.ui.load();
 const next=initialState();next.properties[0].name='Other device';s.api.edit(JSON.stringify({revision:10,scenario:next}));s.setDirty(true);await s.ui.poll();assert.equal(s.value.properties[0].name,'Demo apartment A');
 s.setDirty(false);s.edit('Local edit');await s.ui.flush();assert.equal(s.ui.active,false);await s.ui.poll();assert.equal(s.value.properties[0].name,'Local edit');assert.equal(s.api.saved.scenario.properties[0].name,'Other device');
});
test('cancel and failed recovery backup leave browser state untouched',async t=>{
 for(const options of [{confirm:false},{blocked:true}]){const s=await session(t,options);await s.ui.connect('synthetic-token');await s.ui.load();assert.equal(s.value.properties[0].name,'Current browser');assert.equal(s.ui.active,false);}
});
test('disconnect clears queued uploads and later edits stay local',async t=>{
 const s=await session(t);await s.ui.connect('synthetic-token');await s.ui.load();s.edit('Queued');s.ui.disconnect();await s.ui.flush();assert.equal(s.api.writes,0);assert.equal(s.ui.pending,false);s.edit('Offline');await s.ui.flush();assert.equal(s.api.writes,0);
});
test('edits during first publication are uploaded before declaring the browser synced',async t=>{
 const s=await session(t);await s.ui.connect('synthetic-token');const gate=s.api.holdWrite();const publishing=s.ui.publish();await gate.started;s.edit('Edited during initial publication');gate.release();await publishing;await s.ui.flush();assert.equal(s.api.saved.scenario.properties[0].name,'Edited during initial publication');await s.ui.poll();assert.equal(s.value.properties[0].name,'Edited during initial publication');
});
test('explicit repository load never overwrites edits made while its request is pending',async t=>{
 const s=await session(t);await s.ui.connect('synthetic-token');const gate=s.api.holdRead();const loading=s.ui.load();await gate.started;s.edit('Edited during load');gate.release();await loading;assert.equal(s.value.properties[0].name,'Edited during load');assert.equal(s.ui.active,false);
});
