import { PageHeader } from "@/components/shared/page-header";
import { DocumentWorkspace } from "@/features/documents";

export default function DocumentsPage() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Documentos"
        description="Escolha um modelo, converse com a Moura AI e gere o documento com o layout original."
      />
      <DocumentWorkspace />
    </div>
  );
}
