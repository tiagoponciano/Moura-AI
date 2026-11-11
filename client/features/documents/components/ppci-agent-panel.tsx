"use client";

import { useState } from "react";
import { Chat } from "@/components/chat/chat";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { usePpciChecklist } from "../hooks/use-ppci-checklist";
import {
  changesFromToolOutput,
  currentGroup,
  ppciChatEmptyState,
} from "../lib/ppci-agent";
import type { Answer, ChecklistGroup } from "../lib/ppci-answers";

type PpciAgentPanelProps = {
  projectId: string;
  groups: ChecklistGroup[];
  answers: Map<string, Answer>;
  onAnswer: ReturnType<typeof usePpciChecklist>["answer"];
};

/** The agent that goes through the checklist group by group; the groups follow the answers unless one is picked. */
export function PpciAgentPanel({
  projectId,
  groups,
  answers,
  onAnswer,
}: PpciAgentPanelProps) {
  const [picked, setPicked] = useState<number>();
  const group = currentGroup(groups, answers, picked);
  if (!group) return null;

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="flex-1 text-sm font-medium">Conversar com o agente</h3>
        <Select
          value={String(group.position)}
          onValueChange={(value) => setPicked(Number(value))}
        >
          <SelectTrigger aria-label="Grupo em conversa" className="w-72">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {groups.map((candidate) => (
              <SelectItem
                key={candidate.position}
                value={String(candidate.position)}
              >
                {candidate.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="h-96 min-h-0">
        <Chat
          key={projectId}
          endpoint="/api/documents/ppci-chat"
          body={{ projectId, groupPosition: group.position }}
          onToolResult={(toolName, output) => {
            for (const change of changesFromToolOutput(
              toolName,
              output,
              group,
              answers,
            )) {
              onAnswer(group.position, change.itemPosition, {
                status: change.status,
                ...(change.note !== undefined && { note: change.note }),
              });
            }
          }}
          placeholder="Responda sobre os itens do grupo"
          emptyState={ppciChatEmptyState(group)}
          className="rounded-md border"
        />
      </div>
    </div>
  );
}
