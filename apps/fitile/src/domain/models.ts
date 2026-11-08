export const muscleIds = [
  'chest', 'front-delts', 'side-delts', 'rear-delts', 'triceps', 'biceps', 'forearms',
  'upper-back', 'lats', 'lower-back', 'abs', 'obliques', 'glutes', 'quadriceps',
  'hamstrings', 'calves', 'hip-flexors', 'adductors', 'cardiovascular',
] as const

export type MuscleId = (typeof muscleIds)[number]
export type MuscleRole = 'primary' | 'secondary'
export type EquipmentCapability = 'bodyweight' | 'dumbbell' | 'flat-bench' | 'incline-bench' | 'seated-bench' | 'low-cable' | 'high-cable' | 'resistance-band' | 'twister' | 'treadmill'
export type MovementPattern = 'horizontal-push' | 'vertical-push' | 'horizontal-pull' | 'vertical-pull' | 'squat' | 'hinge' | 'lunge' | 'carry' | 'rotation' | 'anti-rotation' | 'core-flexion' | 'isolation' | 'locomotion' | 'mobility'
export type ExperienceLevel = 'beginner' | 'intermediate' | 'advanced'
export type TrainingSplit = 'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'full-body' | 'fresh' | 'manual'

export type ExerciseMuscle = { muscleId: MuscleId; role: MuscleRole; contribution: number }

export type Exercise = {
  id: string
  name: string
  shortName: string
  muscles: ExerciseMuscle[]
  requirements: EquipmentCapability[]
  alternatives: EquipmentCapability[][]
  pattern: MovementPattern
  splits: TrainingSplit[]
  minimumExperience: ExperienceLevel
  contraindicationTags: string[]
  unilateral?: boolean
  kind: 'strength' | 'cardio' | 'mobility'
  instructions: string[]
}

export type UserEquipment = {
  id: string
  name: string
  capabilities: EquipmentCapability[]
  minKg?: number
  maxKg?: number
  incrementKg?: number
  location: string
  available: boolean
}

export type SetLog = {
  id: string
  sessionId: string
  exerciseId: string
  setNumber: number
  weightKg?: number
  repetitions?: number
  durationSeconds?: number
  distanceMeters?: number
  rpe?: number
  rir?: number
  completedAt: string
}

export type RecoveryEvent = {
  id: string
  muscleId: MuscleId
  fatigue: number
  occurredAt: string
  recoveryHours: number
  sourceLabel: string
}

export type Nutrients = {
  kcal: number
  proteinG: number
  carbohydrateG: number
  fatG: number
  fiberG: number
  sugarG: number
  sodiumMg: number
  [nutrient: string]: number
}

export type Food = {
  id: string
  name: string
  brand?: string
  barcode?: string
  servingLabel: string
  servingGrams: number
  nutrientsPer100g: Partial<Nutrients>
  source: 'custom' | 'open-food-facts' | 'usda' | 'ai-estimate'
  sourceId?: string
  retrievedAt?: string
  estimated: boolean
}

export type MealEntry = {
  id: string
  foodId: string
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snacks'
  grams: number
  eatenAt: string
  snapshot: Food
}

export type Activity = {
  id: string
  type: 'walking' | 'running' | 'treadmill' | 'cycling' | 'custom'
  startedAt: string
  minutes: number
  distanceMeters?: number
  steps?: number
  caloriesKcal?: number
  calorieOrigin: 'manual' | 'estimated' | 'health-connect'
  sourceId?: string
}

export type BodyMeasurement = {
  id: string
  measuredAt: string
  weightKg?: number
  bodyFatPercent?: number
  waistCm?: number
  chestCm?: number
  hipCm?: number
  armCm?: number
  thighCm?: number
}

export type Profile = {
  id: string
  displayName: string
  birthYear?: number
  heightCm?: number
  weightKg: number
  goalWeightKg?: number
  experience: ExperienceLevel
  goal: 'general-fitness' | 'build-muscle' | 'strength' | 'fat-loss' | 'endurance'
  preferredSplit: TrainingSplit
  workoutDays: number
  workoutMinutes: number
  calorieTarget: number
  proteinTargetG: number
  locale: string
  units: 'metric' | 'imperial'
}
