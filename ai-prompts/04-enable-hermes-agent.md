# Prompt: Enable Hermes Agent

Help me connect Hermes Agent as an optional answer layer.

Read:

- `docs/hermes-agent-setup.md`
- `templates/hermes-system-prompt.md`
- `adapters/telegram/server.js`
- `config.json`

Rules:

- Hermes may only use host-approved knowledge.
- Hermes must not scrape platform URLs.
- Hermes must return `needsHostReview: true` for uncertain, risky, policy, payment, refund, cancellation, or emergency questions.
- Keep API keys in `adapters/telegram/.env`.
- If Hermes is not configured, the kit must still work with FAQ and host handoff.

