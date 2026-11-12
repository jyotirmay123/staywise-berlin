# Rare Metals Lab

Static research app published in [JJ’s App Studio](https://jyotirmay123.github.io/staywise-berlin/apps/rare-metals/).

Explore 19 metal/oxide histories from the TRADIUM charts embedded on Strategic Metals Invest, retained raw percentage observations and separate SMI retail tables. No forecast, liquidity or profit guarantee is made. No credentials, personal portfolio records, external scripts, trading links or paid APIs are needed.

## Run and build

Node 22+; Python 3.12+ for refreshing snapshots. No npm dependencies.

```
npm test
npm run build
# Serve dist/ with a static web server.
```

The App Studio root build calls this app's tests and build and copies `dist/` into `dist/apps/rare-metals/`. All asset URLs are relative. A SHA-256 resource manifest covers the deployed resources. The existing GitHub Actions Pages pipeline deploys the collection.

## Modules

- `src/data.mjs`: relative-series conversion, snapshot/settings validation, consecutive monthly calibration panel and minimum-investment feasibility.
- `src/engine.mjs`: portfolio accounting, monthly risk statistics, rolling backtests, synchronous block bootstrap and outcome summaries.
- `src/worker.mjs`: simulation Worker adapter.
- `src/charts.mjs`: charts of actual data and actual simulation percentiles.
- `src/app.mjs`: DOM rendering, interaction, import/export and local persistence.
- `scripts/refresh.py`: public-source ingestion with original response bytes and provenance; no interpolation or gap filling.
- `data/metals.json`: normalized observations, unavailable source observations, source hashes, factual retail tables and reviewed terms.
- `data/raw/`: original cumulative-percentage response bytes.

## Snapshot reviewed 12 November 2026

All MAX chart responses end on **22 April 2026**, even though SMI retail tables are dated November. The app does not splice these distinct series. Histories begin in July 2012 where available; precious metals start May 2017; some newer technology metals start 2021. There are 19,067 valid dated observations plus 22 observations at/below −100% that cannot define positive price levels; originals are retained. Percentages are rounded to whole percentage points by the source.

A gap in March 2019 splits the older histories. Models use the longest continuous common monthly run, normally April 2019–April 2026 for the initial research basket. The full earlier source history remains visible and downloadable. Date controls can select an earlier continuous regime. Source percentages convert to index levels as `100 + p`, and month-end log returns use ratios of those index levels, not ratios of percentage changes.

SMI states a €10,000/$10,000 minimum. Current partner prices identify suspensions/buy-back-only restrictions for four metals and on-request pricing for indium. Website current FAQ names doobloo and Swiss custody; older indexed descriptions mention TRADIUM/METLOCK in Germany. Current contractual documentation must establish actual ownership and costs. doobloo's 0.09% monthly custody rate is a published partner rate, not a verified SMI contract quote.

## Simulation

Draw synchronised circular blocks of monthly log-return vectors; default block length3, seed12345, paths5000. Historical, half and zero mean-log-drift scenarios retain the observed joint fluctuations. No normal-return assumption or independent-metal sampling is used. Monthly contributions buy target-weight quantities at the start of the month. Holdings drift without rebalancing. Initial lump sum is at time0. Annual NAV storage is deducted monthly, purchase markup at entry and sale haircut at terminal liquidation. Optional tax is a simplified aggregate-profit scenario, not a German tax calculation. Same deposit timing applies to inflation and the cash benchmark.

Default costs are explicitly hypothetical: 0% additional markup, 10% exit discount, 2% annual custody, 2% inflation, 2% cash benchmark, 0% tax. Retail history may already include a margin. These assumptions must be replaced with actual executable quotes before treating results as a purchase analysis.

Horizon estimates use the chosen contribution duration, then no further deposits. Youngest-lot age reflects actual deposit timing, including lump-sum-only plans. A displayed probability threshold is the first tested endpoint exceeding it, not a permanent break-even guarantee. Wilson intervals measure Monte Carlo sampling error only; they do not measure true future probability uncertainty. Historical rolling windows overlap and current basket selection has hindsight bias. Illiquidity, failed resale, policy changes, custody/counterparty failure and unobserved shocks are outside the sampled return model.

## Refreshing

`npm run refresh` fetches public MAX endpoints and factual SMI price tables without login. It retains originals and hashes. Do not refresh partner trading status dates or contractual facts without reviewing their sources. Review any change in history end dates and associated UI copy/tests before publishing a newer snapshot. Do not upload personal holdings to this public repository.
