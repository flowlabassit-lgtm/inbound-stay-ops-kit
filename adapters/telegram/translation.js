import { fetchWithTimeout } from "../../lib/http.js";
import { normalizeLanguageTag } from "../../lib/language.js";

const HOST_REPLY_LABELS = {
  en: "Host reply",
  ko: "호스트 답변",
  ja: "ホストからの返信",
  zh: "房东回复"
};

function readEnvNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function hostReplyLabel(language) {
  return HOST_REPLY_LABELS[normalizeLanguageTag(language)] || HOST_REPLY_LABELS.en;
}

function readTranslatedText(data) {
  if (!data || typeof data !== "object") return "";

  if (typeof data.translation === "string") return data.translation.trim();
  if (typeof data.translatedText === "string") return data.translatedText.trim();
  if (typeof data.text === "string") return data.text.trim();

  if (Array.isArray(data.translations)) {
    const first = data.translations[0];
    if (typeof first === "string") return first.trim();
    if (first && typeof first.text === "string") return first.text.trim();
  }

  return "";
}

export async function translateHostReplyWithHttp({
  text,
  targetLanguage,
  ticket,
  config,
  env = process.env,
  fetchImpl = fetchWithTimeout
}) {
  const url = String(env.HOST_REPLY_TRANSLATION_URL || "").trim();
  if (!url) return "";

  const response = await fetchImpl(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(env.HOST_REPLY_TRANSLATION_KEY
        ? { authorization: `Bearer ${env.HOST_REPLY_TRANSLATION_KEY}` }
        : {})
    },
    body: JSON.stringify({
      text,
      targetLocale: targetLanguage,
      source: "telegram_host_reply",
      ticketId: ticket?.id,
      propertyId: config?.property?.id,
      propertyName: config?.property?.name
    }),
    timeoutMs: readEnvNumber(env.HOST_REPLY_TRANSLATION_TIMEOUT_MS, 8_000)
  });

  if (!response.ok) return "";

  try {
    return readTranslatedText(await response.json());
  } catch {
    return "";
  }
}

export async function prepareHostReplyForGuest({
  hostMessage,
  ticket,
  translateText
}) {
  const originalText = String(hostMessage || "").trim();
  const targetLanguage = normalizeLanguageTag(ticket?.guestLanguage || "en") || "en";
  let deliveredText = originalText;
  let translated = false;
  let reason = "not_configured";

  if (typeof translateText === "function" && originalText) {
    try {
      const nextText = String(
        await translateText({
          text: originalText,
          targetLanguage,
          ticket
        }) || ""
      ).trim();

      if (nextText) {
        deliveredText = nextText;
        translated = true;
        reason = "translated";
      } else {
        reason = "empty_translation";
      }
    } catch {
      reason = "translation_failed";
    }
  }

  return {
    guestMessage: `${hostReplyLabel(targetLanguage)}:\n${deliveredText}`,
    deliveredText,
    originalText,
    targetLanguage,
    translated,
    reason
  };
}
