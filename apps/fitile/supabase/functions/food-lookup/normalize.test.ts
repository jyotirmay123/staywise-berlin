import { normalizeOpenFoodFacts } from './normalize'

describe('normalizeOpenFoodFacts', () => {
  it('keeps nutrition provenance while normalizing per-100-gram values', () => {
    expect(normalizeOpenFoodFacts({ code:'4008400401627', product:{ product_name:'Milch-Schnitte', brands:'Ferrero', nutriments:{'energy-kcal_100g':421,proteins_100g:8.2,carbohydrates_100g:34.1,fat_100g:28.1} } })).toMatchObject({source:'open-food-facts',barcode:'4008400401627',nutrientsPer100g:{kcal:421,proteinG:8.2}})
  })
})
