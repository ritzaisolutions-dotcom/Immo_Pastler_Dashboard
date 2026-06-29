export const CHAT_LIMITS = {
  maxMessages: 20,
  maxMessageChars: 4_000,
  maxTotalChars: 24_000,
} as const;

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export function parseChatMessages(
  value: unknown,
): { messages: ChatMessage[] } | { error: string } {
  if (!Array.isArray(value)) {
    return { error: "Ungültiges Nachrichtenformat" };
  }

  const sliced = value.slice(-CHAT_LIMITS.maxMessages);
  const messages: ChatMessage[] = [];
  let totalChars = 0;

  for (const item of sliced) {
    if (
      typeof item !== "object" ||
      item === null ||
      typeof (item as ChatMessage).content !== "string"
    ) {
      return { error: "Ungültiges Nachrichtenformat" };
    }
    const role = (item as ChatMessage).role;
    if (role !== "user" && role !== "assistant") {
      return { error: "Ungültige Rolle" };
    }
    const content = (item as ChatMessage).content
      .trim()
      .slice(0, CHAT_LIMITS.maxMessageChars);
    if (role === "user" && !content) {
      return { error: "Leere Nachricht" };
    }
    if (!content && role === "assistant") {
      continue;
    }
    totalChars += content.length;
    if (totalChars > CHAT_LIMITS.maxTotalChars) {
      return { error: "Konversation zu lang" };
    }
    messages.push({ role, content });
  }

  if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
    return { error: "Nachrichten fehlen" };
  }

  return { messages };
}
