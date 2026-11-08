import { z } from 'zod'
import { muscleIds } from './models'

export const RecoveryEventSchema = z.object({
  id: z.string().min(1),
  muscleId: z.enum(muscleIds),
  fatigue: z.number().min(0).max(100),
  occurredAt: z.iso.datetime(),
  recoveryHours: z.number().positive().max(240),
  sourceLabel: z.string().min(1),
})

export const SetLogSchema = z.object({
  id: z.string().min(1),
  sessionId: z.string().min(1),
  exerciseId: z.string().min(1),
  setNumber: z.number().int().positive(),
  weightKg: z.number().nonnegative().optional(),
  repetitions: z.number().int().nonnegative().optional(),
  durationSeconds: z.number().nonnegative().optional(),
  distanceMeters: z.number().nonnegative().optional(),
  rpe: z.number().min(1).max(10).optional(),
  rir: z.number().min(0).max(10).optional(),
  completedAt: z.iso.datetime(),
})
