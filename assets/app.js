import { loadConfigFromCandidates } from "../lib/config-loader.js";
import {
  getLocalGuideBoundary,
  getPublicLocalRecommendations,
  getPublicStayGuideSections
} from "../lib/public-guide.js";
import { safeExternalUrl, safeTelegramBotUrl } from "../lib/url-policy.js";
import {
  buildApprovedKnowledgeBase,
  resolveGuestReply
} from "../lib/guest-ops.js";
import {
  readStoredLanguage,
  resolveGuestLanguage,
  writeStoredLanguage
} from "../lib/language.js";
import {
  createQrSvgFromText,
  getPublicWifiQrConfig
} from "../lib/wifi-qr.js";

const fallbackCopy = {
  pageEyebrow: {
    en: "Guest help",
    ko: "게스트 도움말",
    ja: "ゲストヘルプ",
    zh: "住客帮助"
  },
  languageLabel: {
    en: "Language",
    ko: "언어",
    ja: "言語",
    zh: "语言"
  },
  demoBadge: {
    en: "Public demo",
    ko: "공개 데모",
    ja: "公開デモ",
    zh: "公开演示"
  },
  statusTitle: {
    en: "Translated from host-approved listing content",
    ko: "호스트가 승인한 숙소 내용을 게스트 언어로 번역",
    ja: "ホスト承認済みの宿泊情報をゲストの言語で表示",
    zh: "将房东确认的住宿信息翻译成住客语言"
  },
  statusBody: {
    en: "Listing text is collected only after the host pastes and approves it. Extra questions go to the agent and risky topics are routed to the host.",
    ko: "숙소 플랫폼 내용은 호스트가 붙여넣고 승인한 뒤에만 표시됩니다. 추가 질문은 에이전트가 처리하고 위험한 주제는 호스트 확인으로 넘깁니다.",
    ja: "掲載内容はホストが貼り付けて承認した情報だけを表示します。追加質問はエージェントが対応し、判断が必要な内容はホストへ回します。",
    zh: "页面只展示房东粘贴并确认过的房源信息。额外问题由智能助手处理，需要判断的内容会转给房东。"
  },
  telegramButton: {
    en: "Ask in Telegram",
    ko: "Telegram으로 문의",
    ja: "Telegramで質問",
    zh: "在 Telegram 提问"
  },
  guideTitle: {
    en: "Translated Stay Guide",
    ko: "번역된 숙소 가이드",
    ja: "翻訳済みステイガイド",
    zh: "已翻译住宿指南"
  },
  guideIntro: {
    en: "Core listing details appear here in the guest's language. The agent handles only what is not already covered.",
    ko: "핵심 숙소 정보는 게스트의 언어로 먼저 표시됩니다. 이미 안내된 내용 외의 질문만 에이전트가 처리합니다.",
    ja: "基本的な宿泊情報はゲストの言語で先に表示されます。未記載の質問だけをエージェントが対応します。",
    zh: "核心房源信息会先用住客语言展示。智能助手只处理指南之外的问题。"
  },
  agentTitle: {
    en: "Ask the Agent",
    ko: "에이전트에게 질문",
    ja: "エージェントに質問",
    zh: "询问智能助手"
  },
  agentIntro: {
    en: "Use this for questions not covered above. Host-review topics are not answered automatically.",
    ko: "위 가이드에 없는 질문만 입력하세요. 호스트 확인이 필요한 내용은 자동 답변하지 않습니다.",
    ja: "上のガイドにない質問だけ入力してください。ホスト確認が必要な内容は自動回答しません。",
    zh: "请只输入上方指南没有覆盖的问题。需要房东确认的话题不会自动回答。"
  },
  askPlaceholder: {
    en: "Ask an extra question...",
    ko: "추가 질문을 입력하세요...",
    ja: "追加の質問を入力...",
    zh: "输入其他问题..."
  },
  askButton: {
    en: "Ask",
    ko: "질문",
    ja: "質問",
    zh: "提问"
  },
  agentHint: {
    en: "Ask the agent about anything not covered in the translated stay guide. Risky or uncertain questions will be routed to the host.",
    ko: "번역된 숙소 가이드에 없는 내용만 에이전트에게 질문하세요. 위험하거나 확실하지 않은 질문은 호스트 확인으로 전달됩니다.",
    ja: "翻訳済みガイドにない内容だけエージェントに質問してください。危険または不確かな質問はホスト確認へ回されます。",
    zh: "请向智能助手询问住宿指南未覆盖的内容。风险或不确定的问题会转给房东确认。"
  },
  askingAgent: {
    en: "Asking the agent...",
    ko: "에이전트에게 확인 중...",
    ja: "エージェントに確認中...",
    zh: "正在询问智能助手..."
  },
  sourceTitle: {
    en: "Source Links",
    ko: "출처 링크",
    ja: "情報元リンク",
    zh: "来源链接"
  },
  sourceIntro: {
    en: "These links help guests verify the official listing. This page does not scrape booking platforms.",
    ko: "게스트가 공식 숙소 정보를 확인할 수 있는 링크입니다. 이 페이지는 예약 플랫폼을 자동 수집하지 않습니다.",
    ja: "ゲストが公式掲載情報を確認できるリンクです。このページは予約プラットフォームをスクレイピングしません。",
    zh: "这些链接用于帮助住客核对官方房源信息。本页面不会抓取预订平台内容。"
  },
  sourceApproved: {
    en: "host approved",
    ko: "호스트 승인",
    ja: "ホスト承認済み",
    zh: "房东已确认"
  },
  sourcePending: {
    en: "pending host review",
    ko: "호스트 확인 대기",
    ja: "ホスト確認待ち",
    zh: "等待房东确认"
  },
  localGuideTitle: {
    en: "Nearby Tips"
  },
  localGuideIntro: {
    en: "Host-approved local recommendations and official source links. The static kit never stores provider API keys."
  },
  localGuideEmpty: {
    en: "No host-approved nearby tips yet."
  },
  localGuideSource: {
    en: "Source"
  },
  wifiTitle: {
    en: "Wi-Fi QR"
  },
  wifiIntro: {
    en: "Scan this code to connect. The password is encoded in the QR and is hidden from the public text by default."
  },
  wifiNetworkLabel: {
    en: "Network"
  },
  wifiPasswordHidden: {
    en: "Password text hidden. Scan the QR code inside the stay."
  },
  wifiPasswordVisible: {
    en: "Password text is host-approved for display."
  },
  wifiUnavailable: {
    en: "Wi-Fi QR could not be generated. Ask the host to shorten the network name or password."
  }
};

const fallbackGuideLabels = {
  checkIn: {
    en: "Check-in",
    ko: "체크인",
    ja: "チェックイン",
    zh: "入住"
  },
  checkOut: {
    en: "Check-out",
    ko: "체크아웃",
    ja: "チェックアウト",
    zh: "退房"
  },
  transport: {
    en: "Transport",
    ko: "교통",
    ja: "交通",
    zh: "交通"
  },
  houseRules: {
    en: "House rules",
    ko: "하우스룰",
    ja: "ハウスルール",
    zh: "房屋守则"
  },
  listingSummary: {
    en: "Listing summary",
    ko: "숙소 설명 요약",
    ja: "掲載情報の要約",
    zh: "房源摘要"
  }
};

const state = {
  config: null,
  configSource: "",
  language: "en"
};

function localized(value, language) {
  if (!value) return "";
  if (typeof value === "string") return value;
  return value[language] || value.en || Object.values(value)[0] || "";
}

function copy(key) {
  return localized(state.config?.uiCopy?.[key] || fallbackCopy[key], state.language);
}

function formatLanguageName(language) {
  try {
    return new Intl.DisplayNames([language], { type: "language" }).of(language) || language;
  } catch {
    return language;
  }
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
  const result = await loadConfigFromCandidates(fetch);
  state.configSource = result.path;
  return result.config;
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

function buildGuideSections(config) {
  const approvedSections = getPublicStayGuideSections(config);
  if (approvedSections.length > 0) {
    return approvedSections;
  }

  const sourceSections = (config.sources || [])
    .filter((source) => source.hostConfirmed && source.approvedSummary)
    .map((source) => ({
      id: `${source.type}-summary`,
      sourceType: source.type,
      title: fallbackGuideLabels.listingSummary,
      body: source.approvedSummary
    }));

  const knowledge = config.approvedKnowledge || {};
  const fallbackSections = [
    ["check-in", fallbackGuideLabels.checkIn, knowledge.checkIn],
    ["check-out", fallbackGuideLabels.checkOut, knowledge.checkOut],
    ["transport", fallbackGuideLabels.transport, knowledge.transport],
    ["house-rules", fallbackGuideLabels.houseRules, knowledge.houseRules]
  ]
    .filter(([, , body]) => body)
    .map(([id, title, body]) => ({ id, title, body }));

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
    const label = localized(source.label, state.language) || source.type.replace(/_/g, " ");
    const status = source.hostConfirmed ? copy("sourceApproved") : copy("sourcePending");

    const href = safeExternalUrl(source.url);
    link.href = href;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.className = "source-row";

    const title = document.createElement("strong");
    title.textContent = label;
    const meta = document.createElement("span");
    meta.textContent = `${status} · ${href === "#" ? "unsafe link blocked" : source.url}`;

    link.append(title, meta);
    sourceList.append(link);
  }
}

function renderLocalGuide(config) {
  const panel = document.querySelector("#local-guide");
  const list = document.querySelector("#local-guide-list");
  const boundary = document.querySelector("#local-guide-boundary");
  const recommendations = getPublicLocalRecommendations(config);

  document.querySelector("#local-guide-title").textContent = copy("localGuideTitle");
  document.querySelector("#local-guide-intro").textContent = copy("localGuideIntro");
  list.innerHTML = "";

  if (recommendations.length === 0) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = copy("localGuideEmpty");
    list.append(empty);
  }

  for (const recommendation of recommendations) {
    const item = document.createElement("article");
    item.className = "local-guide-item";

    const header = document.createElement("div");
    header.className = "local-guide-header";

    const title = document.createElement("strong");
    title.textContent = localized(recommendation.name, state.language) || recommendation.id;
    header.append(title);

    if (recommendation.category) {
      const category = document.createElement("span");
      category.className = "source-pill";
      category.textContent = recommendation.category.replace(/_/g, " ");
      header.append(category);
    }

    item.append(header);

    const description = localized(recommendation.description, state.language);
    if (description) {
      const paragraph = document.createElement("p");
      paragraph.textContent = description;
      item.append(paragraph);
    }

    const meta = document.createElement("div");
    meta.className = "local-guide-meta";

    const distance = localized(recommendation.distanceText, state.language);
    if (distance) {
      const distanceNode = document.createElement("span");
      distanceNode.textContent = distance;
      meta.append(distanceNode);
    }

    if (recommendation.sourceType) {
      const sourceType = document.createElement("span");
      sourceType.textContent = recommendation.sourceType.replace(/_/g, " ");
      meta.append(sourceType);
    }

    if (recommendation.sourceUrl) {
      const href = safeExternalUrl(recommendation.sourceUrl);
      if (href !== "#") {
        const source = document.createElement("a");
        source.href = href;
        source.target = "_blank";
        source.rel = "noreferrer";
        source.textContent = copy("localGuideSource");
        meta.append(source);
      }
    }

    item.append(meta);
    list.append(item);
  }

  boundary.textContent = localized(getLocalGuideBoundary(config), state.language);
  panel.hidden = false;
}

function renderWifiAccess(config) {
  const panel = document.querySelector("#wifi-access");
  const qrCode = document.querySelector("#wifi-qr-code");
  const wifi = getPublicWifiQrConfig(config);

  if (!wifi) {
    panel.hidden = true;
    qrCode.innerHTML = "";
    return;
  }

  document.querySelector("#wifi-title").textContent = copy("wifiTitle");
  document.querySelector("#wifi-intro").textContent = copy("wifiIntro");
  document.querySelector("#wifi-network-label").textContent = copy("wifiNetworkLabel");
  document.querySelector("#wifi-ssid").textContent = wifi.ssid;
  document.querySelector("#wifi-security").textContent = wifi.hidden
    ? `${wifi.security} / hidden`
    : wifi.security;
  document.querySelector("#wifi-password-note").textContent = wifi.showPasswordText
    ? copy("wifiPasswordVisible")
    : copy("wifiPasswordHidden");

  try {
    qrCode.innerHTML = createQrSvgFromText(wifi.payload, {
      label: `${wifi.ssid} Wi-Fi QR`,
      scale: 4
    });
  } catch (error) {
    qrCode.textContent = copy("wifiUnavailable");
    console.error(error);
  }

  panel.hidden = false;
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
    box.textContent = copy("askingAgent");
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

function renderChromeCopy() {
  document.documentElement.lang = state.language;
  document.querySelector("#page-eyebrow").textContent = copy("pageEyebrow");
  document.querySelector("#language-label").textContent = copy("languageLabel");
  document.querySelector("#status-title").textContent = copy("statusTitle");
  document.querySelector("#status-body").textContent = copy("statusBody");
  document.querySelector("#telegram-link").textContent = copy("telegramButton");
  document.querySelector("#guide-title").textContent = copy("guideTitle");
  document.querySelector("#guide-intro").textContent = copy("guideIntro");
  document.querySelector("#agent-title").textContent = copy("agentTitle");
  document.querySelector("#agent-intro").textContent = copy("agentIntro");
  document.querySelector("#question-input").placeholder = copy("askPlaceholder");
  document.querySelector("#ask-button").textContent = copy("askButton");
  document.querySelector("#source-title").textContent = copy("sourceTitle");
  document.querySelector("#source-intro").textContent = copy("sourceIntro");

  const badge = document.querySelector("#demo-badge");
  badge.textContent = copy("demoBadge");
  badge.hidden = state.config?.demo?.publicDemo !== true && state.configSource === "./config.json";
}

function render() {
  const config = state.config;
  const knowledge = buildApprovedKnowledgeBase(config);
  const telegramLink = document.querySelector("#telegram-link");
  const telegramUrl = safeTelegramBotUrl(config.telegram?.botUrl);
  const telegramEnabled = config.telegram?.enabled !== false && telegramUrl;

  document.querySelector("#property-name").textContent = knowledge.propertyName;
  document.querySelector("#property-address").textContent = localized(
    config.property.publicAddress,
    state.language
  );
  telegramLink.href = telegramEnabled ? telegramUrl : "#";
  telegramLink.setAttribute("aria-disabled", telegramEnabled ? "false" : "true");

  renderChromeCopy();
  renderStayGuide(config);
  renderLocalGuide(config);
  renderWifiAccess(config);
  renderSources(config);

  const box = document.querySelector("#answer-box");
  box.dataset.action = "";
  box.textContent = copy("agentHint");
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
      `Run this kit from a local web server, then check config.json or samples/demo.config.json. ${error.message || error}`;
    globalThis.__stayOpsLastError = {
      message: error.message || String(error),
      stack: error.stack || ""
    };
    console.error(error);
  }
}

boot();
