# Claude Desktop (Electron)

A lightweight Electron wrapper around [claude.ai](https://claude.ai) that runs as a native desktop app. It uses your existing Claude subscription — just sign in with your regular account.

## Features

- **Native desktop app** — runs in its own window, lives in your dock/taskbar
- **Persistent sessions** — log in once, stay logged in across restarts
- **Keyboard shortcuts** — `Cmd/Ctrl+N` for new conversation, standard navigation
- **External links** — non-Claude links open in your default browser
- **SSO support** — Google and Apple sign-in work out of the box
- **Cross-platform** — builds for macOS, Windows, and Linux

## Quick Start

```bash
# Install dependencies
npm install

# Run the app
npm start
```

## Building Distributables

```bash
# macOS
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

Build artifacts are written to the `dist/` directory.

## Custom App Icon

Drop a `icon.png` (512×512 or larger, square) into the `assets/` folder before building. For macOS you can also provide `icon.icns`, and for Windows `icon.ico`.

## How It Works

The app loads `https://claude.ai` in a BrowserWindow with a persistent session partition (`persist:claude`). Your cookies and auth tokens are stored locally by Electron, so you only need to sign in once. No API keys are needed — it uses your normal Claude subscription through the web interface.

## Requirements

- Node.js >= 18
- npm >= 9
