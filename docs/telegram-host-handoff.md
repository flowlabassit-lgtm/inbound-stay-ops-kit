# Telegram Host Handoff

Telegram is the only automated messenger adapter included in the free open-source kit.

For Airbnb stays, Telegram must not be required for booking, payment, refund, review, or physical access to the listing. Use Telegram only when it is optional and appropriate, such as a guest-requested alternative channel after booking or a non-Airbnb channel where Telegram links are allowed.

## Flow

```text
Guest asks Telegram bot
-> FAQ answer if approved
-> blocked answer if unsafe
-> host ticket if confirmation is needed
-> host receives ticket in Telegram
-> host replies with /reply TICKET_ID message
-> bot sends the host reply to the guest
```

## Setup

Before using a real token, run the dry-run:

```bash
cd adapters/telegram
npm run dry-run
```

See `docs/telegram-dry-run-rehearsal.md`.

1. Create a bot with BotFather.
2. Copy the bot token.
3. Copy `adapters/telegram/.env.example` to `adapters/telegram/.env`.
4. Set `TELEGRAM_BOT_TOKEN`.
5. Set a private `TELEGRAM_ADMIN_SECRET`.
6. Start the server:

```bash
cd adapters/telegram
npm start
```

7. Register the host admin in Telegram:

```text
/admin YOUR_ADMIN_SECRET
```

8. Guests can now message the bot.

## Host Reply

When a guest question needs host confirmation, the host receives:

```text
[Sample Stay] Guest question TABC123
Topic: early_check_in
Language: en

Guest:
Can I check in at 11am?

Reply with: /reply TABC123 your message here
```

The host replies:

```text
/reply TABC123 Yes, 11:30 is possible today.
```

The guest receives:

```text
Host reply:
Yes, 11:30 is possible today.
```

## Webhook

For production, expose your server over HTTPS and set the Telegram webhook to:

```text
https://YOUR_DOMAIN/telegram/webhook
```

Do not call live APIs until your config and secrets are reviewed.
