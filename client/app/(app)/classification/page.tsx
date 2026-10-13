import { PageHeader } from "@/components/shared/page-header";
import { ClassificationWorkspace } from "@/features/classification";

export default function ClassificationPage() {
  return (
    <div className="flex h-full flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Classificação"
        description="Responda às perguntas-chave e veja quais sistemas preventivos a edificação precisa."
      />
      <ClassificationWorkspace />
    </div>
  );
}
