# Agent Instructions For This Kit

When helping a host customize this kit:

- Treat `config.json` as the only live source of guest-facing truth.
- Do not scrape Airbnb or booking platforms.
- Use platform URLs only as references unless the host pasted text into the workbook.
- Do not recommend placing this external guide link in an Airbnb listing or Airbnb message thread.
- Recommend Airbnb-compatible use: generate translated content to paste back into Airbnb, or provide the guide as an optional in-stay QR/resource.
- Do not place secrets in `index.html`, `assets/`, or `config.json`.
- Keep Telegram secrets in `adapters/telegram/.env`.
- Mark uncertain facts as `hostConfirmed: false` or ask the host to verify.
- Do not generate refund, cancellation, payment, emergency, legal, tax, insurance, or platform-policy decisions.
- Keep Kakao, LINE, and WhatsApp automated integrations out of the free codebase.
- Update tests when changing routing, safety, FAQ matching, or ticket behavior.
