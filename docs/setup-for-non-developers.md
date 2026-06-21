# Setup For Non-Developers

## What You Need

- A public stay listing link
- The listing text copied by you
- Your house rules
- Your check-in instructions
- Common guest questions
- A Telegram account if you want bot handoff
- Codex or Claude to help edit files

## Simple Flow

1. Fill the workbook files in `host-workbook/`.
2. Ask Codex or Claude to run `ai-prompts/01-build-config-from-host-workbook.md`.
3. Review `config.json`.
4. Run `npm test`.
5. Publish `index.html` and `config.json` as a static site.
6. Optional: run the Telegram adapter.

## Host Approval

Every answer shown to guests should be reviewed by the host.

If you are unsure about a fact, do not publish it. Put it in `needsHostConfirmation` or route that topic to host review.

