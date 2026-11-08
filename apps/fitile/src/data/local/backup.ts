import { z } from 'zod'
import type { FitileDb } from './FitileDb'
import { createArchive, type AccountSnapshot } from '../../domain/export/createArchive'
import { OnboardingSchema } from '../../features/onboarding/onboardingSchema'
import { restoreArchive } from '../../domain/export/restoreArchive'

const id = z.string().min(1).max(500)
const timestamp = z.iso.datetime()
const setSchema = z.object({ id, userId:id, sessionId:id, exerciseId:id, setNumber:z.number().int().positive(), completedAt:timestamp, createdAt:timestamp, updatedAt:timestamp, deletedAt:timestamp.optional(), weightKg:z.number().nonnegative().optional(), repetitions:z.number().int().nonnegative().optional(), durationSeconds:z.number().nonnegative().optional(), distanceMeters:z.number().nonnegative().optional(), rpe:z.number().min(0).max(10).optional(), rir:z.number().nonnegative().optional() }).strict()
const settingSchema = z.object({ id, userId:id, value:z.json(), updatedAt:timestamp }).strict()
const operationSchema = z.object({id,userId:id,entity:z.enum(['setLogs','workoutSessions','mealEntries','activities','measurements','settings']),entityId:id,kind:z.enum(['upsert','delete']),payload:z.json().optional(),createdAt:timestamp,attempts:z.number().int().nonnegative(),nextAttemptAt:timestamp.optional()}).strict()
const conflictSchema = z.object({id,entity:id,entityId:id,winner:z.json(),loser:z.json(),createdAt:timestamp}).strict()
const databaseSchema = z.object({setLogs:z.array(setSchema),settings:z.array(settingSchema),outbox:z.array(operationSchema),syncConflicts:z.array(conflictSchema)}).strict()

export async function exportLocalArchive(db: FitileDb, userId: string) {
  const localDatabase = await db.transaction('r', db.tables, async () => {
    const setLogs = await db.setLogs.where('userId').equals(userId).toArray()
    const settings = await db.settings.where('userId').equals(userId).toArray()
    const outbox = await db.outbox.where('userId').equals(userId).toArray()
    const ownedIds = new Set([...setLogs.map(row=>row.id), ...settings.map(row=>row.id), ...outbox.map(row=>row.entityId)])
    const syncConflicts = (await db.syncConflicts.toArray()).filter(row=>ownedIds.has(row.entityId))
    return {setLogs, settings, outbox, syncConflicts}
  })
  const values = Object.fromEntries(localDatabase.settings.map(row=>[row.id.slice(`${userId}:`.length),row.value]))
  return createArchive({workouts:[...localDatabase.setLogs.filter(row=>!row.deletedAt),...asRecords(values.workouts)], meals:asRecords(values.meals), activities:asRecords(values.activities), measurements:asRecords(values.measurements), equipment:asRecords(values.equipment), settings:values, localDatabase})
}
function asRecords(value: unknown): Record<string,unknown>[] { return Array.isArray(value) ? value : [] }

/** Merge by stable ID, after validating the entire file. Never enqueue new cloud operations. */
export async function importLocalArchive(db: FitileDb, userId: string, archive: unknown): Promise<AccountSnapshot> {
  const snapshot = restoreArchive(archive)
  if (!snapshot.localDatabase) throw new Error('This archive predates local database backups; no data was changed.')
  const data = databaseSchema.parse(snapshot.localDatabase)
  const setValues = z.record(z.string(),z.object({weight:z.number().nonnegative(),reps:z.number().int().nonnegative(),done:z.boolean()}).strict())
  const knownValues: Record<string,z.ZodType> = {
    meals:z.array(z.object({id,name:z.string(),detail:z.string(),kcal:z.number().nonnegative(),meal:z.enum(['Breakfast','Lunch','Dinner','Snacks'])}).strict()),
    activities:z.array(z.object({type:z.enum(['walking','running','treadmill','cycling','custom']),minutes:z.number().positive(),caloriesKcal:z.number().nonnegative(),estimated:z.boolean(),distanceKm:z.number().nonnegative().optional()}).strict()),
    equipment:z.array(z.object({id,name:z.string(),capabilities:z.array(z.enum(['bodyweight','dumbbell','flat-bench','incline-bench','seated-bench','low-cable','high-cable','resistance-band','twister','treadmill'])),minKg:z.number().nonnegative().optional(),maxKg:z.number().nonnegative().optional(),incrementKg:z.number().positive().optional(),location:z.string(),available:z.boolean()}).strict()),
    onboarding:OnboardingSchema,
    'active-workout':setValues,
    workouts:z.array(z.object({id,completedAt:timestamp,sets:setValues}).strict()),
  }
  for(const rows of Object.values(data)) {
    if(new Set(rows.map(row=>row.id)).size!==rows.length) throw new Error('Duplicate archive record IDs')
  }
  for(const row of data.settings) {
    const key=row.id.startsWith(`${row.userId}:`) ? row.id.slice(row.userId.length+1) : row.id
    if(key.startsWith('soreness:')) z.number().min(0).max(10).parse(row.value)
    else knownValues[key]?.parse(row.value)
  }
  const sourceUsers = new Set([...data.setLogs,...data.settings,...data.outbox].map(row=>row.userId))
  if (sourceUsers.size>1) throw new Error('Archive contains multiple users')
  const settings = data.settings.map(row=>({...row,userId,id:`${userId}:${row.id.startsWith(`${row.userId}:`) ? row.id.slice(row.userId.length+1) : row.id}`}))
  const setLogs = data.setLogs.map(row=>({...row,userId}))
  const outbox = data.outbox.map(row=>({...row,userId,payload:row.payload && typeof row.payload==='object' && !Array.isArray(row.payload) ? {...row.payload,userId} : row.payload}))
  await db.transaction('rw', db.tables, async () => {
    for(const [table, rows] of [[db.setLogs,setLogs],[db.settings,settings],[db.outbox,outbox]] as const) {
      for(const row of rows) {
        const existing = await table.get(row.id)
        if(existing && existing.userId!==userId) throw new Error('A record ID belongs to another account; no data was changed.')
      }
    }
    await db.setLogs.bulkPut(setLogs)
    await db.settings.bulkPut(settings)
    await db.outbox.bulkPut(outbox)
    await db.syncConflicts.bulkPut(data.syncConflicts)
  })
  return snapshot
}
