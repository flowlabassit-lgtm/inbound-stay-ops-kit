import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

import {
  buildApprovedKnowledgeBase,
  findFaqAnswer,
  classifyGuestQuestion
} from "../lib/guest-ops.js";
import {
  createHostTicket,
  formatHostNotification,
  parseHostReplyCommand
} from "../adapters/telegram/tickets.js";
import {
  LANGUAGE_STORAGE_KEY,
  readStoredLanguage,
  resolveGuestLanguage,
  normalizeLanguageTag,
  writeStoredLanguage
} from "../lib/language.js";
import {
  buildConfigDraft,
  buildSetupPrompt,
  findSensitiveWarnings,
  parseLanguageList
} from "../lib/setup-builder.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "..");

const sampleConfig = {
  property: {
    id: "sample-seoul-stay",
    name: "Sample Seoul Stay",
    defaultLanguage: "en",
    supportedLanguages: ["ko", "en", "ja"]
  },
  sources: [
    {
      type: "airbnb",
      url: "https://www.airbnb.com/rooms/example",
      importMode: "host_pasted_text",
      hostConfirmed: false,
      rawPastedText: "UNAPPROVED: Door code is 9999."
    },
    {
      type: "official_website",
      url: "https://example-stay.test",
      importMode: "host_pasted_text",
      hostConfirmed: true,
      approvedSummary: {
        en: "Self check-in is available from 15:00. The door code is shared on arrival day.",
        ko: "셀프 체크인은 15:00부터 가능하며 도어코드는 도착 당일 안내됩니다."
      }
    }
  ],
  approvedKnowledge: {
    checkIn: {
      en: "Check-in starts at 15:00.",
      ko: "체크인은 15:00부터입니다."
    },
    houseRules: {
      en: ["No smoking.", "Quiet hours after 22:00."]
    }
  },
  approvedStayGuide: [
    {
      id: "listing-overview",
      sourceType: "airbnb",
      title: {
        en: "Airbnb Listing Overview"
      },
      body: {
        en: "APPROVED GUIDE: This sentence came from the host-approved listing guide."
      }
    }
  ],
  faq: [
    {
      id: "wifi",
      keywords: ["wifi", "wi-fi", "internet"],
      answer: {
        en: "Wi-Fi details are printed inside the room.",
        ko: "와이파이 정보는 객실 안에 인쇄되어 있습니다."
      },
      hostApproved: true
    },
    {
      id: "secret-door-code",
      keywords: ["door code"],
      answer: {
        en: "The door code is 9999."
      },
      hostApproved: false
    }
  ],
  safety: {
    hostReviewTopics: [
      {
        id: "early_check_in",
        keywords: ["early check-in", "check in at 11", "before check-in"],
        message: {
          en: "Early check-in needs host confirmation."
        }
      }
    ],
    blockedTopics: [
      {
        id: "refund_policy",
        keywords: ["refund", "cancel", "cancellation"],
        message: {
          en: "Refunds and cancellations must be handled in the booking platform."
        }
      }
    ]
  }
};

test("approved knowledge base excludes unconfirmed platform source text", () => {
  const knowledge = buildApprovedKnowledgeBase(sampleConfig);

  assert.equal(knowledge.propertyName, "Sample Seoul Stay");
  assert.equal(knowledge.sources.length, 2);
  assert.match(knowledge.text.en, /APPROVED GUIDE/);
  assert.match(knowledge.text.en, /Self check-in is available from 15:00/);
  assert.doesNotMatch(knowledge.text.en, /UNAPPROVED/);
  assert.doesNotMatch(knowledge.text.en, /9999/);
});

test("FAQ matching only returns host-approved answers", () => {
  const wifi = findFaqAnswer("What is the wifi?", sampleConfig, "en");
  const doorCode = findFaqAnswer("What is the door code?", sampleConfig, "en");

  assert.equal(wifi?.id, "wifi");
  assert.equal(wifi?.answer, "Wi-Fi details are printed inside the room.");
  assert.equal(doorCode, null);
});

test("guest question classification separates host review from blocked platform policy", () => {
  const early = classifyGuestQuestion("Can I check in at 11am?", sampleConfig, "en");
  const refund = classifyGuestQuestion("Can I get a refund if I cancel?", sampleConfig, "en");

  assert.equal(early.action, "host_review");
  assert.equal(early.topicId, "early_check_in");
  assert.equal(refund.action, "blocked");
  assert.equal(refund.topicId, "refund_policy");
});

test("Telegram host ticket preserves guest chat routing and parses host reply command", () => {
  const ticket = createHostTicket({
    guestChatId: 111,
    hostChatId: 222,
    guestLanguage: "en",
    topicId: "early_check_in",
    question: "Can I check in at 11am?"
  });
  const notification = formatHostNotification(ticket, {
    propertyName: "Sample Seoul Stay"
  });
  const command = parseHostReplyCommand(`/reply ${ticket.id} Yes, 11:30 is possible.`);

  assert.match(ticket.id, /^T[0-9A-Z]{6}$/);
  assert.equal(ticket.guestChatId, 111);
  assert.match(notification, new RegExp(ticket.id));
  assert.equal(command.ticketId, ticket.id);
  assert.equal(command.message, "Yes, 11:30 is possible.");
});

test("language resolver prioritizes URL lang over stored and browser languages", () => {
  const language = resolveGuestLanguage({
    search: "?lang=ja",
    storedLanguage: "ko",
    navigatorLanguages: ["en-US", "ko-KR"],
    supportedLanguages: ["ko", "en", "ja"],
    defaultLanguage: "en"
  });

  assert.equal(language, "ja");
});

test("language resolver keeps a previously selected supported language", () => {
  const language = resolveGuestLanguage({
    search: "",
    storedLanguage: "ko",
    navigatorLanguages: ["ja-JP", "en-US"],
    supportedLanguages: ["ko", "en", "ja"],
    defaultLanguage: "en"
  });

  assert.equal(language, "ko");
});

test("language resolver detects browser language tags and falls back safely", () => {
  assert.equal(normalizeLanguageTag("ja-JP"), "ja");

  const browserLanguage = resolveGuestLanguage({
    search: "",
    storedLanguage: "",
    navigatorLanguages: ["fr-FR", "ja-JP"],
    supportedLanguages: ["ko", "en", "ja"],
    defaultLanguage: "en"
  });

  const fallbackLanguage = resolveGuestLanguage({
    search: "?lang=fr",
    storedLanguage: "de",
    navigatorLanguages: ["fr-FR"],
    supportedLanguages: ["ko", "en", "ja"],
    defaultLanguage: "en"
  });

  assert.equal(browserLanguage, "ja");
  assert.equal(fallbackLanguage, "en");
});

test("unsupported URL language falls back to default instead of stored language", () => {
  const language = resolveGuestLanguage({
    search: "?lang=fr",
    storedLanguage: "ko",
    navigatorLanguages: ["ja-JP"],
    supportedLanguages: ["ko", "en", "ja"],
    defaultLanguage: "en"
  });

  assert.equal(language, "en");
});

test("stored language helpers tolerate browser storage wrappers", () => {
  const values = new Map();
  const storage = {
    getItem(key) {
      return values.get(key) || null;
    },
    setItem(key, value) {
      values.set(key, value);
    }
  };

  writeStoredLanguage(storage, "ja");

  assert.equal(values.get(LANGUAGE_STORAGE_KEY), "ja");
  assert.equal(readStoredLanguage(storage), "ja");
  assert.equal(readStoredLanguage(null), "");
  assert.doesNotThrow(() => writeStoredLanguage(null, "en"));
});

test("setup builder parses languages and flags sensitive public guide content", () => {
  assert.deepEqual(parseLanguageList("ko, en, ja-JP, fr"), ["ko", "en", "ja", "fr"]);

  const warnings = findSensitiveWarnings(
    "The door code is 1234 and the wifi password is hello-world."
  );

  assert.deepEqual(warnings, ["possible_access_code", "possible_password"]);
});

test("setup prompt includes Airbnb-safe boundary and host pasted source text", () => {
  const prompt = buildSetupPrompt({
    propertyName: "Sample Seoul Stay",
    publicArea: "Hongdae, Seoul",
    supportedLanguages: "ko,en,ja",
    defaultLanguage: "en",
    platformUrl: "https://www.airbnb.com/rooms/example",
    platformText: "Self check-in from 15:00. No parties.",
    checkInNotes: "Check-in starts at 15:00.",
    houseRules: "No smoking. Quiet hours after 22:00.",
    guestNotes: "Wi-Fi is printed inside the room."
  });

  assert.match(prompt, /Do not scrape Airbnb/);
  assert.match(prompt, /do not place the external guide link in Airbnb/);
  assert.match(prompt, /Sample Seoul Stay/);
  assert.match(prompt, /Self check-in from 15:00/);
  assert.match(prompt, /approvedStayGuide/);
});

test("setup builder creates an unapproved config draft for host review", () => {
  const draft = buildConfigDraft({
    propertyName: "Sample Seoul Stay",
    propertySlug: "sample-seoul-stay",
    publicArea: "Hongdae, Seoul",
    supportedLanguages: "ko,en,ja",
    defaultLanguage: "en",
    platformUrl: "https://www.airbnb.com/rooms/example",
    platformText: "Self check-in from 15:00.",
    checkInNotes: "Check-in starts at 15:00.",
    houseRules: "No smoking.",
    guestNotes: "Ask the host for luggage storage."
  });

  assert.equal(draft.property.id, "sample-seoul-stay");
  assert.deepEqual(draft.property.supportedLanguages, ["ko", "en", "ja"]);
  assert.equal(draft.sources[0].hostConfirmed, false);
  assert.equal(draft.approvedStayGuide[0].hostApproved, false);
  assert.equal(draft.approvedStayGuide[0].body.en, "Self check-in from 15:00.");
  assert.ok(draft.safety.blockedTopics.length > 0);
});

test("public sample configs are valid and keep source facts host-reviewed", async () => {
  const sampleDir = resolve(projectRoot, "samples");
  const files = (await readdir(sampleDir)).filter((file) => file.endsWith(".json"));

  assert.ok(files.length >= 2, "expected at least two sample configs");

  for (const file of files) {
    const config = JSON.parse(await readFile(resolve(sampleDir, file), "utf8"));
    assert.ok(config.property?.name, `${file} needs property.name`);
    assert.ok(config.property?.supportedLanguages?.includes("en"), `${file} should include English`);
    assert.ok(config.approvedStayGuide?.length >= 2, `${file} needs guide sections`);
    assert.ok(config.sources?.length >= 1, `${file} needs at least one source`);

    for (const source of config.sources) {
      assert.equal(source.importMode, "host_pasted_text", `${file} sources must be host pasted`);
    }

    for (const section of config.approvedStayGuide) {
      assert.equal(section.hostApproved, true, `${file} sample guide sections should be host approved demo content`);
      for (const language of config.property.supportedLanguages) {
        assert.ok(section.title?.[language], `${file} ${section.id} missing title.${language}`);
        assert.ok(section.body?.[language], `${file} ${section.id} missing body.${language}`);
      }
    }
  }
});
