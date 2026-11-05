import { Skeleton } from "@/components/ui/skeleton";
import type { useAdminForms } from "../hooks/use-admin-forms";
import type { useSiteCheck } from "../hooks/use-site-check";
import type { SiteDifference } from "../lib/site-check";
import { FormCatalog } from "./form-catalog";
import { FormImport } from "./form-import";
import { SiteCheckPanel } from "./site-check-panel";

type FormsSectionProps = {
  catalog: ReturnType<typeof useAdminForms>;
  site: ReturnType<typeof useSiteCheck>;
  differences: SiteDifference[];
};

/** The site check on top, then import from a link, then the saved catalog. */
export function FormsSection({
  catalog,
  site,
  differences,
}: FormsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
      <SiteCheckPanel
        site={site}
        differences={differences}
        busyId={catalog.busyId}
        onApply={(difference) => void catalog.applyDifference(difference)}
      />
      <FormImport onSaved={catalog.reload} />
      {catalog.error && (
        <p role="alert" className="text-sm text-destructive">
          {catalog.error}
        </p>
      )}
      {catalog.forms ? (
        <FormCatalog
          forms={catalog.forms}
          busyId={catalog.busyId}
          onUpdate={catalog.update}
        />
      ) : (
        !catalog.error && <Skeleton className="h-64 w-full" />
      )}
    </div>
  );
}
