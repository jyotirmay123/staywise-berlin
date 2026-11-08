export type SyncEntity = 'setLogs' | 'workoutSessions' | 'mealEntries' | 'activities' | 'measurements' | 'settings'

export type OutboxOperation = {
  id: string
  userId: string
  entity: SyncEntity
  entityId: string
  kind: 'upsert' | 'delete'
  payload?: unknown
  createdAt: string
  attempts: number
  nextAttemptAt?: string
}

export type SyncAcknowledgement = { operationId: string; serverUpdatedAt: string }

export interface SyncTransport {
  push(operation: OutboxOperation): Promise<SyncAcknowledgement>
}

export type SyncStatus = 'idle' | 'syncing' | 'offline' | 'auth-required' | 'error'
