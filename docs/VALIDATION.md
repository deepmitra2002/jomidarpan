# Evaluation and user-testing plan

## What is measured now

Document tests read 50 PDFs with PDF.js and 50 CSVs with the shared parser. Both formats produce the intended 30 verified and 20 unverified cases, with field evidence checked. Three Node suites contain 10 passing tests. The built Worker integration uses isolated D1 and mocked Gemini to check API behavior, quotas and failure conditions. This evidence concerns designed fixtures; it is not a held-out real-world accuracy study.

## Independent reading benchmark

Use only synthetic or organizer-permitted samples. Hold out documents beyond the current fixtures and categorize clean printed Bangla, degraded scans, mixed Bangla/English, tables and handwriting. Annotate field ground truth separately from the comparator's expected-output manifest.

Measure character/word error rate, per-field exact match after documented normalization, missing-field rate, incorrect extraction, buyer correction count/time and final discrepancy outcome. Report sample sizes and confidence/uncertainty. Split by document/parcel rather than leaking near-duplicate PDF/CSV cases across partitions. No score is available yet.

## Moderated user sessions

Proposed participants: consenting Bengali readers with varied digital literacy and representative low-cost phones; participant numbers are not yet set. Use dummy land documents only.

Tasks: find plot 2001, confirm the intended parcel, review sample 001, detect the owner discrepancy in 031, explain what Verified does and does not mean, search a public sample report and export evidence. Measure completion, selection errors, corrections, elapsed time, verdict comprehension and assistance needed. Ask short qualitative questions after the task, not during every interaction.

## Technical validation before pilot

Check low-bandwidth asset loading, Android/browser memory, accessibility, keyboard/screen-reader use, file sizes and extraction failure states. Conduct load/security testing only on the team's own prototype. Report runtime, workload, corpus, concurrency, duration, errors and latency percentiles; no capacity/latency numbers are claimed yet.

Authoritative integration, real-data governance and domain review are separate gates. A successful fixture test is not legal validation.
