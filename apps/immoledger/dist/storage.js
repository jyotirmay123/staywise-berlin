import {validateState} from './engine.js';
import {upgradeScenario} from './data.js';

// App-specific keys isolate this app from other Pages apps on the same origin.
export const STORAGE_KEY='immoledger.scenario.v1';
export const BACKUP_SCHEMA_VERSION=1;
export const MAX_BACKUP_BYTES=2_000_000;
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v)&&Object.getPrototypeOf(v)===Object.prototype;
function assertJson(value,depth=0){
 if(depth>40)throw new Error('Backup nesting is too deep.');
 if(value===null||typeof value==='string'||typeof value==='boolean')return;
 if(typeof value==='number'&&Number.isFinite(value))return;
 if(!Array.isArray(value)&&!plain(value))throw new Error('Backup contains a non-JSON value.');
 for(const [key,child] of Object.entries(value)){
  if(['__proto__','constructor','prototype'].includes(key))throw new Error('Backup contains an unsafe object key.');
  assertJson(child,depth+1);
 }
}
function checkedText(text){
 if(typeof text!=='string'||new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw new Error('Backup must be smaller than 2 MB.');
 return text;
}
/** New backups and browser saves use the same versioned, validated format. */
export function serializeScenario(data,now=new Date()){
 assertJson(data);validateState(data);
 return checkedText(JSON.stringify({app:'immoledger',schemaVersion:BACKUP_SCHEMA_VERSION,exportedAt:now.toISOString(),data},null,2));
}
/** Accept original raw scenario-v1 backups, while rejecting other apps/versions. */
export function deserializeScenario(text){
 const parsed=JSON.parse(checkedText(text));assertJson(parsed);
 if(!plain(parsed))throw new Error('Invalid scenario backup.');
 let data;
 if(Object.hasOwn(parsed,'app')||Object.hasOwn(parsed,'schemaVersion')||Object.hasOwn(parsed,'data')){
  if(parsed.app!=='immoledger'||parsed.schemaVersion!==BACKUP_SCHEMA_VERSION||typeof parsed.exportedAt!=='string'||!Number.isFinite(Date.parse(parsed.exportedAt)))throw new Error('Invalid or unsupported ImmoLedger backup.');
  data=parsed.data;
 }else data=parsed;
 validateState(data);upgradeScenario(data);validateState(data);
 return data;
}
/** Retains the working value even when the browser refuses persistence. */
export class ScenarioStore{
 constructor(storage){this.storage=storage;this.persisted=false;this.value=null;this.error='';}
 save(value){this.value=value;try{this.storage.setItem(STORAGE_KEY,serializeScenario(value));this.persisted=true;this.error='';return true;}catch(e){this.persisted=false;this.error=String(e.message||e);return false;}}
}
