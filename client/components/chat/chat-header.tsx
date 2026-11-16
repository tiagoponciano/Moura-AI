import { RotateCcw } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import type { ChatContext, ChatModule } from "@/lib/chat-history/types";
import { AssistantAvatar } from "./assistant-avatar";
import { ChatHistoryMenu } from "./chat-history-menu";

type ChatHeaderProps = {
  title?: ReactNode;
  /** Set when saved chats are available. */
  history?: { module: ChatModule; context?: ChatContext };
  activeId: string;
  busy: boolean;
  canReset: boolean;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
};

/** Title, saved chats and "Nova conversa". */
export function ChatHeader({
  title,
  history,
  activeId,
  busy,
  canReset,
  onSelectChat,
  onNewChat,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between gap-2 border-b px-4 py-2.5">
      {title ?? (
        <div className="flex items-center gap-2">
          <AssistantAvatar />
          <span className="text-sm font-medium">Moura AI</span>
        </div>
      )}
      <div className="flex items-center gap-1">
        {history && (
          <ChatHistoryMenu
            module={history.module}
            context={history.context}
            activeId={activeId}
            disabled={busy}
            onSelect={onSelectChat}
          />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onNewChat}
          disabled={!canReset}
        >
          <RotateCcw />
          Nova conversa
        </Button>
      </div>
    </div>
  );
}
