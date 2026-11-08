import type { Profile } from '../../domain/models'
import { defaultHomeEquipment } from '../../domain/catalog/equipment'

// Synthetic example values, never a real user profile.
export const demoProfile: Profile = {
  id: 'demo-user',
  displayName: 'Example athlete',
  
  heightCm: 170,
  weightKg: 70,
  
  experience: 'beginner',
  goal: 'general-fitness',
  preferredSplit: 'full-body',
  workoutDays: 4,
  workoutMinutes: 50,
  calorieTarget: 2200,
  proteinTargetG: 100,
  locale: 'en-DE',
  units: 'metric',
}

export const demoEquipment = defaultHomeEquipment
