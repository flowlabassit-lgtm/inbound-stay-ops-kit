import { normalizeLanguageTag } from "./language.js";

const DEFAULT_BLOCKED_TOPICS = [
  {
    id: "refund_policy",
    keywords: ["refund", "cancel", "cancellation", "payment", "chargeback"],
    message: {
      en: "Refunds, cancellations, and payment changes must be handled inside the booking platform."
    }
  },
  {
    id: "emergency",
    keywords: ["fire", "medical", "police", "emergency"],
    message: {
      en: "For emergencies, contact local emergency services first, then notify the host."
    }
  }
];

const DEFAULT_HOST_REVIEW_TOPICS = [
  {
    id: "early_check_in",
    keywords: ["early check-in", "early check in", "before check-in"],
    message: {
      en: "Early check-in needs host confirmation."
    }
  },
  {
    id: "luggage",
    keywords: ["luggage", "bag storage", "baggage"],
    message: {
      en: "Luggage storage needs host confirmation."
    }
  },
  {
    id: "lost_item",
    keywords: ["lost", "left behind", "forgot"],
    message: {
      en: "Lost items need host confirmation."
    }
  }
];

function cleanText(value) {
  return String(value || "").trim();
}

export function parseLanguageList(value) {
  const seen = new Set();
  const languages = [];
  for (const item of String(value || "").split(/[,;\s]+/)) {
    const language = normalizeLanguageTag(item);
    if (!language || seen.has(language)) continue;
    seen.add(language);
    languages.push(language);
  }
  return languages.length > 0 ? languages : ["en"];
}

export function slugifyProperty(value) {
  const slug = cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "sample-stay";
}

export function findSensitiveWarnings(text) {
  const normalized = cleanText(text).toLowerCase();
  const warnings = [];
  if (/\b(door|gate|lockbox|keypad|access)\s*(code|pin)\b/.test(normalized)) {
    warnings.push("possible_access_code");
  }
  if (/\b(wifi|wi-fi|internet|router)?\s*(password|passcode|pwd)\b/.test(normalized)) {
    warnings.push("possible_password");
  }
  if (/\b(passport|id card|reservation|booking number|guest name)\b/.test(normalized)) {
    warnings.push("possible_private_guest_or_booking_data");
  }
  return warnings;
}

function section(id, sourceType, title, body) {
  return {
    id,
    sourceType,
    title: {
      en: title
    },
    body: {
      en: body
    },
    hostApproved: false
  };
}

export function buildConfigDraft(input = {}) {
  const supportedLanguages = parseLanguageList(input.supportedLanguages);
  const defaultLanguage = supportedLanguages.includes(normalizeLanguageTag(input.defaultLanguage))
    ? normalizeLanguageTag(input.defaultLanguage)
    : supportedLanguages.includes("en")
      ? "en"
      : supportedLanguages[0];
  const propertyName = cleanText(input.propertyName) || "Sample Stay";
  const publicArea = cleanText(input.publicArea);
  const platformUrl = cleanText(input.platformUrl);

  const guideSections = [
    section(
      "listing-overview",
      "host_pasted_listing",
      "Listing Overview",
      cleanText(input.platformText) || "Paste host-approved listing overview here."
    ),
    section(
      "check-in",
      "host",
      "Check-In",
      cleanText(input.checkInNotes) || "Add host-approved check-in guidance here."
    ),
    section(
      "house-rules",
      "host",
      "House Rules",
      cleanText(input.houseRules) || "Add host-approved house rules here."
    ),
    section(
      "guest-notes",
      "host",
      "Guest Notes",
      cleanText(input.guestNotes) || "Add host-approved guest notes here."
    )
  ];

  return {
    property: {
      id: slugifyProperty(input.propertySlug || propertyName),
      name: propertyName,
      defaultLanguage,
      supportedLanguages,
      publicAddress: {
        en: publicArea
      }
    },
    telegram: {
      botUrl: cleanText(input.telegramBotUrl) || "",
      enabled: Boolean(cleanText(input.telegramBotUrl))
    },
    agent: {
      enabled: false,
      endpoint: "",
      mode: "hermes",
      note: "Use a public proxy endpoint only. Do not put secret API keys in this static config."
    },
    sources: [
      {
        type: "airbnb_or_booking_platform",
        url: platformUrl,
        importMode: "host_pasted_text",
        hostConfirmed: false,
        lastReviewedAt: null,
        note: "Host must review extracted facts before publishing."
      }
    ],
    approvedStayGuide: guideSections,
    approvedKnowledge: {
      checkIn: {
        en: cleanText(input.checkInNotes)
      },
      houseRules: {
        en: cleanText(input.houseRules)
      }
    },
    faq: [],
    safety: {
      hostReviewTopics: DEFAULT_HOST_REVIEW_TOPICS,
      blockedTopics: DEFAULT_BLOCKED_TOPICS
    },
    hostReviewAck: {
      en: "This needs host confirmation. I will ask the host and get back to you here."
    },
    fallbackReply: {
      en: "I do not have a confirmed answer for that yet. Please use the question box or Telegram bot so the host can confirm."
    }
  };
}

export function buildSetupPrompt(input = {}) {
  const languages = parseLanguageList(input.supportedLanguages);
  const warnings = findSensitiveWarnings(
    [
      input.platformText,
      input.checkInNotes,
      input.houseRules,
      input.guestNotes
    ].join("\n")
  );

  return [
    "You are helping me configure the Inbound Stay Ops Kit for one stay.",
    "",
    "Airbnb-safe rules:",
    "- Do not scrape Airbnb or any booking platform.",
    "- Use only the host-pasted text below.",
    "- For Airbnb stays, do not place the external guide link in Airbnb listings or Airbnb messages unless Airbnb explicitly allows it.",
    "- Generate translated content that can be pasted back into Airbnb, or used as an optional in-stay QR/resource.",
    "- Do not publish door codes, lockbox codes, Wi-Fi passwords, guest names, reservation IDs, payment instructions, refund promises, or emergency advice that delays local emergency services.",
    "",
    "Output requirements:",
    "- Update config.json.",
    "- Create approvedStayGuide sections for each supported language.",
    "- Set hostApproved: false for new sections until the host reviews them.",
    "- Keep FAQ as an internal answer bank for agent/Telegram, not visible public cards.",
    "- Route uncertain, risky, payment, refund, cancellation, access-code, and emergency topics to host review or blocked topics.",
    "",
    "Stay inputs:",
    `Property name: ${cleanText(input.propertyName)}`,
    `Property slug: ${cleanText(input.propertySlug) || slugifyProperty(input.propertyName)}`,
    `Public area: ${cleanText(input.publicArea)}`,
    `Supported languages: ${languages.join(", ")}`,
    `Default language: ${normalizeLanguageTag(input.defaultLanguage) || "en"}`,
    `Platform URL: ${cleanText(input.platformUrl)}`,
    "",
    "Host-pasted platform text:",
    "```text",
    cleanText(input.platformText),
    "```",
    "",
    "Check-in notes:",
    "```text",
    cleanText(input.checkInNotes),
    "```",
    "",
    "House rules:",
    "```text",
    cleanText(input.houseRules),
    "```",
    "",
    "Guest notes:",
    "```text",
    cleanText(input.guestNotes),
    "```",
    "",
    warnings.length > 0
      ? `Sensitive-content warnings to resolve before publishing: ${warnings.join(", ")}`
      : "Sensitive-content warnings: none detected by the basic checker."
  ].join("\n");
}

