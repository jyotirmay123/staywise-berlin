import React,{useEffect,useMemo,useRef,useState} from 'react';
import {ResponsiveContainer,BarChart,Bar,LineChart,Line,XAxis,YAxis,CartesianGrid,Tooltip} from 'recharts';
import {filterRows,summary} from './model.mjs';
import {Title,Note,Source,Potsdam,num,dateLabel} from './common';
import {tourism} from './research';

const monthNames=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const monthTotal=(rows:any[],snapshot:any,month:string)=>{
 const index=snapshot.months.indexOf(month);
 if(index<0||!rows.length)return null;
 return summary(rows.map((l:any)=>l.rm[index]??null)).total;
};
const covered=(s:any,district:string)=>district==='all'||s.listings.some((l:any)=>l.district===district);
const chartMargin={top:12,right:16,bottom:8,left:8};

export default function History({snapshot,manifest,state,loadSnapshot}:any){
 const [year,setYear]=useState('2026');
 const [mode,setMode]=useState('reviews');
 const [archive,setArchive]=useState<any[]>([]);
 const [progress,setProgress]=useState({done:0,total:0,failed:0});
 const loader=useRef(loadSnapshot);loader.current=loadSnapshot;
 const archiveKey=(manifest?.snapshots||[]).map((s:any)=>s.date).sort().join('|');
 useEffect(()=>{
  let alive=true;
  const dates=archiveKey.split('|').filter(Boolean);
  setArchive([]);setProgress({done:0,total:dates.length,failed:0});
  const run=async()=>{
   for(let start=0;start<dates.length;start+=3){
    const results=await Promise.allSettled(dates.slice(start,start+3).map(date=>loader.current(date)));
    if(!alive)return;
    const valid=results.flatMap(r=>r.status==='fulfilled'?[r.value]:[]);
    setArchive(old=>[...old,...valid].sort((a,b)=>a.date.localeCompare(b.date)));
    setProgress(old=>({...old,done:old.done+results.length,failed:old.failed+results.filter(r=>r.status==='rejected').length}));
   }
  };
  run();return()=>{alive=false};
 },[archiveKey]);
 const rows=useMemo(()=>filterRows(snapshot.listings,state),[snapshot,state.district,state.type,state.budget,state.shortStay,state.reviewed]);
 const isCovered=covered(snapshot,state.district);
 const months=monthNames.map((label,index)=>({label,month:year+'-'+String(index+1).padStart(2,'0'),official:tourism[year]?.[index]??null}));
 const reviewData=months.map(m=>({...m,reviews:monthTotal(rows,snapshot,m.month)}));
 const activity=mode==='reviews'?reviewData:months;
 const series=mode==='reviews'?'reviews':'official';
 const supply=useMemo(()=>(manifest?.snapshots||[]).slice().sort((a:any,b:any)=>a.date.localeCompare(b.date)).map((entry:any)=>{
  const observed=archive.find(s=>s.date===entry.date);
  return {date:entry.date,count:observed&&covered(observed,state.district)?filterRows(observed.listings,state).length:null};
 }),[archive,archiveKey,state.district,state.type,state.budget,state.shortStay,state.reviewed]);
 const groups=useMemo(()=>{
  const map=new Map<string,any[]>();
  rows.forEach((l:any)=>map.set(l.district,[...(map.get(l.district)||[]),l]));
  return [['Selected cohort',rows],...Array.from(map.entries()).sort((a,b)=>a[0].localeCompare(b[0]))] as [string,any[]][];
 },[rows]);
 const peak=Math.max(1,...groups.flatMap(([,ls])=>months.map(m=>monthTotal(ls,snapshot,m.month)??0)));
 return <div>
  <Title kicker="MARKET HISTORY" title="Activity over time">Compare review activity within a selected listing cohort, observed archive supply and a separate official tourism series.</Title>
  <div className="watch-grid">
   <div className="watch-card"><small>Selected snapshot cohort</small><h2>{isCovered?num(rows.length):'—'}</h2><p>{dateLabel(snapshot.date)} · filtered listings</p></div>
   <div className="watch-card"><small>Berlin tourist nights · 2025</small><h2>−3.8%</h2><p>Official year-on-year change</p><Source id="tourism"/></div>
   <div className="watch-card"><small>Berlin tourist nights · Jan–Jul 2026</small><h2>−2.9%</h2><p>Compared with Jan–Jul 2025</p><Source id="tourism"/></div>
  </div>
  {!isCovered&&<Note warn>This snapshot does not cover {state.district}. Missing coverage is shown as —; it is not zero supply or zero demand.</Note>}
  {isCovered&&!rows.length&&<Note>No listings match these filters in this snapshot. Monthly review activity is unavailable for an empty cohort.</Note>}
  <section className="panel">
   <div className="panel-head"><div><h2>{mode==='reviews'?'Monthly review activity':'Official Berlin tourism'}</h2><p>{mode==='reviews'?'Reviews attached to listings present in the selected snapshot':'Tourist overnight stays in the official accommodation statistics'}</p></div>
    <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
     <label className="field">Series<select value={mode} onChange={e=>setMode(e.target.value)}><option value="reviews">Selected listing cohort</option><option value="official">Official Berlin tourist nights</option></select></label>
     <label className="field">Year<select value={year} onChange={e=>setYear(e.target.value)}>{['2024','2025','2026'].map(y=><option key={y}>{y}</option>)}</select></label>
    </div>
   </div>
   <div style={{height:300,width:'100%'}} role="img" aria-label={mode==='reviews'?'Monthly reviews for the filtered snapshot cohort':'Official Berlin tourist nights by month'}>
    <ResponsiveContainer width="100%" height="100%"><BarChart data={activity} margin={chartMargin}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="label"/><YAxis tickFormatter={(v:number)=>v>=1000000?(v/1000000).toFixed(1)+'m':num(v)}/><Tooltip formatter={(v:any)=>[num(v),mode==='reviews'?'Reviews':'Tourist nights']}/><Bar dataKey={series} fill={mode==='reviews'?'#278465':'#4c78a8'} radius={[4,4,0,0]}/></BarChart></ResponsiveContainer>
   </div>
   <div className="padded chart-note">{mode==='reviews'?<>Filters apply to the {dateLabel(snapshot.date)} cohort only. Earlier months include surviving listings from that snapshot, not all listings operating at the time. Reviews lag stays and do not measure bookings, occupancy or revenue. The snapshot month may be incomplete; months outside the available review series are unknown. <Source id="assumptions"/></>:<>Citywide official tourist nights are independent of the Airbnb cohort, district and room filters. Coverage differs from short-term rental listings. Unpublished months remain missing. <Source id="tourism"/></>}</div>
  </section>
  <section className="panel">
   <div className="panel-head"><div><h2>Observed listing supply</h2><p>Each point uses its own dated snapshot and the current filters.</p></div><span>{progress.done} / {progress.total} snapshots loaded</span></div>
   <div style={{height:280,width:'100%'}} role="img" aria-label="Filtered listing counts in each historical snapshot">
    <ResponsiveContainer width="100%" height="100%"><LineChart data={supply} margin={chartMargin}><CartesianGrid strokeDasharray="3 3" vertical={false}/><XAxis dataKey="date" tickFormatter={(d:string)=>d.slice(0,7)} minTickGap={35}/><YAxis tickFormatter={num}/><Tooltip labelFormatter={(d:any)=>dateLabel(String(d))} formatter={(v:any)=>[num(v),'Observed listings']}/><Line type="linear" dataKey="count" stroke="#278465" strokeWidth={2} dot={{r:3}} connectNulls={false}/></LineChart></ResponsiveContainer>
   </div>
   <div className="padded chart-note"><p>This series counts listings observed in each actual archive snapshot. It does not reconstruct historic supply from the latest cohort. Listing presence does not establish availability, legal status or bookings. Missing or failed snapshots leave gaps.</p>
    <p>The archive sequence around March 2026 changes from 14,470 to 5,856 to 12,855 total listings before filters. This discontinuity limits comparisons; the data do not establish its cause.</p>
    {progress.failed>0&&<p role="status">{progress.failed} snapshot(s) could not be loaded. Reload the page to retry.</p>}<Source id="inside"/>
   </div>
  </section>
  <section className="panel">
   <div className="panel-head"><div><h2>Review activity heatmap · {year}</h2><p>Monthly review counts by district within the selected snapshot cohort.</p></div></div>
   <div className="padded heatmap" style={{overflowX:'auto'}}>
    <div className="heat-row" style={{display:'grid',gridTemplateColumns:'minmax(150px,1.8fr) repeat(12,minmax(45px,1fr))',minWidth:760,gap:4}}><strong>District</strong>{monthNames.map(m=><small key={m}>{m}</small>)}</div>
    {groups.map(([name,ls])=><div className="heat-row" key={name} style={{display:'grid',gridTemplateColumns:'minmax(150px,1.8fr) repeat(12,minmax(45px,1fr))',minWidth:760,gap:4}}><strong>{name}</strong>{months.map(m=>{
     const value=monthTotal(ls,snapshot,m.month);
     return <span key={m.month} title={name+' · '+m.month+': '+(value===null?'unknown':num(value)+' reviews')} style={{padding:'10px 3px',borderRadius:4,textAlign:'center',background:value===null?'#edf0ee':'rgba(39,132,101,'+(0.08+0.72*value/peak)+')',color:value!==null&&value/peak>0.55?'white':'#24372d'}}>{num(value)}</span>;
    })}</div>)}
   </div><p className="padded chart-note">— = unknown or outside available coverage. A known month with no reviews shows 0. All rows share the same scale; counts reflect both cohort size and review activity.</p>
  </section>
  <div className="two-grid">
   <section className="panel padded"><h2>Spandau · official context</h2><p>Spandau recorded 589,700 tourist nights in 2025, compared with 606,680 in 2024. These official accommodation statistics provide district context; they are not Airbnb booking counts.</p><Source id="districts"/></section>
   <section className="panel padded"><h2>Read the limits first</h2><p>Changes in listing coverage, composition and review lag affect comparisons. Past reviews describe activity among observed listings and do not forecast a property’s occupancy or profitability. Potsdam and surrounding towns lack this Berlin listing archive; missing coverage must not be interpreted as zero demand.</p><Source id="assumptions"/></section>
  </div>
  <Potsdam/>
 </div>;
}
