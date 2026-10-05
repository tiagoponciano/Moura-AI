"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, getToolName, isToolUIPart } from "ai";
import {
  Bot,
  CircleCheck,
  Loader2,
  RotateCcw,
  SendHorizontal,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type ChatProps = {
  endpoint: string;
  body?: Record<string, unknown>;
  onToolResult?: (toolName: string, output: unknown) => void;
  placeholder?: string;
  emptyState?: string;
  suggestions?: string[];
};

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

  function submit(event?: FormEvent) {
    event?.preventDefault();
    send(input.trim());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
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
      <div className="flex items-center justify-between border-b px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Bot className="size-4" />
          </div>
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
          <div className="mx-auto flex h-full max-w-md flex-col items-center justify-center gap-4 text-center">
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Bot className="size-5" />
            </div>
            <p className="text-sm text-muted-foreground">{emptyState}</p>
            {suggestions.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => send(suggestion)}
                    className="rounded-full border bg-background px-3 py-1.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent hover:text-accent-foreground"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-2.5",
                  message.role === "user" && "flex-row-reverse",
                )}
              >
                {message.role !== "user" && (
                  <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                    <Bot className="size-4" />
                  </div>
                )}
                <div
                  className={cn(
                    "flex min-w-0 flex-col gap-1.5",
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
                            "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed whitespace-pre-wrap",
                            message.role === "user"
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-tl-md bg-muted text-foreground",
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
                            "flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs",
                            failed
                              ? "border-destructive/40 text-destructive"
                              : done
                                ? "border-success/30 bg-success/5 text-foreground"
                                : "text-muted-foreground",
                          )}
                        >
                          {done ? (
                            <CircleCheck className="mt-px size-3.5 shrink-0 text-success" />
                          ) : !failed ? (
                            <Loader2 className="mt-px size-3.5 shrink-0 animate-spin" />
                          ) : null}
                          <span>
                            {failed
                              ? `Falha ao registrar campos: ${part.errorText}`
                              : done
                                ? `Campos atualizados: ${fields.join(", ") || "nenhum"}`
                                : "Registrando campos…"}
                          </span>
                        </div>
                      );
                    }
                    return null;
                  })}
                </div>
              </div>
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

      <form onSubmit={submit} className="border-t p-3">
        <div className="flex items-end gap-2 rounded-xl border bg-background p-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30">
          <Textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={2}
            className="max-h-40 min-h-11 resize-none border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
          />
          <Button
            type="submit"
            size="icon"
            disabled={isBusy || !input.trim()}
            aria-label="Enviar"
          >
            {isBusy ? <Loader2 className="animate-spin" /> : <SendHorizontal />}
          </Button>
        </div>
        <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
          Enter envia · Shift+Enter quebra a linha
        </p>
      </form>
    </div>
  );
}
