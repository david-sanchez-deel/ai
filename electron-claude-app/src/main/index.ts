import { app, BrowserWindow, ipcMain, Menu, shell } from "electron";
import * as path from "path";
import { query } from "@anthropic-ai/claude-agent-sdk";

let mainWindow: BrowserWindow | null = null;

// Track the currently running query so we can abort it
let activeAbort: AbortController | null = null;

function createMenu() {
  const isMac = process.platform === "darwin";

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "New Conversation",
          accelerator: "CmdOrCtrl+N",
          click: () => mainWindow?.webContents.send("new-conversation"),
        },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac ? [{ type: "separator" as const }, { role: "front" as const }] : []),
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 480,
    minHeight: 500,
    title: "Claude",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 12, y: 12 },
    backgroundColor: "#F9F5EE",
    show: false,
  });

  mainWindow.once("ready-to-show", () => mainWindow?.show());

  mainWindow.loadFile(path.join(__dirname, "..", "..", "src", "renderer", "index.html"));

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

// ── IPC: handle a chat message from the renderer ──────────────────────────

ipcMain.handle(
  "claude:send",
  async (event, { prompt, conversationId }: { prompt: string; conversationId?: string }) => {
    // Abort any existing query
    if (activeAbort) {
      activeAbort.abort();
      activeAbort = null;
    }

    const abort = new AbortController();
    activeAbort = abort;

    try {
      const options: Record<string, unknown> = {
        allowedTools: ["Read", "Edit", "Write", "Bash", "Glob", "Grep", "WebSearch", "WebFetch"],
        permissionMode: "default",
        maxTurns: 25,
      };

      // Resume a previous session if we have one
      if (conversationId) {
        (options as any).resume = conversationId;
      }

      let sessionId: string | undefined;

      for await (const message of query({ prompt, options: options as any })) {
        // Bail if the user started a new query
        if (abort.signal.aborted) break;

        if (message.type === "system" && message.subtype === "init") {
          sessionId = (message as any).data?.session_id ?? (message as any).session_id;
          mainWindow?.webContents.send("claude:session", sessionId);
        }

        if (message.type === "assistant" && (message as any).message?.content) {
          for (const block of (message as any).message.content) {
            if (abort.signal.aborted) break;

            if ("text" in block && block.text) {
              mainWindow?.webContents.send("claude:text", block.text);
            } else if ("name" in block) {
              mainWindow?.webContents.send("claude:tool", {
                name: block.name,
                input: block.input,
              });
            }
          }
        }

        if (message.type === "result") {
          mainWindow?.webContents.send("claude:done", {
            subtype: (message as any).subtype,
            result: (message as any).result,
            sessionId,
          });
        }
      }
    } catch (err: any) {
      if (!abort.signal.aborted) {
        mainWindow?.webContents.send("claude:error", err.message ?? String(err));
      }
    } finally {
      if (activeAbort === abort) activeAbort = null;
    }
  }
);

ipcMain.handle("claude:stop", async () => {
  if (activeAbort) {
    activeAbort.abort();
    activeAbort = null;
  }
});

// ── App lifecycle ─────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createMenu();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
