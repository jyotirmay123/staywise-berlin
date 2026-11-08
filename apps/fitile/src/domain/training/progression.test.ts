import { suggestProgression } from './progression'

describe('suggestProgression', () => {
  it('uses the next representable weight when all sets reach the rep ceiling', () => {
    expect(suggestProgression({ previousWeightKg: 10, completedReps: [12, 12, 12], repRange: [8, 12], averageRpe: 8, incrementKg: 2.5, maxKg: 25 }))
      .toEqual({ weightKg: 12.5, reps: 8, reason: 'Rep ceiling reached with controlled effort' })
  })

  it('reduces the load after repeated missed minimums', () => {
    expect(suggestProgression({ previousWeightKg: 15, completedReps: [5, 5, 4], repRange: [8, 12], averageRpe: 10, incrementKg: 2.5, maxKg: 25 }))
      .toMatchObject({ weightKg: 12.5, reps: 8 })
  })
})
