import type { UserEquipment } from '../models'

export const defaultHomeEquipment: UserEquipment[] = [
  { id: 'bodyweight-home', name: 'Bodyweight', capabilities: ['bodyweight'], location: 'Home', available: true },
  { id: 'adjustable-dumbbells-home', name: 'Adjustable dumbbells', capabilities: ['dumbbell'], minKg: 5, maxKg: 25, incrementKg: 2.5, location: 'Home', available: true },
  { id: 'adjustable-bench-home', name: 'Adjustable bench', capabilities: ['flat-bench', 'incline-bench', 'seated-bench'], location: 'Home', available: true },
  { id: 'bench-cables-home', name: 'Bench cable attachments', capabilities: ['low-cable', 'high-cable', 'resistance-band'], location: 'Home', available: true },
  { id: 'twister-home', name: 'Waist twister', capabilities: ['twister'], location: 'Home', available: true },
  { id: 'treadmill-home', name: 'Treadmill', capabilities: ['treadmill'], location: 'Home', available: true },
]
