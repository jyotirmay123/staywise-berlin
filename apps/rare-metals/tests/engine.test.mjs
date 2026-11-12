import test from 'node:test';import assert from 'node:assert/strict';
import { calculatePath, bootstrapVectors, simulate, rollingBacktest, describe, inverseVolWeights } from '../src/engine.mjs';
const base={monthly:100,initial:0,contributionYears:1,holdYears:0,buyMarkup:0,exitHaircut:0,annualStorage:0,inflation:0,cashRate:0,taxRate:0,paths:100,seed:1,blockMonths:3,drift:'historical'};
const zero=Array.from({length:36},()=>[0]);
test('flat market deposits are not profits and fee-free DCA equals contributions',()=>{
 const r=calculatePath(zero.slice(0,12),[1],base);assert.equal(r.paid,1200);assert.equal(r.value,1200);assert.equal(r.profit,0);assert.equal(r.cash,1200);assert.equal(r.realPaid,1200);
});
test('flat market explicitly charges buy markup, NAV storage and resale haircut',()=>{
 const r=calculatePath([[0]],[1],{...base,monthly:0,initial:1000,buyMarkup:10,exitHaircut:20,annualStorage:12});
 assert.ok(Math.abs(r.value-1000/1.1*Math.pow(.88,1/12)*.8)<1e-9);assert.equal(r.paid,1000);assert.ok(r.profit<0);
});
test('DCA stops after contribution duration, newest lot also accrues hold months',()=>{
 const r=calculatePath(zero.slice(0,24),[1],{...base,holdYears:1});assert.equal(r.paid,1200);assert.equal(r.value,1200);
 const x=calculatePath(Array.from({length:24},()=>[Math.log(1.01)]),[1],{...base,holdYears:1});
 const expected=100*Array.from({length:12},(_,i)=>Math.pow(1.01,24-i)).reduce((a,b)=>a+b,0);assert.ok(Math.abs(x.value-expected)<1e-7);
});
test('inflation comparator and cash benchmark match deposit timing',()=>{
 const r=calculatePath(zero.slice(0,12),[1],{...base,cashRate:12,inflation:12});assert.ok(r.realPaid>1200);assert.ok(Math.abs(r.cash-r.realPaid)<1e-8);assert.ok(r.realProfit<0);
});
test('drawdown captures a fall even when ending above initial',()=>{
 const r=describe([100,200,100,150]);assert.equal(r.maxDrawdown,-.5);assert.ok(r.volatility>0);
});
test('bootstrap samples synchronous metal vectors, seed repeats exactly',()=>{
 const rows=Array.from({length:36},(_,i)=>[(i-18)/100,-(i-18)/100]);
 const a=bootstrapVectors(rows,60,{...base,seed:5}),b=bootstrapVectors(rows,60,{...base,seed:5});
 assert.deepEqual(a,b);for(const row of a)assert.ok(Math.abs(row[0]+row[1])<1e-12);
});
test('zero drift changes mean log return without eliminating downside',()=>{
 const x=bootstrapVectors([[.1],[-.02],[.05]],300,{...base,drift:'zero'});assert.ok(x.some(r=>r[0]<0));assert.ok(x.some(r=>r[0]>0));
});
test('all winning sampled paths still have a nonzero statistical loss bound and no guarantee',()=>{
 const r=simulate(Array.from({length:36},()=>[.01]),[1],{...base});assert.equal(r.nominalProbability,1);assert.ok(r.probabilityInterval[0]<1);assert.equal(r.guaranteed,false);
});
test('short history refuses Monte Carlo and insufficient rolling period returns zero windows',()=>{
 assert.throws(()=>simulate(zero.slice(0,12),[1],base),/24/);assert.equal(rollingBacktest(zero.slice(0,6),[1],base).length,0);
});
test('inverse volatility excludes zero measured volatility and uses actual measured values',()=>{
 const w=inverseVolWeights([{id:'a',volatility:.1},{id:'b',volatility:.2},{id:'c',volatility:0}]);assert.ok(Math.abs(w.a-66.6666666667)<1e-7);assert.equal(w.c,undefined);
});
test('histogram is made from actual simulated terminal values and counts every path',()=>{
 const r=simulate(Array.from({length:36},(_,i)=>[i%2?.04:-.03]),[1],base);assert.equal(r.distribution.reduce((s,b)=>s+b.count,0),base.paths);assert.ok(r.distribution.every(b=>b.to>=b.from));
});
test('youngest lot age follows actual deposits, including a lump sum with no monthly purchases',()=>{
 const r=simulate(zero,[1],{...base,monthly:0,initial:1000});assert.equal(r.horizons[0].youngestLotHeldMonths,12);assert.equal(r.horizons[4].youngestLotHeldMonths,60);
 const d=simulate(zero,[1],base);assert.equal(d.horizons[0].youngestLotHeldMonths,1);assert.equal(d.horizons[1].youngestLotHeldMonths,13);
});
