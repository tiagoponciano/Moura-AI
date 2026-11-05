"use client";

import { ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { googleDocUrls } from "@/lib/cbmsc-forms/links";
import { formatDateTime } from "@/lib/format";
import type { useSiteCheck } from "../hooks/use-site-check";
import {
  describeDifference,
  differenceKey,
  differenceTargetId,
  siteCheckStatusLine,
  type SiteDifference,
} from "../lib/site-check";

type SiteCheckPanelProps = {
  site: ReturnType<typeof useSiteCheck>;
  differences: SiteDifference[];
  busyId?: string;
  onApply: (difference: SiteDifference) => void;
};

/** What the CBMSC site lists that the catalog does not match, with a fix for each. */
export function SiteCheckPanel({
  site,
  differences,
  busyId,
  onApply,
}: SiteCheckPanelProps) {
  return (
    <Card className="[--card-spacing:--spacing(6)]">
      <CardHeader className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <CardTitle>Verificação do site do CBMSC</CardTitle>
          <CardDescription>
            {site.check
              ? `Última verificação: ${formatDateTime(site.check.checkedAt)}. ${siteCheckStatusLine(site.check, differences)}`
              : "Compara o catálogo com os anexos publicados no site, uma vez por dia."}
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          disabled={site.running}
          onClick={() => void site.run()}
        >
          {site.running && <Loader2 className="animate-spin" />}
          Verificar agora
        </Button>
      </CardHeader>
      {(differences.length > 0 || site.error) && (
        <CardContent className="flex flex-col gap-3">
          {site.error && (
            <p role="alert" className="text-sm text-destructive">
              {site.error}
            </p>
          )}
          {differences.length > 0 && (
            <ul className="flex flex-col divide-y rounded-md border">
              {differences.map((difference) => {
                const { title, detail, action } =
                  describeDifference(difference);
                const id = differenceTargetId(difference);
                return (
                  <li
                    key={differenceKey(difference)}
                    className="flex flex-wrap items-center gap-3 px-3 py-2 text-sm"
                  >
                    <Badge variant="secondary">{title}</Badge>
                    <span className="min-w-0 flex-1">{detail}</span>
                    {difference.kind !== "removed" && (
                      <a
                        href={googleDocUrls(difference.site.googleDocId).edit}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                        aria-label={`Abrir ${difference.site.name} no Google Docs`}
                      >
                        <ExternalLink className="size-4" />
                      </a>
                    )}
                    {action && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={busyId !== undefined}
                        onClick={() => onApply(difference)}
                      >
                        {busyId === id && <Loader2 className="animate-spin" />}
                        {action}
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      )}
    </Card>
  );
}
