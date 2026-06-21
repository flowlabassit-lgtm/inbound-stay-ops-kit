export function isAuthorizedTelegramWebhook(request, secret) {
  if (!secret) return true;

  const headers = request?.headers || {};
  const suppliedSecret =
    typeof headers.get === "function"
      ? headers.get("x-telegram-bot-api-secret-token")
      : headers["x-telegram-bot-api-secret-token"];

  return suppliedSecret === secret;
}

export function parseJsonBody(body) {
  try {
    return {
      ok: true,
      value: JSON.parse(body || "{}")
    };
  } catch {
    return {
      ok: false,
      error: "invalid_json"
    };
  }
}
