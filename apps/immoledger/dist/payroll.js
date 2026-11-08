import {incomeTax} from './engine.js';
const cents=v=>Math.round(v*100);const money=v=>Math.round((v+Number.EPSILON)*100)/100;
/** Limited implementation of 2026 PAP: regular monthly pay, statutory RV/AV/GKV/PV,
 * classes I/III/IV without factor, under 64, no pensions, bonuses or child allowance.
 * Source: BMF PAP 2026 MPARA/MRE4JL/MZTABFB/UPEVP/MVSPKVPV/MVSPHB/UPANTEIL.
 * This is a payroll withholding calculation, never an annual joint tax assessment. */
export function regularPayroll2026(p){
 if(!['I','III','IV'].includes(p.taxClass))throw new Error('Payroll preview supports classes I, III and IV without factor only.');
 const grossCents=cents(p.grossMonthly),annualCents=grossCents*12;
 const rvCents=Math.floor(Math.min(annualCents,10140000)*93/1000);
 const healthBasis=Math.min(annualCents,6975000);
 const extraBP=Math.round(p.healthExtra*100);
 const careBP=(p.saxony?230:180)+(p.childless?60:0);
 const basicHealthCareCents=Math.floor(healthBasis*(1400+extraBP+careBP*2)/20000);
 const avCents=Math.floor(Math.min(annualCents,10140000)*13/1000);
 const vsp=Math.max(Math.ceil((rvCents+basicHealthCareCents)/100),Math.ceil((rvCents+Math.min(190000,avCents+basicHealthCareCents))/100));
 const monthlyAllowance=p.monthlyAllowance==null?Math.ceil(p.annualAllowance/12):p.monthlyAllowance;
 const annualTaxable=Math.max(0,annualCents/100-monthlyAllowance*12-Math.min(1230,annualCents/100)-36-vsp);
 const annualWageTax=incomeTax(annualTaxable,p.taxClass==='III');
 const wageTax=Math.floor(annualWageTax*100/12)/100;
 const threshold=p.taxClass==='III'?40700:20350;
 const soliAnnual=Math.max(0,Math.min(annualWageTax*.055,(annualWageTax-threshold)*.119));
 const soli=Math.floor(soliAnnual*100/12+1e-8)/100;
 const church=Math.floor(wageTax*(p.churchRate||0))/100;
 const inferred={health:money(Math.min(p.grossMonthly,5812.5)*(.073+p.healthExtra/200)),pension:money(Math.min(p.grossMonthly,8450)*.093),unemployment:money(Math.min(p.grossMonthly,8450)*.013),care:money(Math.min(p.grossMonthly,5812.5)*careBP/10000)};
 const socialValues=p.useObservedSocial?{health:p.health,pension:p.pension,unemployment:p.unemployment,care:p.care}:inferred;
 const social=money(Object.values(socialValues).reduce((a,b)=>a+b,0));
 const netBeforeAdjustments=money(p.grossMonthly+(p.taxFreeMonthly||0)-wageTax-soli-church-social);
 return {wageTax,soli,church,social,...socialValues,monthlyAllowance,annualTaxable,vsp,annualWageTax,netBeforeAdjustments,payout:money(netBeforeAdjustments-(p.netDeductionsMonthly||0))};
}
/** Neutral inputs for a legacy backup without payroll observations. */
export function emptyPayroll(){return {month:'2026-01',taxClass:'I',grossMonthly:0,annualAllowance:0,monthlyAllowance:null,healthExtra:3.2,childless:true,saxony:false,churchRate:0,useObservedSocial:false,health:0,pension:0,unemployment:0,care:0,taxFreeMonthly:0,netDeductionsMonthly:0,observedWageTax:0,observedPayout:0,observedNet:0,approvedPropertyId:'',observedLoanPayment:0,observedLoanInterest:0,observedLoanPrincipal:0};}
/** Synthetic arithmetic fixture and public demo, not an actual payslip. */
export function payslipBenchmark(){const p={...emptyPayroll(),approvedPropertyId:null,grossMonthly:5000,annualAllowance:6000,monthlyAllowance:500,netDeductionsMonthly:20,observedLoanPayment:900,observedLoanInterest:600,observedLoanPrincipal:300};const r=regularPayroll2026(p);return {...p,health:r.health,pension:r.pension,unemployment:r.unemployment,care:r.care,observedWageTax:r.wageTax,observedNet:r.netBeforeAdjustments,observedPayout:r.payout};}

export function payrollComparison(p,stages){const approved=regularPayroll2026(p);const without=regularPayroll2026({...p,annualAllowance:0,monthlyAllowance:null});const baseId=p.approvedPropertyId===null?stages[0]?.id:p.approvedPropertyId;const hasBase=stages.some(s=>s.id===baseId);const additionalResult=hasBase?stages.filter(s=>s.id!==baseId).reduce((s,r)=>s+r.result,0):0;const additionalLoss=Math.max(0,-additionalResult);const proposed=regularPayroll2026({...p,annualAllowance:Math.max(0,p.annualAllowance-additionalResult),monthlyAllowance:additionalResult===0?approved.monthlyAllowance:Math.ceil(Math.max(0,approved.monthlyAllowance-additionalResult/12))});return {approved,without,proposed,additionalLoss,additionalResult,relief:money(without.wageTax-approved.wageTax),incrementalRelief:money(approved.wageTax-proposed.wageTax),baseId};}
