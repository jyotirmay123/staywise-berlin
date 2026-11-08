import {test} from 'node:test';
import assert from 'node:assert/strict';
import {periodAmount,chartValues,chartMarkup,cashNeeded} from '../dist/display.js';
const row={year:2026,totalResult:-24000,totalBenefit:6000,cash:-9600,afterTaxCash:-3600,principal:7200,balance:500000,final:{marginal:24.7},stages:[{income:12000},{income:6000}]};
test('monthly averages convert flows while preserving debt and tax percentage',()=>{const m=chartValues(row,'monthly');assert.equal(m.receipts,1500);assert.equal(m.result,-2000);assert.equal(m.benefit,500);assert.equal(m.cash,-300);assert.equal(m.principal,600);assert.equal(m.balance,500000);assert.equal(m.rate,24.7);assert.equal(row.totalBenefit,6000);});
test('annual mode preserves original figures and zero/negative flows',()=>{assert.equal(chartValues(row,'yearly').benefit,6000);assert.equal(periodAmount(0,'monthly'),0);assert.equal(periodAmount(-120,'monthly'),-10);});
test('chart provides focusable year controls, exact details and monthly units',()=>{const html=chartMarkup([row,{...row,year:2027}],{period:'monthly',year:2026,visible:{benefit:true,cash:true}});assert.match(html,/Monthly average/);assert.match(html,/tabindex="0"/);assert.match(html,/data-chart-year="2027"/);assert.match(html,/24\.7%/);assert.match(html,/500,00/);assert.match(html,/aria-pressed="true"/);});
test('one-year and empty portfolios produce finite chart geometry',()=>{for(const rows of [[],[row]]){const html=chartMarkup(rows,{period:'yearly',year:2026,visible:{benefit:true,cash:false}});assert.doesNotMatch(html,/NaN|Infinity/);}});

test("cash funding gaps exclude relief, scale by period and never turn a surplus into a need",()=>{assert.equal(cashNeeded(-9600),9600);assert.equal(cashNeeded(500),0);assert.equal(cashNeeded(0),0);assert.equal(chartValues(row,"monthly").neededBefore,800);assert.equal(chartValues(row,"yearly").neededBefore,9600);assert.equal(chartValues({...row,cash:1200},"monthly").neededBefore,0);});
