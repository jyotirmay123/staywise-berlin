# ChatGPT app migration

Goal: preserve recoverable application source in GitHub and publish usable, explicitly scoped Pages versions with portable local data.

Architecture: the existing Pages deployment hosts independent apps below `apps/`. Original server deployments remain available for authenticated database features. No original Git history, credentials, private user records, or private input backups are published.

- Recover each canonical Site repository; record missing source explicitly.
- Keep original server builds and add isolated static entries where needed.
- Validate versioned JSON backups before changing browser state.
- Build the gallery from a versioned catalog; verify every app output and fingerprint deployed files.
- Run domain tests, static builds, privacy review, and the GitHub deployment workflow.

Review focus: subdirectory asset paths; malformed/cross-app backups; database features unavailable on Pages; private seeded data; source-less registered apps. A source-less app is reported rather than reconstructed from unrelated assumptions.
