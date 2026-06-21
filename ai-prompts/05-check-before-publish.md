# Prompt: Check Before Publish

Review this kit before I publish it.

Check:

- `config.json`
- `index.html`
- `assets/app.js`
- `adapters/telegram/.env.example`
- `host-workbook/`

Find and fix:

- Door codes on public pages
- Passwords on public pages
- Guest private data
- Exact reservation details
- Refund or cancellation promises
- Payment instructions outside the booking platform
- Emergency instructions that delay local emergency services
- Unconfirmed platform source facts used as approved answers
- Any Kakao, LINE, or WhatsApp automated integration code in the free kit
- Any instruction to place this external guide link in an Airbnb listing or Airbnb message thread
- Any instruction that requires Airbnb guests to use Telegram or another third-party app to access the listing

Run:

```bash
npm test
```

Report what was checked and what still needs host review.
