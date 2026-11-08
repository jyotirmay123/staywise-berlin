import { FoodPhotoEstimateSchema } from './schema'

describe('FoodPhotoEstimateSchema', () => {
  it('requires confidence and assumptions for every photo-derived item', () => {
    expect(() => FoodPhotoEstimateSchema.parse({items:[{name:'Rice',grams:180,kcal:234,proteinG:5,carbohydrateG:50,fatG:1}]})).toThrow()
  })
})
