interface ClaudeBridge {
  send(prompt: string, conversationId?: string): Promise<void>;
  stop(): Promise<void>;
  onText(cb: (text: string) => void): () => void;
  onTool(cb: (data: { name: string; input: unknown }) => void): () => void;
  onDone(cb: (data: { subtype: string; result?: string; sessionId?: string }) => void): () => void;
  onError(cb: (msg: string) => void): () => void;
  onSession(cb: (id: string) => void): () => void;
  onNewConversation(cb: () => void): () => void;
}

interface Window {
  claude: ClaudeBridge;
}
