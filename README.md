# Staywise Berlin

Interactive Airbnb market explorer and first-host business guide, published as a static GitHub Pages application.

**Website:** https://jyotirmay123.github.io/staywise-berlin/

## Save and share analyses

Use **Save JSON** to download filters, dataset identity, financial assumptions, saved neighbourhoods, launch checklist and notes. **Load JSON** validates and restores an analysis. Send the file with the website link so someone else can inspect the same case.

Analyses also save in the visitor's browser. They are not automatically uploaded to this repository. Imported market data stays separate from published observations; save a JSON backup, especially when browser storage is unavailable.

Shared market observations live under **public/data** as versioned JSON. Each snapshot has a manifest date, listing count and SHA-256 fingerprint; the browser verifies all three. The collector preserves existing vintages. An analysis referring to a different published fingerprint is rejected.

## Update and publish

- Push to **master**: **Publish Staywise** tests, builds and publishes the static app.
- On first publication it collects the free Berlin snapshots and commits validated JSON and a dependency lockfile.
- Later, run **Actions → Refresh market data → Run workflow** to collect newly available snapshots and republish.
- No recurring schedule or paid subscription has been created.
- GitHub Pages publishing source is **GitHub Actions**.
- Visitors use **Reload published data** to reload the shared JSON index. A static website cannot write to GitHub or retrieve private Airbnb bookings.

## Sources and limits

Inside Airbnb public Berlin listings, review dates and neighbourhood boundaries are used under **CC BY 4.0**: https://insideairbnb.com/get-the-data/. Staywise compacts listings and aggregates reviews by month. Source URLs, dates, counts and fingerprints remain in the JSON. OpenStreetMap and Leaflet provide the map.

Colours use a transparent review-intensity heuristic with a minimum of 10 listings. They are not actual occupancy, proof of unmet demand, legal approval or an investment recommendation. Missing reviews disable relative comparison. Coordinates are approximate. Missing prices remain missing. Monthly reviews have survivor bias and lag stays. Large snapshot discontinuities are flagged without assigning an unsupported cause.

The Berlin city archive covers Spandau; no listing-level Potsdam or nearby-town coverage is fabricated. A separately attributed AirDNA public Potsdam summary and official tourism context are displayed with dates, definitions and source currency. No paid API is connected.

Legal, tourism and vendor-summary research was checked **8 November 2026**. These curated sections need editorial updates; the collector updates the public listing snapshots only.

## Financial scope

Inputs are illustrative assumptions. Outputs are before personal income tax and assume small-business VAT exemption. The model includes room and cleaning charges in absorbed overnight tax, excludes that tax from platform fees, and includes operating costs, replacement reserve, startup cash, founder time and impossible break-even cases. Enter an all-in platform percentage including any nonrecoverable fee VAT.

Income/trade tax, detailed VAT/reverse-charge accounting, depreciation, financing and co-host commissions are not calculated. Annual means twelve representative months, not a seasonality forecast.

## Development

Node 22.12+ and Python 3.12 are used in Actions.

- npm install
- npm test
- npm run build
- npm run dev
- python scripts/prepare_data.py
- python scripts/validate_data.py

No secrets or private API keys are required. Public data retains its source licence; no separate licence has been granted for the app's original code.
