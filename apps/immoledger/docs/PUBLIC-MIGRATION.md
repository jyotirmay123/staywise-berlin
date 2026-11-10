# Public deployment audit

The public defaults are fictional examples, visibly labeled throughout the workspace. Personal property names, location details, financing assumptions, household salary and budget references, payroll observations and personal initials from the recovered app have been removed from publishable source and tests. Schema normalization no longer contains person-specific financial corrections.

Historical review notes and implementation plans containing personal inputs were removed from the public source. Original deployment metadata was removed. The original recovered source and starter scenario were retained only in a local excluded snapshot. They are not part of the deployment or public source set. Recovered Git history must not be uploaded.

The public app preserves calculation modules, property editing, multi-loan and dated-cost handling, actuals, strategy switches, risk calculations, CSV reports, print output and manual ChatGPT handoff. Save JSON and Load JSON are accessible in every workspace view. Browser persistence and exported backups share a versioned validated JSON codec; original raw scenario-v1 backups remain supported. Private imports stay in browser memory/storage unless private GitHub sync is explicitly connected and activated. Sync writes only to the private immoledger repository; public assets and defaults stay fictional.

All static resources use relative paths. External font requests were removed. The deployment directory contains only the reviewed HTML, CSS and ES modules. Publish its contents at `/staywise-berlin/apps/immoledger/`.

Validation: 76 automated tests passed, all JavaScript syntax checks passed, and the source whitespace check passed. Tests include full ten-year serialization invariance, legacy imports, wrong-app and version rejection, invalid financial data, unsafe keys, UTF-8 byte limits, blocked browser storage, UI Save/Load behavior and nested Pages asset resolution. The publication scan found no known personal markers in the public file set. Legal/tax assumptions were retained from the recovered app and were not independently revalidated as part of hosting migration.
