"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart } from "ai";
import { Loader2, RotateCcw } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { AssistantAvatar } from "./assistant-avatar";
import { ChatComposer } from "./chat-composer";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessage } from "./chat-message";

type ChatProps = {
  endpoint: string;
  body?: Record<string, unknown>;
  onToolResult?: (toolName: string, output: unknown) => void;
  placeholder?: string;
  emptyState?: string;
  suggestions?: string[];
};

/** Module-agnostic assistant chat; tool results are reported once per call. */
export function Chat({
  endpoint,
  body,
  onToolResult,
  placeholder = "Digite sua mensagem…",
  emptyState = "Comece a conversa descrevendo o que você precisa.",
  suggestions = [],
}: ChatProps) {
  const transport = useMemo(
    () => new DefaultChatTransport({ api: endpoint }),
    [endpoint],
  );
  const { messages, sendMessage, setMessages, stop, status, error } = useChat({
    transport,
  });
  const [input, setInput] = useState("");
  const processedToolCalls = useRef(new Set<string>());
  const bottomRef = useRef<HTMLDivElement>(null);

  const isBusy = status === "submitted" || status === "streaming";

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

  function clear() {
    stop();
    setMessages([]);
    processedToolCalls.current.clear();
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <AssistantAvatar />
          <span className="text-sm font-medium">Assistente</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={clear}
          disabled={messages.length === 0}
        >
          <RotateCcw />
          Nova conversa
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <ChatEmptyState
            text={emptyState}
            suggestions={suggestions}
            onSuggestion={send}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <ChatMessage key={message.id} message={message} />
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 pl-9 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Pensando…
              </div>
            )}
            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                Erro: {error.message}
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <ChatComposer
        value={input}
        placeholder={placeholder}
        busy={isBusy}
        onChange={setInput}
        onSubmit={() => send(input.trim())}
      />
    </div>
  );
}
