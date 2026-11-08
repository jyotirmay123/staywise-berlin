import { FitileDb } from './FitileDb'
import { exportLocalArchive, importLocalArchive } from './backup'
import { createFitileRepository } from './repositories'

describe('local archive persistence', () => {
  it('round trips actual user records and settings into another browser database', async () => {
    const source = new FitileDb('backup-source')
    const target = new FitileDb('backup-target')
    await createFitileRepository(source, 'local').saveSet({ id: 'set-1', sessionId: 'session-1', exerciseId: 'push-up', setNumber: 1, repetitions: 12, completedAt: new Date().toISOString() })
    await source.settings.put({ id: 'local:meals', userId: 'local', value: [{ id: 'meal-1', name: 'Lunch', detail: 'Example', kcal: 300, meal: 'Lunch' }], updatedAt: new Date().toISOString() })
    await source.settings.put({ id: 'someone:private', userId: 'someone', value: 'private', updatedAt: new Date().toISOString() })
    const archive = await exportLocalArchive(source, 'local')
    expect(JSON.stringify(archive)).not.toContain('private')
    await importLocalArchive(target, 'restored', JSON.parse(JSON.stringify(archive)))
    expect((await target.setLogs.get('set-1'))?.userId).toBe('restored')
    expect((await target.settings.get('restored:meals'))?.value).toEqual([{ id: 'meal-1', name: 'Lunch', detail: 'Example', kcal: 300, meal: 'Lunch' }])
    expect(await target.outbox.count()).toBe(1)
    await source.delete(); await target.delete()
  })
  it('rejects tampered content without modifying existing records', async () => {
    const db = new FitileDb('backup-reject')
    await db.settings.put({ id: 'local:goal', userId: 'local', value: 'original', updatedAt: new Date().toISOString() })
    const archive = await exportLocalArchive(db, 'local')
    archive.data.settings = { changed: true }
    await expect(importLocalArchive(db, 'local', archive)).rejects.toThrow(/checksum/i)
    expect((await db.settings.get('local:goal'))?.value).toBe('original')
    await db.delete()
  })
  it('rejects malformed database rows even with a recomputed checksum', async () => {
    const db = new FitileDb('backup-invalid')
    const { createArchive } = await import('../../domain/export/createArchive')
    const malformed = createArchive({workouts:[],meals:[],activities:[],measurements:[],equipment:[],settings:{},localDatabase:{setLogs:[{id:'broken'}],settings:[],outbox:[],syncConflicts:[]}})
    await expect(importLocalArchive(db, 'local', malformed)).rejects.toThrow()
    expect(await db.setLogs.count()).toBe(0)
    await db.delete()
  })
})

it('rejects malformed editable values before applying any settings', async()=>{
  const db=new FitileDb('backup-settings-invalid')
  const {createArchive}=await import('../../domain/export/createArchive')
  const archive=createArchive({workouts:[],meals:[],activities:[],measurements:[],equipment:[],settings:{},localDatabase:{setLogs:[],settings:[{id:'local:meals',userId:'local',value:'not-an-array',updatedAt:new Date().toISOString()}],outbox:[],syncConflicts:[]}})
  await expect(importLocalArchive(db,'local',archive)).rejects.toThrow()
  expect(await db.settings.count()).toBe(0)
  await db.delete()
})

it('preserves another account when imported IDs collide',async()=>{
  const db=new FitileDb('backup-collision')
  const source=new FitileDb('backup-collision-source')
  const set={id:'collision',sessionId:'session',exerciseId:'push-up',setNumber:1,completedAt:new Date().toISOString()}
  await createFitileRepository(db,'other').saveSet(set)
  await createFitileRepository(source,'local').saveSet(set)
  await expect(importLocalArchive(db,'local',await exportLocalArchive(source,'local'))).rejects.toThrow(/another account/)
  expect((await db.setLogs.get('collision'))?.userId).toBe('other')
  await db.delete();await source.delete()
})
