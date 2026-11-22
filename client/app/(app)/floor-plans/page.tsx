import { PageHeader } from "@/components/shared/page-header";
import { FloorPlansWorkspace } from "@/features/floor-plans";

export default function FloorPlansPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-4 py-3 md:px-6">
        <PageHeader
          title="Plantas"
          description="Converta a planta em PDF para DXF ou DWG, com a escala certa."
        />
      </div>
      <FloorPlansWorkspace />
    </div>
  );
}
