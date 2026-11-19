"use client";

import { Download, Loader2, Trash2, Upload } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PROJECT_FILE_KIND_LABEL, formatFileSize } from "@/lib/projects/files";
import { useProjectFiles } from "../hooks/use-project-files";

type ProjectFilesProps = { projectId: string };

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

/** Everything generated or uploaded for the project, with download and removal. */
export function ProjectFiles({ projectId }: ProjectFilesProps) {
  const { files, error, busy, upload, remove, download } =
    useProjectFiles(projectId);
  const input = useRef<HTMLInputElement>(null);

  return (
    <section className="flex flex-col gap-3" aria-labelledby="project-files">
      <div className="flex items-center justify-between gap-2">
        <h2 id="project-files" className="text-sm font-medium">
          Arquivos
        </h2>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => input.current?.click()}
        >
          {busy ? <Loader2 className="animate-spin" /> : <Upload />}
          Enviar arquivo
        </Button>
        <input
          ref={input}
          type="file"
          multiple
          hidden
          aria-label="Escolher arquivos do projeto"
          onChange={(event) => {
            void upload(Array.from(event.target.files ?? []));
            event.target.value = "";
          }}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
      {!files ? (
        !error && <Skeleton className="h-24 w-full" />
      ) : files.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum arquivo ainda. O que for gerado ou enviado para o projeto
          aparece aqui.
        </p>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Arquivo</TableHead>
                <TableHead>Origem</TableHead>
                <TableHead>Tamanho</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {files.map((file) => (
                <TableRow key={file.id}>
                  <TableCell className="font-medium break-all">
                    {file.file_name}
                  </TableCell>
                  <TableCell>{PROJECT_FILE_KIND_LABEL[file.kind]}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatFileSize(file.size_bytes)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(file.created_at)}
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Baixar ${file.file_name}`}
                      onClick={() => void download(file)}
                    >
                      <Download />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Excluir ${file.file_name}`}
                      onClick={() => void remove(file)}
                    >
                      <Trash2 />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </section>
  );
}
