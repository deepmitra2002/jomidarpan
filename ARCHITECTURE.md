# Architecture

The main application is a Bengali-first HTML/CSS/JavaScript interface served by a Vinext application on Cloudflare Workers. React route entry points redirect to the studio. Existing Sites identity/build adapters are retained.

## Comparison flow

1. `/api/land` searches the versioned D1 reference dataset.
2. The buyer selects a reference record.
3. Browser PDF.js extracts embedded PDF text; Tesseract is a fallback. CSV uses the shared parser.
4. The buyer reviews and confirms the 21 extracted fields.
5. `/api/compare` receives only reviewed values, reference ID and provenance.
6. Shared comparison code normalizes digits, whitespace, dates and supported numeric units, then returns field-level evidence.

The 500-record JSON corpus and reference CSV share canonical values. D1 is seeded idempotently after migrations create the schema. A partially populated dataset blocks verification. Test manifests are never decision inputs. Missing fields are reported explicitly. P3 claim analysis is separate from the database verdict.

## Other endpoints

| Endpoint | Behavior |
| --- | --- |
| `GET /api/status` | Dataset count/version and session status |
| `GET /api/land` | Number-based reference search |
| `POST /api/compare` | Confirmed field comparison |
| `GET /api/crime` | Server-filtered public demonstration reports |
| `GET /api/assistant` | Assistant availability |
| `POST /api/assistant` | Bounded server-side Gemini request |

## AI and privacy

Google credentials are runtime secrets. The assistant accepts a bounded question plus optional allowlisted field names/counts, rejects likely private identifiers/email, and never controls verification outcomes. D1 stores quota counters, not question/answer history. Same-origin checks, timeouts, quotas and sanitized error messages are implemented. Answers are displayed as plain text.

The application does not persist uploaded originals or saved verification reports. Demo fixtures are deliberately shipped in source and downloads; they are not production citizen records. Public report filtering applies to API responses, not repository confidentiality.

## Hosting

`.openai/hosting.json` retains the existing Sites identity and DB binding. `drizzle/` contains immutable applied migrations. The Sites source repository and GitHub are distinct destinations: publishing code to GitHub does not deploy a Sites version. `node_modules`, generated builds, local databases and actual secrets should remain untracked.
