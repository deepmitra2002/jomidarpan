<p align="center"><img src="mark.svg" width="88" alt="Jomidarpan logo"></p>
<h1 align="center">জমিদর্পণ · Jomidarpan</h1>
<p align="center">জমি কেনার আগে বিক্রেতার দেওয়া তথ্য মিলিয়ে দেখুন।</p>
<p align="center">A Bengali-first land-document comparison app for buyers in Bangladesh.</p>
<p align="center"><a href="https://jomidarpan.dncorleone1211.chatgpt.site">Open the live app</a> · <a href="USER_GUIDE.md">User guide</a> · <a href="ARCHITECTURE.md">Architecture</a> · <a href="SCREENSHOTS.md">Screenshot guide</a></p>

## Complete source download

[Download all source code, files and documents](jomidarpan-complete-source.zip). Extract the archive and open the `jomidarpan` folder before running the commands below. The ZIP preserves the complete directory structure, including all 500 reference records, 50 PDFs, 50 CSVs, OCR assets, API routes, tests and hosting files. [SOURCE-MANIFEST.json](SOURCE-MANIFEST.json) lists every included file with its SHA-256 checksum.

This initial GitHub delivery uses a complete source archive because the connected GitHub app has no access to this repository. Source files are not yet expanded into the repository tree. Actual tab screenshots are pending supported browser access.

## What it does

Jomidarpan helps a buyer compare the seller's PDF or CSV against a server-side reference dataset, inspect evidence for every field, and understand the next steps in simple Bengali.

- Search 500 reference records by record number, plot/dag, khatian or deed number; Bengali and English digits are supported.
- Upload a PDF or CSV, review the extracted values, and compare 21 fields with the selected record.
- See **Verified** or **Unverified**, with matched, different and missing values shown separately.
- Search the crime-report tab for available public demonstration reports.
- Read Bangla/English documents using PDF text extraction and browser OCR.
- Ask a server-backed Google Gemini assistant for explanations; AI cannot change a verification result.
- Follow a nine-step animated quick tour across tabs, with optional read-aloud guidance.
- Use larger Bengali controls, Bangladesh-inspired branding, mobile bottom navigation and a phone-width preview.
- Download current evidence without a saved-report archive.

**Data scope:** this repository contains realistic demonstration data, not government land or police records. “Verified” means the reviewed values match this dataset; it does not establish legal ownership or guarantee a safe purchase.

## Try the complete workflow

1. Open **জমি যাচাই** and search plot **2001** or record **LND-0001**.
2. Select the record and upload submission-001.csv (included in the source ZIP) or submission-001.pdf (included in the source ZIP).
3. Review all extracted fields, confirm, and compare. This example matches all 21 fields.
4. Repeat with record **LND-0031** and submission **031** to inspect a mismatch and its evidence.

| Included data | Location | Expected behavior |
| --- | --- | --- |
| 500 reference records | reference-500.csv (included in the source ZIP) | Same canonical values used by the server |
| 50 individual PDFs | PDF folder (included in the source ZIP) | 001–030 match; 031–050 differ or omit fields |
| 50 individual CSVs | CSV folder (included in the source ZIP) | Same cases as the PDFs |
| Downloadable bundles | Downloads (included in the source ZIP) | ZIP files, test manifest and test report |

Expected outcomes are test metadata only. Runtime comparison uses the actual reviewed values, never the file name or an expected-result flag.

## App tabs and screenshots

The app includes Home, Land Verification, Crime Search, Sample Files, AI Assistant, Official Guidance and a separate document reader. The mobile layout provides the five main actions in a bottom navigation bar.

Actual screenshots still need to be captured in a browser that can reach the app. No mockups are presented as screenshots. [Capture instructions and tab links](SCREENSHOTS.md) describe the requested gallery.

## Run locally

Use Node.js **22.18+** (for native TypeScript test imports) and the **pnpm version pinned in package.json**. The app uses Vinext, React, Vite and Cloudflare Workers/D1.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The portable development command defaults to port **5173**. Open `/studio.html`. Cloudflare bindings and local tooling are configured in `vite.config.ts`. Database schema changes live in `drizzle/`; apply the SQL migrations to the local D1 binding before API testing. The server inserts the 500-record versioned dataset on its first read after the schema exists.

```sh
pnpm exec tsc --noEmit
node --test tests/documents.test.mjs tests/assistant.test.mjs tests/interface.test.mjs
pnpm build
node scripts/test-server.mjs
```

The server integration test requires the built `dist/server` and `dist/client` folders. Its test database is isolated and its Gemini responses are mocked. See [Testing](TESTING.md) for scope and limits. A fresh external-machine setup has not yet been verified.

## Gemini configuration

Set `GEMINI_API_KEY` as a **server-side runtime secret**. Optional configuration:

| Variable | Purpose |
| --- | --- |
| `GEMINI_API_KEY` | Google API credential; never put it in browser code or commit it |
| `GEMINI_BASE_URL` | Gemini Developer API base endpoint |
| `GEMINI_MODEL` | Model available to the configured Google project |

See .env.example (included in the source ZIP) for names and non-secret defaults. For local Workers development, use an ignored `.dev.vars` file. Production uses Sites runtime secrets. Without a configured key, document comparison remains separate from the assistant's offline guidance.

Only the user's submitted question and an optional allowlisted summary of field names/counts go to Google. Document files, record identifiers, names and field values are not automatically included. Provider errors are sanitized; answers are rendered as text. The assistant enforces input limits, a timeout, six requests per visitor per minute and a global daily quota.

## Source map

| Path | Contents |
| --- | --- |
| `public/studio.*`, `public/tour.js` | Main UI, mobile layout and guided tour |
| `public/reader.html`, OCR assets | Browser document reader and local OCR |
| `app/api/` | Search, comparison, crime, status and assistant endpoints |
| `lib/jomi/` | Canonical data, parsers, normalization and evidence comparison |
| `lib/ai/` | Gemini request validation and assistant behavior |
| `db/`, `drizzle/` | D1 schema and SQL migrations |
| `public/downloads/` | All 100 submission documents, reference CSV and bundles |
| `tests/`, `scripts/test-server.mjs` | Document, UI, AI and Worker integration checks |
| `build/`, `scripts/`, `.openai/` | Retained Sites/Vinext build and hosting integration |
| `docs/` | User guide, architecture, testing and screenshot instructions |

## Deployment and limitations

The live app is deployed through **ChatGPT Sites**, using Cloudflare Workers and D1. Keep the Sites build integration and existing database migrations when updating that deployment. A GitHub copy alone does not provision a production D1 database, configure secrets or enable Sites authentication on another host.

Original uploads are processed in the browser; only reviewed fields go to the comparison endpoint. No original-file storage or saved-report archive is implemented. Public crime reports are filtered on the server. Government APIs, police-system connectivity, authoritative title checks, restored private case management and staff administration are not implemented. OCR, handwriting recognition and browser voices can vary by document and device.

Third-party libraries, OCR assets and retained starter components retain their respective licenses/notices. No new blanket license is assigned to third-party material by this README.
