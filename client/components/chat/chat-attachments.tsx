import { FileText, Loader2 } from "lucide-react";
import type { Attachment } from "@/lib/attachments/types";

type ChatAttachmentsProps = {
  attachments: Attachment[];
  uploading: boolean;
  problems: string[];
};

/** Files attached to the current chat, each opening its signed URL in a new tab. */
export function ChatAttachments({
  attachments,
  uploading,
  problems,
}: ChatAttachmentsProps) {
  if (attachments.length === 0 && !uploading && problems.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-1.5 border-t px-3 pt-2.5">
      <div className="flex flex-wrap gap-1.5">
        {attachments.map((attachment) => (
          <a
            key={attachment.id}
            href={attachment.url ?? undefined}
            target="_blank"
            rel="noreferrer"
            className="flex max-w-56 items-center gap-1.5 rounded-md border bg-muted/50 px-2 py-1 text-xs transition-colors hover:bg-muted"
          >
            <FileText className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate">{attachment.fileName}</span>
          </a>
        ))}
        {uploading && (
          <span className="flex items-center gap-1.5 px-2 py-1 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" />
            Enviando…
          </span>
        )}
      </div>
      {problems.map((problem) => (
        <p key={problem} className="text-xs text-destructive">
          {problem}
        </p>
      ))}
    </div>
  );
}
