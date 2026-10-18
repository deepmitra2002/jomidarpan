# Roadmap

This roadmap separates implemented behavior from future work. It is a direction for development, not a promise of dates or completed validation.

## Implemented in the working prototype

- [x] Bengali-first identity, rural Bangladesh visual cues and responsive navigation.
- [x] Nine-step cross-tab quick tour and optional browser read-aloud guidance.
- [x] Search 500 server-backed demonstration records using English/Bangla digits.
- [x] PDF/CSV extraction, buyer review and deterministic 21-field comparison.
- [x] Field evidence for matches, differences and missing values.
- [x] 50 paired cases: 30 matching and 20 nonmatching, in both PDF and CSV.
- [x] Public sample crime-report search with server-side filtering.
- [x] Optional server-side Gemini explanations with a separate decision boundary.
- [x] Automated document, assistant, simulated-interface and Worker integration checks.
- [x] GitHub source archive, setup documentation and evidence notes.

## Next: reproducibility and usability

- [x] Expand application files into the GitHub source tree through direct source uploads.
- [ ] Capture actual tab screenshots, mobile layouts and quick-tour states.
- [ ] Verify a fresh-machine setup and document an exact local D1 migration command for that environment.
- [ ] Test PDF/CSV upload flows on physical low-cost Android devices and slow networks.
- [ ] Evaluate Bengali copy with rural users and test with screen readers/keyboard navigation.
- [ ] Measure OCR on a diverse, consented and appropriately anonymized document set.

## Next: trustworthy integration

- [ ] Specify approved authoritative-data interfaces and access agreements before connecting official records.
- [ ] Define identity, authorization, audit and retention requirements for production use.
- [ ] Assess abuse resistance, provider privacy and operational monitoring.
- [ ] Run security review and representative load tests.
- [ ] Validate with domain professionals and publish measured limitations.

There is no planned claim that dataset agreement alone establishes legal title. Private case storage, staff administration and official police connectivity remain unimplemented.
