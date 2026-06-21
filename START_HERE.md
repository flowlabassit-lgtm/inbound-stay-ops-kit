# Start Here

Use this file if you are a non-developer host.

## What You Are Building

You are building a small guest-help system for one stay:

- A public page guests can open before asking repeated questions
- A translated stay guide based on host-approved Airbnb or booking-platform text
- An agent question box for anything not covered in the guide
- A Telegram bot that answers approved questions or routes them to the host
- A Telegram handoff path when the host must answer directly

## The Important Rule

Do not let the bot invent stay facts.

Airbnb, Booking.com, Agoda, Vrbo, or your own website can be source links. However, the bot should only answer from facts that you copied, checked, and approved in `config.json`.

For Airbnb stays, do not place this external guide link inside the Airbnb listing or Airbnb message thread unless Airbnb explicitly allows it for your situation. Use this kit to create translated content that you can paste back into Airbnb, or provide the guide as an optional QR/resource inside the property.

## Your Setup Steps

1. Open `host-setup.html`.
2. Paste your listing text and stay rules.
3. Copy the generated Codex / Hermes prompt.
4. Ask Codex or Hermes to create or update `config.json`.
5. Review the generated `config.json`, especially `approvedStayGuide`.
6. Ask Codex or Claude to use `ai-prompts/05-check-before-publish.md`.
7. Publish the static page.
8. Optional: enable Telegram using `docs/telegram-host-handoff.md`.

You can also use the workbook files in `host-workbook/` if you prefer a document-based flow.

For the full paste -> translate -> approve -> publish workflow, read `docs/host-content-workflow.md`.

For guest language selection, read `docs/language-routing.md`.

## Do Not Publish

- Door codes
- Lockbox codes
- Wi-Fi passwords on a public page
- Guest names
- Reservation details
- Refund promises
- Safety/legal advice
- Payment instructions outside the booking platform
