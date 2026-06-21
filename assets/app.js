import {
  buildApprovedKnowledgeBase,
  resolveGuestReply
} from "../lib/guest-ops.js";
import {
  readStoredLanguage,
  resolveGuestLanguage,
  writeStoredLanguage
} from "../lib/language.js";

const state = {
  config: null,
  language: "en"
};

function localized(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || Object.values(value)[0] || "";
}

function formatLanguageName(language) {
  return new Intl.DisplayNames([language], { type: "language" }).of(language) || language;
}

function toTextBlocks(value, language) {
  const localizedValue = localized(value, language);
  if (Array.isArray(localizedValue)) return localizedValue.filter(Boolean);
  if (Array.isArray(value?.[language])) return value[language].filter(Boolean);
  if (typeof localizedValue !== "string") return [];
  return localizedValue
    .split(/\n{2,}/)
    .map((text) => text.trim())
    .filter(Boolean);
}

async function loadConfig() {
  const response = await fetch("./config.example.json", { cache: "no-store" });
  if (!response.ok) throw new Error(`Unable to load config.example.json: ${response.status}`);
  return response.json();
}

function renderLanguageSelect(config) {
  const select = document.querySelector("#language-select");
  select.innerHTML = "";
  for (const language of config.property.supportedLanguages || ["en"]) {
    const option = document.createElement("option");
    option.value = language;
    option.textContent = formatLanguageName(language);
    select.append(option);
  }
  select.value = state.language;
  select.addEventListener("change", () => {
    state.language = select.value;
    writeStoredLanguage(window.localStorage, state.language);
    render();
  });
}

function agentHint(language) {
  return {
    en: "Ask the agent about anything not covered in the translated stay guide. Risky or uncertain questions will be routed to the host.",
    ko: "번역된 숙소 안내에 없는 내용만 에이전트에게 질문하세요. 위험하거나 확실하지 않은 질문은 호스트 확인으로 넘어갑니다.",
    ja: "翻訳済みの宿泊ガイドにない内容だけをエージェントに質問してください。危険または不確かな質問はホスト確認に回されます。"
  }[language] || "Ask the agent about anything not covered in the translated stay guide.";
}

function renderAgentHint() {
  const box = document.querySelector("#answer-box");
  box.dataset.action = "";
  box.textContent = agentHint(state.language);
}

function buildGuideSections(config) {
  if (Array.isArray(config.approvedStayGuide) && config.approvedStayGuide.length > 0) {
    return config.approvedStayGuide;
  }

  const sourceSections = (config.sources || [])
    .filter((source) => source.hostConfirmed && source.approvedSummary)
    .map((source) => ({
      id: `${source.type}-summary`,
      sourceType: source.type,
      title: {
        en: "Listing summary",
        ko: "숙소 설명 요약",
        ja: "宿泊施設の説明"
      },
      body: source.approvedSummary
    }));

  const knowledge = config.approvedKnowledge || {};
  const fallbackSections = [
    ["check-in", "Check-in", "체크인", "チェックイン", knowledge.checkIn],
    ["check-out", "Check-out", "체크아웃", "チェックアウト", knowledge.checkOut],
    ["transport", "Transport", "교통", "交通", knowledge.transport],
    ["house-rules", "House rules", "하우스룰", "ハウスルール", knowledge.houseRules]
  ]
    .filter(([, , , , body]) => body)
    .map(([id, en, ko, ja, body]) => ({
      id,
      title: { en, ko, ja },
      body
    }));

  return [...sourceSections, ...fallbackSections];
}

function renderStayGuide(config) {
  const guide = document.querySelector("#stay-guide");
  guide.innerHTML = "";

  for (const section of buildGuideSections(config)) {
    const blocks = toTextBlocks(section.body, state.language);
    if (blocks.length === 0) continue;

    const item = document.createElement("article");
    item.className = "guide-section";

    const header = document.createElement("div");
    header.className = "guide-section-header";
    const title = document.createElement("strong");
    title.textContent = localized(section.title, state.language) || section.id;
    header.append(title);

    if (section.sourceType) {
      const source = document.createElement("span");
      source.className = "source-pill";
      source.textContent = section.sourceType;
      header.append(source);
    }

    item.append(header);

    for (const block of blocks) {
      const paragraph = document.createElement("p");
      paragraph.textContent = block;
      item.append(paragraph);
    }

    guide.append(item);
  }
}

function renderSources(config) {
  const sourceList = document.querySelector("#source-list");
  sourceList.innerHTML = "";
  for (const source of config.sources || []) {
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = `${source.type}: ${source.url} (${source.hostConfirmed ? "host approved" : "not approved yet"})`;
    sourceList.append(link);
  }
}

async function askAgent(question) {
  const endpoint = state.config.agent?.enabled ? state.config.agent?.endpoint : "";
  if (!endpoint) return null;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      propertyId: state.config.property?.id,
      language: state.language,
      message: question,
      approvedKnowledge: buildApprovedKnowledgeBase(state.config),
      safety: state.config.safety || {}
    })
  });

  if (!response.ok) {
    throw new Error(`Agent request failed: ${response.status}`);
  }

  return response.json();
}

async function answerQuestion(question) {
  const reply = resolveGuestReply(question, state.config, state.language);
  const box = document.querySelector("#answer-box");

  if (reply.action === "blocked" || reply.action === "host_review" || reply.action === "auto_reply") {
    box.dataset.action = reply.action;
    box.textContent = reply.message;
    return;
  }

  try {
    box.dataset.action = "agent";
    box.textContent = "Asking the agent...";
    const agentReply = await askAgent(question);

    if (agentReply?.reply) {
      box.dataset.action = agentReply.needsHostReview ? "host_review" : "agent";
      box.textContent = agentReply.reply;
      return;
    }
  } catch (error) {
    console.error(error);
  }

  box.dataset.action = reply.action;
  box.textContent = reply.message;
}

function render() {
  const config = state.config;
  const knowledge = buildApprovedKnowledgeBase(config);
  document.querySelector("#property-name").textContent = knowledge.propertyName;
  document.querySelector("#property-address").textContent = localized(
    config.property.publicAddress,
    state.language
  );
  document.querySelector("#telegram-link").href = config.telegram?.botUrl || "#";

  renderStayGuide(config);
  renderSources(config);
  renderAgentHint();
}

async function boot() {
  try {
    state.config = await loadConfig();
    state.language = resolveGuestLanguage({
      search: window.location.search,
      storedLanguage: readStoredLanguage(window.localStorage),
      navigatorLanguages: navigator.languages || [navigator.language],
      supportedLanguages: state.config.property.supportedLanguages || [],
      defaultLanguage: state.config.property.defaultLanguage || "en"
    });

    renderLanguageSelect(state.config);
    render();

    document.querySelector("#ask-form").addEventListener("submit", (event) => {
      event.preventDefault();
      const question = new FormData(event.currentTarget).get("question");
      answerQuestion(question);
    });
  } catch (error) {
    document.querySelector("#property-name").textContent = "Config load failed";
    document.querySelector("#answer-box").textContent =
      `Run this kit from a local web server, then check config.example.json. ${error.message || error}`;
    globalThis.__stayOpsLastError = {
      message: error.message || String(error),
      stack: error.stack || ""
    };
    console.error(error);
  }
}

boot();
