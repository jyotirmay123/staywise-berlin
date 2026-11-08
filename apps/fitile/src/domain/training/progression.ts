export type ProgressionInput = { previousWeightKg: number; completedReps: number[]; repRange: [number, number]; averageRpe: number; incrementKg: number; maxKg: number }

export function suggestProgression(input: ProgressionInput) {
  const [minimum, maximum] = input.repRange
  if (input.completedReps.every((reps) => reps >= maximum) && input.averageRpe <= 8) {
    return { weightKg: Math.min(input.maxKg, input.previousWeightKg + input.incrementKg), reps: minimum, reason: 'Rep ceiling reached with controlled effort' }
  }
  if (input.completedReps.filter((reps) => reps < minimum).length >= 2 || input.averageRpe >= 9.5) {
    return { weightKg: Math.max(0, input.previousWeightKg - input.incrementKg), reps: minimum, reason: 'Load reduced after missed minimums or excessive effort' }
  }
  return { weightKg: input.previousWeightKg, reps: Math.min(maximum, Math.max(minimum, Math.max(...input.completedReps))), reason: 'Build another controlled repetition at the same load' }
}
