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
  detectLanguageFromText,
  readStoredLanguage,
  resolveGuestLanguage,
  resolveMessageLanguage,
  normalizeLanguageTag,
  writeStoredLanguage
} from "../lib/language.js";
import {
  buildWifiQrPayload,
  createQrSvgFromText,
  getPublicWifiQrConfig
} from "../lib/wifi-qr.js";
import {
  prepareHostReplyForGuest
} from "../adapters/telegram/translation.js";
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
      hostApproved: true,
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

test("approved knowledge base excludes unapproved stay guide draft sections", () => {
  const config = {
    ...sampleConfig,
    approvedStayGuide: [
      {
        id: "draft-access",
        hostApproved: false,
        title: { en: "Draft Access" },
        body: {
          en: "UNAPPROVED: The door code is 1234."
        }
      },
      {
        id: "approved-summary",
        hostApproved: true,
        title: { en: "Approved Summary" },
        body: {
          en: "APPROVED: Check-in starts at 15:00."
        }
      }
    ]
  };

  const knowledge = buildApprovedKnowledgeBase(config);

  assert.match(knowledge.text.en, /APPROVED/);
  assert.doesNotMatch(knowledge.text.en, /UNAPPROVED/);
  assert.doesNotMatch(knowledge.text.en, /1234/);
});

test("setup draft does not feed unapproved host text into public or agent knowledge", () => {
  const draft = buildConfigDraft({
    propertyName: "Sample Seoul Stay",
    supportedLanguages: "en",
    platformText: "UNAPPROVED: The door code is 1234.",
    checkInNotes: "Exact access details are shared on arrival day.",
    houseRules: "No smoking.",
    guestNotes: "Wi-Fi password is sample-password."
  });

  const knowledge = buildApprovedKnowledgeBase(draft);

  assert.equal(draft.approvedStayGuide.every((section) => section.hostApproved === false), true);
  assert.doesNotMatch(knowledge.text.en, /UNAPPROVED/);
  assert.doesNotMatch(knowledge.text.en, /1234/);
  assert.doesNotMatch(knowledge.text.en, /sample-password/);
});

test("public guide section helper only exposes host-approved sections", async () => {
  const { getPublicStayGuideSections } = await import("../lib/public-guide.js");
  const sections = getPublicStayGuideSections({
    approvedStayGuide: [
      {
        id: "draft",
        hostApproved: false,
        body: { en: "Draft body" }
      },
      {
        id: "approved",
        hostApproved: true,
        body: { en: "Approved body" }
      }
    ]
  });

  assert.deepEqual(sections.map((section) => section.id), ["approved"]);
});

test("public local guide helper only exposes host-approved recommendations", async () => {
  const { getPublicLocalRecommendations } = await import("../lib/public-guide.js");
  const recommendations = getPublicLocalRecommendations({
    localGuide: {
      recommendations: [
        {
          id: "draft-tabelog-place",
          hostApproved: false,
          name: { en: "UNAPPROVED draft place" },
          copiedReviewText: "UNAPPROVED copied review text"
        },
        {
          id: "approved-breakfast",
          hostApproved: true,
          category: "breakfast",
          name: { en: "Host Approved Breakfast" },
          description: { en: "A simple nearby breakfast option." },
          sourceType: "google_places",
          sourceUrl: "https://maps.google.com/?q=breakfast",
          lastReviewedAt: "2026-06-23"
        }
      ]
    }
  });

  assert.deepEqual(recommendations.map((item) => item.id), ["approved-breakfast"]);
  assert.equal(recommendations[0].copiedReviewText, undefined);
  assert.equal(recommendations[0].sourceUrl, "https://maps.google.com/?q=breakfast");
});

test("public local guide boundary stays official-api or host-approved only", async () => {
  const { getLocalGuideBoundary } = await import("../lib/public-guide.js");
  const boundary = getLocalGuideBoundary({
    localGuide: {
      apiProxy: {
        enabled: false,
        endpoint: ""
      }
    }
  });

  assert.match(boundary.en, /official place APIs/);
  assert.match(boundary.en, /host-approved recommendations/);
  assert.match(boundary.en, /does not scrape/);
});

test("guest page exposes local guide slots without client-side provider secrets", async () => {
  const indexHtml = await readFile(resolve(projectRoot, "index.html"), "utf8");
  const appJs = await readFile(resolve(projectRoot, "assets", "app.js"), "utf8");

  assert.match(indexHtml, /id="local-guide"/);
  assert.match(indexHtml, /id="local-guide-list"/);
  assert.match(indexHtml, /id="local-guide-boundary"/);
  assert.match(appJs, /getPublicLocalRecommendations/);
  assert.match(appJs, /getLocalGuideBoundary/);
  assert.doesNotMatch(appJs, /GOOGLE_PLACES_API_KEY|KAKAO_REST_API_KEY|NAVER_SEARCH_CLIENT_SECRET/);
});

test("Wi-Fi QR payload escapes reserved fields and hides password text by default", () => {
  const config = getPublicWifiQrConfig({
    wifiQr: {
      enabled: true,
      hostApproved: true,
      ssid: "Garden;Stay:Guest",
      password: "pa;ss:word\\demo",
      security: "WPA",
      hidden: true
    }
  });

  assert.equal(config.ssid, "Garden;Stay:Guest");
  assert.equal(config.security, "WPA");
  assert.equal(config.hidden, true);
  assert.equal(config.showPasswordText, false);
  assert.equal(
    config.payload,
    "WIFI:T:WPA;S:Garden\\;Stay\\:Guest;P:pa\\;ss\\:word\\\\demo;H:true;;"
  );
  assert.equal(
    buildWifiQrPayload({
      ssid: "Lobby WiFi",
      security: "nopass"
    }),
    "WIFI:T:nopass;S:Lobby WiFi;;"
  );
});

test("Wi-Fi QR generator creates a local SVG without exposing payload as text", () => {
  const payload = buildWifiQrPayload({
    ssid: "HarborLoft_Guest",
    password: "demo-password-change-me",
    security: "WPA"
  });
  const svg = createQrSvgFromText(payload, { label: "Demo Wi-Fi QR" });

  assert.match(svg, /^<svg /);
  assert.match(svg, /viewBox="0 0 [0-9]+ [0-9]+"/);
  assert.match(svg, /<path d="/);
  assert.doesNotMatch(svg, /demo-password-change-me/);
  assert.doesNotMatch(svg, /api\.qrserver|chart\.googleapis|quickchart/);
});

test("guest page exposes Wi-Fi QR slots without external QR services", async () => {
  const indexHtml = await readFile(resolve(projectRoot, "index.html"), "utf8");
  const appJs = await readFile(resolve(projectRoot, "assets", "app.js"), "utf8");

  assert.match(indexHtml, /id="wifi-access"/);
  assert.match(indexHtml, /id="wifi-qr-code"/);
  assert.match(appJs, /getPublicWifiQrConfig/);
  assert.match(appJs, /createQrSvgFromText/);
  assert.doesNotMatch(indexHtml + appJs, /api\.qrserver|chart\.googleapis|quickchart/);
});

test("host setup exposes optional Wi-Fi QR fields", async () => {
  const setupHtml = await readFile(resolve(projectRoot, "host-setup.html"), "utf8");
  const setupJs = await readFile(resolve(projectRoot, "assets", "host-setup.js"), "utf8");

  assert.match(setupHtml, /name="wifiQrEnabled"/);
  assert.match(setupHtml, /name="wifiSsid"/);
  assert.match(setupHtml, /name="wifiPassword"/);
  assert.match(setupHtml, /name="wifiSecurity"/);
  assert.match(setupJs, /type === "checkbox"/);
});

test("external URL policy blocks script-like URLs and limits Telegram links", async () => {
  const { safeExternalUrl, safeTelegramBotUrl } = await import("../lib/url-policy.js");

  assert.equal(safeExternalUrl("https://example.com/stay"), "https://example.com/stay");
  assert.equal(safeExternalUrl("javascript:alert(1)"), "#");
  assert.equal(safeExternalUrl("data:text/html,hello"), "#");
  assert.equal(safeTelegramBotUrl("https://t.me/example_stay_bot"), "https://t.me/example_stay_bot");
  assert.equal(safeTelegramBotUrl("https://evil.example.com/example_stay_bot"), "");
});

test("Telegram webhook security requires the configured secret header", async () => {
  const { isAuthorizedTelegramWebhook, parseJsonBody } = await import("../adapters/telegram/security.js");

  assert.equal(isAuthorizedTelegramWebhook({ headers: {} }, "secret"), false);
  assert.equal(
    isAuthorizedTelegramWebhook({
      headers: {
        "x-telegram-bot-api-secret-token": "secret"
      }
    }, "secret"),
    true
  );
  assert.deepEqual(parseJsonBody("{bad json").ok, false);
  assert.deepEqual(parseJsonBody("{\"ok\":true}"), { ok: true, value: { ok: true } });
});

test("fetch timeout helper passes an abort signal to outbound requests", async () => {
  const { fetchWithTimeout } = await import("../lib/http.js");
  let observedSignal = null;

  const response = await fetchWithTimeout("https://example.com", {
    fetchImpl: async (_url, options) => {
      observedSignal = options.signal;
      return { ok: true };
    },
    timeoutMs: 50
  });

  assert.equal(response.ok, true);
  assert.ok(observedSignal);
  assert.equal(observedSignal.aborted, false);
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

test("message language resolver prefers the guest's written language over Telegram profile language", () => {
  assert.equal(detectLanguageFromText("혹시 체크인을 11시에 할 수 있을까요?", ["ko", "en", "ja"]), "ko");
  assert.equal(detectLanguageFromText("チェックインは11時でも大丈夫ですか？", ["ko", "en", "ja"]), "ja");

  const language = resolveMessageLanguage({
    text: "짐을 먼저 맡길 수 있나요?",
    platformLanguage: "en-US",
    supportedLanguages: ["ko", "en", "ja"],
    defaultLanguage: "en"
  });

  assert.equal(language, "ko");
});

test("host reply is translated to the saved guest language before delivery", async () => {
  const translated = await prepareHostReplyForGuest({
    hostMessage: "네, 11시 30분에 체크인 가능합니다.",
    ticket: {
      id: "TABC123",
      guestLanguage: "ja"
    },
    translateText: async ({ text, targetLanguage }) => {
      assert.equal(text, "네, 11시 30분에 체크인 가능합니다.");
      assert.equal(targetLanguage, "ja");
      return "はい、11時30分にチェックインできます。";
    }
  });

  assert.equal(translated.translated, true);
  assert.equal(translated.guestMessage, "ホストからの返信:\nはい、11時30分にチェックインできます。");
});

test("host reply falls back to original text when translation is unavailable", async () => {
  const translated = await prepareHostReplyForGuest({
    hostMessage: "Yes, 11:30 is possible today.",
    ticket: {
      id: "TABC123",
      guestLanguage: "ja"
    },
    translateText: async () => ""
  });

  assert.equal(translated.translated, false);
  assert.equal(translated.guestMessage, "ホストからの返信:\nYes, 11:30 is possible today.");
  assert.equal(translated.reason, "empty_translation");
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

test("setup builder keeps Wi-Fi QR opt-in local and unapproved by default", () => {
  const draft = buildConfigDraft({
    propertyName: "Sample Seoul Stay",
    supportedLanguages: "en",
    defaultLanguage: "en",
    wifiQrEnabled: "on",
    wifiSsid: "GardenStay_Guest",
    wifiPassword: "do-not-publish",
    wifiSecurity: "WPA",
    wifiHidden: "on"
  });
  const prompt = buildSetupPrompt({
    propertyName: "Sample Seoul Stay",
    supportedLanguages: "en",
    defaultLanguage: "en",
    wifiQrEnabled: "on",
    wifiSsid: "GardenStay_Guest",
    wifiPassword: "do-not-publish",
    wifiSecurity: "WPA",
    wifiHidden: "on"
  });

  assert.equal(draft.wifiQr.enabled, true);
  assert.equal(draft.wifiQr.hostApproved, false);
  assert.equal(draft.wifiQr.ssid, "GardenStay_Guest");
  assert.equal(draft.wifiQr.password, "do-not-publish");
  assert.equal(draft.wifiQr.hidden, true);
  assert.equal(draft.wifiQr.showPasswordText, false);
  assert.match(prompt, /Wi-Fi QR requested: yes/);
  assert.match(prompt, /Wi-Fi SSID: GardenStay_Guest/);
  assert.match(prompt, /Wi-Fi password provided: yes/);
  assert.doesNotMatch(prompt, /do-not-publish/);
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

test("guest page config loader prefers host config before demo fallback", async () => {
  const { CONFIG_CANDIDATE_PATHS, loadConfigFromCandidates } = await import("../lib/config-loader.js");

  assert.deepEqual(CONFIG_CANDIDATE_PATHS, [
    "./config.json",
    "./samples/demo.config.json",
    "./config.example.json"
  ]);

  const calls = [];
  const fakeFetch = async (path) => {
    calls.push(path);

    if (path === "./samples/demo.config.json") {
      return {
        ok: true,
        async json() {
          return { property: { id: "demo-harbor-loft" } };
        }
      };
    }

    return { ok: false, status: 404 };
  };

  const result = await loadConfigFromCandidates(fakeFetch);

  assert.equal(result.path, "./samples/demo.config.json");
  assert.equal(result.fallbackUsed, true);
  assert.deepEqual(calls, ["./config.json", "./samples/demo.config.json"]);
});

test("demo config is a public Pages fallback with four guest languages", async () => {
  const config = JSON.parse(
    await readFile(resolve(projectRoot, "samples", "demo.config.json"), "utf8")
  );
  const languages = ["en", "ko", "ja", "zh"];

  assert.equal(config.property.id, "demo-harbor-loft");
  assert.deepEqual(config.property.supportedLanguages, languages);
  assert.equal(config.demo.publicDemo, true);
  assert.ok(config.approvedStayGuide.length >= 4);
  assert.ok(config.localGuide?.recommendations?.length >= 2);
  assert.equal(
    config.localGuide.recommendations.every((item) => item.hostApproved === true && !item.copiedReviewText),
    true
  );

  for (const section of config.approvedStayGuide) {
    assert.equal(section.hostApproved, true);
    for (const language of languages) {
      assert.ok(section.title[language], `${section.id} title missing ${language}`);
      assert.ok(section.body[language], `${section.id} body missing ${language}`);
    }
  }
});
