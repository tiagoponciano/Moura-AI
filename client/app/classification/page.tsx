import { Layers } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function ClassificationPage() {
  return (
    <ComingSoon
      title="Classificação"
      description="Classificação de edificações conforme as Instruções Normativas do CBMSC (ocupação, risco e exigências), com apoio do assistente."
      icon={Layers}
      plans={[
        "Perguntas-chave: área, uso da edificação e número de pavimentos",
        "Lista dos sistemas preventivos exigidos pelas tabelas das INs",
        "Checklist de projeto e vistoria personalizado por obra",
      ]}
    />
  );
}
