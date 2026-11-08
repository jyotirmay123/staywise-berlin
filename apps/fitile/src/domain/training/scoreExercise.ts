import type { EquipmentCapability, Exercise, MuscleId, TrainingSplit } from '../models'

export type ExerciseScore = { exercise: Exercise; total: number; reasons: string[] }
export type ScoreInput = { exercise: Exercise; split: TrainingSplit; readiness: Partial<Record<MuscleId, number>>; capabilities: readonly EquipmentCapability[] }

export const requirementsMet = (exercise: Exercise, capabilities: readonly EquipmentCapability[]) => exercise.requirements.every((requirement) => capabilities.includes(requirement))

export function scoreExercise({ exercise, split, readiness, capabilities }: ScoreInput): ExerciseScore {
  if (!requirementsMet(exercise, capabilities) || !exercise.splits.includes(split)) return { exercise, total: Number.NEGATIVE_INFINITY, reasons: [] }
  const primary = exercise.muscles.filter((muscle) => muscle.role === 'primary')
  const averageReadiness = primary.reduce((sum, muscle) => sum + (readiness[muscle.muscleId] ?? 80), 0) / Math.max(1, primary.length)
  const compoundBonus = exercise.pattern === 'isolation' ? 0 : 8
  const reasons = [`${Math.round(averageReadiness)}% target-muscle readiness`, `Matches your ${split.replace('-', ' ')} focus`]
  if (compoundBonus) reasons.push('Efficient multi-muscle movement')
  return { exercise, total: averageReadiness + compoundBonus, reasons }
}
