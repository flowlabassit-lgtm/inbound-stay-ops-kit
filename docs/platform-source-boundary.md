# Platform Source Boundary

This kit supports Airbnb and other booking-platform links as source references.

It does not scrape them.

## Allowed

- Store public listing URLs
- Paste listing text into the workbook yourself
- Ask Codex or Claude to extract candidate facts from pasted text
- Review extracted facts before adding them to `config.json`
- Mark the source as `hostConfirmed: true` after review

## Not Allowed

- Logging in to Airbnb or another booking platform from this kit
- Scraping listing pages
- Scraping guest messages
- Reading reservation data
- Publishing private guest information
- Making refund, cancellation, or payment promises outside the booking platform
- Putting this external guide link into an Airbnb listing or message thread as a required guest step
- Requiring a guest to use Telegram or another third-party app to physically access the listing

## Data Flow

```text
Platform link
-> host pastes public listing text
-> AI extracts candidate facts
-> host reviews facts
-> approved facts enter config.json
-> approvedStayGuide shows translated listing content to guests
-> the question box and Telegram bot handle only extra questions, safety checks, and host handoff
```
