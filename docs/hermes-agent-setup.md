# Hermes Agent Setup

Hermes Agent is optional. The kit works without it.

Without Hermes:

- FAQ answers work
- Safety blocking works
- Host handoff works

With Hermes:

- Extra questions can be drafted using the translated, host-approved stay guide
- The agent can translate host-approved facts
- The agent can decide that a question needs host review

## Request Contract

```json
{
  "propertyId": "sample-seoul-stay",
  "language": "en",
  "message": "Can I leave my luggage before check-in?",
  "approvedKnowledge": {
    "text": {
      "en": "Host-approved translated stay guide..."
    }
  },
  "sources": [],
  "safety": {}
}
```

## Response Contract

```json
{
  "reply": "Luggage storage depends on the cleaning schedule. I will ask the host to confirm.",
  "needsHostReview": true,
  "matchedTopic": "luggage"
}
```

## Rules

- Use host-approved knowledge only.
- Do not scrape platform URLs.
- Do not answer if the topic is risky or uncertain.
- Return `needsHostReview: true` when host confirmation is needed.
- Store Hermes secrets in `adapters/telegram/.env`.
