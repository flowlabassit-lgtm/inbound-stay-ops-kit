# Prompt: Enable Telegram Bot

Help me enable the Telegram adapter.

Read:

- `docs/telegram-host-handoff.md`
- `adapters/telegram/.env.example`
- `adapters/telegram/server.js`
- `config.json`

Tasks:

1. Check whether `config.json` has a valid `telegram.botUrl`.
2. Help me create `adapters/telegram/.env` from `.env.example`.
3. Confirm that secrets are only in `.env`.
4. Explain how the host registers with `/admin ADMIN_SECRET`.
5. Explain how guests trigger handoff tickets.
6. Explain how the host replies with `/reply TICKET_ID message`.

Do not call the real Telegram API unless I explicitly approve it.

