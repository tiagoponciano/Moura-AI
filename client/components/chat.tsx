"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart } from "ai";
import { Loader2, SendHorizontal, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatProps = {
  endpoint: string;
  body?: Record<string, unknown>;
  onToolResult?: (toolName: string, output: unknown) => void;
  placeholder?: string;
  emptyState?: string;
};

export function Chat({
  endpoint,
  body,
  onToolResult,
  placeholder = "Digite sua mensagem…",
  emptyState = "Comece a conversa descrevendo o que você precisa.",
}: ChatProps) {
  const transport = useMemo(() => new DefaultChatTransport({ api: endpoint }), [endpoint]);
  const { messages, sendMessage, setMessages, stop, status, error } = useChat({ transport });
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

  function submit(event?: FormEvent) {
    event?.preventDefault();
    const text = input.trim();
    if (!text || isBusy) return;
    sendMessage({ text }, { body });
    setInput("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  function clear() {
    stop();
    setMessages([]);
    processedToolCalls.current.clear();
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-xl border bg-card">
      <div className="flex items-center justify-between border-b px-4 py-2">
        <span className="text-sm font-medium">Assistente</span>
        <Button variant="ghost" size="sm" onClick={clear} disabled={messages.length === 0}>
          <Trash2 />
          Limpar conversa
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">{emptyState}</p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex flex-col gap-1.5",
                  message.role === "user" ? "items-end" : "items-start",
                )}
              >
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    if (!part.text) return null;
                    return (
                      <div
                        key={index}
                        className={cn(
                          "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
                          message.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground",
                        )}
                      >
                        {part.text}
                      </div>
                    );
                  }
                  if (isToolUIPart(part)) {
                    const done = part.state === "output-available";
                    const failed = part.state === "output-error";
                    const fields =
                      done && part.output && typeof part.output === "object"
                        ? Object.keys(part.output)
                        : [];
                    return (
                      <div
                        key={index}
                        className={cn(
                          "rounded-md border px-2.5 py-1 text-xs",
                          failed ? "border-destructive/40 text-destructive" : "text-muted-foreground",
                        )}
                      >
                        {failed
                          ? `Falha ao registrar campos: ${part.errorText}`
                          : done
                            ? `Campos atualizados: ${fields.join(", ") || "nenhum"}`
                            : "Registrando campos…"}
                      </div>
                    );
                  }
                  return null;
                })}
              </div>
            ))}
            {status === "submitted" && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
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

      <form onSubmit={submit} className="flex items-end gap-2 border-t p-3">
        <Textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={2}
          className="max-h-40 min-h-11 resize-none"
        />
        <Button type="submit" size="icon" disabled={isBusy || !input.trim()} aria-label="Enviar">
          {isBusy ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
        </Button>
      </form>
    </div>
  );
}
