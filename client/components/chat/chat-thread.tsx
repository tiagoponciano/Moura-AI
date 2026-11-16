import type { UIMessage } from "ai";
import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";
import { chatErrorMessage } from "@/lib/chat-error";
import { ChatAlert } from "./chat-alert";
import { ChatEmptyState } from "./chat-empty-state";
import { ChatMessage } from "./chat-message";

type ChatThreadProps = {
  messages: UIMessage[];
  status: string;
  error?: Error;
  notice?: string;
  emptyState: string;
};

/** The scrolling conversation: messages, the waiting mark and errors; follows the latest. */
export function ChatThread({
  messages,
  status,
  error,
  notice,
  emptyState,
}: ChatThreadProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
      {notice && (
        <div className="mb-4">
          <ChatAlert>{notice}</ChatAlert>
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
  );
}
