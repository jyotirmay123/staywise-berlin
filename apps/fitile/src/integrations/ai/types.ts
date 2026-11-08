export type FoodPhotoItem = { id: string; name: string; portion: string; grams: number; kcal: number; proteinG: number; carbohydrateG: number; fatG: number; confidence: number; assumption: string }
export type FoodPhotoEstimate = { items: FoodPhotoItem[]; overallConfidence: 'low'|'medium'|'high'; estimated: true }
export interface FoodPhotoAnalysisClient { analyze(image: Blob): Promise<FoodPhotoEstimate> }
