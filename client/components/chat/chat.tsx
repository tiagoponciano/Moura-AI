"use client";

import { useChat } from "@ai-sdk/react";
import {
  DefaultChatTransport,
  getToolName,
  isToolUIPart,
  type UIMessage,
} from "ai";
import { Loader2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useChatAttachments } from "@/hooks/use-chat-attachments";
import { chatErrorMessage } from "@/lib/chat-error";
import { fetchChatMessages } from "@/lib/chat-history/client";
import type { ChatContext, ChatModule } from "@/lib/chat-history/types";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { cn } from "@/lib/utils";
import { AssistantAvatar } from "./assistant-avatar";
import { ChatAlert } from "./chat-alert";
import { ChatAttachments } from "./chat-attachments";
import { ChatComposer } from "./chat-composer";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatHistoryMenu } from "./chat-history-menu";
import { ChatMessage } from "./chat-message";

type ChatProps = {
  endpoint: string;
  body?: Record<string, unknown>;
  onToolResult?: (toolName: string, output: unknown) => void;
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
  const processedToolCalls = useRef(new Set<string>());
  const bottomRef = useRef<HTMLDivElement>(null);

  const isBusy = status === "submitted" || status === "streaming";
  const historyEnabled = history !== undefined && isSupabaseConfigured();
  const files = useChatAttachments(session.id, historyEnabled);

  useEffect(() => {
    if (!onToolResult) return;
    for (const message of messages) {
      for (const part of message.parts) {
        if (!isToolUIPart(part) || part.state !== "output-available") continue;
        if (processedToolCalls.current.has(part.toolCallId)) continue;
        processedToolCalls.current.add(part.toolCallId);
        onToolResult(getToolName(part), part.output);
      }
    }
  }, [messages, onToolResult]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  function send(text: string) {
    if (!text || isBusy) return;
    sendMessage({ text }, { body });
    setInput("");
  }

  function startSession(next: ChatSession) {
    stop();
    processedToolCalls.current.clear();
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
      <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
        {title ?? (
          <div className="flex items-center gap-2">
            <AssistantAvatar />
            <span className="text-sm font-medium">Moura AI</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          {historyEnabled && (
            <ChatHistoryMenu
              module={history.module}
              context={history.context}
              activeId={session.id}
              disabled={isBusy}
              onSelect={openSavedChat}
            />
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => startSession(newSession())}
            disabled={messages.length === 0}
          >
            <RotateCcw />
            Nova conversa
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {historyError && (
          <div className="mb-4">
            <ChatAlert>{historyError}</ChatAlert>
          </div>
        )}
        {messages.length === 0 ? (
          <ChatEmptyState text={emptyState} />
        ) : (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 pl-9 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Pensando…
              </div>
            )}
            {error && <ChatAlert>Erro: {chatErrorMessage(error)}</ChatAlert>}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

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
