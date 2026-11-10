# ImmoLedger — Property & Tax Studio

A browser-local German rental-property planner with an auditable calculation engine. Static HTML, CSS and ES modules; no backend or runtime dependencies.

The public app starts with **fictional, clearly labeled demo data**. Property names, prices, loans, salary, payroll observations and budgets are illustrative. Enter your verified inputs or load a private JSON backup. Never commit your real financial backups to a public repository.


## Shared data between both deployed sites

Open **Sync data** on [ChatGPT ImmoLedger](https://immoledger-jj.senapati-jyotirmay.chatgpt.site/) or [GitHub Pages ImmoLedger](https://jyotirmay123.github.io/staywise-berlin/apps/immoledger/). Both use the same private [`jyotirmay123/immoledger`, `main:data/scenario.json`](https://github.com/jyotirmay123/immoledger/blob/main/data/scenario.json). The public `staywise-berlin` repository contains app code and fictional defaults only.

1. Create a [fine-grained GitHub token](https://github.com/settings/personal-access-tokens/new). Select only the private **immoledger** repository and grant **Contents: Read and write**. Do not paste the token into chat or commit it.
2. In the browser where your latest data already exists, open **Sync data**, enter the token, then **Connect GitHub**. Connecting alone does not change data. Review the available repository copy; select **Save this browser to repo** to publish your current complete scenario, or **Load repo data** to use the repository copy.
3. Open the other deployment, connect with the same restricted token, then select **Load repo data**. Both now share that scenario. Each tab holds its token in memory only, so reconnect and choose the repository copy after reloading or reopening.
4. Save forms as usual. Saved changes upload automatically after a short delay. A clean connected tab checks the repository every 30 seconds. Wait for **Synced with private repo** before closing. Unsaved forms and queued/failed uploads prevent background replacement.

Loads retain a validated previous browser snapshot under `immoledger.sync.previous.v1`; **Download previous browser backup** recovers it. Manual **Download browser JSON** works without GitHub. Concurrent conflicting saves pause sync rather than overwriting newer data: download your local JSON, load repository data, then reapply your intended changes. Full snapshots preserve deletions; there is no field-by-field merge. Each repository save is also retained in Git history.

Sync accepts existing local-server JSON, versioned portable backups and legacy scenarios; it saves a validated `{revision, scenario, savedAt}` JSON envelope. GitHub file SHA guards updates. Sync limits snapshots to 1 MB; manual JSON backups retain their existing limit. Tokens are never stored in browser persistence or shipped with the app. Offline/local-only use remains available, but those edits reach the other site only after reconnecting and publishing them.


## Run and verify

Requires Python 3 for the local server and Node.js 22+ for tests.

```sh
python3 -m http.server 8080 --directory dist
npm test
npm run check
```

Open http://localhost:8080. ES modules require HTTP rather than file URLs.

## Features

- Create, duplicate, edit, remove and restore property profiles; selectively enable properties and savings strategies.
- Multiple annuity loans, nominal interest, initial repayment, payment overrides, start dates, fixed-interest periods and annual extra repayments.
- Whole-property inputs with ownership applied once; purchase funding, building allocation, custom evidenced linear depreciation and dated costs.
- Monthly or annual views, interactive projection charts, ten-year projections, actual-year overrides and combined tax worksheets.
- Household income-tax planning, separate spouse pension inputs, pension favorable checks, entered withholding and regular-pay payslip reconciliation.
- Risk and budget inputs, explicit hypothetical stress choices, disclosed resilience heuristic and enabled-only ChatGPT handoff.
- CSV exports, print-to-PDF and versioned JSON Save/Load.

## Data and JSON

Data remains in this browser under the app-specific key `immoledger.scenario.v1`; display preferences use `immoledger.view.v1`. Browser storage does not synchronize between devices or origins. Export backups before moving browsers, clearing site data or changing hosting. Other apps at the same GitHub Pages origin use their own storage keys, but browser storage is not a security boundary between apps on one origin.

The app uses one JSON codec for browser persistence and Save/Load:

```json
{
  "app": "immoledger",
  "schemaVersion": 1,
  "exportedAt": "2026-01-01T00:00:00.000Z",
  "data": { "version": 1, "baseYear": 2026, "household": {}, "properties": [] }
}
```

The example above describes the envelope; actual household data must satisfy the scenario validator. Load accepts new envelopes and original raw scenario-v1 backups. Validation rejects other apps, unsupported versions, invalid financial values, duplicate identifiers, unsafe object keys, excessive nesting and files exceeding 2 MB. An imported scenario is validated before the replacement confirmation and before any persistence. Normalization adds missing containers without rewriting entered property or household amounts. Missing legacy payroll observations begin at zero, and missing risk amounts remain unknown.

If local storage is blocked or full, the app retains the working scenario in memory and reports it as unsaved. Use Save JSON to preserve it. There are no financial-data uploads, telemetry, API keys, automatic AI calls or external font requests. ChatGPT analysis text is prepared locally and copied or downloaded only on request.

## GitHub Pages

Publish the contents of `dist/` at `/staywise-berlin/apps/immoledger/`. All local asset and module URLs are relative, so the same files also run under other subpaths. No SPA fallback, server rewrite or build step is required. The repository owner handles the shared Pages deployment workflow.

Public source consists of `dist/`, `tests/`, `docs/RESEARCH.md`, `README.md`, `package.json` and `.gitignore`. Do not upload recovered Git history, original hosting metadata, private source snapshots, or financial JSON backups. The public tests use synthetic inputs.

## Model scope

This is planning software, not certified tax software, an official Anlage V, an ELSTER client or an exact payroll calculator. Tax and social parameters use the original app's 2026 model, held constant in future projections; the modeled new pension-depot branch begins in 2027. Legal references and limitations are in [docs/RESEARCH.md](docs/RESEARCH.md) and the app's Rules & assumptions screen. Deployment work does not independently revalidate those legal assumptions.

Principal repayments and reserve transfers are cash expenses rather than immediate deductions. Capital spending is not automatically capitalized or depreciated. Custom depreciation, prior-year depreciation, foreign income, restricted loss offsets, renovation rules and other special cases need individual review. Payroll observations, approved withholding allowances and final annual rental results remain separate. Child entitlement and guarantees depend on entered assumptions and confirmations.

Risk scores are disclosed heuristics, not default probabilities, predictions, lending approvals or promises of returns. Unknown inputs withhold the score. No future appreciation, sale proceeds, benefit payments or automatic saving of positive cash flow are invented.

## Source layout

- `dist/engine.js`: pure tax, loan, property calculations and scenario validation.
- `dist/data.js`: fictional defaults, blank property factory and schema normalization.
- `dist/storage.js`: versioned JSON codec and browser persistence.
- `dist/app.js`: forms, navigation, reports and exports.
- `dist/payroll.js`, `dist/scenario.js`, `dist/risk.js`: calculation modules.
- `dist/display.js`, `dist/planning-ui.js`, `dist/styles.css`: presentation.
- `tests/`: calculation invariants, UI rendering, serialization and subpath checks.
