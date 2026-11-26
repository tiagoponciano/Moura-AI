"use client";

import { Loader2, Presentation } from "lucide-react";
import { useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

type TemplateDropZoneProps = {
  busy: boolean;
  onSelect: (file: File) => void;
};

/** Drop target (or click) for the proposal's `.pptx`; what it sends becomes the deck in use. */
export function TemplateDropZone({ busy, onSelect }: TemplateDropZoneProps) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file && !busy) onSelect(file);
  }

  return (
    <label
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted",
        dragging && "border-primary bg-accent",
        busy && "pointer-events-none opacity-60",
      )}
    >
      <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {busy ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Presentation className="size-5" />
        )}
      </div>
      <span className="text-sm font-medium">
        {busy ? "Enviando o modelo…" : "Arraste o modelo da proposta (.pptx)"}
      </span>
      <span className="text-xs text-muted-foreground">
        ou clique para escolher o arquivo (até 20 MB). Ao enviar, ele passa a
        valer para as próximas propostas.
      </span>
      <input
        type="file"
        accept=".pptx"
        className="sr-only"
        aria-label="Modelo da proposta (.pptx)"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onSelect(file);
        }}
      />
    </label>
  );
}
