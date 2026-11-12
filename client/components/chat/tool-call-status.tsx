import type { DynamicToolUIPart, ToolUIPart } from "ai";
import { CircleCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/** One-line status of a tool call: pending, the fields it recorded, or its error. */
export function ToolCallStatus({
  part,
}: {
  part: ToolUIPart | DynamicToolUIPart;
}) {
  const done = part.state === "output-available";
  const failed = part.state === "output-error";
  const output =
    done && part.output && typeof part.output === "object"
      ? (part.output as Record<string, unknown>)
      : undefined;
  // A tool whose output carries more than the recorded fields names them in `fields`,
  // and one that records nothing says what it did in `summary`.
  const summary =
    typeof output?.summary === "string" ? output.summary : undefined;
  const fields = output
    ? Array.isArray(output.fields)
      ? output.fields.filter((f): f is string => typeof f === "string")
      : Object.keys(output)
    : [];

  return (
    <div
      className={cn(
        "flex items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs",
        failed
          ? "border-destructive/40 text-destructive"
          : done
            ? "border-success/30 bg-success/5 text-foreground"
            : "text-muted-foreground",
      )}
    >
      {done ? (
        <CircleCheck className="mt-px size-3.5 shrink-0 text-success" />
      ) : !failed ? (
        <Loader2 className="mt-px size-3.5 shrink-0 animate-spin" />
      ) : null}
      <span>
        {failed
          ? `Falha ao registrar campos: ${part.errorText}`
          : done
            ? (summary ??
              `Campos atualizados: ${fields.join(", ") || "nenhum"}`)
            : "Registrando campos…"}
      </span>
    </div>
  );
}
