# API reference

These endpoints belong to the Jomidarpan application. Examples use the live origin for clarity. Comparison uses demonstration records. No endpoint establishes legal ownership.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/status` | Dataset/version/count and session state |
| GET | `/api/land` | Search selected identifier fields |
| POST | `/api/compare` | Compare confirmed, reviewed values |
| GET | `/api/crime` | Return eligible public demonstration reports |
| GET | `/api/assistant` | Check provider configuration |
| POST | `/api/assistant` | Ask for an explanation |

## Search

```sh
curl 'https://jomidarpan.dncorleone1211.chatgpt.site/api/land?q=2001&type=plot'
```

`q` is the search value. `type` can be `all`, `record_id`, `plot`, `khatian` or `deed_number`. Search normalizes Bangla/English digits. Multiple candidates must be selected explicitly; the UI does not silently choose one.

## Compare

Send JSON containing `record_id`, `values`, `provenance` and `confirmed: true`. `values` uses the 21 allowlisted field names documented in the source comparison modules. The request is bounded to 40,000 characters.

```json
{
  "record_id": "LND-0001",
  "confirmed": true,
  "values": {
    "owner": "Value reviewed by the buyer",
    "plot": "2001"
  },
  "provenance": {
    "owner": "Reviewed document field",
    "plot": "Reviewed document field"
  }
}
```

This intentionally partial example illustrates the shape, not a verified submission. Omitted fields are missing evidence. Use the supplied CSV/PDF and review all 21 fields for a complete demo.

Responses expose the comparison outcome, field evidence and separate claim analysis. Changing a reviewed field invalidates the previous UI result. Original files and expected-result flags are not request inputs.

## Public report search

```sh
curl 'https://jomidarpan.dncorleone1211.chatgpt.site/api/crime?record_id=LND-0001'
```

Only public QA reports are returned. An empty list is not a statement about every possible police/government system.

## Assistant

```json
{
  "question": "খতিয়ান কী?",
  "language": "bn",
  "summary": {
    "matched": 20,
    "different": 1,
    "missing": 0,
    "attention_fields": ["owner"]
  }
}
```

`summary` is optional. Only allowlisted counts and field names survive validation. The response contains plain text, provider information and a notice. The question goes to Google; avoid private data. A configured provider status does not guarantee every subsequent provider request will succeed.

## Important statuses

| Status | Example condition |
| --- | --- |
| 400 | Invalid input or missing comparison confirmation |
| 403 | Assistant request from a different explicit Origin |
| 429 | Visitor/global assistant quota reached |
| 503 | Assistant not configured or reference dataset incomplete |

Provider failures are mapped to sanitized statuses/messages. See the route source for the exact contract. Do not rely on raw Google response text or use the assistant endpoint to automate verification decisions.
