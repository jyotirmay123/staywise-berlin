# Fitile

Fitile is a React/TypeScript fitness and nutrition prototype with a deterministic workout generator, recovery map, example nutrition and progress views, and an offline IndexedDB data layer. Example plans and charts are synthetic, illustrative data.

## GitHub Pages

```bash
npm ci
npm run test:run
npm run build:pages
```

Publish `dist-pages/` at `/staywise-berlin/apps/fitile/`. Hash routing and the scoped service worker support this static subdirectory. Pages mode is local only: it does not initialize cloud auth, sync or AI services. See [Pages setup and data migration](docs/setup.md#github-pages-mode).

Meals, equipment changes, activities, setup choices, soreness, workout drafts and completed workout summaries persist on this device. Profile → Data & sync exports a versioned, checksummed JSON archive of actual saved data and imports it through schema validation and an atomic merge. CSV files are readable summaries. Dashboard totals and chart values remain illustrative and are excluded from exports. Browser data is private to each origin and device; transfer JSON to move records between browsers. Backups contain user-entered health information and should remain private.

## Original app integrations

```bash
npm run dev
npm run build
```

The regular build, Sites worker staging, Android wrapper, Supabase transport, OAuth, and server functions remain available in the recovered source. These are optional integration boundaries; cloud sign-in does not by itself wire all UI data into automatic synchronization. [Setup](docs/setup.md) documents the backend and Android requirements. No APK is required for the Pages build.

## Verification

```bash
npm run verify
npm run test:e2e
```

[Privacy and data ownership](docs/privacy.md) describes local data and integration constraints. Recovery, energy and nutrition values are estimates, not medical measurements.
