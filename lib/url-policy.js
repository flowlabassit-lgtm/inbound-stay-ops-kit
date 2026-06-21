export function safeExternalUrl(value) {
  try {
    const url = new URL(String(value || "").trim());
    if (url.protocol !== "https:") return "#";
    return url.href;
  } catch {
    return "#";
  }
}

export function safeTelegramBotUrl(value) {
  const safeUrl = safeExternalUrl(value);
  if (safeUrl === "#") return "";

  const url = new URL(safeUrl);
  if (url.hostname.toLowerCase() !== "t.me") return "";
  return url.href;
}
