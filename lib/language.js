export const LANGUAGE_STORAGE_KEY = "inboundStayOps.guestLanguage";

export function normalizeLanguageTag(value) {
  const tag = String(value || "").trim().toLowerCase();
  if (!tag) return "";
  return tag.split(/[-_]/)[0];
}

function firstSupported(candidates, supportedLanguages) {
  const supported = new Set((supportedLanguages || []).map(normalizeLanguageTag).filter(Boolean));
  for (const candidate of candidates || []) {
    const normalized = normalizeLanguageTag(candidate);
    if (normalized && supported.has(normalized)) return normalized;
  }
  return "";
}

export function detectLanguageFromText(text, supportedLanguages = []) {
  const value = String(text || "");
  if (!value.trim()) return "";

  if (/[\uac00-\ud7af]/.test(value)) {
    return firstSupported(["ko"], supportedLanguages);
  }

  if (/[\u3040-\u30ff]/.test(value)) {
    return firstSupported(["ja"], supportedLanguages);
  }

  if (/[\u4e00-\u9fff]/.test(value)) {
    return firstSupported(["zh", "ja", "ko"], supportedLanguages);
  }

  if (/[A-Za-z]/.test(value)) {
    return firstSupported(["en"], supportedLanguages);
  }

  return "";
}

function langFromSearch(search) {
  try {
    return new URLSearchParams(search || "").get("lang") || "";
  } catch {
    return "";
  }
}

export function resolveGuestLanguage({
  search = "",
  storedLanguage = "",
  navigatorLanguages = [],
  supportedLanguages = [],
  defaultLanguage = "en"
} = {}) {
  const fallback =
    firstSupported([defaultLanguage], supportedLanguages) ||
    firstSupported(["en"], supportedLanguages) ||
    normalizeLanguageTag(supportedLanguages[0]) ||
    "en";
  const requestedLanguage = langFromSearch(search);

  if (requestedLanguage) {
    return firstSupported([requestedLanguage], supportedLanguages) || fallback;
  }

  return (
    firstSupported([storedLanguage], supportedLanguages) ||
    firstSupported(navigatorLanguages, supportedLanguages) ||
    fallback
  );
}

export function resolveMessageLanguage({
  text = "",
  platformLanguage = "",
  supportedLanguages = [],
  defaultLanguage = "en"
} = {}) {
  const fallback =
    firstSupported([defaultLanguage], supportedLanguages) ||
    firstSupported(["en"], supportedLanguages) ||
    normalizeLanguageTag(supportedLanguages[0]) ||
    "en";

  return (
    detectLanguageFromText(text, supportedLanguages) ||
    firstSupported([platformLanguage], supportedLanguages) ||
    fallback
  );
}

export function readStoredLanguage(storage) {
  try {
    return storage?.getItem(LANGUAGE_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function writeStoredLanguage(storage, language) {
  try {
    if (language) storage?.setItem(LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Storage can be unavailable in private or embedded browser contexts.
  }
}
