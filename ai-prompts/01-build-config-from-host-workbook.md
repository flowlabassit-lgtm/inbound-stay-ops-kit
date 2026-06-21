# Prompt: Build Config From Host Workbook

You are helping me customize the Inbound Stay Ops Kit.

Read these files:

- `host-workbook/host-info-form.md`
- `host-workbook/platform-source-form.md`
- `host-workbook/repeated-questions-form.md`
- `host-workbook/risky-answer-checklist.md`
- `config.example.json`

Create or update `config.json`.

Rules:

- Do not scrape any platform URL.
- Use platform URLs only as source references.
- Use only facts the host explicitly confirmed.
- Create `approvedStayGuide` as the guest-facing translated guide. This should collect the host-approved Airbnb or booking-platform content into clear sections.
- Translate `approvedStayGuide` into every supported guest language.
- Keep FAQ items as an internal answer bank for the agent and Telegram bot, not as visible cards on the public page.
- Set `hostApproved: false` on newly generated guide sections until the host explicitly approves them.
- Add `lastReviewedAt` only after host review.
- If a fact is uncertain, do not put it into guest-facing answers.
- Do not expose door codes, lockbox codes, Wi-Fi passwords, guest data, or private reservation data.
- Refund, cancellation, payment, emergency, legal, tax, insurance, and platform-policy questions must be blocked or routed to host review.
- Keep Telegram as the only automated messenger integration.
- Do not add Kakao, LINE, or WhatsApp adapter code.

After editing, summarize:

- Facts added
- `approvedStayGuide` sections created
- Facts rejected or left uncertain
- Host-review topics
- Blocked topics
- Anything the host must manually verify
