import { exerciseById } from '../catalog/exercises'
import { muscleById } from '../catalog/muscles'
import type { EquipmentCapability, MuscleId } from '../models'
import { requirementsMet } from './scoreExercise'

export type ValidationInput = { exerciseIds: string[]; readiness: Partial<Record<MuscleId, number>>; capabilities: EquipmentCapability[]; excludedExerciseIds: string[] }

export function validateWorkout(input: ValidationInput) {
  const issues: { exerciseId: string; reason: string }[] = []
  for (const exerciseId of input.exerciseIds) {
    const exercise = exerciseById[exerciseId]
    if (!exercise) { issues.push({ exerciseId, reason: 'Exercise is not in the approved catalog' }); continue }
    if (input.excludedExerciseIds.includes(exerciseId)) issues.push({ exerciseId, reason: 'Exercise is excluded' })
    if (!requirementsMet(exercise, input.capabilities)) issues.push({ exerciseId, reason: 'Required equipment is unavailable' })
    for (const muscle of exercise.muscles.filter((item) => item.role === 'primary')) {
      const value = input.readiness[muscle.muscleId]
      if (value !== undefined && value < 20) issues.push({ exerciseId, reason: `${muscleById[muscle.muscleId].name} is only ${value}% ready` })
    }
  }
  return issues.length ? { ok: false as const, issues } : { ok: true as const, issues: [] }
}
