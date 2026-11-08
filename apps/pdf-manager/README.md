# PDF Manager

PDF Manager is a privacy-first PDF workbench with two deployment modes:

- The original `chatgpt.site` server deployment uses Sign in with ChatGPT.
- The GitHub Pages deployment is a public app at `/staywise-berlin/apps/pdf-manager/`.
  It requires no account and keeps documents in browser memory.

## Privacy model

- PDF, DOCX, and image bytes are read directly into the current browser tab.
- Files are never uploaded to the site, R2, D1, analytics, or another user.
- The workspace automatically clears after one hour.
- Closing or refreshing the tab clears file bytes immediately.
- Download URLs are temporary browser object URLs and are revoked after use.
- Smart summaries run locally with extractive sentence scoring.
- Translation uses the browser's on-device Translator API when supported.

Browser tabs isolate document workspaces. The Pages app has no authentication
or server data store. It never backs up document bytes, signatures, form values,
extracted text or summaries. Refreshing the page resets the workspace; download
any output you want to keep before closing it. Adding files does not extend the
one-hour deadline for existing files. Clear now also resets input fields and
prevents pending operations from restoring results.

## Web features

- Merge PDFs.
- Split PDFs and extract page groups.
- Reorder, rotate, and remove pages.
- Compress PDFs by locally rasterizing pages.
- Convert selectable PDF text to DOCX.
- Convert DOCX text to letter-size PDF pages.
- Convert JPG, PNG, HEIC, WebP, GIF, BMP, and TIFF images to PDF.
- Add text and visual signatures.
- Repair readable PDF page structures.
- Crop pages.
- Fill interactive PDF text fields.
- Generate a local smart summary.
- Use on-device browser translation where supported.

## Development

```bash
npm ci
npm run dev
npm test
```

`npm test` builds the production worker, verifies anonymous visitors are
redirected to ChatGPT sign-in, renders the authenticated workbench, and runs
raw end-to-end PDF fixtures.

The original native macOS implementation remains under `Sources/` and can still
be built with Swift Package Manager. The hosted product lives under `app/`,
`lib/`, and `worker/`.

## GitHub Pages

```bash
npm ci
npm run test:pages
npm run test:pdf
npm run build:pages
```

Publish only `dist-pages/` at `/staywise-berlin/apps/pdf-manager/`. The original
server build remains `npm run build` and `npm test`. To build for another path,
set `PAGES_BASE_PATH=/your/path/` (include both slashes). `npm run preview:pages`
serves the static build locally. No server credentials or document fixtures are
included in the Pages build. The PDF worker, CMaps, standard fonts and WASM are
served from the app's own base path; no PDF CDN is required. No backup/import UI
is provided because the app has no persistent user settings or document store.

Browser limitations remain: scanned PDF text needs OCR before text conversion
or summaries; complex Word layout is simplified; HEIC/TIFF depend on browser
image decoding; translation requires the browser's on-device Translator API and
may require a language-model download. Compression flattens pages, so selectable
text and interactive form structure are lost in compressed output. The visual
signature tool does not create a certificate-backed digital signature.
