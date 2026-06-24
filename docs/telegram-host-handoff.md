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
-> bot translates the host reply to the saved guest language when translation is configured
-> bot sends the translated or fallback host reply to the guest
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
6. Set a private `TELEGRAM_WEBHOOK_SECRET`. Use the same value when registering the Telegram webhook.
7. Optional: set `HOST_REPLY_TRANSLATION_URL` if you want host replies translated before they are delivered to guests. The endpoint should accept:

```json
{
  "text": "Host reply text",
  "targetLocale": "ja",
  "source": "telegram_host_reply",
  "ticketId": "TABC123",
  "propertyId": "sample-stay",
  "propertyName": "Sample Stay"
}
```

and return one of:

```json
{ "translation": "Translated text" }
```

```json
{ "translations": "Translated text" }
```

```json
{ "translations": ["Translated text"] }
```

If `HOST_REPLY_TRANSLATION_URL` is not configured, the bot sends the host's original reply and tells the host it was sent without translation.

8. Start the server:

```bash
cd adapters/telegram
npm start
```

8. Register the host admin in Telegram:

```text
/admin YOUR_ADMIN_SECRET
```

9. Guests can now message the bot.

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

If `HOST_REPLY_TRANSLATION_URL` is configured and the guest language is `ja`, the guest receives:

```text
ホストからの返信:
はい、本日は11:30にチェックインできます。
```

If translation is not configured or the translation endpoint fails, the guest receives the original host reply.

## Webhook

For production, expose your server over HTTPS and set the Telegram webhook to:

```text
https://YOUR_DOMAIN/telegram/webhook
```

Register the webhook with Telegram's secret token header enabled:

```bash
curl "https://api.telegram.org/botYOUR_BOT_TOKEN/setWebhook" \
  -d "url=https://YOUR_DOMAIN/telegram/webhook" \
  -d "secret_token=YOUR_TELEGRAM_WEBHOOK_SECRET"
```

The adapter rejects webhook POST requests when the `X-Telegram-Bot-Api-Secret-Token` header does not match `TELEGRAM_WEBHOOK_SECRET`.

Do not call live APIs until your config and secrets are reviewed.
