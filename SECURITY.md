# Security and privacy

## Report a vulnerability

Do not post API keys, real land documents, personal identifiers or exploit details in a public issue. Use GitHub's private vulnerability reporting if enabled. If it is unavailable, open a minimal issue asking the maintainer for a private channel without disclosing the sensitive material. No response-time commitment or completed security audit is claimed.

## Current data handling

| Data | Handling |
| --- | --- |
| Original uploaded PDF/CSV | Processed in the browser; not persisted by the rebuilt app |
| Reviewed comparison fields | Sent to the application's comparison endpoint |
| Reference corpus | Demonstration values stored in D1 and included in source/downloads |
| Current evidence | Download/print available; no saved-report archive |
| AI question | Sent to Google when the user submits it |
| Optional AI context | Allowlisted field names/counts only; no automatic document values |
| AI usage | Hashed-IP/time-bucket quota counters in D1; application does not store question/answer history |

Third-party provider processing and hosting policies still apply. Input filtering reduces some accidental disclosure; it cannot guarantee removal of every private value written in a question.

## Implemented safeguards

- Server-only Gemini credentials; `.env*` and `.dev.vars*` excluded, with a blank-key example allowed.
- Prepared D1 statements and allowlisted comparison fields.
- Fail-closed comparison when the reference dataset is incomplete.
- Public crime-report filtering on the server.
- Assistant origin validation, bounded input/output, timeout and D1-backed quotas.
- Sanitized provider errors and plain-text AI rendering.
- Comparison decisions independent of AI and expected-result metadata.

## Boundaries

The public demo is not an authenticated production land-record service. Retained Sites sign-in does not imply every data route is restricted to a named buyer. Demo source fixtures are not confidential government records. No penetration test, compliance certification, production-scale load validation, comprehensive abuse protection or authoritative land-title integration is claimed.

Do not add real citizen records to the demo corpus. Never put a secret into a README, client-side variable, screenshot, sample request or committed history. If a credential is exposed, revoke/rotate it at its provider; deleting the visible file alone does not invalidate the credential.
