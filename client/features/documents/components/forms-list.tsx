"use client";

import { Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCbmscForms } from "../hooks/use-cbmsc-forms";
import type { Filling } from "../lib/fillings";
import { toFormRows, type FormRow } from "../lib/forms-table";
import type { TemplateEntry } from "../lib/templates";
import { CbmscFormPreview } from "./cbmsc-form-preview";
import { FormsTable } from "./forms-table";

type FormsListProps = {
  templates: TemplateEntry[];
  fillings: Filling[];
  onFill: (templateId: string) => void;
};

/** The forms table; a row opens Google's live preview of the form with its actions. */
export function FormsList({ templates, fillings, onFill }: FormsListProps) {
  const catalog = useCbmscForms();
  const [opened, setOpened] = useState<FormRow>();
  const rows = useMemo(
    () => toFormRows(catalog.forms, templates, fillings),
    [catalog.forms, templates, fillings],
  );

  if (catalog.error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {catalog.error}
      </p>
    );
  }
  if (catalog.loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
        <Loader2 className="mr-2 size-4 animate-spin" />
        Carregando formulários…
      </div>
    );
  }

  return (
    <>
      <FormsTable rows={rows} onOpen={setOpened} />
      <Dialog
        open={Boolean(opened)}
        onOpenChange={(open) => !open && setOpened(undefined)}
      >
        <DialogContent
          aria-describedby={undefined}
          className="flex h-[85vh] flex-col sm:max-w-5xl"
        >
          <DialogHeader>
            <DialogTitle className="sr-only">Formulário</DialogTitle>
          </DialogHeader>
          {opened && (
            <CbmscFormPreview
              key={opened.form.googleDocId}
              form={opened.form}
              template={opened.template}
              onFill={onFill}
              onBack={() => setOpened(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
