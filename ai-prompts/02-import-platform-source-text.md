# Prompt: Import Platform Source Text

I pasted public listing text into `host-workbook/platform-source-form.md`.

Extract candidate stay facts into this structure:

```json
{
  "source": {
    "type": "",
    "url": "",
    "importMode": "host_pasted_text",
    "hostConfirmed": false
  },
  "candidateFacts": [],
  "unsafeOrPrivateFacts": [],
  "needsHostConfirmation": []
}
```

Rules:

- Do not browse or scrape the source URL.
- Do not treat pasted text as approved automatically.
- Mark the source `hostConfirmed: false` until the host confirms.
- Never include private guest data.
- Never publish exact door codes, lockbox codes, or passwords on the public page.
- Ask the host to confirm uncertain facts.

