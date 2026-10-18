# Setup and reproducibility

Use Node.js 22.18+ and the pnpm version pinned in package.json. The actual stack is Vinext/React/Cloudflare Workers/D1; Thamun's Python/FastAPI setup does not apply.

```sh
git clone https://github.com/deepmitra2002/jomidarpan.git
cd jomidarpan
pnpm install --frozen-lockfile
chmod +x scripts/*.sh
pnpm dev
```

The portable development command uses port 5173. Open `/studio.html`. Database APIs require the `DB` D1 binding and schema migrations, not merely a static HTML server. Local secrets belong in ignored `.dev.vars`; see `.env.example` for names only.

## Reproducible isolated API test

```sh
pnpm exec tsc --noEmit
node --test tests/documents.test.mjs tests/assistant.test.mjs tests/interface.test.mjs
pnpm build
node scripts/test-server.mjs
```

The integration script imports Miniflare through Wrangler's installed dependency, creates isolated D1, applies SQL migrations, seeds the 500-record corpus, mocks Google and exercises the built APIs. It does not require a live Gemini key and does not operate on the production database.

## Local Worker database

On a fresh local database, after building:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_wooden_exodus.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_third_captain_universe.sql
pnpm start
```

Both local migration commands were exercised in the managed checkout, and a schema query confirmed `land_records` and `ai_usage`. The built local Worker start script uses this same persistence path. These initial `CREATE TABLE` files should run once on a fresh database; do not rerun them over an existing schema. Never add `--remote` for a local check.

The hosted deployment and managed-environment checks passed. A separate fresh-machine/browser validation remains open. Interactive Vite development may need its database state provisioned consistently with the configured binding; test the actual target machine before claiming one-command setup.

Preserve Sites build adapters and immutable applied migrations when maintaining the existing deployment; a GitHub upload does not redeploy the live Site.
