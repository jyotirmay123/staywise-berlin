# Privacy and data ownership

Fitile is designed around local-first, user-owned health records.

## What is stored

- Profile goals, preferences, equipment, and limitations
- Workout sessions, set weights/repetitions, soreness, and recovery inputs
- Meals, portions, nutrition estimates, activities, and body measurements
- Sync metadata needed to reconcile offline edits

Local records live in the browser/app’s IndexedDB. GitHub Pages mode does not initialize cloud services. In the regular build, optional backend transport and auth are provided; a running sync engine must be integrated and verified before claiming automatic synchronization. Database row-level-security policies scope each private row to the authenticated user ID.

## Photos, barcodes, and AI

Barcode numbers are sent to Fitile’s server function and Open Food Facts for product lookup. Meal photos are sent to Fitile’s authenticated server function and the configured AI provider only when the user requests an estimate. Fitile requests non-persistent AI processing (`store: false`) and saves the structured estimate—not the original photo—after the user confirms it. Infrastructure/provider logs and retention are governed by the operator’s chosen Supabase and AI account settings.

Never place AI or service-role secrets in `.env.local`, compiled JavaScript, or the APK. Only publishable Supabase values may be client-side.

## User controls

The Data & sync screen provides:

- A versioned JSON archive intended for complete restore
- Separate CSV files for readable/portable analysis
- Archive validation before restore
- Local-only status and explicit import results

Pages mode does not offer cloud account deletion.

A cloud operator must implement a re-authenticated server deletion endpoint before accepting public users. A production privacy notice should identify the operator, contact address, hosting region, processors, retention policy, lawful basis, and GDPR rights.

## Safety and accuracy

Recovery readiness, calories burned, food-photo analysis, barcode data, and nutrient totals are estimates. They are not diagnoses, medical advice, or substitutes for package labels and professional care. Stop exercise and seek appropriate help for sharp pain, chest pain, dizziness, or unusual shortness of breath.
