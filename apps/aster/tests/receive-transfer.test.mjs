import test from 'node:test';
import assert from 'node:assert/strict';
import { receivePortfolioTransfer } from '../lib/receive-transfer.ts';
import { SOURCE_ORIGIN, createTransferMessage } from '../lib/hosted-transfer.ts';
const nonce='aa'.repeat(32);
const data={version:1,investments:[],valuations:[],lastFxRate:100,lastFxDate:'2026-01-01',dataUpdatedAt:'2026-01-01T00:00:00Z'};

test('only the opened private source window may deliver a portfolio',()=>{
  const popup={};const event={origin:SOURCE_ORIGIN,source:popup,data:createTransferMessage(nonce,data)};
  assert.deepEqual(receivePortfolioTransfer(event,popup,nonce),data);
  assert.equal(receivePortfolioTransfer({...event,origin:'https://untrusted.example'},popup,nonce),null);
  assert.equal(receivePortfolioTransfer({...event,source:{}},popup,nonce),null);
  assert.equal(receivePortfolioTransfer(event,null,nonce),null);
  assert.equal(receivePortfolioTransfer(event,popup,'bb'.repeat(32)),null);
});

test('a trusted source with invalid portfolio rows cannot import',()=>{
  const popup={};
  assert.equal(receivePortfolioTransfer({origin:SOURCE_ORIGIN,source:popup,data:{type:'aster-transfer-v1',nonce,payload:{...data,investments:[null]}}},popup,nonce),null);
});
