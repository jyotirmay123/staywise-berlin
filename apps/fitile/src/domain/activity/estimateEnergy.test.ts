import { estimateActivityKcal } from './estimateEnergy'

describe('estimateActivityKcal', () => {
  it('uses the standard MET, body weight, and duration equation', () => {
    expect(estimateActivityKcal({ met: 8.3, minutes: 30, weightKg: 80 }))
      .toEqual({ kcal: 349, estimated: true })
  })

  it('does not return negative energy for invalid negative duration', () => {
    expect(estimateActivityKcal({ met: 8.3, minutes: -1, weightKg: 80 }))
      .toEqual({ kcal: 0, estimated: true })
  })
})
