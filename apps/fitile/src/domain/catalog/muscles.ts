import type { MuscleId } from '../models'

export type MuscleDefinition = { id: MuscleId; name: string; region: 'upper' | 'core' | 'lower' | 'system'; defaultRecoveryHours: number }

export const muscles: MuscleDefinition[] = [
  { id: 'chest', name: 'Chest', region: 'upper', defaultRecoveryHours: 72 },
  { id: 'front-delts', name: 'Front delts', region: 'upper', defaultRecoveryHours: 60 },
  { id: 'side-delts', name: 'Side delts', region: 'upper', defaultRecoveryHours: 48 },
  { id: 'rear-delts', name: 'Rear delts', region: 'upper', defaultRecoveryHours: 48 },
  { id: 'triceps', name: 'Triceps', region: 'upper', defaultRecoveryHours: 60 },
  { id: 'biceps', name: 'Biceps', region: 'upper', defaultRecoveryHours: 48 },
  { id: 'forearms', name: 'Forearms', region: 'upper', defaultRecoveryHours: 36 },
  { id: 'upper-back', name: 'Upper back', region: 'upper', defaultRecoveryHours: 72 },
  { id: 'lats', name: 'Lats', region: 'upper', defaultRecoveryHours: 72 },
  { id: 'lower-back', name: 'Lower back', region: 'core', defaultRecoveryHours: 96 },
  { id: 'abs', name: 'Abs', region: 'core', defaultRecoveryHours: 36 },
  { id: 'obliques', name: 'Obliques', region: 'core', defaultRecoveryHours: 48 },
  { id: 'glutes', name: 'Glutes', region: 'lower', defaultRecoveryHours: 72 },
  { id: 'quadriceps', name: 'Quadriceps', region: 'lower', defaultRecoveryHours: 72 },
  { id: 'hamstrings', name: 'Hamstrings', region: 'lower', defaultRecoveryHours: 72 },
  { id: 'calves', name: 'Calves', region: 'lower', defaultRecoveryHours: 48 },
  { id: 'hip-flexors', name: 'Hip flexors', region: 'lower', defaultRecoveryHours: 48 },
  { id: 'adductors', name: 'Adductors', region: 'lower', defaultRecoveryHours: 60 },
  { id: 'cardiovascular', name: 'Cardiovascular', region: 'system', defaultRecoveryHours: 24 },
]

export const muscleById = Object.fromEntries(muscles.map((muscle) => [muscle.id, muscle])) as Record<MuscleId, MuscleDefinition>
