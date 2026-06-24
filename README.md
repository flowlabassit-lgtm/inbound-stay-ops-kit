# Inbound Stay Ops Kit

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md)

Open-source multilingual guest-help kit for stay hosts who receive foreign guests.

It helps hosts turn approved listing and house-rule content into a mobile guest guide that appears in the guest's language. Extra questions can go to a safe agent flow or Telegram host handoff.

## What It Is

```text
Host-approved listing text
-> translated stay guide
-> mobile guest page
-> optional Telegram host handoff
```

## What It Is Not

- Not an Airbnb scraper
- Not an Airbnb inbox bot
- Not a booking, payment, refund, or review automation tool
- Not a way to move Airbnb guests off-platform
- Not a Kakao / LINE / WhatsApp automation starter

## Free Open-Source Scope

- Static guest help page
- Translated stay guide built from host-approved Airbnb or booking-platform text
- Internal FAQ / answer bank for the agent and Telegram bot
- Host-approved source workflow for Airbnb or other booking-platform links
- Host-approved local recommendations with official source links
- Safety rules for blocked and host-review questions
- Telegram Bot adapter
- Host handoff tickets through Telegram
- Optional host-reply translation before Telegram delivers the answer to the guest
- Optional Hermes Agent integration guide
- Workbooks and prompts for non-developers using Codex or Claude

## Paid / Custom Scope

- Kakao automated integration
- LINE automated integration
- WhatsApp automated integration
- Live local place API proxy and provider-specific integrations
- Property-specific implementation service
- Pricing diagnosis report

Manual links to official listings are allowed in the free kit. Automated non-Telegram messenger integration is not included.
Manual links to local place sources are allowed. Live provider APIs must run behind a server-side proxy, not directly in the static page.

## Quick Links

- Korean quickstart: `docs/quickstart-ko.md`
- English quickstart: `docs/quickstart-en.md`
- Japanese quickstart: `docs/quickstart-ja.md`
- Airbnb policy boundary: `docs/airbnb-policy-boundary.md`
- Local guide boundary: `docs/local-guide-boundary.md`
- Host setup workflow: `docs/host-content-workflow.md`
- Language routing: `docs/language-routing.md`
- Telegram dry-run: `docs/telegram-dry-run-rehearsal.md`
- Samples: `samples/`

## Safety Model

This kit does not scrape Airbnb or booking platforms.
It also does not scrape maps, review pages, or logged-in local services.

Platform links are stored as source references. The bot only uses text that the host pasted, reviewed, and approved into `config.json`.
Local recommendations follow the same rule: the static page only exposes host-approved notes and source links. Do not put provider API keys or copied review text in `config.json`.

For Airbnb stays, do not put this external guide link in an Airbnb listing description or Airbnb message thread unless Airbnb explicitly allows it for your situation. Use the kit to create translated guide content that can be pasted back into Airbnb, or provide the guide as an optional in-stay resource such as a QR code inside the property.

See `docs/airbnb-policy-boundary.md`.

The kit does not:

- Ask for Airbnb passwords
- Log in to booking platforms
- Scrape private guest messages
- Auto-send booking, refund, cancellation, payment, legal, or safety decisions
- Move booking/payment/refund workflows away from the booking platform
- Require guests to leave Airbnb, install Telegram, or create another account to access the stay

## Quick Start

Run a local static server from this folder, then open:

```text
host-setup.html
```

1. Open `host-setup.html` from the local web server.
2. Paste host-approved listing text and stay rules.
3. Copy the generated Codex / Hermes prompt.
4. Ask Codex or Hermes to turn it into a reviewed `config.json`.
5. Review `approvedStayGuide` before publishing. This is what guests read in their own language.
6. Run `npm test`.
7. Open `index.html` from a local web server or deploy it as a static site.
8. If using Telegram, follow `docs/telegram-host-handoff.md`.

Manual workbook flow is still available:

1. Copy `config.example.json` to `config.json`.
2. Fill `host-workbook/host-info-form.md`.
3. Paste public listing text into `host-workbook/platform-source-form.md`.
4. Ask Codex or Claude to run `ai-prompts/01-build-config-from-host-workbook.md`.

For the full host content flow, see `docs/host-content-workflow.md`.

For automatic guest-language behavior, see `docs/language-routing.md`.

## Try A Sample

```bash
cp samples/seoul-guesthouse.config.json config.json
```

Then open:

```text
index.html?lang=en
index.html?lang=ja
index.html?lang=ko
```

## Folder Map

```text
config.example.json              Sample host-approved property config and translated stay guide
index.html                       Guest help page
host-setup.html                  Browser setup wizard for hosts
assets/                          Browser UI
lib/                             Shared guest-ops logic
tests/                           Safety and routing tests
adapters/telegram/               Free Telegram Bot adapter
host-workbook/                   Forms the host fills in
ai-prompts/                      Prompts for Codex or Claude
docs/                            Setup and boundary docs
templates/                       Reusable policy and Hermes prompts
```

## Commands

```bash
npm test
node --check assets/app.js
node --check assets/host-setup.js
node --check lib/guest-ops.js
node --check lib/language.js
node --check lib/setup-builder.js
```

Telegram adapter:

```bash
cd adapters/telegram
node dry-run-handoff.mjs
npm start
```

## Release

Before publishing, follow `RELEASE_CHECKLIST.md`.
