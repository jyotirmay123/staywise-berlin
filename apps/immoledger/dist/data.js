import {payslipBenchmark,emptyPayroll} from './payroll.js';
export const uid=()=>globalThis.crypto.randomUUID();
const confirmations=()=>({rent:false,buildingShare:false,dates:false,loans:false,costs:false,growth:false});
const guaranteePlan=()=>({enabled:false,confirmed:false,startYear:2029,endYear:2036,annualPremium:null,coveragePercent:null});
export function newProperty(){return {id:uid(),name:'New property',location:'Germany',enabled:false,confirmations:confirmations(),guaranteePlan:guaranteePlan(),purchasePrice:0,buyerCosts:0,equity:0,buildingShare:0,afaRate:0,afaBasis:null,afaEvidence:'',ownership:100,start:'2026-01',rent:0,parking:0,serviceIncome:0,rentGrowth:0,rentEvery:3,vacancy:0,loans:[],costs:[],actuals:{}};}

/** Fictional public examples. Never seed the public app with personal records. */
export function initialState(){
 const a=newProperty();Object.assign(a,{name:'Demo apartment A',location:'Illustrative German property',enabled:true,purchasePrice:200000,equity:20000,buildingShare:80,afaRate:2,rent:950,afaEvidence:'Fictional demo inputs. Replace with verified contracts and tax basis.'});
 a.loans=[{id:uid(),name:'Demo mortgage',amount:180000,interest:4,repayment:2,start:'2026-01',fixedYears:10,extra:0}];
 a.costs=[{id:uid(),name:'Demo management',amount:100,frequency:'monthly',from:'2026-01',to:'',type:'deductible',growth:0},{id:uid(),name:'Demo maintenance reserve',amount:40,frequency:'monthly',from:'2026-01',to:'',type:'reserve',growth:0}];
 const b=newProperty();Object.assign(b,{name:'Demo apartment B',location:'Illustrative German property',enabled:true,purchasePrice:280000,equity:30000,buildingShare:75,afaRate:2,rent:1150,parking:50,afaEvidence:'Fictional demo inputs. Replace with verified contracts and tax basis.'});
 b.loans=[{id:uid(),name:'Demo first tranche',amount:200000,interest:3.5,repayment:2,start:'2026-01',fixedYears:10,extra:0},{id:uid(),name:'Demo second tranche',amount:50000,interest:4,repayment:2,start:'2026-01',fixedYears:10,extra:0}];
 b.costs=[{id:uid(),name:'Demo management',amount:110,frequency:'monthly',from:'2026-01',to:'',type:'deductible',growth:0},{id:uid(),name:'Demo maintenance reserve',amount:50,frequency:'monthly',from:'2026-01',to:'',type:'reserve',growth:0}];
 const payroll=payslipBenchmark();payroll.approvedPropertyId=a.id;
 return {version:1,demo:true,baseYear:2026,reconciliationVersion:1,activationVersion:1,household:{gross:60000,spouseGross:0,joint:false,taxClass:'I',children:0,childrenUnder25:0,parent:false,saxony:false,churchRate:0,healthExtra:3.2,socialOverride:null,deductibleOverride:null,otherDeductions:0,progression:0,privateMonthly:0,spousePrivateMonthly:0,rurupMonthly:0,spouseRurupMonthly:0,depotMonthly:100,spouseDepotMonthly:0,depotEligible:true,spouseDepotEligible:false,depotChildren:0,spouseDepotChildren:0,withheld:0,spouseWithheld:0,salaryGrowth:0},properties:[a,b],payroll,risk:{...riskDefaults(),liquidCash:18000,essentialMonthly:2000,otherAnnualLow:200,otherAnnualHigh:400,optionalMonthly:250,consumerMonthly:100,consumerEnd:'2029-06'}};
}

/** Add missing schema containers only; never rewrite imported financial inputs. */
export function upgradeScenario(s){
 if(!s.payroll)s.payroll=emptyPayroll();
 if(!s.risk)s.risk=riskDefaults();
 for(const p of s.properties){
  if(p.enabled==null)p.enabled=true;
  if(!p.confirmations)p.confirmations=confirmations();
  if(!p.guaranteePlan)p.guaranteePlan=guaranteePlan();
 }
 s.reconciliationVersion=1;s.activationVersion=1;
 return s;
}

/** Missing imported household amounts stay unknown, rather than becoming demo facts. */
export function riskDefaults(){return {liquidCash:null,cashApproximate:false,essentialMonthly:null,otherAnnualLow:null,otherAnnualHigh:null,optionalMonthly:null,consumerMonthly:null,consumerEnd:'',startYear:2027,vacancyStressPercent:null,salaryStressPercent:null,repairStress:null,rateShockPoints:null};}
