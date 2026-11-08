import { FitileDb } from './FitileDb'
import { createFitileRepository } from './repositories'

describe('FitileRepository', () => {
  it('persists a completed set and its outbox operation atomically', async () => {
    const db = new FitileDb(`repo-test-${crypto.randomUUID()}`)
    const repository = createFitileRepository(db, 'user-1')

    await repository.saveSet({
      id: 'set-1', sessionId: 'session-1', exerciseId: 'db-bench-press', setNumber: 1,
      weightKg: 12.5, repetitions: 10, completedAt: '2026-08-28T20:00:00.000Z',
    })

    expect(await repository.getSet('set-1')).toMatchObject({ id: 'set-1', weightKg: 12.5 })
    expect(await repository.pendingOperations()).toEqual([
      expect.objectContaining({ entity: 'setLogs', entityId: 'set-1', kind: 'upsert', userId: 'user-1' }),
    ])
    db.close()
    await db.delete()
  })

  it('marks a record and queues a tombstone instead of erasing it', async () => {
    const db = new FitileDb(`delete-test-${crypto.randomUUID()}`)
    const repository = createFitileRepository(db, 'user-1')
    await repository.saveSet({ id: 'set-2', sessionId: 's', exerciseId: 'push-up', setNumber: 1, repetitions: 8, completedAt: '2026-08-28T20:00:00.000Z' })

    await repository.deleteSet('set-2')

    expect(await repository.getSet('set-2')).toBeUndefined()
    expect(await repository.pendingOperations()).toEqual(expect.arrayContaining([
      expect.objectContaining({ entityId: 'set-2', kind: 'delete' }),
    ]))
    db.close()
    await db.delete()
  })
})
