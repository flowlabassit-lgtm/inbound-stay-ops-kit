import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  buildHostReviewAck,
  resolveGuestReply
} from "../../lib/guest-ops.js";
import {
  createHostTicket,
  formatHostNotification,
  parseHostReplyCommand
} from "./tickets.js";
import {
  prepareHostReplyForGuest
} from "./translation.js";

const configPath = resolve(import.meta.dirname, "../../config.example.json");
const config = JSON.parse(await readFile(configPath, "utf8"));

const guestChatId = 111111111;
const hostChatId = 222222222;
const guestLanguage = "ja";
const question = "Can I check in at 11am?";

const reply = resolveGuestReply(question, config, guestLanguage);
const ticket = createHostTicket({
  guestChatId,
  hostChatId,
  guestLanguage,
  topicId: reply.topicId || "host_review",
  question
});

const hostCommand = `/reply ${ticket.id} Yes, 11:30 is possible today. Please keep noise low while cleaning finishes.`;
const parsed = parseHostReplyCommand(hostCommand);
const preparedHostReply = await prepareHostReplyForGuest({
  hostMessage: parsed.message,
  ticket,
  translateText: async () =>
    "はい、本日は11:30にチェックインできます。清掃が終わるまで静かにお待ちください。"
});

const lines = [
  "# Telegram Handoff Dry Run",
  "",
  "Guest -> Bot:",
  question,
  "",
  "Bot -> Guest:",
  reply.message || buildHostReviewAck(config, guestLanguage),
  "",
  "Bot -> Host:",
  formatHostNotification(ticket, { propertyName: config.property?.name }),
  "",
  "Host -> Bot:",
  hostCommand,
  "",
  "Bot -> Guest:",
  preparedHostReply.guestMessage,
  "",
  "Translation:",
  preparedHostReply.translated
    ? `translated to ${preparedHostReply.targetLanguage}`
    : `not translated (${preparedHostReply.reason})`,
  ""
];

console.log(lines.join("\n"));
