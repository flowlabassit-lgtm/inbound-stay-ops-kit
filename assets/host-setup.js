import {
  buildConfigDraft,
  buildSetupPrompt,
  findSensitiveWarnings
} from "../lib/setup-builder.js";

const STORAGE_KEY = "inboundStayOps.hostSetupDraft";
const form = document.querySelector("#setup-form");
const promptOutput = document.querySelector("#prompt-output");
const configOutput = document.querySelector("#config-output");
const warningList = document.querySelector("#warning-list");
const warningCount = document.querySelector("#warning-count");

function readForm() {
  return Object.fromEntries(new FormData(form).entries());
}

function writeForm(data) {
  for (const [key, value] of Object.entries(data || {})) {
    const field = form.elements.namedItem(key);
    if (field && typeof field.value === "string") field.value = value;
  }
}

function saveForm(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage is optional.
  }
}

function loadForm() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function renderWarnings(data) {
  const warnings = findSensitiveWarnings(
    [data.platformText, data.checkInNotes, data.houseRules, data.guestNotes].join("\n")
  );
  warningList.innerHTML = "";
  warningCount.textContent = `${warnings.length} warnings`;

  if (warnings.length === 0) {
    const item = document.createElement("li");
    item.textContent = "No access-code, password, or private-data pattern detected by the basic checker.";
    warningList.append(item);
    return;
  }

  for (const warning of warnings) {
    const item = document.createElement("li");
    item.textContent = warning.replaceAll("_", " ");
    warningList.append(item);
  }
}

function renderOutputs() {
  const data = readForm();
  saveForm(data);
  renderWarnings(data);
  promptOutput.value = buildSetupPrompt(data);
  configOutput.textContent = JSON.stringify(buildConfigDraft(data), null, 2);
}

async function copyText(text, button) {
  try {
    await navigator.clipboard.writeText(text);
    const original = button.textContent;
    button.textContent = "Copied";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1200);
  } catch {
    const original = button.textContent;
    button.textContent = "Select text";
    window.setTimeout(() => {
      button.textContent = original;
    }, 1200);
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderOutputs();
});

form.addEventListener("input", () => {
  renderOutputs();
});

document.querySelector("#copy-prompt").addEventListener("click", (event) => {
  copyText(promptOutput.value, event.currentTarget);
});

document.querySelector("#copy-config").addEventListener("click", (event) => {
  copyText(configOutput.textContent, event.currentTarget);
});

document.querySelector("#reset-sample").addEventListener("click", () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage is optional.
  }
  location.reload();
});

writeForm(loadForm());
renderOutputs();
