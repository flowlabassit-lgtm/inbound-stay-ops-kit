const DEFAULT_LANGUAGE = "en";

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9가-힣ぁ-んァ-ン一-龥\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function readLocalized(value, language, fallbackLanguage = DEFAULT_LANGUAGE) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value[fallbackLanguage] || Object.values(value)[0] || "";
}

function appendLocalizedText(target, value, languages) {
  for (const language of languages) {
    const text = readLocalized(value, language);
    if (text) target[language].push(text);
  }
}

export function buildApprovedKnowledgeBase(config) {
  const property = config.property || {};
  const languages = property.supportedLanguages?.length
    ? property.supportedLanguages
    : [property.defaultLanguage || DEFAULT_LANGUAGE];
  const buckets = Object.fromEntries(languages.map((language) => [language, []]));

  for (const source of config.sources || []) {
    if (source.hostConfirmed && source.approvedSummary) {
      appendLocalizedText(buckets, source.approvedSummary, languages);
    }
  }

  for (const section of config.approvedStayGuide || []) {
    appendLocalizedText(buckets, section.body, languages);
  }

  const approvedKnowledge = config.approvedKnowledge || {};
  for (const value of Object.values(approvedKnowledge)) {
    if (Array.isArray(value)) {
      for (const item of value) appendLocalizedText(buckets, item, languages);
    } else if (typeof value === "object" && value !== null) {
      for (const nested of Object.values(value)) {
        if (Array.isArray(nested)) {
          for (const item of nested) appendLocalizedText(buckets, item, languages);
        } else {
          appendLocalizedText(buckets, nested, languages);
        }
      }
    } else {
      appendLocalizedText(buckets, value, languages);
    }
  }

  for (const item of config.faq || []) {
    if (!item.hostApproved) continue;
    appendLocalizedText(buckets, item.answer, languages);
  }

  return {
    propertyId: property.id || "property",
    propertyName: property.name || "Unnamed Stay",
    languages,
    sources: (config.sources || []).map((source) => ({
      type: source.type,
      url: source.url,
      importMode: source.importMode,
      hostConfirmed: Boolean(source.hostConfirmed),
      lastReviewedAt: source.lastReviewedAt || null
    })),
    text: Object.fromEntries(
      Object.entries(buckets).map(([language, parts]) => [language, parts.join("\n\n")])
    )
  };
}

export function findFaqAnswer(message, config, language = DEFAULT_LANGUAGE) {
  const normalizedMessage = normalizeText(message);
  for (const item of config.faq || []) {
    if (!item.hostApproved) continue;
    const keywords = item.keywords || [];
    const matched = keywords.some((keyword) => normalizedMessage.includes(normalizeText(keyword)));
    if (!matched) continue;
    return {
      id: item.id,
      answer: readLocalized(item.answer, language, config.property?.defaultLanguage || DEFAULT_LANGUAGE)
    };
  }
  return null;
}

function matchTopic(message, topics = []) {
  const normalizedMessage = normalizeText(message);
  for (const topic of topics) {
    const matched = (topic.keywords || []).some((keyword) =>
      normalizedMessage.includes(normalizeText(keyword))
    );
    if (matched) return topic;
  }
  return null;
}

export function classifyGuestQuestion(message, config, language = DEFAULT_LANGUAGE) {
  const safety = config.safety || {};
  const blocked = matchTopic(message, safety.blockedTopics);
  if (blocked) {
    return {
      action: "blocked",
      topicId: blocked.id,
      message: readLocalized(blocked.message, language, config.property?.defaultLanguage || DEFAULT_LANGUAGE)
    };
  }

  const hostReview = matchTopic(message, safety.hostReviewTopics);
  if (hostReview) {
    return {
      action: "host_review",
      topicId: hostReview.id,
      message: readLocalized(hostReview.message, language, config.property?.defaultLanguage || DEFAULT_LANGUAGE)
    };
  }

  return {
    action: "auto_reply",
    topicId: null,
    message: ""
  };
}

export function buildFallbackReply(config, language = DEFAULT_LANGUAGE) {
  return readLocalized(
    config.fallbackReply,
    language,
    config.property?.defaultLanguage || DEFAULT_LANGUAGE
  ) || "I do not have a confirmed answer for that yet. The host will need to confirm.";
}

export function buildHostReviewAck(config, language = DEFAULT_LANGUAGE) {
  return readLocalized(
    config.hostReviewAck,
    language,
    config.property?.defaultLanguage || DEFAULT_LANGUAGE
  ) || "This needs host confirmation. I will ask the host and get back to you here.";
}

export function resolveGuestReply(message, config, language = DEFAULT_LANGUAGE) {
  const classification = classifyGuestQuestion(message, config, language);
  if (classification.action === "blocked") {
    return classification;
  }

  if (classification.action === "host_review") {
    return {
      ...classification,
      message: classification.message || buildHostReviewAck(config, language)
    };
  }

  const faq = findFaqAnswer(message, config, language);
  if (faq) {
    return {
      action: "auto_reply",
      topicId: faq.id,
      message: faq.answer
    };
  }

  return {
    action: "unknown",
    topicId: null,
    message: buildFallbackReply(config, language)
  };
}
