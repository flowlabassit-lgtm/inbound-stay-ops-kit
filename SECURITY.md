# Security Policy

## Reporting

Please report security issues privately to the maintainer instead of opening a public issue.

## Sensitive Data

This project should never expose:

- Airbnb passwords
- Booking-platform credentials
- Telegram bot tokens
- Hermes Agent API keys
- Door codes
- Lockbox codes
- Wi-Fi passwords on a public page
- Guest names
- Reservation IDs
- Private guest messages

## Design Boundary

The static guest page can run publicly, but secrets must not be placed in:

- `index.html`
- `host-setup.html`
- `assets/`
- `config.json`
- `config.example.json`
- `samples/`

Secrets belong only in server-side `.env` files, such as:

```text
adapters/telegram/.env
```

## Platform Boundary

Do not use this project to scrape Airbnb or other booking platforms. Hosts should paste and approve their own listing text.

