# Local Guide Boundary

The local guide feature helps hosts show nearby recommendations without turning the static page into a scraper or a secret-key leak.

## Free Static Kit

The open-source static kit may show:

- Host-approved recommendations written in `config.json`
- Manual source links to public official pages or map search pages
- Stable guest-help notes such as nearby cafe, pharmacy, market, transit, or rainy-day options

The static kit must not:

- Put Google, Kakao, Naver, Yelp, Foursquare, Tripadvisor, or other provider API keys in browser files
- Scrape Google Maps, Naver Map, Kakao Map, Tabelog, review pages, or logged-in services
- Copy review text into the public config
- Claim that live ratings, opening hours, or availability are current unless they came from an approved live API path

## Official API / Proxy Scope

Live place data belongs behind a server-side proxy or custom deployment. That proxy can call approved provider APIs, enforce rate limits, hide secrets, and normalize the response before the guest page sees it.

Typical provider choices by market:

- Korea: Kakao Local API, Naver Search/Local APIs, or Google Places where appropriate
- Japan: Google Places or approved partner/API access; Tabelog should be used as manual links unless licensed API access is available
- US and many global markets: Google Places, Yelp Fusion, Foursquare Places, or Tripadvisor Content API where policy and quota allow
- Southeast Asia and Hong Kong/Taiwan: Google Places plus locally dominant services only when official API or partner access is available

If a provider does not offer an approved API path for your use case, use host-approved manual recommendations and source links instead.

## Config Pattern

Use `localGuide.recommendations` for static, host-approved items:

```json
{
  "localGuide": {
    "mode": "host_approved_static",
    "apiProxy": {
      "enabled": false,
      "endpoint": ""
    },
    "recommendations": [
      {
        "id": "station-cafe",
        "hostApproved": true,
        "category": "cafe",
        "name": {
          "en": "Station cafe candidate"
        },
        "description": {
          "en": "A host-approved nearby cafe candidate."
        },
        "sourceType": "official_place_link",
        "sourceUrl": "https://www.google.com/maps/search/?api=1&query=cafe%20near%20Hongdae%20Station",
        "lastReviewedAt": "2026-06-23"
      }
    ]
  }
}
```

Only `hostApproved: true` recommendations should be exposed to guests.
