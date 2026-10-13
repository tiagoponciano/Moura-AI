"use client";

import { History, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { fetchChats } from "@/lib/chat-history/client";
import type {
  ChatContext,
  ChatModule,
  ChatSummary,
} from "@/lib/chat-history/types";
import { formatDateTime } from "@/lib/format";

type ChatHistoryMenuProps = {
  module: ChatModule;
  context?: ChatContext;
  activeId: string;
  disabled: boolean;
  onSelect: (id: string) => void;
};

type ListState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; chats: ChatSummary[] };

/** "Histórico": the user's saved chats for this module, fetched each time it opens. */
export function ChatHistoryMenu({
  module,
  context,
  activeId,
  disabled,
  onSelect,
}: ChatHistoryMenuProps) {
  const [list, setList] = useState<ListState>({ status: "loading" });

  function handleOpenChange(open: boolean) {
    if (!open) return;
    setList({ status: "loading" });
    fetchChats(module, context)
      .then((chats) => setList({ status: "ready", chats }))
      .catch((error) => {
        console.error("Failed to load chat history", error);
        setList({ status: "error" });
      });
  }

  return (
    <DropdownMenu onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" disabled={disabled}>
          <History />
          Histórico
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="max-h-80 w-72 overflow-y-auto"
      >
        <DropdownMenuLabel>Conversas anteriores</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {list.status === "loading" && (
          <p className="flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" />
            Carregando…
          </p>
        )}
        {list.status === "error" && (
          <p className="px-2 py-1.5 text-sm text-destructive">
            Não foi possível carregar o histórico.
          </p>
        )}
        {list.status === "ready" && list.chats.length === 0 && (
          <p className="px-2 py-1.5 text-sm text-muted-foreground">
            Nenhuma conversa salva ainda.
          </p>
        )}
        {list.status === "ready" &&
          list.chats.map((chat) => (
            <DropdownMenuItem
              key={chat.id}
              onSelect={() => onSelect(chat.id)}
              disabled={chat.id === activeId}
              className="flex flex-col items-start gap-0.5"
            >
              <span className="w-full truncate">{chat.title}</span>
              <span className="text-xs text-muted-foreground">
                {formatDateTime(chat.updatedAt)}
              </span>
            </DropdownMenuItem>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
