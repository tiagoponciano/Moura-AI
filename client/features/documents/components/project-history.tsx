"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { errorMessage } from "@/lib/api/request-json";
import {
  describeChange,
  fetchProjectHistory,
  type ProjectChangeRecord,
} from "../lib/project-history";

type ProjectHistoryProps = { projectId: string };

const dateTime = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
});

/** Who changed what in the project, loaded each time the toggle opens. */
export function ProjectHistory({ projectId }: ProjectHistoryProps) {
  const [changes, setChanges] = useState<ProjectChangeRecord[]>();
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  async function load(open: boolean) {
    if (!open) return;
    setLoading(true);
    setError(undefined);
    try {
      setChanges((await fetchProjectHistory(projectId)).changes);
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Collapsible
      onOpenChange={load}
      className="group/section rounded-md border"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium">
        <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=closed]/section:-rotate-90" />
        <span className="flex-1">Histórico de alterações</span>
        {loading && <Loader2 className="size-4 animate-spin" />}
      </CollapsibleTrigger>
      <CollapsibleContent className="flex flex-col gap-2 border-t p-3 text-sm">
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {changes?.length === 0 && (
          <p className="text-xs text-muted-foreground">
            Nenhuma alteração registrada ainda.
          </p>
        )}
        {changes?.map((change) => (
          <p key={change.id}>
            {describeChange(change)}
            <span className="block text-xs text-muted-foreground">
              {change.changed_by_name ?? "Alguém"} ·{" "}
              {dateTime.format(new Date(change.changed_at))}
            </span>
          </p>
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
