import { Skeleton } from "@/components/ui/skeleton";
import type { useAdminForms } from "../hooks/use-admin-forms";
import { FormCatalog } from "./form-catalog";
import { FormImport } from "./form-import";

type FormsSectionProps = {
  catalog: ReturnType<typeof useAdminForms>;
};

/** Import from a link above, the saved catalog below. */
export function FormsSection({ catalog }: FormsSectionProps) {
  return (
    <div className="flex flex-col gap-4">
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
          onSetActive={(id, active) => void catalog.setActive(id, active)}
        />
      ) : (
        !catalog.error && <Skeleton className="h-64 w-full" />
      )}
    </div>
  );
}
