import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildApprovedKnowledgeBase,
  buildHostReviewAck,
  resolveGuestReply
} from "../../lib/guest-ops.js";
import { fetchWithTimeout } from "../../lib/http.js";
import {
  createHostTicket,
  formatHostNotification,
  parseHostReplyCommand
} from "./tickets.js";
import {
  isAuthorizedTelegramWebhook,
  parseJsonBody
} from "./security.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

await loadDotEnv(resolve(__dirname, ".env"));

const PORT = Number(process.env.PORT || 8787);
const WEBHOOK_PATH = process.env.PUBLIC_WEBHOOK_PATH || "/telegram/webhook";
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || "";
const TELEGRAM_ADMIN_SECRET = process.env.TELEGRAM_ADMIN_SECRET || "";
const TELEGRAM_WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET || "";
const PROPERTY_CONFIG_PATH = resolve(
  __dirname,
  process.env.PROPERTY_CONFIG_PATH || "../../config.example.json"
);
const TICKET_STORE_PATH = resolve(__dirname, process.env.TICKET_STORE_PATH || "./ticket-store.json");
const HOST_STORE_PATH = resolve(__dirname, process.env.HOST_STORE_PATH || "./host-store.json");

async function loadDotEnv(path) {
  try {
    const text = await readFile(path, "utf8");
    for (const line of text.split(/\r?\n/)) {
      if (!line || line.trim().startsWith("#")) continue;
      const [key, ...parts] = line.split("=");
      if (!key || process.env[key]) continue;
      process.env[key] = parts.join("=").trim();
    }
  } catch {
    // .env is optional. Production hosts often set environment variables outside files.
  }
}

async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return fallback;
  }
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadConfig() {
  return readJson(PROPERTY_CONFIG_PATH, null);
}

async function sendTelegramMessage(chatId, text) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.log(`[dry-run] sendMessage to ${chatId}: ${text}`);
    return;
  }

  const response = await fetchWithTimeout(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true
    }),
    timeoutMs: 8_000
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Telegram sendMessage failed: ${response.status} ${body}`);
  }
}

async function callHermesAgent({ message, language, config }) {
  if (!process.env.HERMES_AGENT_URL) return null;

  const response = await fetchWithTimeout(process.env.HERMES_AGENT_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(process.env.HERMES_AGENT_KEY
        ? { authorization: `Bearer ${process.env.HERMES_AGENT_KEY}` }
        : {})
    },
    body: JSON.stringify({
      propertyId: config.property?.id,
      language,
      message,
      approvedKnowledge: buildApprovedKnowledgeBase(config),
      sources: (config.sources || []).map(({ type, url, hostConfirmed, lastReviewedAt }) => ({
        type,
        url,
        hostConfirmed,
        lastReviewedAt
      })),
      safety: config.safety
    }),
    timeoutMs: 10_000
  });

  if (!response.ok) return null;
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function registerHost(chatId, text) {
  const suppliedSecret = text.replace(/^\/admin\s*/i, "").trim();
  if (!TELEGRAM_ADMIN_SECRET || suppliedSecret !== TELEGRAM_ADMIN_SECRET) {
    await sendTelegramMessage(chatId, "Admin registration failed.");
    return;
  }

  await writeJson(HOST_STORE_PATH, {
    hostChatId: chatId,
    registeredAt: new Date().toISOString()
  });
  await sendTelegramMessage(chatId, "Host admin registered. You can now receive guest handoff tickets.");
}

async function answerTicketAsHost(chatId, text) {
  const hostStore = await readJson(HOST_STORE_PATH, {});
  if (hostStore.hostChatId !== chatId) {
    await sendTelegramMessage(chatId, "Only the registered host can reply to guest tickets.");
    return;
  }

  const command = parseHostReplyCommand(text);
  if (!command) {
    await sendTelegramMessage(chatId, "Use /reply TICKET_ID your message here");
    return;
  }

  const store = await readJson(TICKET_STORE_PATH, { tickets: [] });
  const ticket = store.tickets.find((item) => item.id === command.ticketId);
  if (!ticket) {
    await sendTelegramMessage(chatId, `Ticket not found: ${command.ticketId}`);
    return;
  }

  ticket.status = "answered";
  ticket.hostReply = command.message;
  ticket.answeredAt = new Date().toISOString();
  await writeJson(TICKET_STORE_PATH, store);

  await sendTelegramMessage(ticket.guestChatId, `Host reply:\n${command.message}`);
  await sendTelegramMessage(chatId, `Sent to guest for ticket ${ticket.id}.`);
}

async function handoffToHost({ chatId, language, text, config, reply }) {
  const hostStore = await readJson(HOST_STORE_PATH, {});
  const ticket = createHostTicket({
    guestChatId: chatId,
    hostChatId: hostStore.hostChatId || null,
    guestLanguage: language,
    topicId: reply.topicId || "host_review",
    question: text
  });

  const store = await readJson(TICKET_STORE_PATH, { tickets: [] });
  store.tickets.push(ticket);
  await writeJson(TICKET_STORE_PATH, store);

  await sendTelegramMessage(chatId, reply.message || buildHostReviewAck(config, language));

  if (hostStore.hostChatId) {
    await sendTelegramMessage(
      hostStore.hostChatId,
      formatHostNotification(ticket, { propertyName: config.property?.name })
    );
  } else {
    await sendTelegramMessage(
      chatId,
      "No host admin is registered yet. Ask the host to send /admin ADMIN_SECRET to this bot."
    );
  }
}

async function handleGuestMessage(update) {
  const message = update.message;
  if (!message?.chat?.id || !message.text) return;

  const chatId = message.chat.id;
  const text = message.text.trim();
  const config = await loadConfig();
  if (!config) {
    await sendTelegramMessage(chatId, "Property config could not be loaded.");
    return;
  }

  if (text.startsWith("/admin")) {
    await registerHost(chatId, text);
    return;
  }

  if (text.startsWith("/reply")) {
    await answerTicketAsHost(chatId, text);
    return;
  }

  if (text.startsWith("/start")) {
    await sendTelegramMessage(
      chatId,
      `Welcome to ${config.property?.name || "this stay"}. Ask about check-in, Wi-Fi, luggage, house rules, or transport.`
    );
    return;
  }

  const language = message.from?.language_code?.slice(0, 2) || config.property?.defaultLanguage || "en";
  const reply = resolveGuestReply(text, config, language);

  if (reply.action === "blocked") {
    await sendTelegramMessage(chatId, reply.message);
    return;
  }

  if (reply.action === "host_review") {
    await handoffToHost({ chatId, language, text, config, reply });
    return;
  }

  if (reply.action === "unknown") {
    const hermesReply = await callHermesAgent({ message: text, language, config });
    if (hermesReply?.needsHostReview) {
      await handoffToHost({
        chatId,
        language,
        text,
        config,
        reply: {
          action: "host_review",
          topicId: hermesReply.matchedTopic || "hermes_review",
          message: hermesReply.reply || buildHostReviewAck(config, language)
        }
      });
      return;
    }
    if (hermesReply?.reply) {
      await sendTelegramMessage(chatId, hermesReply.reply);
      return;
    }
  }

  await sendTelegramMessage(chatId, reply.message);
}

function readRequestBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) request.destroy();
    });
    request.on("end", () => resolveBody(body));
    request.on("error", rejectBody);
  });
}

const server = createServer(async (request, response) => {
  try {
    if (request.method === "GET" && request.url === "/health") {
      response.writeHead(200, { "content-type": "application/json" });
      response.end(JSON.stringify({ ok: true }));
      return;
    }

    if (request.method !== "POST" || request.url !== WEBHOOK_PATH) {
      response.writeHead(404, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "not_found" }));
      return;
    }

    if (!isAuthorizedTelegramWebhook(request, TELEGRAM_WEBHOOK_SECRET)) {
      response.writeHead(401, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: "unauthorized" }));
      return;
    }

    const body = await readRequestBody(request);
    const parsedBody = parseJsonBody(body);
    if (!parsedBody.ok) {
      response.writeHead(400, { "content-type": "application/json" });
      response.end(JSON.stringify({ error: parsedBody.error }));
      return;
    }

    await handleGuestMessage(parsedBody.value);

    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: true }));
  } catch (error) {
    console.error(error);
    response.writeHead(500, { "content-type": "application/json" });
    response.end(JSON.stringify({ ok: false }));
  }
});

server.listen(PORT, () => {
  console.log(`Telegram adapter listening on http://localhost:${PORT}${WEBHOOK_PATH}`);
});
