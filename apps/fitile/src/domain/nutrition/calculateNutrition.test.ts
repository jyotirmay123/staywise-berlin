import { sumNutrition } from './calculateNutrition'

describe('sumNutrition', () => {
  it('adds nutrients after converting each entry from its per-100-gram values', () => {
    expect(sumNutrition([
      { grams: 150, nutrientsPer100g: { kcal: 120, proteinG: 8, carbohydrateG: 20, fatG: 2 } },
      { grams: 50, nutrientsPer100g: { kcal: 200, proteinG: 4, carbohydrateG: 10, fatG: 12 } },
    ])).toEqual({ kcal: 280, proteinG: 14, carbohydrateG: 35, fatG: 9, fiberG: 0, sugarG: 0, sodiumMg: 0 })
  })

  it('treats unavailable optional nutrients as zero without inventing values', () => {
    expect(sumNutrition([{ grams: 100, nutrientsPer100g: { kcal: 80 } }]))
      .toMatchObject({ kcal: 80, proteinG: 0, sodiumMg: 0 })
  })
})
