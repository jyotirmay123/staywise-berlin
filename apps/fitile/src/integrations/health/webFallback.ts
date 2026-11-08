import type { HealthImportAdapter } from './types'
export const webHealthAdapter:HealthImportAdapter={async available(){return false},async requestPermissions(){return false},async readSince(cursor=''){return{records:[],cursor}}}
