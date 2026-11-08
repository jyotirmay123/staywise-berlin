# Fitile V1 Product and Technical Design

**Status:** Approved in conversation on 2026-08-28

## 1. Purpose

Fitile is a private, installable health and fitness application for web and Android. It combines adaptive strength-programming workflows with nutrition, body, and cardio tracking. The catalog uses illustrative home-gym equipment presets, while equipment and exercise models remain extensible.

Fitile is not a medical device. Recovery, energy-expenditure, and food-photo values are estimates. The interface must identify estimates, allow correction, avoid diagnosis, and direct users with injuries, symptoms, eating-disorder concerns, or medical conditions to qualified professionals.

## 2. V1 Outcomes

V1 succeeds when a user can:

1. Sign in with Google on Android or the web and see synchronized data on both.
2. Complete onboarding for goals, body data, experience, schedule, limitations, diet, available equipment, and adjustable weight ranges.
3. Generate an explainable deterministic workout or explicitly choose an AI alternative.
4. Select Push/Pull/Legs, Upper/Lower, Full Body, Fresh Muscles, or a manual muscle focus.
5. Log sets, repetitions, weights, duration, distance, effort, and exercise completion quickly during a session.
6. See how completed exercise sets affect each muscle's readiness and estimated recovery timeline.
7. Log food manually, from recent/favorite foods, by barcode, or from a photographed-meal estimate that the user confirms.
8. Track calorie, macro, and available micronutrient totals against editable targets.
9. Log walking, running, treadmill, and custom cardio sessions and import supported Android records with optional Health Connect permission.
10. Review weekly adherence, training volume, personal records, body measurements, nutrition trends, and goal progress.
11. Continue core browsing, deterministic recommendation, and logging flows offline, then synchronize automatically.
12. Export all owned data as versioned JSON and human-readable CSV files, restore a compatible JSON archive, and delete the account and its synchronized data.

## 3. Product Scope

### 3.1 Today

The Today screen is the daily control center. It shows:

- The recommended workout with its source, target muscles, duration, and plain-language rationale.
- Current muscle readiness summary and the most fatigued/recovered groups.
- Calories consumed, activity calories, remaining calorie budget, macros, and hydration.
- Weight or soreness check-in prompts when useful.
- A chronological daily log of workouts, meals, activities, and measurements.
- One quick-add action for food, barcode, food photo, weight, water, walking/running, or custom activity.

### 3.2 Train

The user selects a saved schedule or overrides the current session with:

- Split: Push, Pull, Legs, Upper, Lower, Full Body, Fresh Muscles, or Manual.
- Duration: 15–90 minutes.
- Difficulty: easy, standard, or hard.
- Exercise variability: consistent, balanced, or varied.
- Equipment available for this session.
- Warm-up and cooldown inclusion.

A generated workout contains ordered exercises, target muscles, sets, rep or duration ranges, weight suggestions where applicable, rest periods, and explanations. Users can swap an exercise for validated alternatives, reorder it, add one manually, save the workout, or regenerate it.

The active-session view provides previous performance, editable weight/reps/duration, set completion, RPE or reps-in-reserve, rest timer, undo, add/remove set, notes, and finish/discard controls. A discarded in-progress session remains recoverable until the user explicitly removes it.

### 3.3 Recovery

Recovery shows front and back anatomical maps plus an accessible list. Each muscle group has a 0–100 readiness percentage, state label, color, estimated time to high readiness, and an explanation of recent contributors. Color semantics are:

- 75–100: fresh (green)
- 40–74: recovering (amber)
- 0–39: fatigued (coral-red)

Percentages and labels are always present, so color is never the sole signal. Users can log soreness and temporarily override readiness. The system records the override separately from computed readiness.

The V1 readiness estimate is a transparent training-load heuristic, not a biological claim. Each completed set creates fatigue contributions for primary and secondary muscles based on normalized volume, effort, set count, movement role, and experience-adjusted caps. Cardio creates smaller contributions for involved lower-body muscles based on duration and intensity. Fatigue decays continuously with elapsed time using muscle-category recovery windows and user feedback. The engine exposes its inputs and output explanation.

### 3.4 Food

The food diary groups entries into breakfast, lunch, dinner, and snacks. It supports:

- Search across the user's recent, favorite, custom, cached, and external foods.
- Serving and gram-based quantity editing.
- Manual foods with per-serving or per-100 g nutrients.
- Barcode scanning with Open Food Facts lookup.
- AI meal-photo analysis with itemized foods, portion estimates, calories, macros, optional micronutrients, confidence, and assumptions.
- Confirmation and correction before an AI estimate reaches the diary.
- Copy meal/day, save meal, favorite food, and quick-add calories/macros.
- Daily calorie, protein, carbohydrate, fat, fiber, sugar, sodium, and available vitamin/mineral totals.

Open Food Facts is the primary packaged-food source for Germany and Europe. USDA FoodData Central is a secondary source for generic foods. Every imported record stores source, source identifier, retrieval time, and whether the user changed it. Missing or conflicting values remain visibly incomplete rather than being invented.

Food photos are compressed before upload and removed after analysis by default. The confirmed derived entry remains. Users may opt in to retain a photo with the diary record.

### 3.5 Activity and Progress

Activities include outdoor/indoor walking, running, treadmill, cycling, and custom cardio. Manual logs accept duration, distance, steps, pace, incline, intensity, and optional calories. When calories are not supplied, Fitile shows an editable estimate based on activity MET, duration, and current weight and labels it as estimated.

Android users may optionally import supported exercise, distance, step, energy, and body records through Health Connect. Each permission is requested in context; Fitile remains fully usable without it. Imported records retain source metadata and are deduplicated.

Progress includes weekly/monthly views for adherence, training volume, estimated one-rep maximum, personal records, exercise history, body weight and measurements, calorie/macronutrient averages, activity, and goal pace. Trends require sufficient data and never convert weak signals into health conclusions.

### 3.6 Profile, Equipment, and Ownership

Profile settings include preferred name, locale, metric/imperial units, time zone, birth year, height, current/goal weight, sex used for optional calorie equations, experience, goal, training days, preferred split, session duration, limitations, dietary target, and manual calorie/macro overrides.

Equipment is data-driven. Each item has type, capabilities, constraints, location, and availability. V1 presets cover adjustable dumbbells, adjustable bench, cable/band attachment, twister, treadmill, and bodyweight. Users can add a custom item. Exercises declare required capabilities rather than hard-coded product names, so future equipment can become eligible without changing recommendation code.

Export produces one versioned JSON archive containing every user-owned record and separate CSV files for workouts, sets, meals, nutrients, activities, measurements, soreness/readiness history, and settings. Restore validates archive version and records a result summary before modifying synchronized data. Account deletion requires explicit confirmation and removes database records and retained photos.

## 4. Recommendation Systems

### 4.1 Deterministic Coach

The deterministic coach is the default and must function offline from cached data. It first applies hard eligibility filters:

- Required equipment capabilities are present.
- The exercise is compatible with limitations and explicit exclusions.
- The exercise matches the chosen split or manual target.
- The load can be performed within known equipment ranges or without load.
- The required primary muscles are not below the hard fatigue threshold, unless the user explicitly overrides the warning.

It then scores eligible exercises using weighted, independently testable factors:

- Split and target-muscle match.
- Primary and secondary muscle readiness.
- Weekly target-volume gap.
- Movement-pattern balance.
- Progression continuity and availability of a plausible next load/repetition target.
- Recent exposure and the chosen variability preference.
- User preference: recommend more, neutral, recommend less, or exclude.
- Experience suitability and complexity.
- Fit within remaining session duration.

Workout assembly selects a safe number of compound and accessory movements, prevents redundant movement patterns, respects duration, and adds warm-up/cooldown elements. The explanation identifies the strongest scoring reasons and any compromises.

Progression uses completed history and effort. When all prescribed sets reach the upper rep bound at acceptable effort, the next representable dumbbell increment is suggested. If effort is excessive or prescribed minimums are repeatedly missed, weight or volume decreases. New users receive conservative defaults. The algorithm caps abrupt weekly volume changes.

### 4.2 AI Coach

AI Coach is an explicit alternative, never an invisible replacement. A Supabase Edge Function sends a constrained summary—not the full raw database—to an OpenAI Responses API model. The request includes goal, experience, limitations, selected split, duration, available equipment, readiness, recent volume/performance, preferences, and the IDs of allowed exercises.

The model returns structured JSON containing only allowed exercise IDs, sets, reps/duration, suggested load, rest, and concise rationale. The server validates the schema. The shared safety validator then enforces equipment, exclusion, fatigue, duration, volume-spike, and load constraints. Invalid or unsafe output is rejected and the deterministic workout is returned with a visible fallback message.

The OpenAI API key exists only in server secrets. AI calls record model, timestamp, purpose, token/usage metadata, validation result, and user-visible result ID, but do not store provider reasoning. AI can explain choices and suggest alternatives; it cannot diagnose, rehabilitate injuries, recommend supplements/medication, or override explicit safety constraints.

### 4.3 Food Photo Estimation

Food-photo analysis uses the same protected server boundary and a vision-capable model. The model must produce structured itemized estimates with confidence and assumptions. Fitile calculates totals from the returned items, shows the image-derived nature of the estimate, and requires review before saving. If uncertainty is high, the interface asks for portion or ingredient clarification rather than fabricating precision.

## 5. Architecture

### 5.1 Client

- React and TypeScript application built with Vite.
- Responsive PWA with web app manifest and service worker.
- Capacitor Android wrapper producing a debug APK and supporting native camera, barcode, and Health Connect bridges.
- IndexedDB local database containing the signed-in user's cached domain data, reference catalog, drafts, and synchronization outbox.
- Feature-oriented modules with domain logic independent of UI and Supabase.
- English V1 copy stored through an internationalization layer ready for German translations.

Mobile uses five bottom destinations: Today, Train, Food, Progress, and Profile. Desktop replaces the bottom bar with a navigation rail and wider tile grid. The visual system uses graphite/off-white surfaces, fresh green, amber, and coral-red states, strong typography, accessible contrast, 44 px minimum touch targets, keyboard navigation, semantic labels, and reduced-motion support.

### 5.2 Cloud

- Supabase Auth with Google OAuth.
- PostgreSQL as the synchronized source of truth.
- Row Level Security on every user-owned table using the authenticated user ID.
- Supabase Storage for transient food photos and optional retained user photos.
- Edge Functions for OpenAI, Open Food Facts, USDA, and export orchestration where secrets or identifying headers are required.
- Schema migrations and deterministic seed scripts versioned in the repository.

The application supports a demo/local mode with seeded sample data when Supabase credentials are absent. Demo mode is clearly labeled, uses no Google sign-in or cross-device sync, and exists for development and evaluation only.

### 5.3 Synchronization

Every mutable record has a client-generated UUID, owner ID, creation/update timestamps, and deletion tombstone where appropriate. Client writes first update IndexedDB and append an outbox operation. The sync worker sends idempotent upserts/deletes after authentication and connectivity return.

Workout sets, food entries, activities, and measurements are independently addressed event records to minimize conflicts. Concurrent changes to the same mutable record use newest-update-wins based on server-normalized update time; the losing version is retained in a local conflict log and surfaced when user-visible information differs. Reference catalog records are versioned and read-only to clients. Realtime notifications prompt incremental pulls on other active devices.

### 5.4 Core Data Boundaries

The schema contains these aggregates:

- Identity: `profiles`, `user_preferences`, `goals`, `limitations`.
- Equipment: `equipment_types`, `user_equipment`, `equipment_capabilities`.
- Exercise catalog: `muscles`, `exercises`, `exercise_muscles`, `exercise_requirements`, `exercise_instructions`, `exercise_preferences`.
- Training: `workout_plans`, `workout_exercises`, `workout_sessions`, `session_exercises`, `set_logs`, `recovery_events`, `soreness_checkins`.
- Nutrition: `foods`, `food_nutrients`, `food_sources`, `meals`, `meal_entries`, `food_photo_analyses`, `hydration_logs`.
- Activity/body: `activities`, `health_imports`, `body_measurements`.
- Operations: `ai_requests`, `sync_conflicts`, `export_jobs`.

Public reference data and user-owned data are separated. Users may create private exercises and foods without altering shared catalog records.

## 6. External Data and Cost Strategy

- Open Food Facts API v3 supplies packaged-food barcode data. Read access has no commercial subscription, but it is rate limited and crowdsourced; Fitile caches results and preserves attribution and source metadata.
- USDA FoodData Central supplies public-domain generic food data. A free data.gov key supports normal use; Fitile caches selected records.
- Wger's Creative Commons exercise content may seed attributable exercise metadata after per-entry license review. Fitile does not depend on a live Wger service and does not incorporate Wger application code.
- Supabase Free is suitable for personal evaluation. Current documented allowances include a 500 MB database, 1 GB storage, social OAuth, and 50,000 monthly active users; production reliability may later justify the paid plan.
- Google OAuth configuration is free but requires a Google Cloud project, consent-screen configuration, client credentials, and authorized redirect URLs.
- OpenAI API usage is pay-as-you-go. Fitile enforces per-user daily limits, compresses images, uses a cost-conscious configurable model, and displays AI usage counts. No OpenAI subscription is bundled or required for deterministic features.
- Building and sideloading a debug APK is free. Google Play distribution, a custom domain, hosted frontend, or higher backend usage can add separate costs and are not required to run the local/demo build.

## 7. Error Handling and Safety

- Network failures never discard confirmed local logs; they remain queued with visible sync state and retry automatically.
- Authentication expiry pauses cloud synchronization and asks the user to sign in again without deleting local data.
- External food lookup failures route to manual entry. Rate limits use cached data and bounded retry with user-visible status.
- AI timeout, schema failure, unknown exercise, or safety-validator failure routes to the deterministic coach.
- Camera denial leaves upload/manual/barcode-number alternatives available.
- Health Connect denial or unavailability leaves manual logging available.
- Export and restore validate checksums/schema versions. Restore shows additions, updates, conflicts, and rejected records.
- Destructive account actions require reauthentication and confirmation.
- Limitations and soreness are constraints, not medical diagnoses. The app displays urgent-care guidance for user-entered severe warning symptoms and does not create a workout in that state.

## 8. Testing and Acceptance

### 8.1 Automated Tests

- Unit tests: scoring factors, workout assembly, progression, volume caps, recovery decay, muscle contribution, calorie/macro totals, MET estimates, portion conversion, export serialization, schema validation, and conflict resolution.
- Property/edge tests: readiness remains within 0–100, deterministic generation is stable for identical inputs, excluded equipment/exercises never appear, nutrition totals are additive, and duplicate sync operations are idempotent.
- Integration tests: IndexedDB repositories, outbox replay, Supabase adapters, Row Level Security policies, external food normalization, AI response validation, and JSON restore.
- Browser tests: onboarding, deterministic generation, active workout completion, recovery update, manual/barcode/photo-confirmation food flows, offline logging and reconnection, Google-auth callback handling, export, and responsive navigation.
- Android checks: camera/barcode permission behavior, PWA/native navigation, Health Connect availability/denial behavior, and successful debug APK installation build.

### 8.2 Release Acceptance

V1 is ready only when:

1. Type checking, linting, unit/integration tests, and browser tests pass without unexpected warnings.
2. A production PWA build is installable and its offline core flows work after initial load.
3. A debug Android APK builds successfully from the same application and native-only features degrade safely when unavailable.
4. RLS tests demonstrate that one authenticated user cannot read or mutate another user's records.
5. Deterministic workouts never include unavailable equipment, excluded exercises, or disallowed limitations in the test matrix.
6. AI and food-photo outputs cannot reach logs before schema validation and user confirmation where required.
7. Export contains all user-owned data and a round-trip restore reproduces the tested account dataset.

## 9. Delivery Boundaries

V1 includes production-shaped code, migrations, tests, sample data, configuration documentation, the installable PWA, and an Android debug APK when the local Android toolchain permits it. Deployment credentials, Google OAuth secrets, Supabase project creation, OpenAI billing, a public domain, Play Store signing/publication, clinician validation, live wearable vendor integrations beyond Health Connect, meal recipes/planning, social features, and coaching by a human professional are outside the repository's automatic setup and require separate user-owned accounts or future work.

## 10. Research Basis

- [Fitbod feature overview](https://fitbod.zendesk.com/hc/en-us/sections/360012732693-Feature-Overview)
- [Fitbod workout generation](https://help.fitbod.me/hc/en-us/articles/360004429814-How-Fitbod-Creates-Your-Workout)
- [Fitbod muscle recovery](https://help.fitbod.me/hc/en-us/articles/360006269014-Muscle-Recovery)
- [YAZIO application tutorial](https://help.yazio.com/hc/en-us/articles/11804776635281-Tutorial-of-the-Yazio-app)
- [MyFitnessPal Premium features](https://support.myfitnesspal.com/hc/en-us/articles/360032625951-What-are-the-features-of-MyFitnessPal-Premium)
- [Open Food Facts API](https://openfoodfacts.github.io/openfoodfacts-server/api/)
- [USDA FoodData Central API](https://fdc.nal.usda.gov/api-guide/)
- [Wger documentation and licensing](https://wger.readthedocs.io/en/latest/)
- [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Supabase pricing](https://supabase.com/pricing)
- [Android Health Connect](https://developer.android.com/health-and-fitness/health-connect)
- [OpenAI Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)
