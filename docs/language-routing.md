# Language Routing

The Web Guest Help Page shows the translated stay guide in the guest's language when that language is supported.

## Selection Order

1. URL language parameter:

```text
?lang=ja
?lang=en
?lang=ko
```

2. The guest's previous manual language choice saved in local storage.
3. Browser language:

```text
ja-JP -> ja
en-US -> en
ko-KR -> ko
```

4. `property.defaultLanguage`.
5. English or the first supported language.

## Unsupported URL Language

If the URL says `?lang=fr` but `fr` is not listed in `property.supportedLanguages`, the page falls back to the default language. It does not use unapproved live translation.

## Host Links

For non-Airbnb channels where external links are allowed, the host can share:

```text
https://example.com/stay-guide?lang=ja
https://example.com/stay-guide?lang=en
https://example.com/stay-guide?lang=ko
```

For Airbnb, do not put the external link in the listing or Airbnb message thread unless Airbnb explicitly allows it for the host's situation. Use the kit to generate translated content to paste back into Airbnb, or provide the guide as an optional in-stay QR/resource.

## Adding Languages

To add a language:

1. Add the language code to `property.supportedLanguages`.
2. Add translated `title` and `body` values to every `approvedStayGuide` section.
3. Review the translation.
4. Keep risky or uncertain content out of the guide.

Example:

```json
{
  "property": {
    "defaultLanguage": "en",
    "supportedLanguages": ["ko", "en", "ja", "zh"]
  }
}
```

