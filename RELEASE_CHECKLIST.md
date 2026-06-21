# Release Checklist

Use this before publishing a GitHub release.

## Product

- [ ] `README.md` states the free and paid/custom boundaries.
- [ ] `README.md` states the Airbnb-safe usage boundary.
- [ ] `START_HERE.md` works for non-developer hosts.
- [ ] `host-setup.html` generates a prompt and config draft.
- [ ] `index.html` renders the guest guide on desktop and mobile.
- [ ] `docs/language-routing.md` explains `?lang`.
- [ ] `docs/airbnb-policy-boundary.md` is current enough for launch.

## Safety

- [ ] No real property secrets in examples.
- [ ] No real guest data in examples.
- [ ] No Telegram token in files.
- [ ] No Hermes API key in files.
- [ ] No instruction tells hosts to put the external guide link in Airbnb listing/messages.

## Verification

```bash
npm test
node --check assets/app.js
node --check assets/host-setup.js
node --check lib/guest-ops.js
node --check lib/language.js
node --check lib/setup-builder.js
cd adapters/telegram
node dry-run-handoff.mjs
```

## Browser Checks

- [ ] `host-setup.html` desktop
- [ ] `host-setup.html` mobile
- [ ] `index.html?lang=ja` mobile
- [ ] `index.html?lang=en` mobile
- [ ] `index.html?lang=fr` falls back safely

