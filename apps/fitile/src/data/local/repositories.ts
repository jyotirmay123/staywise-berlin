import type { SetLog } from '../../domain/models'
import type { OutboxOperation } from '../sync/types'
import type { FitileDb, StoredSetLog } from './FitileDb'

const nowIso = () => new Date().toISOString()

export type FitileRepository = ReturnType<typeof createFitileRepository>

export function createFitileRepository(db: FitileDb, userId: string) {
  return {
    db,
    userId,
    async saveSet(set: SetLog) {
      const timestamp = nowIso()
      const existing = await db.setLogs.get(set.id)
      const record: StoredSetLog = {
        ...set,
        userId,
        createdAt: existing?.createdAt ?? timestamp,
        updatedAt: timestamp,
        deletedAt: undefined,
      }
      const operation: OutboxOperation = {
        id: crypto.randomUUID(), userId, entity: 'setLogs', entityId: set.id,
        kind: 'upsert', payload: record, createdAt: timestamp, attempts: 0,
      }
      await db.transaction('rw', db.setLogs, db.outbox, async () => {
        await db.setLogs.put(record)
        await db.outbox.add(operation)
      })
      return record
    },
    async getSet(id: string) {
      const record = await db.setLogs.get(id)
      return record?.deletedAt ? undefined : record
    },
    async listSets() {
      const records = await db.setLogs.where('userId').equals(userId).toArray()
      return records.filter((record) => !record.deletedAt)
    },
    async deleteSet(id: string) {
      const record = await db.setLogs.get(id)
      if (!record || record.userId !== userId) return
      const timestamp = nowIso()
      const operation: OutboxOperation = {
        id: crypto.randomUUID(), userId, entity: 'setLogs', entityId: id,
        kind: 'delete', createdAt: timestamp, attempts: 0,
      }
      await db.transaction('rw', db.setLogs, db.outbox, async () => {
        await db.setLogs.update(id, { deletedAt: timestamp, updatedAt: timestamp })
        await db.outbox.add(operation)
      })
    },
    async pendingOperations(at = new Date()) {
      const operations = await db.outbox.where('userId').equals(userId).sortBy('createdAt')
      return operations.filter((operation) => !operation.nextAttemptAt || new Date(operation.nextAttemptAt) <= at)
    },
    async acknowledgeOperation(id: string) {
      await db.outbox.delete(id)
    },
    async deferOperation(operation: OutboxOperation) {
      const attempts = operation.attempts + 1
      const delaySeconds = Math.min(300, 2 ** attempts)
      await db.outbox.update(operation.id, {
        attempts,
        nextAttemptAt: new Date(Date.now() + delaySeconds * 1000).toISOString(),
      })
    },
  }
}
