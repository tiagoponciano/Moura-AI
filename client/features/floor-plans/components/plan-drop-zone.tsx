"use client";

import { FileUp } from "lucide-react";
import { useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";
import { FLOOR_PLAN_ACCEPT } from "../lib/floor-plan-file";

type PlanDropZoneProps = {
  problem?: string;
  onSelect: (file: File) => void;
};

/** Click or drop target for the floor plan PDF. */
export function PlanDropZone({ problem, onSelect }: PlanDropZoneProps) {
  const [dragging, setDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files[0];
    if (file) onSelect(file);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        className={cn(
          "flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed px-4 py-8 text-center transition-colors focus-within:ring-3 focus-within:ring-ring/50 hover:bg-muted",
          dragging && "border-primary bg-accent",
        )}
      >
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <FileUp className="size-5" />
        </div>
        <span className="text-sm font-medium">Enviar planta em PDF</span>
        <span className="text-xs text-muted-foreground">
          Clique ou arraste o arquivo (até 20 MB)
        </span>
        <input
          type="file"
          accept={FLOOR_PLAN_ACCEPT}
          className="sr-only"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) onSelect(file);
            event.target.value = "";
          }}
        />
      </label>
      {problem && (
        <p role="alert" className="text-xs text-destructive">
          {problem}
        </p>
      )}
    </div>
  );
}
