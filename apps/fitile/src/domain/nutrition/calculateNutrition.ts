import type { Nutrients } from '../models'

export type NutritionInput = { grams: number; nutrientsPer100g: Partial<Nutrients> }

const tracked = ['kcal', 'proteinG', 'carbohydrateG', 'fatG', 'fiberG', 'sugarG', 'sodiumMg'] as const

export function sumNutrition(entries: NutritionInput[]): Nutrients {
  const result = Object.fromEntries(tracked.map((nutrient) => [nutrient, 0])) as Nutrients
  for (const entry of entries) {
    const ratio = Math.max(0, entry.grams) / 100
    for (const nutrient of tracked) result[nutrient] += (entry.nutrientsPer100g[nutrient] ?? 0) * ratio
  }
  for (const nutrient of tracked) result[nutrient] = Math.round(result[nutrient] * 10) / 10
  return result
}
