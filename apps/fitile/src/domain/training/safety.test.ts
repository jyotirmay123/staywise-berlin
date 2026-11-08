import { validateWorkout } from './safety'

describe('validateWorkout', () => {
  it('rejects a plan that targets a fully fatigued primary muscle', () => {
    expect(validateWorkout({ exerciseIds: ['db-bench-press'], readiness: { chest: 12 }, capabilities: ['dumbbell','flat-bench'], excludedExerciseIds: [] }))
      .toEqual({ ok: false, issues: [{ exerciseId: 'db-bench-press', reason: 'Chest is only 12% ready' }] })
  })
})
