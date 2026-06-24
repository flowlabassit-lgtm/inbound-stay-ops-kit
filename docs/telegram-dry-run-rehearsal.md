# Telegram Dry-Run Rehearsal

Use this before connecting a real Telegram Bot token.

The rehearsal does not call Telegram APIs. It simulates:

```text
guest question
-> host review detection
-> ticket creation
-> host notification
-> /reply command
-> guest-facing translated host reply
```

Run:

```bash
cd adapters/telegram
npm run dry-run
```

Expected flow:

```text
Guest -> Bot:
Can I check in at 11am?

Bot -> Guest:
Early check-in needs host confirmation.

Bot -> Host:
[Sample Seoul Stay] Guest question TABC123
...
Reply with: /reply TABC123 your message here

Host -> Bot:
/reply TABC123 Yes, 11:30 is possible today...

Bot -> Guest:
ホストからの返信:
はい、本日は11:30にチェックインできます...

Translation:
translated to ja
```

After this works, use `docs/telegram-host-handoff.md` to connect a real bot.
