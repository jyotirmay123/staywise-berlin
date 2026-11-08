import { resolveNewestUpdate } from './conflicts'

describe('resolveNewestUpdate', () => {
  it('chooses the newest timestamp and preserves the losing value', () => {
    const local = { id: 'goal-1', calorieTarget: 2000, updatedAt: '2026-08-28T20:00:00.000Z' }
    const remote = { id: 'goal-1', calorieTarget: 2100, updatedAt: '2026-08-28T20:01:00.000Z' }

    expect(resolveNewestUpdate(local, remote)).toEqual({ winner: remote, loser: local, conflicted: true })
  })

  it('does not report a conflict for equivalent records', () => {
    const record = { id: 'goal-1', calorieTarget: 2000, updatedAt: '2026-08-28T20:00:00.000Z' }
    expect(resolveNewestUpdate(record, { ...record })).toEqual({ winner: record, loser: undefined, conflicted: false })
  })
})
