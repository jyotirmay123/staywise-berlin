/** Pure portfolio mathematics. Inputs are log-return vectors in fixed metal order. */
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
export function quantile(sorted,p){if(!sorted.length)return null;const x=(sorted.length-1)*p,i=Math.floor(x);return sorted[i]+(sorted[Math.ceil(x)]-sorted[i])*(x-i);}
export function describe(levels){
 if(levels.length<3)return {volatility:null,maxDrawdown:null,cagr:null};
 const logs=levels.slice(1).map((v,i)=>Math.log(v/levels[i])),mu=mean(logs);
 const volatility=Math.sqrt(logs.reduce((s,v)=>s+(v-mu)**2,0)/(logs.length-1))*Math.sqrt(12);
 let peak=levels[0],dd=0;for(const p of levels){peak=Math.max(peak,p);dd=Math.min(dd,p/peak-1);}
 return {volatility,maxDrawdown:dd,cagr:(levels.at(-1)/levels[0])**(12/logs.length)-1,totalReturn:levels.at(-1)/levels[0]-1,months:logs.length,flatShare:logs.filter(v=>v===0).length/logs.length};
}
export function inverseVolWeights(stats){const good=stats.filter(m=>Number.isFinite(m.volatility)&&m.volatility>0);const sum=good.reduce((s,m)=>s+1/m.volatility,0);return Object.fromEntries(good.map(m=>[m.id,100/m.volatility/sum]));}
export function seededRandom(seed){return ()=>{let t=seed+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;};}
export function bootstrapVectors(rows,months,s,rng=seededRandom(s.seed)){
 if(!rows.length)throw Error('No return history');const dimensions=rows[0].length;
 const averages=Array.from({length:dimensions},(_,i)=>mean(rows.map(r=>r[i]))),factor={historical:1,half:.5,zero:0}[s.drift];
 const sampled=[];while(sampled.length<months){const start=Math.floor(rng()*rows.length);for(let k=0;k<s.blockMonths&&sampled.length<months;k++)sampled.push(rows[(start+k)%rows.length].map((v,i)=>v-(1-factor)*averages[i]));}return sampled;
}
export function calculatePath(rows,weights,s){
 const sum=weights.reduce((a,b)=>a+b,0);if(!(sum>0))throw Error('Invalid weights');
 const allocation=weights.map(v=>v/sum),holdings=allocation.map(w=>s.initial*w/(1+s.buyMarkup/100));
 const storage=(1-s.annualStorage/100)**(1/12),cashGrowth=(1+s.cashRate/100)**(1/12),inflationGrowth=(1+s.inflation/100)**(1/12);
 let paid=s.initial,cash=s.initial,realPaid=s.initial;const timeline=[];
 for(let t=0;t<rows.length;t++){
  const deposit=t<s.contributionYears*12?s.monthly:0;paid+=deposit;cash=(cash+deposit)*cashGrowth;realPaid=(realPaid+deposit)*inflationGrowth;
  for(let i=0;i<holdings.length;i++)holdings[i]=(holdings[i]+deposit*allocation[i]/(1+s.buyMarkup/100))*Math.exp(rows[t][i])*storage;
  const sale=holdings.reduce((a,b)=>a+b,0)*(1-s.exitHaircut/100),value=sale-Math.max(0,sale-paid)*s.taxRate/100;
  timeline.push({month:t+1,value,paid,cash,realPaid,profit:value-paid,realProfit:value-realPaid});
 }
 const last=timeline.at(-1)||{value:s.initial,paid,cash,realPaid,profit:0,realProfit:0};
 return {...last,timeline};
}
export function rollingBacktest(rows,weights,s){const months=(s.contributionYears+s.holdYears)*12,out=[];for(let start=0;start+months<=rows.length;start++){const r=calculatePath(rows.slice(start,start+months),weights,s);const {timeline,...summary}=r;out.push({start,...summary});}return out;}
export function wilson(wins,n){const z=1.959963984540054,p=wins/n,d=1+z*z/n,c=(p+z*z/(2*n))/d,h=z*Math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d;return [Math.max(0,c-h),Math.min(1,c+h)];}
function summarize(outcomes){const sorted=outcomes.map(r=>r.value).sort((a,b)=>a-b),wins=outcomes.filter(r=>r.profit>1e-8).length;return {p05:quantile(sorted,.05),median:quantile(sorted,.5),p95:quantile(sorted,.95),nominalProbability:wins/outcomes.length,realProbability:outcomes.filter(r=>r.realProfit>1e-8).length/outcomes.length,cashProbability:outcomes.filter(r=>r.value>r.cash+1e-8).length/outcomes.length,probabilityInterval:wilson(wins,outcomes.length),paid:outcomes[0].paid,cash:outcomes[0].cash,realPaid:outcomes[0].realPaid};}
export function simulate(rows,weights,s){
 if(rows.length<24)throw Error('At least 24 consecutive common monthly returns required');
 const requested=(s.contributionYears+s.holdYears)*12,maxMonths=Math.max(15*12,requested),rng=seededRandom(s.seed);
 const annual=Array.from({length:maxMonths/12},()=>[]),fan=Array.from({length:requested},()=>[]);
 for(let path=0;path<s.paths;path++){
  const sample=bootstrapVectors(rows,maxMonths,s,rng),r=calculatePath(sample,weights,s);
  r.timeline.forEach((step,t)=>{if(t<requested)fan[t].push(step.value);if((t+1)%12===0)annual[(t+1)/12-1].push(step);});
 }
 const horizons=annual.map((outcomes,i)=>({years:i+1,youngestLotHeldMonths:s.monthly>0?Math.max(1,(i+1)*12-s.contributionYears*12+1):(i+1)*12,...summarize(outcomes)}));
 const timeline=fan.map((a,i)=>{a.sort((x,y)=>x-y);const month=i+1,paid=s.initial+s.monthly*Math.min(month,s.contributionYears*12);return {month,paid,p05:quantile(a,.05),median:quantile(a,.5),p95:quantile(a,.95)};});
 const terminal=annual[requested/12-1].map(r=>r.value).sort((a,b)=>a-b),min=terminal[0],max=terminal.at(-1),width=(max-min||1)/25;
 const distribution=Array.from({length:25},(_,i)=>({from:min+i*width,to:min+(i+1)*width,count:0}));
 for(const value of terminal)distribution[Math.min(24,Math.floor((value-min)/width))].count++;
 return {...horizons[requested/12-1],horizons,timeline,distribution,paths:s.paths,guaranteed:false,observedMonths:rows.length};
}
