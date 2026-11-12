# Verification

- Numerical/data suite: 22 tests covering relative index semantics, invalid dates and zero price levels, missing months, deterministic correlated bootstrap, drift, fee timing, contributions vs profit, inflation, cash benchmark, no-data rejection, exact source fingerprints, terminal histogram counts, lot ages and finite saving-plan feasibility.
- Existing App Studio root domain/build-assembly suite:12 tests passing.
- New app build:27 runtime resources, no package dependencies, nested relative URLs.
- Independent code review identified three P2 issues: tiny allocations rounded to zero, lump-sum youngest-lot ages and minimum reach beyond the contribution duration. Fixed; numerical/feasibility regressions added.
- Browser preview: source data loads, initial 5000-path simulation renders, default observed calibration period and correct outcome values, one-year rerun, tiny allocation preservation and lump-sum minimum status inspected.
- Current raw charts and November retail tables remain separate. Source response SHA-256 values checked for every metal.
