/** Provider cumulative percentage series become positive index levels, never currency prices. */
export function normalizeRelative(raw){
 return Object.entries(raw).map(([key,v])=>{
  const match=/^(\d{2})\.(\d{2})\.(\d{4})$/.exec(key);if(!match)throw Error('Invalid date');
  const [,d,m,y]=match,date=`${y}-${m}-${d}`;if(new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('Invalid date');
  const point={date};for(const c of ['eur','usd']){const n=Number(String(v[c]).replace(',','.'));if(!Number.isFinite(n)||n<=-100)throw Error('Invalid relative level');point[c]=100+n;}return point;
 }).sort((a,b)=>a.date.localeCompare(b.date));
}
const monthNumber=s=>Number(s.slice(0,4))*12+Number(s.slice(5,7));
/** Longest consecutive common monthly run. Missing months are not interpolated or bridged. */
export function monthlyPanel(metals,ids,currency='eur',from='',to=''){
 const selected=ids.map(id=>metals.find(m=>m.id===id));if(!ids.length||selected.some(m=>!m))throw Error('Choose known metals');
 const maps=selected.map(m=>{const map=new Map();for(const p of m.observations){if((!from||p.date>=from)&&(!to||p.date<=to))map.set(p.date.slice(0,7),p[currency]);}return map;});
 const common=[...maps[0].keys()].filter(k=>maps.every(m=>m.has(k))).sort();
 let best=[],run=[];for(const m of common){if(run.length&&monthNumber(m)-monthNumber(run.at(-1))!==1){if(run.length>best.length)best=run;run=[];}run.push(m);}if(run.length>best.length)best=run;
 const levels=best.map(m=>maps.map(map=>map.get(m)));
 return {months:best,levels,returns:levels.slice(1).map((row,t)=>row.map((p,i)=>Math.log(p/levels[t][i]))),excludedMonths:common.length-best.length,ids};
}
export const DEFAULTS=Object.freeze({monthly:150,initial:0,contributionYears:5,holdYears:0,buyMarkup:0,exitHaircut:10,annualStorage:2,inflation:2,cashRate:2,taxRate:0,currency:'eur',drift:'half',paths:5000,seed:12345,blockMonths:3,threshold:90,from:'',to:'',weights:{}});
export function validateSettings(input,ids){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('Invalid settings');
 const x={...DEFAULTS,...input};
 const bounds={monthly:[0,100000],initial:[0,1e8],contributionYears:[1,20],holdYears:[0,10],buyMarkup:[0,100],exitHaircut:[0,99],annualStorage:[0,99],inflation:[-10,30],cashRate:[-10,30],taxRate:[0,60],paths:[100,20000],seed:[0,4294967295],blockMonths:[1,12],threshold:[50,99]};
 for(const [k,[lo,hi]]of Object.entries(bounds)){if(typeof x[k]!=='number'||!Number.isFinite(x[k])||x[k]<lo||x[k]>hi)throw Error(`Invalid ${k}`);}
 for(const k of ['contributionYears','holdYears','paths','seed','blockMonths'])if(!Number.isInteger(x[k]))throw Error(`Invalid ${k}`);
 if(!['eur','usd'].includes(x.currency)||!['historical','half','zero'].includes(x.drift))throw Error('Invalid scenario');
 for(const k of ['from','to'])if(x[k]!==''&&(!/^\d{4}-\d{2}-\d{2}$/.test(x[k])||Number.isNaN(Date.parse(x[k]))||new Date(x[k]).toISOString().slice(0,10)!==x[k]))throw Error('Invalid date window');
 if(x.from&&x.to&&x.from>x.to)throw Error('Start must precede end');
 if(!x.weights||typeof x.weights!=='object'||Array.isArray(x.weights))throw Error('Invalid weights');
 let total=0;for(const [id,v]of Object.entries(x.weights)){if(!ids.includes(id)||typeof v!=='number'||!Number.isFinite(v)||v<0||v>100)throw Error('Invalid allocation');total+=v;}
 if(total<=0||x.monthly+x.initial<=0)throw Error('Choose a positive allocation and contribution');
 // Strip unknown keys and prototype-bearing input from persisted state.
 return Object.fromEntries(Object.keys(DEFAULTS).map(k=>[k,k==='weights'?Object.fromEntries(Object.entries(x.weights)):x[k]]));
}
export function validateDataset(data){
 if(data.schemaVersion!==1||!Array.isArray(data.metals)||data.metals.length!==19)throw Error('Unsupported data snapshot');
 const ids=new Set();for(const m of data.metals){if(ids.has(m.id)||!Array.isArray(m.observations)||m.observations.length<2)throw Error('Invalid metal');ids.add(m.id);let prior='';for(const p of m.observations){if(!/^\d{4}-\d{2}-\d{2}$/.test(p.date)||p.date<=prior||!Number.isFinite(p.eur)||p.eur<=0||!Number.isFinite(p.usd)||p.usd<=0)throw Error('Invalid observation');prior=p.date;}}return data;
}
/** Does the selected finite contribution schedule reach the dealer's published minimum? */
export function minimumFeasibility(s,minimum){
 const totalPaid=s.initial+s.monthly*s.contributionYears*12;
 if(s.initial>=minimum)return {reached:true,months:0,totalPaid};
 if(s.monthly<=0||totalPaid<minimum)return {reached:false,months:null,totalPaid};
 return {reached:true,months:Math.ceil((minimum-s.initial)/s.monthly),totalPaid};
}
