# App Studio

The application directory is published at **https://jyotirmay123.github.io/staywise-berlin/apps/**.

Each recovered project has independent editable source under `apps/<slug>/`. The existing Staywise app remains at the repository root. The collection shares one GitHub Pages deployment, without an additional hosting subscription.

| Project | Pages edition | Persistent resources |
| --- | --- | --- |
| Staywise | Full market explorer | Published, fingerprinted market JSON; browser state and portable analysis JSON |
| ImmoLedger | Property and tax calculator, illustrative defaults | Validated scenario JSON; local browser persistence |
| Aster Portfolio | Local portfolio tools | IndexedDB and validated JSON backup; account/vault service remains on original host |
| Fitile | Local training tracker | IndexedDB, browser state and validated JSON backup; optional cloud service requires separate configuration |
| PDF Manager | Browser document tools | Documents remain in memory; no document persistence or upload |
| Resin Rang | Branded launch page | Live products, stock, customer accounts and orders remain on original Worker/D1/R2 service |
| App Directory / Sites Hub | Both saved directory projects | Versioned app metadata; local preferences where offered |
| LOHN/KLAR 2026 | Unavailable | Registered project had no source commit or published version to recover |

## Move your existing data

Browser storage belongs to its website origin. GitHub Pages cannot read the private storage of a ChatGPT-hosted app. Export JSON on the original host and import it on the new app. Where an older application lacked a working exporter, its old local records are not silently transferred. Keep original backups until you have checked the restored records.

JSON files downloaded by a visitor are private files on that visitor's device, not automatic repository commits. Share a backup explicitly to share a case. Never commit real account balances, health records, customer data, passwords, API keys, or document uploads to this public repository.

## Build and resource handling

`apps/catalog.json` defines source directories, build commands, output directories and hosting scope. `npm run build` builds Staywise, tests/builds the collection, and writes each static app into `dist/apps/<slug>/`. The directory uses relative URLs; framework builds explicitly set their nested base path. PWA scopes and caches are limited to their own app.

Each published app includes `resource-manifest.json`, with SHA-256 and byte length for its deployed files. JSON backup formats are app-specific and versioned; imports validate before changing local state. Resource manifests are deployment inventories, not authentication or encryption.

The Publish App Studio workflow deploys the collection on pushes to `master`. Refresh market data also builds the same collection, so refreshing Staywise cannot remove sibling apps. Use separate original Site deployments for server-only features; GitHub Pages cannot run Workers, D1, R2, account authentication or private environment secrets.

Only current sanitized source is copied here. Private original Git history, personal default scenarios, runtime database rows, local private backups, signed binaries and oversized unused social-preview images are excluded. Original hosted Sites are unchanged. Existing backend configuration/source is retained for reference and rebuilding on its supported runtime; GitHub Pages does not provide that runtime.

## Verification limits

Domain, import/export, nested-resource and build checks run where each app supports them. Browser automation in the build container is unavailable because Chromium cannot open its required sockets; a successful build does not claim visual browser verification. Original app calculations and curated research retain their stated assumptions and dates.
