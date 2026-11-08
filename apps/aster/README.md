# Aster Portfolio

Offline-first investment portfolio tracker for EUR and INR. One TypeScript
product surface runs as responsive website, installable PWA, and Capacitor
Android wrapper.

## Product behavior

- Custom investment names, categories, native currencies, and return assumptions
- Manual valuations with immutable valuation date and EUR/INR rate
- Current totals in EUR or INR
- Per-investment and category views
- 1, 2, 3, 5, and 10-year compound scenarios
- IndexedDB local persistence and service-worker offline cache
- D1 cloud vault sync with high-entropy recovery key
- Portable JSON import/export

Forecasts are mathematical scenarios, not financial advice. They exclude future
contributions, inflation, fees, tax, and future FX changes.

## Local website

Requires Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

Generate a database migration after schema changes:

```bash
npm run db:generate
```

Validate:

```bash
npm test
npm run lint
```

## Android

Android project is committed under `android/`. Wrapper loads deployed HTTPS site,
so web and mobile share exactly one UI and cloud dataset.

```bash
CAPACITOR_SERVER_URL=https://your-deployed-site.example npm run android:sync
npm run android:apk
```

Debug APK appears at:

`android/app/build/outputs/apk/debug/app-debug.apk`

Release distribution requires Android signing configuration. Never distribute a
debug keystore as production identity.

## Data security

Cloud database stores SHA-256 hash of recovery key, never raw key. Recovery code
acts as bearer credential: anyone holding it can read and overwrite portfolio.
Store it in a password manager. Browser data stays local until cloud sync is
enabled.

## FX source

Live EUR/INR uses Frankfurter’s public ECB-backed endpoint. Every valuation
copies rate into its own historical record. Manual rate editing supports
historical dates and source corrections.

## GitHub Pages edition

```bash
npm ci
npm run build:pages
npm run test:pages
```

Publish only `dist-pages/` at `/staywise-berlin/apps/aster/`. The static build has
its own Vite entry (`pages/`) and config (`vite.pages.config.ts`); the original
Vinext/Cloudflare server, authentication, D1 APIs, migrations, and Android source
remain available. Set `PAGES_BASE=/another/path/` when building for a different
subdirectory. Assets, manifest identity and service-worker scope share that base.
The worker caches only this app's generated assets and removes only its own old
caches, so it cannot clear sibling apps' offline data. First visit requires a
network connection; revisits can load offline after the worker finishes caching.

**GitHub Pages provides local browser persistence and JSON backup/restore only.**
It cannot run the original signed-in account cloud or recovery-vault API. Those
features continue to require the original Cloudflare/D1 host. The Pages UI omits
cloud actions and makes local storage explicit. Live FX still uses the public
Frankfurter endpoint when reachable; manual FX input also works offline. Fonts
use the system sans-serif stack so rendering needs no external font request.

To transfer existing records, export JSON from Settings on the original host,
then import it from Settings on Pages. Import replaces the local portfolio after
confirmation and validates the v1 data. To transfer back, export from Pages and
import on the original host. Browser storage is scoped by origin: it does not
move automatically between hosts or devices. Clearing site/browser data removes
local records. Keep private JSON backups outside the public repository.

All source defaults are empty. No private portfolio, browser database, exported
backup, cloud credential, or cloud database is included in the published bundle.


## Transfer your actual ChatGPT Aster portfolio

Open the GitHub Pages app and select **Import from ChatGPT Aster**. The original private Site opens and uses your normal ChatGPT sign-in. It reads the full signed-in account copy, the current browser's original-site copy and any configured recovery vault, then displays record counts and edit/save timestamps. Choose a complete snapshot and click **Send to GitHub Aster**; return to the GitHub tab, review the counts, and select **Import this portfolio**.

The receiver checks the exact source origin, opened window and a one-time session nonce, validates the portfolio, then atomically backs up the prior local portfolio and saves the incoming one before acknowledging success. No readable balances, account credentials, recovery keys or portfolio JSON are added to this public repository. Use **Download previous local backup** to recover the portfolio that preceded a replacement.

If signing in breaks the popup connection or popups are blocked, open the original Site's `/transfer` page, download its selected JSON, then use **Settings → Import** on GitHub Aster. This fallback also backs up the previous portfolio before committing the replacement. The original Site remains private and its transfer page makes read-only cloud requests.

Records saved only in another browser/device cannot be read here. Use that browser/device for the transfer, or export there first. The newest recorded content edit is the default choice; review timestamps because an old snapshot can be saved to a server later than a newer browser edit. Transferring uses a whole snapshot to preserve deletions. There is no automatic cross-host synchronization after import.
