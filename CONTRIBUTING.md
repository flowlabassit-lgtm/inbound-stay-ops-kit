# Contributing

Thanks for improving Inbound Stay Ops Kit.

## Scope

Good contributions:

- Better host setup flow
- Safer language routing
- Clearer Airbnb-safe documentation
- More sample configs
- Better Telegram dry-run and host handoff behavior
- Tests for safety, routing, and config generation

Out of scope for this free open-source kit:

- Kakao automated integration
- LINE automated integration
- WhatsApp automated integration
- Airbnb scraping
- Booking-platform inbox automation
- Payment, refund, cancellation, legal, tax, or insurance automation

## Safety Rules

- Do not add code that scrapes Airbnb or other booking platforms.
- Do not add code that requires guests to use a third-party app to access a stay.
- Do not expose door codes, lockbox codes, Wi-Fi passwords, guest names, reservation IDs, or private guest messages.
- Keep secrets out of browser files and sample configs.
- Keep `.env` files untracked.

## Before Opening A PR

Run:

```bash
npm test
node --check assets/app.js
node --check assets/host-setup.js
node --check lib/guest-ops.js
node --check lib/language.js
node --check lib/setup-builder.js
```

If changing Telegram:

```bash
cd adapters/telegram
node dry-run-handoff.mjs
```

