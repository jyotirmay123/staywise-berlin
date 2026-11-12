import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRelative, monthlyPanel, validateSettings, DEFAULTS } from '../src/data.mjs';
test('relative percent zero means index 100, negative values are legitimate losses',()=>{
 assert.deepEqual(normalizeRelative({'04.07.2012':{eur:'0',usd:'0'},'11.07.2012':{eur:'-25,5',usd:'10'}}),[{date:'2012-07-04',eur:100,usd:100},{date:'2012-07-11',eur:74.5,usd:110}]);
});
test('reject impossible relative levels and dates',()=>{
 assert.throws(()=>normalizeRelative({'31.02.2020':{eur:'0',usd:'0'}}));
 assert.throws(()=>normalizeRelative({'01.01.2020':{eur:'-100',usd:'0'}}));
});
test('monthly panel uses last actual observation and never bridges a missing month',()=>{
 const metals=[{id:'x',observations:[{date:'2020-01-03',eur:100},{date:'2020-01-24',eur:110},{date:'2020-03-02',eur:120},{date:'2020-04-02',eur:132}]}];
 const p=monthlyPanel(metals,['x'],'eur');
 assert.deepEqual(p.months,['2020-03','2020-04']); assert.ok(Math.abs(p.returns[0][0]-Math.log(1.1))<1e-12);
});
test('settings roundtrip validated before application; unsafe values and unknown metals rejected',()=>{
 const ids=['germanium','indium'];const x={...DEFAULTS,weights:{indium:100}};
 assert.deepEqual(validateSettings(x,ids),x);
 for(const bad of [{monthly:-2},{exitHaircut:100},{annualStorage:101},{seed:NaN},{currency:'CHF'},{weights:{unknown:100}},{weights:{indium:0}}]) assert.throws(()=>validateSettings({...x,...bad},ids));
});
