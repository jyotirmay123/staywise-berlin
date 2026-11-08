# GitHub Pages migration

The recovered application source remains in `app/`, `db/`, `drizzle/`, `worker/` and the original project configuration. `portable/` is the self-contained static GitHub Pages edition.

Build without installing dependencies:

```sh
npm run build:pages
```

Publish the contents of `dist-pages/` at the `publicPath` recorded in `migration-manifest.json`. The build needs Node.js and uses only its standard library. Relative CSS and JavaScript paths support the repository subdirectory deployment.

The original `npm run build` still targets the Cloudflare/vinext application. Do not treat that server output as static Pages content.

## Data and source handling

The public edition contains no account, customer, order, session, uploaded media, or live database export. Environment secret values and git history are excluded. Do not copy `.git`, `.env*`, `.wrangler`, local databases, private seed files, or deployment credentials into a public repository. The resource manifest records the migration scope and original site address.

## Public directory behavior

The original hub required ChatGPT identity headers and displayed a personalized account header. The static edition intentionally presents a public gallery without those identity fields or sign-in controls. Search and category filtering run entirely in the browser. Each entry provides its verified original Sites address and its GitHub edition path; the shop card identifies its launch-page scope.

The directory includes ImmoLedger, Aster Portfolio, Fitile, PDF Manager, Resin Rang, Sites Index and Jyotirmay Sites Hub. An application card is a directory link, not a claim that all original server capabilities have migrated. Consult each edition's capability details. Salary Calculator is not listed because no recoverable source was available.
