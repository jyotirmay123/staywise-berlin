import { HealthImportService } from './HealthImportService'

describe('HealthImportService', () => {
  it('does not import the same source record twice', async () => {
    const saved:{sourceId:string}[]=[]
    const service=new HealthImportService({existingSourceIds:async()=>saved.map(item=>item.sourceId),save:async(record)=>{saved.push(record)}})
    const record={sourceId:'hc-1',type:'walking' as const,startedAt:'2026-08-28T08:00:00.000Z',minutes:30,sourceName:'Health Connect'}
    await service.import([record]);await service.import([record])
    expect(saved).toHaveLength(1)
  })
})
