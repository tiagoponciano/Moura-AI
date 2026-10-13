import { PageHeader } from "@/components/shared/page-header";
import { AdminConsole } from "@/features/admin";

export default function AdminPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-6">
      <PageHeader
        title="Administração"
        description="Quem entra na plataforma e qual IA as conversas usam."
      />
      <AdminConsole />
    </div>
  );
}
