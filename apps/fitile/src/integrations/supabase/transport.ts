import type { SupabaseClient } from '@supabase/supabase-js'
import type { OutboxOperation, SyncTransport } from '../../data/sync/types'
import { SyncAuthError } from '../../data/sync/SyncEngine'

const tableByEntity = {
  setLogs: 'set_logs', workoutSessions: 'workout_sessions', mealEntries: 'meal_entries',
  activities: 'activities', measurements: 'body_measurements', settings: 'user_preferences',
} as const

const toSnakeCase = (key: string) => key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)

export function toSupabaseMutation(operation: OutboxOperation) {
  const payload = operation.payload && typeof operation.payload === 'object' ? operation.payload as Record<string, unknown> : {}
  return {
    table: tableByEntity[operation.entity],
    kind: operation.kind,
    row: Object.fromEntries([
      ...Object.entries(payload).filter(([key]) => !['userId', 'createdAt', 'updatedAt'].includes(key)).map(([key, value]) => [toSnakeCase(key), value]),
      ['user_id', operation.userId],
    ]),
  }
}

export class SupabaseSyncTransport implements SyncTransport {
  constructor(private client: SupabaseClient) {}

  async push(operation: OutboxOperation) {
    const mutation = toSupabaseMutation(operation)
    const query = operation.kind === 'delete'
      ? this.client.from(mutation.table).update({ deleted_at: operation.createdAt }).eq('id', operation.entityId)
      : this.client.from(mutation.table).upsert(mutation.row, { onConflict: 'id' })
    const { error } = await query
    if (error?.code === 'PGRST301' || error?.message.toLowerCase().includes('jwt')) throw new SyncAuthError(error.message)
    if (error) throw new Error(error.message)
    return { operationId: operation.id, serverUpdatedAt: new Date().toISOString() }
  }
}
