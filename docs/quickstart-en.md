# Quick Start

Inbound Stay Ops Kit is an open-source multilingual guest guide for stay hosts who receive foreign guests.

## Read This First

For Airbnb stays, do not put the external guide link in your Airbnb listing or Airbnb message thread unless Airbnb explicitly allows it for your situation. Use the kit to generate translated guide text that can be pasted back into Airbnb, or provide the guide as an optional in-stay QR/resource.

## 5-Minute Flow

1. Open `host-setup.html` from the local server.
2. Enter the property name, area, and supported languages.
3. Paste listing text yourself from Airbnb or another booking platform.
4. Copy the generated Codex / Hermes prompt.
5. Ask Codex or Hermes to create `config.json`.
6. Review `approvedStayGuide`.
7. Check `index.html?lang=ko`, `index.html?lang=en`, and `index.html?lang=ja`.

## Commands

```bash
npm test
```

Telegram dry-run:

```bash
cd adapters/telegram
node dry-run-handoff.mjs
```

## Sample

```bash
cp samples/seoul-guesthouse.config.json config.json
```

## Paid / Custom Scope

Kakao, LINE, WhatsApp automation, property-specific implementation, and pricing diagnosis are not included in the free open-source kit.

