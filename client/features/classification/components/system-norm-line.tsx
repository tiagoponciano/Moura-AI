import { systemNorm } from "../lib/system-norms";
import { NormDialog } from "./norm-dialog";

/** "Norma do sistema: IN 6 · Ver artigos": the instruction on Drive and a search of its articles. */
export function SystemNormLine({
  systemId,
  systemLabel,
}: {
  systemId: string;
  systemLabel: string;
}) {
  const norm = systemNorm(systemId);
  if (!norm) return null;
  return (
    <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
      <span>
        Norma do sistema:{" "}
        <a
          href={norm.url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-foreground underline underline-offset-2"
        >
          {norm.label}
        </a>
      </span>
      <NormDialog
        doc={norm.doc}
        label={norm.label}
        defaultQuery={systemLabel}
      />
    </p>
  );
}
