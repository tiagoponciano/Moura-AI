"use client";

import { Landmark } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CbmscFormsBrowser } from "./cbmsc-forms-browser";

/** Picker card that opens the official CBMSC forms dialog. */
export function CbmscFormsCard() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="group flex flex-col gap-2.5 text-left focus-visible:outline-none"
        >
          <span className="flex aspect-[210/297] w-full flex-col items-center justify-center gap-2 rounded-md border bg-card px-4 text-center text-xs text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:border-primary group-hover:shadow-md group-focus-visible:border-primary group-focus-visible:ring-3 group-focus-visible:ring-ring/50">
            <Landmark className="size-6 text-primary" />
            Formulários oficiais, sempre atualizados
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="text-sm font-medium">Anexos do CBMSC</span>
            <span className="w-fit rounded border px-1.5 font-mono text-[11px] text-muted-foreground">
              Google Docs
            </span>
          </span>
        </button>
      </DialogTrigger>
      <DialogContent className="flex h-[85vh] flex-col sm:max-w-5xl">
        <DialogHeader>
          <DialogTitle>Anexos do CBMSC</DialogTitle>
          <DialogDescription>
            Formulários das Instruções Normativas em vigor, na versão publicada
            pelo CBMSC.
          </DialogDescription>
        </DialogHeader>
        <CbmscFormsBrowser />
      </DialogContent>
    </Dialog>
  );
}
