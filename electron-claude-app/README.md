# Claude Desktop (Agent SDK)

A native desktop chat app for Claude, powered by the [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk). It uses your existing **Claude Code CLI subscription** — no API keys needed.

## How It Works

The app runs the Claude Agent SDK in Electron's main process. When you send a message, the SDK invokes your local Claude Code CLI under the hood, which authenticates with your existing subscription. Responses stream back into a clean chat UI via Electron IPC.

Claude has access to real tools — file reading/writing, shell commands, web search — just like Claude Code in the terminal.

## Prerequisites

- **Node.js** >= 18
- **Claude Code CLI** installed and authenticated (`npm install -g @anthropic-ai/claude-code`, then `claude` to log in)

## Quick Start

```bash
cd electron-claude-app
npm install
npm start
```

## Features

- **Agent SDK powered** — not a web wrapper; runs the real Claude agent locally
- **Tool access** — Claude can read/write files, run shell commands, search the web
- **Session persistence** — conversations resume across turns via session IDs
- **Streaming** — responses appear token-by-token as Claude thinks
- **Keyboard shortcuts** — `Cmd/Ctrl+N` for new conversation, `Enter` to send, `Shift+Enter` for newline

## Building Distributables

```bash
npm run build:mac    # macOS .dmg + .zip
npm run build:win    # Windows installer + portable
npm run build:linux  # AppImage + .deb
```

Output goes to `release/`.

## Architecture

```
src/
  main/
    index.ts      — Electron main process: creates window, runs Agent SDK queries via IPC
    preload.ts    — Exposes a safe `window.claude` bridge to the renderer
  renderer/
    index.html    — Chat UI shell
    styles.css    — Styling
    app.js        — Chat logic: sends prompts, renders streamed responses
```

## Customization

### System Prompt
Edit the `options` object in `src/main/index.ts` to add a `systemPrompt`:
```ts
const options = {
  systemPrompt: "You are a helpful coding assistant. Be concise.",
  allowedTools: ["Read", "Edit", "Bash", "Glob", "Grep"],
  // ...
};
```

### Allowed Tools
Restrict or expand what Claude can do by modifying `allowedTools` in the same place.

### Permission Mode
- `"default"` — prompts for dangerous operations (default)
- `"acceptEdits"` — auto-accepts file edits
- `"bypassPermissions"` — skips all prompts (use with caution)
