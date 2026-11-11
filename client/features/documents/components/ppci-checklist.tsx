"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { usePpciChecklist } from "../hooks/use-ppci-checklist";
import {
  ANSWER_LABEL,
  ANSWER_STATUSES,
  answerKey,
  groupStats,
  type Answer,
  type ChecklistGroup,
} from "../lib/ppci-answers";

type PpciChecklistProps = { projectId: string };

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Moura's PPCI checklist for a project: the control panel and one toggle per group. */
export function PpciChecklist({ projectId }: PpciChecklistProps) {
  const { checklist, answers, error, answer } = usePpciChecklist(projectId);

  if (!checklist) {
    return error ? (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    ) : (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="size-4 animate-spin" />
        Carregando checklist…
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
      <p className="text-xs text-muted-foreground">
        Marque cada item como Atende, Adequar ou Não se aplica. As marcações
        ficam salvas no projeto, com quem marcou e quando.
      </p>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
      <ControlPanel groups={checklist.groups} answers={answers} />
      {checklist.groups.map((group, index) => (
        <GroupSection
          key={group.position}
          group={group}
          answers={answers}
          defaultOpen={index === 0}
          onAnswer={answer}
        />
      ))}
    </div>
  );
}

type PanelProps = { groups: ChecklistGroup[]; answers: Map<string, Answer> };

function ControlPanel({ groups, answers }: PanelProps) {
  const rows = groups.map((group) => ({
    group,
    stats: groupStats(group, answers),
  }));
  return (
    <div className="overflow-x-auto rounded-md border">
      <table className="w-full text-xs">
        <caption className="sr-only">Painel de controle do checklist</caption>
        <thead className="bg-muted/50 text-left">
          <tr>
            <th className="px-3 py-1.5 font-medium">Grupo</th>
            <th className="px-2 py-1.5 font-medium">Itens</th>
            <th className="px-2 py-1.5 font-medium">Pendentes</th>
            <th className="px-2 py-1.5 font-medium">Não se aplica</th>
            <th className="px-2 py-1.5 font-medium">Concluídos</th>
            <th className="px-2 py-1.5 font-medium">Progresso</th>
          </tr>
        </thead>
        <tbody className="tabular-nums">
          {rows.map(({ group, stats }) => (
            <tr key={group.position} className="border-t">
              <td className="px-3 py-1.5">{group.name}</td>
              <td className="px-2 py-1.5">{stats.items}</td>
              <td className="px-2 py-1.5">{stats.pending}</td>
              <td className="px-2 py-1.5">{stats.notApplicable}</td>
              <td className="px-2 py-1.5">{stats.concluded}</td>
              <td className="px-2 py-1.5">{stats.progress}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

type GroupSectionProps = {
  group: ChecklistGroup;
  answers: Map<string, Answer>;
  defaultOpen: boolean;
  onAnswer: ReturnType<typeof usePpciChecklist>["answer"];
};

function GroupSection({
  group,
  answers,
  defaultOpen,
  onAnswer,
}: GroupSectionProps) {
  const stats = groupStats(group, answers);
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="group/section rounded-md border"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium">
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=closed]/section:-rotate-90" />
        <span className="flex-1">{group.name}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {stats.concluded} de {stats.items - stats.notApplicable} ·{" "}
          {stats.progress}%
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col divide-y border-t">
        {group.items.map((item, index) => {
          const current = answers.get(answerKey(group.position, item.position));
          const newSection =
            item.section && item.section !== group.items[index - 1]?.section;
          return (
            <div key={item.position} className="flex flex-col gap-2 p-3">
              {newSection && (
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  {item.section}
                </p>
              )}
              <p className="text-sm">{item.text}</p>
              <div className="flex flex-wrap items-center gap-2">
                <div
                  role="group"
                  aria-label="Situação do item"
                  className="flex gap-1"
                >
                  {ANSWER_STATUSES.map((status) => (
                    <Button
                      key={status}
                      type="button"
                      size="sm"
                      variant={
                        current?.status === status ? "secondary" : "outline"
                      }
                      aria-pressed={current?.status === status}
                      className={cn(
                        current?.status === status &&
                          status === "atende" &&
                          "text-success",
                        current?.status === status &&
                          status === "adequar" &&
                          "text-destructive",
                      )}
                      onClick={() =>
                        onAnswer(group.position, item.position, {
                          status: current?.status === status ? null : status,
                        })
                      }
                    >
                      {ANSWER_LABEL[status]}
                    </Button>
                  ))}
                </div>
                <Input
                  aria-label="Nota do item"
                  placeholder="Nota"
                  className="h-8 min-w-48 flex-1"
                  defaultValue={current?.note ?? ""}
                  onBlur={(event) => {
                    const note = event.target.value.trim() || null;
                    if (note !== (current?.note ?? null)) {
                      onAnswer(group.position, item.position, { note });
                    }
                  }}
                />
              </div>
              {current && (current.status || current.note) && (
                <p className="text-xs text-muted-foreground">
                  {current.updated_by_name ?? "Alguém"} ·{" "}
                  {dateTime.format(new Date(current.updated_at))}
                </p>
              )}
            </div>
          );
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}
