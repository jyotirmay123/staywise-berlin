import {GitHubScenarioSync,SYNC_REPOSITORY,SYNC_PATH} from './github-sync.js';
import {serializeScenario,deserializeScenario} from './storage.js';

export const PREVIOUS_SYNC_KEY='immoledger.sync.previous.v1';
const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const snapshot=value=>deserializeScenario(serializeScenario(value));

/** UI/session policy shared by both static deployments. Credentials live only in memory. */
export function createSyncUI({getState,replaceState,hasUnsaved,beforeSync,storage,confirm,toast,onChange,fetcher,pollMs=30000}){
 const sync=new GitHubScenarioSync(fetcher?{fetcher}:{});
 let status='Browser only · connect to sync',busy=false,publishing=false,queued=null,timer=null,poller=null,unsynced=false,epoch=0,session=0,running=null;
 const notify=()=>onChange();
 const cancelTimer=()=>{if(timer!==null)clearTimeout(timer);timer=null;};
 const fail=error=>{sync.active=false;status=error.message||'Sync failed. Browser data retained.';toast(status);};
 async function run(action){
  if(busy)return false;
  const id=session;busy=true;notify();
  running=(async()=>{
   try{await action(id);return id===session;}
   catch(error){if(id===session)fail(error);return false;}
   finally{if(id===session){busy=false;notify();}}
  })();
  return running;
 }
 function backup(){storage.setItem(PREVIOUS_SYNC_KEY,serializeScenario(getState()));}
 function applyRemote(remote){
  backup();replaceState(snapshot(remote.scenario));sync.accept(remote);unsynced=false;status='Synced with private repo';
 }
 async function connect(token){
  if(busy)return;
  status='Connecting to private repo…';
  await run(async()=>{
   await sync.connect(token);
   status=sync.remote.scenario?'Connected · choose which data to use':'Connected · save browser data to create shared JSON';
   if(pollMs>0&&poller===null)poller=setInterval(()=>{void poll();},pollMs);
  });
 }
 async function load(){
  if(busy||!sync.connected)return;
  if(!confirm('Load the repository scenario and replace this browser’s current scenario? A recovery backup is saved first. Unsynced local changes will be replaced.'))return;
  const version=epoch;
  cancelTimer();queued=null;
  await run(async(id)=>{
   status='Loading repository data…';notify();const remote=await sync.read();
   if(id!==session)return;
   if(version!==epoch||hasUnsaved())throw new Error('Browser data changed while loading. Your edits are retained; try loading again when ready.');
   if(!remote.scenario)throw new Error('No repository scenario exists. Save this browser to the repo first.');
   applyRemote(remote);epoch++;
  });
 }
 async function publish(){
  if(busy||!sync.connected)return;
  if(sync.blocked){toast('Load repository data before saving again. Download your browser JSON to keep local edits.');return;}
  if(!beforeSync())return;
  if(!confirm('Save this browser’s complete scenario to the private repository? This becomes the shared version for both sites.'))return;
  cancelTimer();queued=null;unsynced=true;
  const id=session;publishing=true;
  await run(async(current)=>{status='Saving to private repo…';notify();await sync.publish(snapshot(getState()));if(current!==session)return;unsynced=!!queued;status=queued?'Waiting to sync…':'Synced with private repo';});
  if(id!==session)return;
  publishing=false;
  if(queued&&sync.active)await flush();
 }
 function changed(){
  epoch++;
  if(!sync.active&&!publishing)return;
  try{queued=snapshot(getState());unsynced=true;status='Waiting to sync…';cancelTimer();timer=setTimeout(()=>{timer=null;void flush();},600);notify();}
  catch(error){fail(error);notify();}
 }
 async function flush(){
  const id=session;
  cancelTimer();
  if(busy){await running;if(busy||id!==session)return;}
  while(id===session&&queued&&sync.active){
   const value=queued;queued=null;
   await run(async(current)=>{status='Saving to private repo…';notify();await sync.publish(value);if(current!==session)return;if(!queued)unsynced=false;status=queued?'Waiting to sync…':'Synced with private repo';});
  }
 }
 async function poll(){
  if(!sync.active||busy||queued||unsynced||hasUnsaved())return;
  const version=epoch;
  await run(async(id)=>{
   const remote=await sync.read();
   if(id!==session||version!==epoch||queued||unsynced||hasUnsaved())return;
   if(remote.sha===sync.sha)return;
   if(!remote.scenario)throw new Error('Shared JSON was removed. Sync paused; browser data retained.');
   applyRemote(remote);
  });
 }
 function disconnect(){
  session++;epoch++;cancelTimer();queued=null;busy=false;publishing=false;running=null;
  if(poller!==null)clearInterval(poller);poller=null;sync.disconnect();status='Browser only · connect to sync';notify();
 }
 function markup(){
  const remote=sync.remote,disabled=busy?'disabled':'',button=(label,action,extra='')=>`<button type="button" class="btn ${extra}" data-action="${action}" ${disabled}>${label}</button>`;
  return `<section class="sync-panel card"><div class="eyebrow">Private GitHub sync</div><h2>One scenario, both sites.</h2><p>Shared file: <a href="https://github.com/${SYNC_REPOSITORY}/blob/main/${SYNC_PATH}" target="_blank" rel="noopener noreferrer">${SYNC_REPOSITORY} / ${SYNC_PATH}</a></p><p class="sync-status" role="status">${escape(status)}</p>${sync.connected?`<p>Repository: ${remote?.scenario?`${remote.scenario.properties.length} properties · revision ${remote.revision}${remote.savedAt?' · '+escape(remote.savedAt):''}`:'No shared JSON yet'}. This browser: ${getState().properties.length} properties.</p><div class="actions">${button('Load repo data','sync-load')}${sync.blocked?'':button('Save this browser to repo','sync-publish','primary')}${button('Disconnect','sync-disconnect')}</div><p>Choose once to start automatic sync. Save forms as usual. Clean tabs check for changes every 30 seconds. A conflicting save pauses sync; download your browser JSON before loading the repo again.</p>`:`<label for="sync-token">GitHub fine-grained token</label><input id="sync-token" class="sync-token" type="password" autocomplete="off" spellcheck="false" placeholder="github_pat_…" ${disabled}><div class="actions">${button('Connect GitHub','sync-connect','primary')}<a class="btn" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">Create token</a></div><p>Select only <strong>immoledger</strong> and give repository <strong>Contents: Read and write</strong>. Connect separately on each site. Token stays in this tab’s memory; reconnect after reload or closing the tab. Never paste it into chat.</p><p>Connecting does not replace any data. Next, choose the repository scenario or this browser’s scenario. The public Pages repository receives code only.</p>`}<div class="actions">${button('Download browser JSON','export-json')}${button('Download previous browser backup','sync-backup')}</div><p>Loading repository data keeps the previous scenario as a recovery copy in this browser. JSON export/import remains available without GitHub.</p></section>`;
 }
 return {connect,load,publish,changed,flush,poll,disconnect,markup,get status(){return status;},get active(){return sync.active;},get pending(){return busy||!!queued||timer!==null;},previous(){const value=storage.getItem(PREVIOUS_SYNC_KEY);if(!value)throw new Error('No previous browser backup is available yet.');deserializeScenario(value);return value;}};
}
