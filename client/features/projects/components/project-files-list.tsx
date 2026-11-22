"use client";

import { useState } from "react";
import { ProjectFileButton } from "@/components/shared/project-file-button";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useProjectFiles } from "@/hooks/use-project-files";
import { formatDateTime } from "@/lib/format";
import {
  FILE_FILTERS,
  FILE_KIND_LABEL,
  countByFilter,
  filterFiles,
  type FileFilterId,
} from "../lib/file-filters";

/** Everything kept for a project, with a toggle per kind of file. */
export function ProjectFilesList({ projectId }: { projectId: string }) {
  const { files, loading, error, download } = useProjectFiles(projectId);
  const [filter, setFilter] = useState<FileFilterId>("all");
  const counts = countByFilter(files);
  const shown = filterFiles(files, filter);

  return (
    <section className="flex flex-col gap-3" aria-label="Arquivos do projeto">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-medium">Arquivos</h2>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          value={filter}
          onValueChange={(value) => value && setFilter(value as FileFilterId)}
          aria-label="Filtrar por tipo"
        >
          {FILE_FILTERS.map(({ id, label }) => (
            <ToggleGroupItem key={id} value={id}>
              {label}
              <span className="ml-1.5 text-xs text-muted-foreground tabular-nums">
                {counts[id]}
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : shown.length === 0 ? (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          {files.length === 0
            ? "Nada guardado ainda. O que você gerar neste projeto aparece aqui."
            : "Nenhum arquivo deste tipo."}
        </p>
      ) : (
        <ul className="divide-y rounded-lg border bg-card">
          {shown.map((file) => (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
            >
              <span className="min-w-0">
                <span className="block truncate">{file.file_name}</span>
                <span className="text-xs text-muted-foreground">
                  {FILE_KIND_LABEL[file.kind]} ·{" "}
                  {formatDateTime(file.created_at)}
                </span>
              </span>
              <ProjectFileButton
                file={file}
                label="Baixar"
                onDownload={download}
              />
            </li>
          ))}
        </ul>
      )}
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </section>
  );
}
