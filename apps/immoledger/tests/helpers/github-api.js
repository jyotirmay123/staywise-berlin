import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {initialState} from '../../dist/data.js';

export async function fixture(t,{privateRepo=true,content,delay=0}={}){
 let sha='version-1',text=content===undefined?JSON.stringify({revision:1,scenario:initialState()}):content,writes=0,pauseRead=null,pauseWrite=null;
 function hold(kind){let release,started;const wait=new Promise(resolve=>{release=resolve;}),seen=new Promise(resolve=>{started=resolve;});const gate={wait,started};if(kind==='read')pauseRead=gate;else pauseWrite=gate;return {release,started:seen};}
 const server=createServer(async(req,res)=>{
  res.setHeader('Content-Type','application/json');
  const reply=(code,value)=>{res.statusCode=code;res.end(JSON.stringify(value));};
  if(req.headers.authorization!=='Bearer synthetic-token')return reply(401,{message:'Bad credentials'});
  if(req.url==='/repos/jyotirmay123/immoledger')return reply(200,{private:privateRepo,default_branch:'main'});
  if(!req.url.startsWith('/repos/jyotirmay123/immoledger/contents/data/scenario.json'))return reply(404,{});
  if(req.method==='GET'){
   if(pauseRead){const gate=pauseRead;pauseRead=null;gate.started();await gate.wait;}
   if(delay)await new Promise(resolve=>setTimeout(resolve,delay));
   if(text===null)return reply(404,{});
   return reply(200,{type:'file',sha,encoding:'base64',size:Buffer.byteLength(text),content:Buffer.from(text).toString('base64')});
  }
  let body='';for await(const chunk of req)body+=chunk;
  const value=JSON.parse(body);assert.equal(value.branch,'main');
  if(pauseWrite){const gate=pauseWrite;pauseWrite=null;gate.started();await gate.wait;}
  if(value.sha!==(text===null?undefined:sha))return reply(409,{message:'Conflict'});
  writes++;text=Buffer.from(value.content,'base64').toString('utf8');sha=`version-${writes+1}`;
  return reply(200,{content:{sha},commit:{sha:`commit-${writes}`}});
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');t.after(()=>new Promise(resolve=>server.close(resolve)));
 const origin=`http://127.0.0.1:${server.address().port}`;
 return {holdRead:()=>hold('read'),holdWrite:()=>hold('write'),fetcher:(url,options)=>{assert.ok(url.startsWith('https://api.github.com/repos/jyotirmay123/immoledger'));assert.equal(options.redirect,'error');return fetch(origin+new URL(url).pathname+new URL(url).search,options);},get saved(){return JSON.parse(text);},get writes(){return writes;},edit(value){text=value;sha='other-client';}};
}
