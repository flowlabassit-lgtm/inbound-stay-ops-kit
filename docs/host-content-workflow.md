# Host Content Workflow

This workflow turns host-provided Airbnb or booking-platform text into a translated Web Guest Help Page without scraping the platform.

## Goal

```text
Host pastes listing content
-> Codex, Claude, or Hermes extracts safe facts
-> AI drafts approvedStayGuide sections in supported languages
-> Host reviews and approves
-> Guest page auto-selects the guest language
-> Extra questions go to agent or Telegram host handoff
```

## Step 1: Paste Source Text

Fast path:

- Open `host-setup.html`.
- Paste source text and stay rules.
- Copy the generated prompt.
- Ask Codex, Claude, or Hermes to create the final reviewed `config.json`.

Workbook path:

- `host-workbook/host-info-form.md`
- `host-workbook/platform-source-form.md`
- `host-workbook/repeated-questions-form.md`
- `host-workbook/risky-answer-checklist.md`

Rules:

- Do not scrape Airbnb.
- Do not paste private guest messages.
- Do not paste reservation details.
- Do not paste door codes, lockbox codes, or passwords into the public guide.

## Step 2: Generate Candidate Guide

Use:

- `ai-prompts/01-build-config-from-host-workbook.md`
- `ai-prompts/02-import-platform-source-text.md`

Output should update `config.json`:

```json
{
  "approvedStayGuide": [
    {
      "id": "listing-overview",
      "sourceType": "airbnb",
      "title": {
        "en": "Airbnb Listing Overview",
        "ko": "Airbnb listing overview in Korean",
        "ja": "Airbnb listing overview in Japanese"
      },
      "body": {
        "en": "Host-approved guide text...",
        "ko": "Host-approved guide text translated to Korean...",
        "ja": "Host-approved guide text translated to Japanese..."
      },
      "hostApproved": false
    }
  ]
}
```

## Step 3: Host Review

The host checks:

- Times
- Address and transit hints
- Access instructions
- House rules
- Amenities
- Luggage and early check-in rules
- Risky topics
- Translation accuracy

Only after review, set:

```json
{
  "hostApproved": true,
  "lastReviewedAt": "2026-06-17"
}
```

## Step 4: Language Display

The page selects the guest language in this order:

1. `?lang=ja`, `?lang=en`, or another supported URL language
2. The guest's previous manual selection in local storage
3. Browser language, such as `ja-JP` -> `ja`
4. `property.defaultLanguage`
5. English or the first supported language

Unsupported languages fall back safely instead of using unapproved live translation.

## Step 5: Extra Questions

The guide should answer the stable stay information.

The question box is for anything not covered by the guide:

- Safe FAQ answer if already approved
- Blocked answer for refund/payment/platform/emergency topics
- Host review for uncertain or risky stay-specific questions
- Optional Hermes Agent when configured
- Telegram handoff when host confirmation is needed
