import { PageHeader } from "@/components/shared/page-header";
import { AdminConsole } from "@/features/admin";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Administração"
        description="Aprove quem pode usar a Moura AI e escolha o modelo de IA e as chaves de API."
      />
      <AdminConsole />
    </div>
  );
}
