import { Map as MapIcon } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function PlantasPage() {
  return (
    <ComingSoon
      title="Plantas (PDF → DWG)"
      description="Conversão de plantas em PDF para DWG editável, para agilizar o desenho dos projetos preventivos."
      icon={MapIcon}
      plans={[
        "Começar pelos PDFs vetoriais, que a empresa recebe com mais frequência",
        "Avaliar ferramentas de vetorização para JPEG escaneado (caso mais difícil)",
        "Benchmark de como outros escritórios de engenharia resolvem isso",
      ]}
    />
  );
}
