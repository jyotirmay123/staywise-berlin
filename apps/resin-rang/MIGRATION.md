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

## Commerce remains on the original shop

The static edition keeps the original Hindi brand, decorative artwork, category overview and story. All shopping, account and admin links explicitly open the original live application.

The original application requires a Cloudflare Worker runtime, D1 `DB`, R2 `MEDIA`, and server environment variables `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Its schema includes products, inventory, users, sessions, orders and order items. D1 migrations contain schema only in this sanitized backup; original demonstration product inserts were removed. No actual data was exported.

A separate backend deployment plus secure data/media migration is required to move commerce. GitHub Pages cannot serve those server routes. The existing checkout records COD or UPI follow-up as a payment preference; it is not a payment gateway integration. This static edition neither accepts orders nor represents inventory or payment completion.
