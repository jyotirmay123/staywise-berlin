import type { EquipmentCapability, Exercise, ExerciseMuscle, MuscleId, MovementPattern, TrainingSplit } from '../models'

const m = (muscleId: MuscleId, role: 'primary' | 'secondary' = 'primary', contribution = role === 'primary' ? 1 : 0.45): ExerciseMuscle => ({ muscleId, role, contribution })
const allStrengthSplits: TrainingSplit[] = ['upper', 'lower', 'full-body', 'fresh', 'manual']

type Seed = {
  id: string; name: string; muscles: ExerciseMuscle[]; requirements: EquipmentCapability[]; pattern: MovementPattern
  splits: TrainingSplit[]; level?: Exercise['minimumExperience']; tags?: string[]; unilateral?: boolean; kind?: Exercise['kind']
}

const exercise = ({ level = 'beginner', tags = [], kind = 'strength', ...seed }: Seed): Exercise => ({
  ...seed,
  shortName: seed.name,
  minimumExperience: level,
  contraindicationTags: tags,
  unilateral: seed.unilateral,
  kind,
  alternatives: [],
  instructions: ['Set a stable starting position and brace gently.', 'Move through a controlled, pain-free range.', 'Stop with one to three good repetitions still available.'],
})

export const exercises: Exercise[] = [
  exercise({ id: 'db-bench-press', name: 'Dumbbell bench press', muscles: [m('chest'), m('triceps','secondary'), m('front-delts','secondary')], requirements: ['dumbbell','flat-bench'], pattern: 'horizontal-push', splits: ['push','upper','full-body','fresh','manual'] }),
  exercise({ id: 'db-floor-press', name: 'Dumbbell floor press', muscles: [m('chest'), m('triceps','secondary')], requirements: ['dumbbell'], pattern: 'horizontal-push', splits: ['push','upper','full-body','fresh','manual'] }),
  exercise({ id: 'db-incline-press', name: 'Incline dumbbell press', muscles: [m('chest'),m('front-delts','secondary'),m('triceps','secondary')], requirements: ['dumbbell','incline-bench'], pattern: 'horizontal-push', splits: ['push','upper','full-body','fresh','manual'] }),
  exercise({ id: 'db-fly', name: 'Dumbbell fly', muscles: [m('chest'),m('front-delts','secondary')], requirements: ['dumbbell','flat-bench'], pattern: 'isolation', splits: ['push','upper','fresh','manual'], tags: ['shoulder-irritation'] }),
  exercise({ id: 'push-up', name: 'Push-up', muscles: [m('chest'),m('triceps','secondary'),m('front-delts','secondary'),m('abs','secondary')], requirements: ['bodyweight'], pattern: 'horizontal-push', splits: ['push','upper','full-body','fresh','manual'] }),
  exercise({ id: 'seated-db-press', name: 'Seated dumbbell shoulder press', muscles: [m('front-delts'),m('side-delts'),m('triceps','secondary')], requirements: ['dumbbell','seated-bench'], pattern: 'vertical-push', splits: ['push','upper','full-body','fresh','manual'] }),
  exercise({ id: 'arnold-press', name: 'Arnold press', muscles: [m('front-delts'),m('side-delts'),m('triceps','secondary')], requirements: ['dumbbell','seated-bench'], pattern: 'vertical-push', splits: ['push','upper','fresh','manual'], level: 'intermediate' }),
  exercise({ id: 'db-lateral-raise', name: 'Dumbbell lateral raise', muscles: [m('side-delts'),m('upper-back','secondary')], requirements: ['dumbbell'], pattern: 'isolation', splits: ['push','upper','fresh','manual'] }),
  exercise({ id: 'db-front-raise', name: 'Dumbbell front raise', muscles: [m('front-delts')], requirements: ['dumbbell'], pattern: 'isolation', splits: ['push','upper','fresh','manual'] }),
  exercise({ id: 'db-skull-crusher', name: 'Dumbbell skull crusher', muscles: [m('triceps')], requirements: ['dumbbell','flat-bench'], pattern: 'isolation', splits: ['push','upper','fresh','manual'], tags: ['elbow-irritation'] }),
  exercise({ id: 'db-overhead-triceps', name: 'Dumbbell overhead triceps extension', muscles: [m('triceps')], requirements: ['dumbbell'], pattern: 'isolation', splits: ['push','upper','fresh','manual'] }),
  exercise({ id: 'cable-triceps-pushdown', name: 'Cable triceps pushdown', muscles: [m('triceps')], requirements: ['high-cable'], pattern: 'isolation', splits: ['push','upper','fresh','manual'] }),
  exercise({ id: 'one-arm-db-row', name: 'One-arm dumbbell row', muscles: [m('lats'),m('upper-back'),m('biceps','secondary'),m('rear-delts','secondary')], requirements: ['dumbbell','flat-bench'], pattern: 'horizontal-pull', splits: ['pull','upper','full-body','fresh','manual'], unilateral: true }),
  exercise({ id: 'chest-supported-row', name: 'Chest-supported dumbbell row', muscles: [m('upper-back'),m('lats'),m('biceps','secondary'),m('rear-delts','secondary')], requirements: ['dumbbell','incline-bench'], pattern: 'horizontal-pull', splits: ['pull','upper','full-body','fresh','manual'] }),
  exercise({ id: 'bent-over-db-row', name: 'Bent-over dumbbell row', muscles: [m('lats'),m('upper-back'),m('biceps','secondary'),m('lower-back','secondary')], requirements: ['dumbbell'], pattern: 'horizontal-pull', splits: ['pull','upper','full-body','fresh','manual'], tags: ['lower-back-irritation'] }),
  exercise({ id: 'cable-seated-row', name: 'Seated cable row', muscles: [m('upper-back'),m('lats'),m('biceps','secondary')], requirements: ['low-cable','seated-bench'], pattern: 'horizontal-pull', splits: ['pull','upper','full-body','fresh','manual'] }),
  exercise({ id: 'band-lat-pulldown', name: 'Band lat pulldown', muscles: [m('lats'),m('biceps','secondary'),m('upper-back','secondary')], requirements: ['high-cable'], pattern: 'vertical-pull', splits: ['pull','upper','full-body','fresh','manual'] }),
  exercise({ id: 'db-pullover', name: 'Dumbbell pullover', muscles: [m('lats'),m('chest','secondary'),m('triceps','secondary')], requirements: ['dumbbell','flat-bench'], pattern: 'vertical-pull', splits: ['pull','upper','fresh','manual'] }),
  exercise({ id: 'db-rear-delt-fly', name: 'Dumbbell rear delt fly', muscles: [m('rear-delts'),m('upper-back','secondary')], requirements: ['dumbbell'], pattern: 'isolation', splits: ['pull','upper','fresh','manual'] }),
  exercise({ id: 'cable-face-pull', name: 'Cable face pull', muscles: [m('rear-delts'),m('upper-back'),m('biceps','secondary')], requirements: ['high-cable'], pattern: 'horizontal-pull', splits: ['pull','upper','fresh','manual'] }),
  exercise({ id: 'db-biceps-curl', name: 'Dumbbell biceps curl', muscles: [m('biceps'),m('forearms','secondary')], requirements: ['dumbbell'], pattern: 'isolation', splits: ['pull','upper','fresh','manual'] }),
  exercise({ id: 'hammer-curl', name: 'Hammer curl', muscles: [m('biceps'),m('forearms')], requirements: ['dumbbell'], pattern: 'isolation', splits: ['pull','upper','fresh','manual'] }),
  exercise({ id: 'incline-db-curl', name: 'Incline dumbbell curl', muscles: [m('biceps'),m('forearms','secondary')], requirements: ['dumbbell','incline-bench'], pattern: 'isolation', splits: ['pull','upper','fresh','manual'] }),
  exercise({ id: 'db-shrug', name: 'Dumbbell shrug', muscles: [m('upper-back'),m('forearms','secondary')], requirements: ['dumbbell'], pattern: 'carry', splits: ['pull','upper','fresh','manual'] }),
  exercise({ id: 'goblet-squat', name: 'Goblet squat', muscles: [m('quadriceps'),m('glutes'),m('adductors','secondary'),m('abs','secondary')], requirements: ['dumbbell'], pattern: 'squat', splits: ['legs','lower','full-body','fresh','manual'] }),
  exercise({ id: 'db-front-squat', name: 'Double dumbbell front squat', muscles: [m('quadriceps'),m('glutes'),m('abs','secondary')], requirements: ['dumbbell'], pattern: 'squat', splits: ['legs','lower','full-body','fresh','manual'], level: 'intermediate' }),
  exercise({ id: 'db-romanian-deadlift', name: 'Dumbbell Romanian deadlift', muscles: [m('hamstrings'),m('glutes'),m('lower-back','secondary'),m('forearms','secondary')], requirements: ['dumbbell'], pattern: 'hinge', splits: ['pull','legs','lower','full-body','fresh','manual'], tags: ['lower-back-irritation'] }),
  exercise({ id: 'db-sumo-deadlift', name: 'Dumbbell sumo deadlift', muscles: [m('glutes'),m('adductors'),m('quadriceps','secondary'),m('hamstrings','secondary')], requirements: ['dumbbell'], pattern: 'hinge', splits: ['legs','lower','full-body','fresh','manual'] }),
  exercise({ id: 'reverse-lunge', name: 'Dumbbell reverse lunge', muscles: [m('glutes'),m('quadriceps'),m('hamstrings','secondary')], requirements: ['dumbbell'], pattern: 'lunge', splits: ['legs','lower','full-body','fresh','manual'], unilateral: true }),
  exercise({ id: 'split-squat', name: 'Dumbbell split squat', muscles: [m('quadriceps'),m('glutes'),m('adductors','secondary')], requirements: ['dumbbell'], pattern: 'lunge', splits: ['legs','lower','full-body','fresh','manual'], unilateral: true }),
  exercise({ id: 'bulgarian-split-squat', name: 'Bulgarian split squat', muscles: [m('quadriceps'),m('glutes'),m('hamstrings','secondary')], requirements: ['dumbbell','flat-bench'], pattern: 'lunge', splits: ['legs','lower','full-body','fresh','manual'], unilateral: true, level: 'intermediate' }),
  exercise({ id: 'step-up', name: 'Dumbbell step-up', muscles: [m('quadriceps'),m('glutes'),m('hamstrings','secondary')], requirements: ['dumbbell','flat-bench'], pattern: 'lunge', splits: ['legs','lower','full-body','fresh','manual'], unilateral: true }),
  exercise({ id: 'db-hip-thrust', name: 'Dumbbell hip thrust', muscles: [m('glutes'),m('hamstrings','secondary')], requirements: ['dumbbell','flat-bench'], pattern: 'hinge', splits: ['legs','lower','full-body','fresh','manual'] }),
  exercise({ id: 'glute-bridge', name: 'Glute bridge', muscles: [m('glutes'),m('hamstrings','secondary')], requirements: ['bodyweight'], pattern: 'hinge', splits: ['legs','lower','full-body','fresh','manual'] }),
  exercise({ id: 'standing-calf-raise', name: 'Standing dumbbell calf raise', muscles: [m('calves')], requirements: ['dumbbell'], pattern: 'isolation', splits: ['legs','lower','fresh','manual'] }),
  exercise({ id: 'cable-leg-curl', name: 'Cable lying leg curl', muscles: [m('hamstrings'),m('calves','secondary')], requirements: ['low-cable','flat-bench'], pattern: 'isolation', splits: ['legs','lower','fresh','manual'] }),
  exercise({ id: 'cable-leg-extension', name: 'Cable seated leg extension', muscles: [m('quadriceps')], requirements: ['low-cable','seated-bench'], pattern: 'isolation', splits: ['legs','lower','fresh','manual'] }),
  exercise({ id: 'dead-bug', name: 'Dead bug', muscles: [m('abs'),m('hip-flexors','secondary')], requirements: ['bodyweight'], pattern: 'anti-rotation', splits: allStrengthSplits }),
  exercise({ id: 'forearm-plank', name: 'Forearm plank', muscles: [m('abs'),m('obliques'),m('front-delts','secondary')], requirements: ['bodyweight'], pattern: 'anti-rotation', splits: allStrengthSplits }),
  exercise({ id: 'side-plank', name: 'Side plank', muscles: [m('obliques'),m('abs','secondary'),m('side-delts','secondary')], requirements: ['bodyweight'], pattern: 'anti-rotation', splits: allStrengthSplits, unilateral: true }),
  exercise({ id: 'db-russian-twist', name: 'Dumbbell Russian twist', muscles: [m('obliques'),m('abs')], requirements: ['dumbbell'], pattern: 'rotation', splits: allStrengthSplits, tags: ['lower-back-irritation'] }),
  exercise({ id: 'twister-rotation', name: 'Controlled waist twister', muscles: [m('obliques'),m('abs','secondary'),m('hip-flexors','secondary')], requirements: ['twister'], pattern: 'rotation', splits: allStrengthSplits }),
  exercise({ id: 'suitcase-carry', name: 'Suitcase carry', muscles: [m('obliques'),m('forearms'),m('upper-back','secondary')], requirements: ['dumbbell'], pattern: 'carry', splits: ['pull','upper','lower','full-body','fresh','manual'], unilateral: true }),
  exercise({ id: 'farmers-carry', name: 'Farmer carry', muscles: [m('forearms'),m('upper-back'),m('abs','secondary'),m('calves','secondary')], requirements: ['dumbbell'], pattern: 'carry', splits: ['pull','upper','lower','full-body','fresh','manual'] }),
  exercise({ id: 'treadmill-walk', name: 'Treadmill walk', muscles: [m('cardiovascular'),m('calves','secondary'),m('quadriceps','secondary')], requirements: ['treadmill'], pattern: 'locomotion', splits: ['legs','lower','full-body','fresh','manual'], kind: 'cardio' }),
  exercise({ id: 'treadmill-incline-walk', name: 'Incline treadmill walk', muscles: [m('cardiovascular'),m('glutes','secondary'),m('calves','secondary')], requirements: ['treadmill'], pattern: 'locomotion', splits: ['legs','lower','full-body','fresh','manual'], kind: 'cardio' }),
  exercise({ id: 'treadmill-run', name: 'Treadmill run', muscles: [m('cardiovascular'),m('quadriceps','secondary'),m('hamstrings','secondary'),m('calves','secondary')], requirements: ['treadmill'], pattern: 'locomotion', splits: ['legs','lower','full-body','fresh','manual'], kind: 'cardio' }),
  exercise({ id: 'march-in-place', name: 'March in place', muscles: [m('cardiovascular'),m('hip-flexors','secondary')], requirements: ['bodyweight'], pattern: 'locomotion', splits: allStrengthSplits, kind: 'cardio' }),
  exercise({ id: 'cat-cow', name: 'Cat-cow mobility', muscles: [m('lower-back'),m('abs','secondary')], requirements: ['bodyweight'], pattern: 'mobility', splits: allStrengthSplits, kind: 'mobility' }),
  exercise({ id: 'hip-flexor-stretch', name: 'Half-kneeling hip-flexor stretch', muscles: [m('hip-flexors')], requirements: ['bodyweight'], pattern: 'mobility', splits: allStrengthSplits, kind: 'mobility' }),
]

export const exerciseById = Object.fromEntries(exercises.map((item) => [item.id, item])) as Record<string, Exercise>
