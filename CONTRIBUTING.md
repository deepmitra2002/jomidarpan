# Contributing to Jomidarpan

Contributions should make the buyer's workflow clearer, the comparison evidence more reliable, or the implementation easier to maintain.

## Before starting

Read the README, DATASET.md and SECURITY.md. The complete application source is in `jomidarpan-complete-source.zip`; this repository currently exposes project documentation alongside that archive. Extract it to inspect or run the implementation. Do not assume cloning the documentation tree is enough to start the app.

Open a focused issue describing the problem, proposed behavior and affected workflow. Use demonstration records only. For Bengali UI changes, include the exact Bengali copy and its intended meaning.

## Development expectations

1. Use the pinned dependency versions and lockfile.
2. Keep changes focused and preserve working mobile navigation and keyboard access.
3. Keep secrets on the server and original documents in the browser.
4. Keep deterministic comparison separate from AI explanations.
5. Add meaningful regression coverage when changing parsing, normalization, comparison or security behavior.
6. Preserve applied SQL migrations; introduce a new migration for a schema change.

## Validation

From the extracted source:

```sh
pnpm exec tsc --noEmit
node --test tests/documents.test.mjs tests/assistant.test.mjs tests/interface.test.mjs
pnpm build
node scripts/test-server.mjs
```

Run checks appropriate to the change. Screenshots should show the actual changed interface, use demonstration values and exclude account details or secrets. Distinguish a desktop phone-width preview from a real-device capture.

## Pull request description

Describe the problem and resulting behavior, list relevant validation, and disclose remaining limits. Include before/after screenshots for visible interface changes when supported browser capture is available. Do not claim accuracy, security, official connectivity or deployment success without evidence.

Third-party assets must retain attribution and license notices. The project has no blanket license yet; do not assume unrestricted redistribution rights for every included asset.
