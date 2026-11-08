import { z } from 'zod'

export const OnboardingSchema = z.object({
  goal: z.enum(['general-fitness', 'build-muscle', 'strength', 'fat-loss', 'endurance']),
  split: z.enum(['push-pull-legs', 'upper-lower', 'full-body', 'fresh']),
  equipment: z.array(z.string()).min(1),
  workoutDays: z.number().int().min(1).max(7),
  workoutMinutes: z.number().int().min(15).max(90),
})

export type OnboardingData = z.infer<typeof OnboardingSchema>
