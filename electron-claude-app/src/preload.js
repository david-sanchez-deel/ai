// Preload script — runs in the renderer context before web content loads.
// Provides a minimal bridge and hides the Electron environment from the page.

const { contextBridge } = require("electron");

// Expose a tiny API so the page can detect it's running in the desktop app
// (useful if you ever want to customise behaviour for the desktop wrapper).
contextBridge.exposeInMainWorld("claudeDesktop", {
  isDesktop: true,
  platform: process.platform,
});
