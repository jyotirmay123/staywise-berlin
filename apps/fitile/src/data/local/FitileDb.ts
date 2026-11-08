import Dexie, { type EntityTable } from 'dexie'
import type { SetLog } from '../../domain/models'
import type { OutboxOperation } from '../sync/types'

export type StoredSetLog = SetLog & {
  userId: string
  createdAt: string
  updatedAt: string
  deletedAt?: string
}

export type SyncConflictRecord = {
  id: string
  entity: string
  entityId: string
  winner: unknown
  loser: unknown
  createdAt: string
}

export class FitileDb extends Dexie {
  setLogs!: EntityTable<StoredSetLog, 'id'>
  outbox!: EntityTable<OutboxOperation, 'id'>
  syncConflicts!: EntityTable<SyncConflictRecord, 'id'>
  settings!: EntityTable<{ id: string; userId: string; value: unknown; updatedAt: string }, 'id'>

  constructor(name = 'fittile') {
    super(name)
    this.version(1).stores({
      setLogs: '&id, userId, sessionId, exerciseId, completedAt, deletedAt',
      outbox: '&id, userId, [entity+entityId], createdAt, nextAttemptAt',
      syncConflicts: '&id, [entity+entityId], createdAt',
      settings: '&id, userId, updatedAt',
    })
  }
}
