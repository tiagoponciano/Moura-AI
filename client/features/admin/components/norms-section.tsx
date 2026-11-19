import { ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRetrieved, normLabel } from "../lib/norms";
import type { AdminNormSource } from "../lib/types";

type NormsSectionProps = {
  norms?: AdminNormSource[];
  error?: string;
};

/** Where each norm comes from, when it was read and what still waits for a person. */
export function NormsSection({ norms, error }: NormsSectionProps) {
  if (error) {
    return (
      <p role="alert" className="text-sm text-destructive">
        {error}
      </p>
    );
  }
  if (!norms) return <Skeleton className="h-48 w-full" />;
  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader>
        <CardTitle>Normas usadas na classificação</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col divide-y rounded-md border">
          {norms.map((norm) => (
            <li
              key={norm.doc}
              className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm"
            >
              <span className="w-28 shrink-0 font-medium">
                {normLabel(norm.doc)}
              </span>
              <span className="flex-1 text-xs text-muted-foreground">
                Extraída em {formatRetrieved(norm.retrieved)} · {norm.pages}{" "}
                páginas
              </span>
              {norm.needsHumanLook > 0 && (
                <Badge variant="outline">
                  {norm.needsHumanLook} a conferir
                </Badge>
              )}
              <a
                href={norm.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground"
                aria-label={`Abrir ${normLabel(norm.doc)} no Drive`}
              >
                <ExternalLink className="size-4" />
              </a>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
