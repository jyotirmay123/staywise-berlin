import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fixture} from './helpers/github-api.js';
import {initialState} from '../dist/data.js';
import {serializeScenario} from '../dist/storage.js';

async function client(t,options){
 const api=await fixture(t,options),module=await import('../dist/github-sync.js');
 return {api,sync:new module.GitHubScenarioSync({fetcher:api.fetcher})};
}
test('private repository loads existing server JSON and saves Unicode without changing scenario fields',async t=>{
 const {api,sync}=await client(t),remote=await sync.connect('synthetic-token');
 assert.equal(remote.scenario.properties[0].rent,initialState().properties[0].rent);
 const value=initialState();value.properties[0].name='Düsseldorf · घर';value.properties[1].enabled=false;
 await sync.publish(value);assert.equal(api.saved.scenario.properties[0].name,'Düsseldorf · घर');assert.equal(api.saved.scenario.properties[1].enabled,false);assert.equal(api.saved.revision,2);assert.equal(sync.active,true);
});
test('stale saves block instead of retrying over another browser, even after checking remote',async t=>{
 const {api,sync}=await client(t);await sync.connect('synthetic-token');sync.accept(sync.remote);
 const updated=initialState();updated.properties[0].rent=777;api.edit(serializeScenario(updated));
 await sync.read();await assert.rejects(sync.publish(initialState()),/newer|changed|conflict/i);
 assert.equal(api.writes,0);assert.equal(api.saved.data.properties[0].rent,777);assert.equal(sync.active,false);
});
test('public repository and invalid credentials never permit upload',async t=>{
 const {api,sync}=await client(t,{privateRepo:false});await assert.rejects(sync.connect('synthetic-token'),/private/i);assert.equal(sync.connected,false);assert.equal(api.writes,0);
 const other=await client(t);await assert.rejects(other.sync.connect('wrong-token'),/GitHub|token|credential/i);assert.equal(other.sync.connected,false);
});
test('missing file can be seeded explicitly and corrupt remote cannot be overwritten',async t=>{
 const {api,sync}=await client(t,{content:null});const remote=await sync.connect('synthetic-token');assert.equal(remote.scenario,null);assert.equal(api.writes,0);await sync.publish(initialState());assert.equal(api.saved.scenario.version,1);
 const corrupt=await client(t,{content:'{broken'});await assert.rejects(corrupt.sync.connect('synthetic-token'));await assert.rejects(corrupt.sync.publish(initialState()));assert.equal(corrupt.api.writes,0);
});
test('disconnect while connecting discards late responses and credentials',async t=>{
 const {sync}=await client(t,{delay:40});const connecting=sync.connect('synthetic-token');sync.disconnect();await assert.rejects(connecting);assert.equal(sync.connected,false);assert.equal(sync.token,'');
});
test('unsupported remote revision and oversized snapshots preserve repository data',async t=>{
 const bad=await client(t,{content:JSON.stringify({revision:-1,scenario:initialState()})});await assert.rejects(bad.sync.connect('synthetic-token'));
 const {api,sync}=await client(t);await sync.connect('synthetic-token');const value=initialState();value.extra='x'.repeat(1_000_001);await assert.rejects(sync.publish(value),/large|MB|size/i);assert.equal(api.writes,0);
});
