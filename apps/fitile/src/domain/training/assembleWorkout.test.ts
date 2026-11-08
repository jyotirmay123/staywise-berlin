import { assembleWorkout } from './assembleWorkout'

describe('assembleWorkout', () => {
  const base = {
    split: 'push' as const,
    durationMinutes: 45,
    capabilities: ['bodyweight', 'dumbbell', 'flat-bench', 'incline-bench', 'seated-bench'] as const,
    excludedExerciseIds: ['db-floor-press'],
    readiness: { chest: 95, 'front-delts': 88, 'side-delts': 90, triceps: 84 },
    variability: 'balanced' as const,
    seed: '2026-08-28:user-1',
  }

  it('never selects unavailable equipment or an excluded exercise', () => {
    const plan = assembleWorkout(base)
    expect(plan.exercises.every((item) => item.exercise.requirements.every((requirement) => base.capabilities.includes(requirement as typeof base.capabilities[number])))).toBe(true)
    expect(plan.exercises.map((item) => item.exercise.id)).not.toContain('db-floor-press')
  })

  it('is stable for identical input and explains the choice', () => {
    const first = assembleWorkout(base)
    expect(first).toEqual(assembleWorkout(base))
    expect(first.exercises[0].reasons.length).toBeGreaterThan(0)
  })
})
