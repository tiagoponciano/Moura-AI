import { PageHeader } from "@/components/shared/page-header";
import { ClassificationWorkspace } from "@/features/classification";

export default function ClassificationPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-4 py-3 md:px-6">
        <PageHeader
          title="Classificação"
          description="Ocupação, risco e exigências de segurança contra incêndio, conforme as INs."
        />
      </div>
      <ClassificationWorkspace />
    </div>
  );
}
