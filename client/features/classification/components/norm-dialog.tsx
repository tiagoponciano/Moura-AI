"use client";

import { Loader2, Search } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useNormSearch } from "../hooks/use-norm-search";

type NormDialogProps = {
  /** The instruction searched, like `IN-7`. */
  doc: string;
  /** How it is shown, like `IN 7`. */
  label: string;
  /** What is searched when the dialog opens. */
  defaultQuery: string;
};

/** The articles of one instruction that match some words, as the norm prints them. */
export function NormDialog({ doc, label, defaultQuery }: NormDialogProps) {
  const [query, setQuery] = useState(defaultQuery);
  const { hits, error, busy, search } = useNormSearch(doc);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (query.trim().length >= 3) void search(query);
  }

  return (
    <Dialog
      onOpenChange={(open) => {
        if (open && !hits && !busy) void search(defaultQuery);
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="link" size="xs" className="h-auto p-0">
          Ver artigos
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>
            Trechos dos artigos da norma, como estão impressos. Confira o artigo
            inteiro no PDF.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex gap-2">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label={`Buscar na ${label}`}
            placeholder="Palavras para buscar"
            autoComplete="off"
          />
          <Button type="submit" disabled={busy || query.trim().length < 3}>
            {busy ? <Loader2 className="animate-spin" /> : <Search />}
            Buscar
          </Button>
        </form>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        {hits && hits.length === 0 && !error && (
          <p className="text-sm text-muted-foreground">
            Nenhum artigo com essas palavras.
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {hits?.map((hit) => (
            <li
              key={`${hit.doc}-${hit.article}`}
              className="rounded-lg border p-3"
            >
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                Art. {hit.article} · página {hit.page}
              </p>
              <p className="text-sm leading-snug whitespace-pre-line">
                {hit.excerpt}
              </p>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
