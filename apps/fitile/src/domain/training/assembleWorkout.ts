import { exercises } from '../catalog/exercises'
import type { EquipmentCapability, MuscleId, TrainingSplit } from '../models'
import { scoreExercise, type ExerciseScore } from './scoreExercise'

export type WorkoutPlan = {
  id: string
  source: 'deterministic' | 'ai'
  split: TrainingSplit
  durationMinutes: number
  exercises: (ExerciseScore & { sets: number; repRange: [number, number]; restSeconds: number; suggestedWeightKg?: number })[]
  explanation: string
}

export type AssembleWorkoutInput = {
  split: TrainingSplit
  durationMinutes: number
  capabilities: readonly EquipmentCapability[]
  excludedExerciseIds: readonly string[]
  readiness: Partial<Record<MuscleId, number>>
  variability: 'consistent' | 'balanced' | 'varied'
  seed: string
}

const hash = (value: string) => [...value].reduce((total, character) => ((total << 5) - total + character.charCodeAt(0)) | 0, 0)

export function assembleWorkout(input: AssembleWorkoutInput): WorkoutPlan {
  const scored = exercises
    .filter((exercise) => exercise.kind === 'strength' && !input.excludedExerciseIds.includes(exercise.id))
    .map((exercise) => scoreExercise({ exercise, ...input }))
    .filter((result) => Number.isFinite(result.total))
    .filter((result) => result.exercise.muscles.filter((muscle) => muscle.role === 'primary').every((muscle) => (input.readiness[muscle.muscleId] ?? 80) >= 20))
    .sort((left, right) => right.total - left.total || hash(`${input.seed}:${left.exercise.id}`) - hash(`${input.seed}:${right.exercise.id}`))

  const count = Math.max(3, Math.min(7, Math.floor(input.durationMinutes / 9)))
  const selected: typeof scored = []
  for (const candidate of scored) {
    if (selected.length >= count) break
    const samePattern = selected.filter((item) => item.exercise.pattern === candidate.exercise.pattern).length
    if (samePattern >= 2) continue
    selected.push(candidate)
  }
  return {
    id: `plan-${Math.abs(hash(input.seed))}`,
    source: 'deterministic', split: input.split, durationMinutes: input.durationMinutes,
    exercises: selected.map((item, index) => ({ ...item, sets: index < 2 ? 4 : 3, repRange: item.exercise.pattern === 'isolation' ? [10, 15] : [8, 12], restSeconds: index < 2 ? 90 : 60, suggestedWeightKg: item.exercise.requirements.includes('dumbbell') ? (index < 2 ? 12.5 : 7.5) : undefined })),
    explanation: `Prioritizes recovered ${input.split.replace('-', ' ')} muscles, your available equipment, and balanced weekly volume.`,
  }
}
