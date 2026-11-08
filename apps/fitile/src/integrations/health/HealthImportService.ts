import type { HealthRecord } from './types'
type Store={existingSourceIds:()=>Promise<string[]>;save:(record:HealthRecord)=>Promise<void>}
export class HealthImportService{constructor(private store:Store){}async import(records:HealthRecord[]){const known=new Set(await this.store.existingSourceIds());let imported=0;for(const record of records){if(known.has(record.sourceId))continue;await this.store.save(record);known.add(record.sourceId);imported++}return imported}}
