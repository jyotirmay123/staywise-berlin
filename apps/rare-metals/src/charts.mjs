const palette=['#a6cdb6','#d2ad7b','#88abc7','#ca969a','#bcc77e','#a49acb','#83c4bb','#daa482','#bcc3cb','#889770','#c6a2c8','#81a1ab','#d5ca91','#a7afdd','#c77e69','#82a385','#cca38e','#a3c4d9','#c7beac'];
export const colorFor=(index)=>palette[index%palette.length];
const compact=v=>Math.abs(v)>=1000000?(v/1e6).toFixed(1)+'m':Math.abs(v)>=1000?(v/1000).toFixed(1)+'k':v.toFixed(0);
/** Render source points without fitting, interpolating, smoothing or forecasting. */
export function plot(canvas,series,{band=null,xType='date',valuePrefix='',tooltip=null}={}){
 const rect=canvas.getBoundingClientRect(),width=Math.max(280,rect.width),height=rect.height||300,dpr=window.devicePixelRatio||1;
 canvas.width=width*dpr;canvas.height=height*dpr;const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,width,height);
 const points=series.flatMap(s=>s.points).concat(band?band.flatMap(p=>[{x:p.x,y:p.low},{x:p.x,y:p.high}]):[]).filter(p=>Number.isFinite(p.y));if(!points.length)return;
 const left=58,right=16,top=18,bottom=32,w=width-left-right,h=height-top-bottom;
 let minX=Math.min(...points.map(p=>p.x)),maxX=Math.max(...points.map(p=>p.x)),minY=Math.min(0,...points.map(p=>p.y)),maxY=Math.max(...points.map(p=>p.y));if(maxY<=minY)maxY=minY+1;if(maxX===minX)maxX=minX+1;maxY*=1.08;
 const x=v=>left+(v-minX)/(maxX-minX)*w,y=v=>top+(maxY-v)/(maxY-minY)*h;
 ctx.font='10px system-ui';ctx.fillStyle='#86988b';ctx.textAlign='right';ctx.lineWidth=1;
 for(let i=0;i<=4;i++){const v=minY+(maxY-minY)*i/4,py=y(v);ctx.strokeStyle='#2b3730';ctx.beginPath();ctx.moveTo(left,py);ctx.lineTo(width-right,py);ctx.stroke();ctx.fillText(valuePrefix+compact(v),left-9,py+3);}
 ctx.textAlign='center';for(let i=0;i<=4;i++){const v=minX+(maxX-minX)*i/4;ctx.fillText(xType==='date'?new Date(v).toISOString().slice(0,7):`${(v/12).toFixed(v%12===0?0:1)}y`,x(v),height-8);}
 if(band){ctx.beginPath();band.forEach((p,i)=>(i?ctx.lineTo(x(p.x),y(p.high)):ctx.moveTo(x(p.x),y(p.high))));[...band].reverse().forEach(p=>ctx.lineTo(x(p.x),y(p.low)));ctx.closePath();ctx.fillStyle='#598a6c33';ctx.fill();}
 for(const s of series){ctx.strokeStyle=s.color;ctx.lineWidth=s.dashed?1.3:1.8;ctx.setLineDash(s.dashed?[5,5]:[]);ctx.beginPath();let prior=null;for(const p of s.points){if(!Number.isFinite(p.y)){prior=null;continue;}const gap=xType==='date'&&prior&&p.x-prior.x>45*86400000;if(prior&&!gap)ctx.lineTo(x(p.x),y(p.y));else ctx.moveTo(x(p.x),y(p.y));prior=p;}ctx.stroke();}ctx.setLineDash([]);
 if(tooltip){canvas.onpointermove=e=>{const target=minX+(e.offsetX-left)/w*(maxX-minX);const lines=[];for(const s of series){let p=s.points.reduce((best,item)=>Math.abs(item.x-target)<Math.abs(best.x-target)?item:best,s.points[0]);if(p)lines.push({text:`${s.name}: ${p.y.toFixed(1)} · ${p.date||''}`,color:s.color});}tooltip.replaceChildren(...lines.map(l=>{const el=document.createElement('span');el.textContent=l.text;el.style.color=l.color;return el;}));tooltip.hidden=false;};canvas.onpointerleave=()=>{tooltip.hidden=true;};}
}
