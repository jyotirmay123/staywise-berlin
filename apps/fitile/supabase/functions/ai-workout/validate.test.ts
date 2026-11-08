import { validateAiWorkout } from './validate'

describe('validateAiWorkout', () => {
  it('rejects an exercise outside the supplied allowlist', () => {
    expect(validateAiWorkout({exercises:[{exerciseId:'barbell-squat',sets:3,repsMin:8,repsMax:10,restSeconds:90,rationale:'Compound leg movement'}]}, {allowedIds:['goblet-squat'],maxExercises:6}))
      .toEqual({ok:false,reason:'exercise-not-allowed'})
  })

  it('accepts a bounded plan containing only allowed exercises', () => {
    expect(validateAiWorkout({exercises:[{exerciseId:'goblet-squat',sets:3,repsMin:8,repsMax:10,restSeconds:90,rationale:'Fresh legs and available dumbbell'}]}, {allowedIds:['goblet-squat'],maxExercises:6}))
      .toEqual({ok:true})
  })
})
