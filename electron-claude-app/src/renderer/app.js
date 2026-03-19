// @ts-check
/// <reference path="./types.d.ts" />

const messagesEl = document.getElementById("messages");
const welcomeEl = document.getElementById("welcome");
const form = document.getElementById("form");
const promptEl = /** @type {HTMLTextAreaElement} */ (document.getElementById("prompt"));
const sendBtn = document.getElementById("send-btn");
const stopBtn = document.getElementById("stop-btn");

let sessionId = null;
let streaming = false;
let currentAssistantEl = null;
let currentAssistantText = "";

// ── Helpers ─────────────────────────────────────────────────────────────────

function addMessage(role, text) {
  if (welcomeEl) welcomeEl.classList.add("hidden");
  const el = document.createElement("div");
  el.className = `message ${role}`;
  el.textContent = text;
  messagesEl.appendChild(el);
  scrollToBottom();
  return el;
}

function scrollToBottom() {
  const chat = document.getElementById("chat");
  // Use requestAnimationFrame for smooth scroll after DOM update
  requestAnimationFrame(() => {
    chat.scrollTop = chat.scrollHeight;
  });
}

function setStreaming(value) {
  streaming = value;
  sendBtn.classList.toggle("hidden", value);
  stopBtn.classList.toggle("hidden", !value);
  promptEl.disabled = value;
  if (!value) {
    promptEl.focus();
  }
}

function autoResize() {
  promptEl.style.height = "auto";
  promptEl.style.height = Math.min(promptEl.scrollHeight, 200) + "px";
}

// ── Send ────────────────────────────────────────────────────────────────────

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const text = promptEl.value.trim();
  if (!text || streaming) return;

  addMessage("user", text);
  promptEl.value = "";
  autoResize();
  setStreaming(true);

  // Create the assistant bubble that we'll stream into
  currentAssistantText = "";
  currentAssistantEl = addMessage("assistant", "");
  currentAssistantEl.classList.add("streaming");

  await window.claude.send(text, sessionId);
});

stopBtn.addEventListener("click", () => {
  window.claude.stop();
  setStreaming(false);
  if (currentAssistantEl) {
    currentAssistantEl.classList.remove("streaming");
    if (!currentAssistantText) {
      currentAssistantEl.textContent = "(stopped)";
      currentAssistantEl.classList.add("system");
    }
  }
  currentAssistantEl = null;
});

// ── Auto-resize textarea ────────────────────────────────────────────────────

promptEl.addEventListener("input", autoResize);

// Submit on Enter, newline on Shift+Enter
promptEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    form.dispatchEvent(new Event("submit"));
  }
});

// ── Incoming messages from the Agent SDK (via main process IPC) ─────────────

window.claude.onText((text) => {
  if (!currentAssistantEl) {
    currentAssistantEl = addMessage("assistant", "");
    currentAssistantEl.classList.add("streaming");
    currentAssistantText = "";
  }
  currentAssistantText += text;
  currentAssistantEl.textContent = currentAssistantText;
  scrollToBottom();
});

window.claude.onTool((data) => {
  // Finish current assistant bubble before showing tool info
  if (currentAssistantEl) {
    currentAssistantEl.classList.remove("streaming");
    currentAssistantEl = null;
  }

  const inputStr =
    typeof data.input === "string"
      ? data.input
      : JSON.stringify(data.input, null, 2);

  const preview = inputStr.length > 200 ? inputStr.slice(0, 200) + "..." : inputStr;
  addMessage("tool", `${data.name}\n${preview}`);

  // Start a new assistant bubble for the follow-up text
  currentAssistantText = "";
  currentAssistantEl = addMessage("assistant", "");
  currentAssistantEl.classList.add("streaming");
});

window.claude.onDone((data) => {
  if (currentAssistantEl) {
    currentAssistantEl.classList.remove("streaming");
    // If the assistant bubble is still empty, show the final result
    if (!currentAssistantText && data.result) {
      currentAssistantEl.textContent = data.result;
    }
    // Remove empty trailing bubbles
    if (!currentAssistantEl.textContent.trim()) {
      currentAssistantEl.remove();
    }
    currentAssistantEl = null;
  }
  if (data.sessionId) sessionId = data.sessionId;
  setStreaming(false);
});

window.claude.onError((msg) => {
  if (currentAssistantEl) {
    currentAssistantEl.classList.remove("streaming");
    if (!currentAssistantText) currentAssistantEl.remove();
    currentAssistantEl = null;
  }
  addMessage("error", `Error: ${msg}`);
  setStreaming(false);
});

window.claude.onSession((id) => {
  sessionId = id;
});

window.claude.onNewConversation(() => {
  sessionId = null;
  messagesEl.innerHTML = "";
  if (welcomeEl) welcomeEl.classList.remove("hidden");
  if (streaming) {
    window.claude.stop();
    setStreaming(false);
  }
});
