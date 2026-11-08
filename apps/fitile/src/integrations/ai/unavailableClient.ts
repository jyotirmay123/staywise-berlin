import type { FoodPhotoAnalysisClient } from './types'
export const unavailableFoodPhotoClient: FoodPhotoAnalysisClient = { async analyze(){ throw new Error('ai-not-configured') } }
