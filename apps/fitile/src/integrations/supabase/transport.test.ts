import { toSupabaseMutation } from './transport'

describe('toSupabaseMutation', () => {
  it('maps an outbox upsert to its table and snake-case metadata', () => {
    expect(toSupabaseMutation({
      id: 'op-1', userId: 'user-1', entity: 'setLogs', entityId: 'set-1', kind: 'upsert',
      payload: { id: 'set-1', weightKg: 12.5 }, createdAt: '2026-08-28T20:00:00.000Z', attempts: 0,
    })).toEqual({
      table: 'set_logs',
      kind: 'upsert',
      row: { id: 'set-1', weight_kg: 12.5, user_id: 'user-1' },
    })
  })
})
