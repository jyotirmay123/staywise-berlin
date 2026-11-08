import { calculateReadiness } from './calculateReadiness'

describe('calculateReadiness', () => {
  const event = {
    id: 'recovery-1',
    muscleId: 'chest' as const,
    fatigue: 72,
    occurredAt: '2026-08-27T08:00:00.000Z',
    recoveryHours: 96,
    sourceLabel: 'Dumbbell bench press · 3 sets',
  }

  it('recovers continuously while remaining within zero and one hundred', () => {
    expect(calculateReadiness([event], new Date('2026-08-27T08:00:00Z')).percent).toBe(28)
    expect(calculateReadiness([event], new Date('2026-08-29T08:00:00Z')).percent).toBe(64)
    expect(calculateReadiness([event], new Date('2026-09-10T08:00:00Z')).percent).toBe(100)
  })

  it('retains the contributing event in its explanation', () => {
    expect(calculateReadiness([event], new Date('2026-08-27T08:00:00Z')).contributors)
      .toEqual([{ label: 'Dumbbell bench press · 3 sets', remainingFatigue: 72 }])
  })
})
