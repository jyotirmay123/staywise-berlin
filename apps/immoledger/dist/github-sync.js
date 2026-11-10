import {serializeScenario,deserializeScenario} from './storage.js';

export const SYNC_REPOSITORY='jyotirmay123/immoledger';
export const SYNC_PATH='data/scenario.json';
export const SYNC_BRANCH='main';
const REPO_URL=`https://api.github.com/repos/${SYNC_REPOSITORY}`;
const FILE_URL=`${REPO_URL}/contents/${SYNC_PATH}`;
const MAX_SYNC_BYTES=1_000_000;

function encode(text){
 const bytes=new TextEncoder().encode(text);let binary='';
 for(const byte of bytes)binary+=String.fromCharCode(byte);
 return btoa(binary);
}
function decode(content){
 return new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(atob(content.replace(/\s/g,'')),c=>c.charCodeAt(0)));
}
function parseFile(file){
 if(file.type!=='file'||typeof file.sha!=='string'||!file.sha||file.encoding!=='base64'||typeof file.content!=='string'||file.size>MAX_SYNC_BYTES)throw new Error('Repository JSON is invalid or larger than 1 MB.');
 const text=decode(file.content);
 if(new TextEncoder().encode(text).length>MAX_SYNC_BYTES)throw new Error('Repository JSON is larger than 1 MB.');
 const parsed=JSON.parse(text);
 let scenario,revision=0;
 if(parsed&&Object.hasOwn(parsed,'revision')&&Object.hasOwn(parsed,'scenario')){
  if(!Number.isSafeInteger(parsed.revision)||parsed.revision<1)throw new Error('Invalid repository data revision.');
  revision=parsed.revision;scenario=deserializeScenario(JSON.stringify(parsed.scenario));
 }else scenario=deserializeScenario(text);
 return {sha:file.sha,scenario,revision,savedAt:typeof parsed.savedAt==='string'?parsed.savedAt:parsed.exportedAt||''};
}

/** One fixed private repository; every write uses the last accepted file SHA. */
export class GitHubScenarioSync{
 constructor({fetcher=globalThis.fetch.bind(globalThis)}={}){
  this.fetcher=fetcher;this.generation=0;this.disconnect();
 }
 disconnect(){
  this.generation++;this.token='';this.connected=false;this.active=false;this.blocked=false;this.busy=false;this.sha=undefined;this.revision=0;this.remote=null;
 }
 async request(url,options={},generation=this.generation){
  if(!this.token)throw new Error('Connect GitHub first.');
  const response=await this.fetcher(url,{cache:'no-store',credentials:'omit',redirect:'error',referrerPolicy:'no-referrer',signal:AbortSignal.timeout(20000),...options,headers:{Accept:'application/vnd.github+json',Authorization:`Bearer ${this.token}`,'X-GitHub-Api-Version':'2022-11-28',...options.headers}});
  if(generation!==this.generation)throw new Error('GitHub connection was closed.');
  return response;
 }
 async privateRepository(generation=this.generation){
  const response=await this.request(REPO_URL,{},generation);
  if(!response.ok)throw new Error('GitHub access failed. Check token expiry and access to the private immoledger repository.');
  const repo=await response.json();
  if(generation!==this.generation)throw new Error('GitHub connection was closed.');
  if(repo.private!==true)throw new Error('Sync requires the private immoledger repository.');
 }
 async connect(token){
  this.disconnect();this.token=token.trim();const generation=this.generation;
  try{
   await this.privateRepository(generation);
   const remote=await this.read();
   if(generation!==this.generation)throw new Error('GitHub connection was closed.');
   this.connected=true;this.sha=remote.sha;this.revision=remote.revision;return remote;
  }catch(error){if(generation===this.generation)this.disconnect();throw error;}
 }
 async read(){
  const generation=this.generation,response=await this.request(`${FILE_URL}?ref=${SYNC_BRANCH}`,{},generation);
  let remote;
  if(response.status===404)remote={sha:null,scenario:null,revision:0,savedAt:''};
  else{
   if(!response.ok)throw new Error('GitHub JSON could not be loaded. Check repository access or retry later.');
   remote=parseFile(await response.json());
  }
  if(generation!==this.generation)throw new Error('GitHub connection was closed.');
  this.remote=remote;return remote;
 }
 accept(remote){
  if(!this.connected||remote!==this.remote||!remote.scenario)throw new Error('Load current repository data before resuming sync.');
  this.sha=remote.sha;this.revision=remote.revision;this.active=true;this.blocked=false;
 }
 async publish(value){
  if(!this.connected||this.sha===undefined||this.blocked)throw new Error('Load newer repository data before saving again.');
  if(this.busy)throw new Error('A GitHub save is still running.');
  const scenario=deserializeScenario(serializeScenario(value));
  const savedAt=new Date().toISOString(),text=JSON.stringify({revision:this.revision+1,scenario,savedAt},null,2);
  if(new TextEncoder().encode(text).length>MAX_SYNC_BYTES)throw new Error('Scenario is too large for GitHub sync (1 MB maximum). Export JSON instead.');
  const generation=this.generation;this.busy=true;
  try{
   await this.privateRepository(generation);
   const response=await this.request(FILE_URL,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Preserve shared ImmoLedger scenario',branch:SYNC_BRANCH,content:encode(text),...(this.sha?{sha:this.sha}:{})})},generation);
   if(response.status===409||response.status===422){this.blocked=true;throw new Error('Another browser saved newer data. Download your backup, then load repository data before saving again.');}
   if(!response.ok)throw new Error('GitHub save failed. Check token Contents read/write permission, branch rules or connection. Your browser copy is retained.');
   const result=await response.json();
   if(generation!==this.generation)throw new Error('GitHub connection was closed.');
   if(typeof result.content?.sha!=='string'||!result.content.sha)throw new Error('GitHub did not confirm the saved revision. Reconnect before saving again.');
   this.sha=result.content.sha;this.revision++;this.remote={sha:this.sha,scenario,revision:this.revision,savedAt};this.active=true;return this.remote;
  }catch(error){if(generation===this.generation){this.active=false;this.blocked=true;}throw error;}
  finally{if(generation===this.generation)this.busy=false;}
 }
}
