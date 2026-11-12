# Rare Metals Lab Implementation Plan

> Execute inline within the authorized GitHub app build and deployment.

**Goal:** Evidence-grounded rare metals research with full source histories and transparent simulations.
**Architecture:** public immutable snapshot -> validated monthly panel -> pure portfolio math -> worker -> accessible static UI.
**Tech Stack:** standard Python ingestion, ES modules, Node test runner, Canvas/SVG, GitHub Pages.
**Spec:** docs/design.md

## Constraints
Never fabricate prices, interpolate absent history, splice retail snapshots into index histories, assume resale liquidity, claim guaranteed profit, or publish personal portfolio data. Stay within apps/rare-metals plus catalog/docs integration.

## Review focus
- Relative series at -100 or below and malformed dates must be rejected.
- Missing months cannot silently become one-month returns.
- Suspended/stale/short series must remain visible and distinct from investable recommendations.
- Deposits must not count as profits; costs, benchmark and real contributions must use identical timing.
- Browser import must validate before replacing settings; paths must work below /apps/rare-metals/.

## Tasks
1. Snapshot extraction: fetch all MAX chart series and all available metal page tables, retain originals and metadata. Test normalization validation and date gaps, run red, implement and pass.
2. Domain engine: test flat-price costs, correlated bootstrap, seed, fee timing, DCA/hold, real and benchmark contributions; run red, implement pure engine and pass whole suite.
3. UI: portfolio editor, data explorer, charts/tables, backtests, worker Monte Carlo, scenarios and exports; add schema/build integration checks, verify and build.
4. Review, integrate catalog entry, run app/root tests, publish a single non-destructive commit through GitHub connector, verify deployment and public app.
