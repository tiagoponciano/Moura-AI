import { PageHeader } from "@/components/shared/page-header";
import { DocumentWorkspace } from "@/features/documents";

export default function DocumentsPage() {
  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b px-4 py-3 md:px-6">
        <PageHeader
          title="Documentos"
          description="Preencha os formulários do CBMSC conversando com o assistente."
        />
      </div>
      <DocumentWorkspace />
    </div>
  );
}
