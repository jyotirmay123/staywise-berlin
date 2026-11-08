import { z } from 'zod'
export const AiWorkoutSchema=z.object({exercises:z.array(z.object({exerciseId:z.string().min(1),sets:z.number().int().min(1).max(6),repsMin:z.number().int().min(1).max(50),repsMax:z.number().int().min(1).max(60),suggestedWeightKg:z.number().min(0).max(100).optional(),restSeconds:z.number().int().min(15).max(300),rationale:z.string().min(8).max(240)})).min(1).max(10),summary:z.string().max(400).optional()})
export type AiWorkout=z.infer<typeof AiWorkoutSchema>
