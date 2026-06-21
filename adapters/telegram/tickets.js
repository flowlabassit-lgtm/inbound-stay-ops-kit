import { randomBytes } from "node:crypto";

function makeTicketId() {
  const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const bytes = randomBytes(6);
  let suffix = "";
  for (const byte of bytes) {
    suffix += alphabet[byte % alphabet.length];
  }
  return `T${suffix}`;
}

export function createHostTicket({
  guestChatId,
  hostChatId,
  guestLanguage = "en",
  topicId = "host_review",
  question
}) {
  return {
    id: makeTicketId(),
    status: "waiting_for_host",
    guestChatId,
    hostChatId,
    guestLanguage,
    topicId,
    question,
    createdAt: new Date().toISOString()
  };
}

export function formatHostNotification(ticket, { propertyName = "Stay" } = {}) {
  return [
    `[${propertyName}] Guest question ${ticket.id}`,
    `Topic: ${ticket.topicId}`,
    `Language: ${ticket.guestLanguage}`,
    "",
    "Guest:",
    ticket.question,
    "",
    `Reply with: /reply ${ticket.id} your message here`
  ].join("\n");
}

export function parseHostReplyCommand(text) {
  const match = String(text || "").match(/^\/reply\s+([A-Za-z0-9_-]+)\s+([\s\S]+)$/);
  if (!match) return null;
  return {
    ticketId: match[1],
    message: match[2].trim()
  };
}

