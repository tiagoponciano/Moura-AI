import { isToolUIPart, type UIMessage } from "ai";
import { cn } from "@/lib/utils";
import { AssistantAvatar } from "./assistant-avatar";
import { ToolCallStatus } from "./tool-call-status";

export function ChatMessage({ message }: { message: UIMessage }) {
  const fromUser = message.role === "user";

  return (
    <div className={cn("flex gap-2.5", fromUser && "flex-row-reverse")}>
      {!fromUser && <AssistantAvatar className="mt-0.5" />}
      <div
        className={cn(
          "flex min-w-0 flex-col gap-1.5",
          fromUser ? "items-end" : "items-start",
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
                  fromUser
                    ? "rounded-br-md bg-primary text-primary-foreground"
                    : "rounded-tl-md bg-muted text-foreground",
                )}
              >
                {part.text}
              </div>
            );
          }
          if (isToolUIPart(part)) {
            return <ToolCallStatus key={index} part={part} />;
          }
          return null;
        })}
      </div>
    </div>
  );
}
