# Airbnb Policy Boundary

Date reviewed: 2026-06-17

This kit is designed to avoid Airbnb platform-policy risk when used correctly.

It is not legal advice. Hosts are responsible for checking Airbnb's current policies and their local laws before publishing links or asking guests to use external tools.

## Core Conclusion

The open-source kit itself is not the policy problem. The risky part is how a host distributes the link.

Do not instruct hosts to place the Web Guest Help Page or Telegram Bot link inside an Airbnb listing description or Airbnb message thread.

Use the kit as:

- A translation and guest-guide generator for host-approved listing content
- A static guest-help page for channels where external links are allowed
- An optional in-stay guide, such as a QR code inside the property
- A Telegram handoff tool only when use of Telegram is optional and appropriate

## Not Allowed For Airbnb-First Use

- Do not add this kit's external URL to an Airbnb listing description.
- Do not send the external URL through Airbnb messages as a required step.
- Do not ask guests to move booking, extensions, payments, refunds, reviews, or surveys outside Airbnb.
- Do not require guests to create a third-party account or install Telegram to access the listing.
- Do not make this page the only place where guests can access required entry information.
- Do not scrape Airbnb listing pages, guest messages, or reservation details.

## Safer Airbnb-Compatible Uses

### 1. Translate, then paste back into Airbnb

Use the kit to convert host-approved listing text into multilingual descriptions, house rules, and check-in guidance. Then paste the final text back into Airbnb's own listing, house-rule, or check-in fields.

### 2. Optional QR code inside the property

After the guest has arrived, a QR code inside the property can point to the translated guide if it is optional and does not require another app or account.

### 3. Guest-requested alternative communication

If a guest asks after booking to use an alternative communication method, the host may use that method only if the conversation still complies with Airbnb's other requirements. Do not use it for payments, booking changes, reviews, or unrelated contact collection.

### 4. Non-Airbnb channels

For a host's own website, direct-booking site, hostel website, Google Business Profile, Instagram, Telegram, email, or printed guide, use the external guest-help page only when those channels allow it.

## Required Product Copy

Use this wording in docs and host prompts:

```text
For Airbnb stays, do not put this external guide link in your Airbnb listing or Airbnb message thread unless Airbnb explicitly allows it for your situation. Use the kit to create translated guide content that you can paste back into Airbnb, or provide the guide as an optional in-stay resource such as a QR code inside the property.
```

## Source-Based Rationale

Airbnb's Off-Platform and Fee Transparency Policy prohibits including links that take people off Airbnb in listings or messages, asking or encouraging users to move current/future/repeat bookings off Airbnb, soliciting other communication channels using Airbnb messaging, and requiring guests to use other websites/apps to physically access a listing.

Airbnb's Terms also prohibit bots, crawlers, and scrapers, and prohibit requiring or encouraging guests to interact with third-party services before, during, or after a reservation unless authorized by Airbnb.

Airbnb's Host Privacy Standards require hosts to use guest personal information only as necessary to manage reservations, comply with laws, and deliver the host service.

