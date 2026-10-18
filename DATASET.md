# Dataset and comparison guide

## Canonical source

Jomidarpan uses the supplied LandTech v5 corpus: 500 realistic demonstration records. The source archive contains `lib/jomi/reference.json`; the matching CSV is `public/downloads/reference-500.csv`. D1 holds the versioned server-side copy used by both search and comparison.

The separately supplied older v2 reference CSV and old SYN records are not the active dataset. Mixing them with v5 submissions produces misleading mismatches. No government land registry is connected.

## Evaluation cases

| Documents | Intended design | Expected comparison |
| --- | --- | --- |
| Submissions 001–030, each in PDF and CSV | Values match their selected reference record | 30 verified per format |
| Submissions 031–050, each in PDF and CSV | Deliberately different or missing values | 20 unverified per format |

There are **50 paired cases and 100 files**, not 100 independent land cases. Match each submission number to its reference record: 001 → LND-0001, 031 → LND-0031. Expected-result metadata lives in the test manifest; runtime decisions use actual reviewed values.

## The 21 compared fields

| Group | Fields |
| --- | --- |
| People | Owner, previous owner |
| Location | District, upazila, mouza, JL number |
| Record | Survey, khatian, plot/dag, classification |
| Area and share | Area, unit, seller share |
| Deeds | Deed number, deed date, registration date, previous deed, previous deed date |
| Administrative state | Mutation status, tax year, tax status |

The buyer reviews extracted values before comparison. Provenance identifies the document source or reviewed input for each field.

## Normalization and failure behavior

Supported normalization covers Bangla/English digits, Unicode normalization, whitespace, supported numeric values/units and date forms including ISO, year-first slash and day-first slash dates. Material differences in names and identifiers remain discrepancies. Missing values are shown explicitly, never silently filled from the reference.

The application seeds the corpus idempotently after schema migrations. A reference count different from 500 blocks verification. It does not certify a partial dataset.

## Reproduce the evidence

Run `node --test tests/documents.test.mjs` from the extracted source. This processes every supplied PDF/CSV and rewrites `public/downloads/test-report.json`. Inspect each case's evidence instead of inferring correctness only from aggregate 30/20 counts.

The designed test split validates behavior on these fixtures. It does not estimate real document accuracy, ownership validity, OCR generalization or fraud detection performance.
