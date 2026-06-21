# Samples

These are synthetic sample configs. They do not represent real properties.

Use them to understand:

- How `approvedStayGuide` should be structured
- How language variants are stored
- How source links remain host-pasted references
- How sensitive details stay out of public guide content

## Files

- `seoul-guesthouse.config.json`
- `osaka-family-stay.config.json`
- `demo.config.json` - public GitHub Pages fallback used when `config.json` is not present

To use a sample:

```bash
cp samples/seoul-guesthouse.config.json config.json
```

Then open:

```text
index.html?lang=en
index.html?lang=ja
index.html?lang=ko
index.html?lang=zh
```
