import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("claude", {
  send: (prompt: string, conversationId?: string) =>
    ipcRenderer.invoke("claude:send", { prompt, conversationId }),

  stop: () => ipcRenderer.invoke("claude:stop"),

  onText: (cb: (text: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, text: string) => cb(text);
    ipcRenderer.on("claude:text", handler);
    return () => ipcRenderer.removeListener("claude:text", handler);
  },

  onTool: (cb: (data: { name: string; input: unknown }) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, data: { name: string; input: unknown }) =>
      cb(data);
    ipcRenderer.on("claude:tool", handler);
    return () => ipcRenderer.removeListener("claude:tool", handler);
  },

  onDone: (cb: (data: { subtype: string; result?: string; sessionId?: string }) => void) => {
    const handler = (
      _e: Electron.IpcRendererEvent,
      data: { subtype: string; result?: string; sessionId?: string }
    ) => cb(data);
    ipcRenderer.on("claude:done", handler);
    return () => ipcRenderer.removeListener("claude:done", handler);
  },

  onError: (cb: (msg: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, msg: string) => cb(msg);
    ipcRenderer.on("claude:error", handler);
    return () => ipcRenderer.removeListener("claude:error", handler);
  },

  onSession: (cb: (id: string) => void) => {
    const handler = (_e: Electron.IpcRendererEvent, id: string) => cb(id);
    ipcRenderer.on("claude:session", handler);
    return () => ipcRenderer.removeListener("claude:session", handler);
  },

  onNewConversation: (cb: () => void) => {
    const handler = () => cb();
    ipcRenderer.on("new-conversation", handler);
    return () => ipcRenderer.removeListener("new-conversation", handler);
  },
});
