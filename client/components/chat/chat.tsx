"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useChatAttachments } from "@/hooks/use-chat-attachments";
import { useToolResults } from "@/hooks/use-tool-results";
import { fetchChatMessages } from "@/lib/chat-history/client";
import type { ChatContext, ChatModule } from "@/lib/chat-history/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { ChatAttachments } from "./chat-attachments";
import { ChatComposer } from "./chat-composer";
import { ChatHeader } from "./chat-header";
import { ChatThread } from "./chat-thread";

type ChatProps = {
  endpoint: string;
  body?: Record<string, unknown>;
  onToolResult?: (toolName: string, output: unknown) => void;
  /** A message to send for the user; each new `id` is sent once, when the chat is free. */
  outbox?: { id: number; text: string };
  /** Called once the outbox message went out, so the owner can drop it. */
  onOutboxSent?: () => void;
  placeholder?: string;
  emptyState?: string;
  /** Saved-chat scope. The history menu shows only when this is set and Supabase is configured. */
  history?: { module: ChatModule; context?: ChatContext };
  /** Left side of the header; defaults to the assistant avatar and name. */
  title?: ReactNode;
  className?: string;
};

type ChatSession = { id: string; messages: UIMessage[] };

const newSession = (): ChatSession => ({
  id: crypto.randomUUID(),
  messages: [],
});

/** Module-agnostic assistant chat; tool results are reported once per call. */
export function Chat({
  endpoint,
  body,
  onToolResult,
  outbox,
  onOutboxSent,
  placeholder = "Digite sua mensagem…",
  emptyState = "Comece a conversa descrevendo o que você precisa.",
  history,
  title,
  className,
}: ChatProps) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: endpoint }),
    [endpoint],
  );
  const [session, setSession] = useState(newSession);
  const { messages, sendMessage, stop, status, error } = useChat({
    id: session.id,
    messages: session.messages,
    transport,
  });
  const [input, setInput] = useState("");
  const [historyError, setHistoryError] = useState<string>();
  const toolResults = useToolResults(messages, onToolResult);

  const isBusy = status === "submitted" || status === "streaming";
  const sentOutbox = useRef(0);
  useEffect(() => {
    if (!outbox || outbox.id === sentOutbox.current || isBusy) return;
    sentOutbox.current = outbox.id;
    sendMessage({ text: outbox.text }, { body });
    onOutboxSent?.();
  }, [outbox, isBusy, sendMessage, body, onOutboxSent]);
  const historyEnabled = history !== undefined && isSupabaseConfigured();
  const files = useChatAttachments(session.id, historyEnabled);

  function send(text: string) {
    if (!text || isBusy) return;
    sendMessage({ text }, { body });
    setInput("");
  }

  function startSession(next: ChatSession) {
    stop();
    toolResults.reset();
    setHistoryError(undefined);
    setSession(next);
  }

  async function openSavedChat(id: string) {
    try {
      startSession({ id, messages: await fetchChatMessages(id) });
    } catch (loadError) {
      console.error("Failed to open saved chat", loadError);
      setHistoryError("Não foi possível abrir a conversa.");
    }
  }

  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col rounded-xl border bg-card",
        className,
      )}
    >
      <ChatHeader
        title={title}
        history={historyEnabled ? history : undefined}
        activeId={session.id}
        busy={isBusy}
        canReset={messages.length > 0}
        onSelectChat={openSavedChat}
        onNewChat={() => startSession(newSession())}
      />
      <ChatThread
        messages={messages}
        status={status}
        error={error}
        notice={historyError}
        emptyState={emptyState}
      />

      {historyEnabled && (
        <ChatAttachments
          attachments={files.attachments}
          uploading={files.uploading}
          problems={files.problems}
        />
      )}
      <ChatComposer
        value={input}
        placeholder={placeholder}
        busy={isBusy}
        onChange={setInput}
        onSubmit={() => send(input.trim())}
        onAttach={historyEnabled ? files.attach : undefined}
        attaching={files.uploading}
      />
    </div>
  );
}
