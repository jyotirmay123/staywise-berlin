# Fitile setup and operating costs

## 1. Web and PWA

Requirements: Node.js 20 or newer.

```bash
npm install
cp .env.example .env.local
npm run dev
```

For production, run `npm run build` and publish the `dist/` directory on any HTTPS static host. HTTPS is required for production service workers and install prompts. Configure the host to fall back unknown routes to `index.html`.

## 2. Supabase synchronization and Google sign-in

1. Create a Supabase project in the EU region if German/EU data residency is preferred.
2. Install the Supabase CLI, authenticate, and link this repository to the project.
3. Apply `supabase/migrations/202608280001_core_schema.sql`, `202608280002_rls.sql`, and `202608280003_reference_catalog.sql` in order (or run `supabase db push`).
4. Copy the Project URL and publishable/anon key into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Never put the service-role key in a browser or APK.
5. In Google Cloud Console, create an OAuth consent screen and OAuth web client. Add the Supabase callback URL shown under Authentication → Providers → Google to Google’s authorized redirect URIs.
6. Add the Google client ID and secret to Supabase’s Google provider. Add the deployed Fitile URL and `/auth/callback` to Supabase’s site and redirect URL allow-list.

Fitile uses PKCE, persistent sessions, row-level-security policies tied to `auth.uid()`, a local operation outbox, retries, and conflict copies. These transport primitives require explicit sync-engine integration before cross-device synchronization can be claimed.

For an Android production release, register the final package/signing SHA configuration required by your Google OAuth setup and test the deep-link callback `app.fittile.health://auth/callback` on a physical device.

## 3. Edge functions and optional AI

Deploy `food-lookup`, `ai-workout`, and `analyze-food-photo` from `supabase/functions/`. Set secrets on the server, never as `VITE_` client values:

```bash
supabase secrets set OPENAI_API_KEY=your_key
supabase secrets set OPENAI_MODEL=gpt-5.6-luna
supabase functions deploy food-lookup
supabase functions deploy ai-workout
supabase functions deploy analyze-food-photo
```

The OpenAI key is optional. Deterministic recommendations remain the default and require no AI fee. AI workout output is schema-validated and rejected when it violates equipment or recovery constraints. Food-photo output is itemized, confidence-labelled, editable, and saved only after confirmation.

`USDA_API_KEY` is reserved in `.env.example` for a future FoodData Central fallback and is not required by V1.

## 4. Food barcodes

EAN lookup uses the free, crowdsourced Open Food Facts API. Product values can be incomplete, so Fitile makes them editable. For production, replace the placeholder contact in the function’s `User-Agent` with a monitored project contact and submit Open Food Facts’ API usage form.

The official API currently limits direct product reads to 15 requests/minute/IP and search to 10 requests/minute/IP. Fitile caches product reads for 14 days. See [Open Food Facts API guidance](https://openfoodfacts.github.io/openfoodfacts-server/api/).

## 5. Android APK

Requirements: Android SDK API 36/build-tools 35 and JDK 21.

```bash
npm run android:sync
JAVA_HOME=/path/to/jdk-21 npm run android:apk
```

The debug APK is produced at `android/app/build/outputs/apk/debug/app-debug.apk`. Install it with Android Studio or `adb install -r <apk>`. Camera permissions are requested only when needed. Health Connect has a typed import boundary and deterministic deduplication in V1; connecting that boundary to a production Health Connect permission screen remains device-specific release configuration.

For Play Store distribution, generate a private release keystore, keep it outside Git, configure release signing, build an `.aab`, and complete Play Console privacy/data-safety declarations. The committed debug APK must not be submitted to the store.

## 6. Cost expectations (checked 28 August 2026)

| Component | V1 choice | Expected starting cost |
|---|---|---|
| Local PWA/APK | Browser + device storage | Free |
| Supabase | Auth, Postgres, Edge Functions | Free tier includes 50,000 MAU, 500 MB database, 1 GB storage, 5 GB egress, and 500,000 function calls; Pro starts at $25/month. [Official billing](https://supabase.com/docs/guides/platform/billing-on-supabase) |
| Google OAuth | Sign-in identity | No per-login application fee; Google Cloud project/configuration is required |
| Open Food Facts | Barcode nutrition | Free/open data, subject to attribution, identification, and rate limits |
| OpenAI | Optional AI coach/photo estimates | Usage-based; the configured cost-sensitive `gpt-5.6-luna` is currently listed at $0.20/M input tokens and $1.20/M output tokens. [Official models](https://platform.openai.com/docs/models) |
| Hosting/domain | Static PWA | Many hosts have free tiers; a custom domain is optional and separately priced |
| Google Play | Store distribution | Developer registration/signing requirements are separate from this source build |

Prices and quotas change; verify linked official pages before budgeting a public launch.

## GitHub Pages mode

```bash
npm ci
npm run test:run
npm run build:pages
```

Publish `dist-pages/` at `/staywise-berlin/apps/fitile/`. This mode uses hash routes (for example `#/profile`), and scopes assets, manifest, and the service worker to that directory. It does not require a server-side SPA fallback. Keep the generated service worker inside the app directory; do not move it to the domain root.

Pages mode deliberately disables Supabase initialization, OAuth, server AI, automatic sync, and account deletion even when environment values are present. GitHub Pages hosts static files only. Original `build` and Android scripts retain the existing backend integration boundaries; sign-in alone does not start the sync engine. A deployed backend and explicit sync-engine integration still need separate verification.

Editable meals, equipment, activity logs, onboarding choices, soreness values, workout drafts and finished workout summaries persist in IndexedDB. Dashboard, profile cards, recovery calculations, trends and photo estimates retain clearly marked illustrative values. The current UI does not offer every domain model's CRUD interface. JSON exports contain saved records, never fabricated dashboard totals. Clearing site data removes local records. The Pages database (`fittile-pages`) is isolated from the regular build database (`fittile`). Existing records at the old Sites origin must be exported there and imported here; browsers cannot read another origin's IndexedDB.

In Profile → Data & sync, JSON archives use `fittile-archive` version `1.1.0`, include local records and sync bookkeeping, and carry a checksum for accidental-corruption detection (not a security signature). Import validates supported version, checksum, row schemas and account ownership before an atomic merge by stable ID. Other local records remain; matching IDs update. Imported records are mapped to the current local identity. CSV is a readable summary and is not a restore format. Old preview-only archives without local database rows are rejected for restore rather than reporting a restore that did not occur.
