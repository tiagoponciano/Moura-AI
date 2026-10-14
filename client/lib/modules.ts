import {
  FileText,
  Layers,
  Map as MapIcon,
  type LucideIcon,
} from "lucide-react";

export type ModuleStatus = "available" | "preview" | "soon";

export type AppModule = {
  href: string;
  label: string;
  summary: string;
  icon: LucideIcon;
  status: ModuleStatus;
};

export const MODULE_STATUS_LABEL: Record<ModuleStatus, string> = {
  available: "Disponível",
  preview: "Prévia",
  soon: "Em breve",
};

export const MODULES: AppModule[] = [
  {
    href: "/documents",
    label: "Documentos",
    summary:
      "Preenche os anexos do CBMSC a partir da conversa, sem desconfigurar o layout do Word.",
    icon: FileText,
    status: "available",
  },
  {
    href: "/classification",
    label: "Classificação",
    summary:
      "Classifica a edificação e indica quais sistemas preventivos ela precisa ter.",
    icon: Layers,
    status: "preview",
  },
  {
    href: "/floor-plans",
    label: "Plantas",
    summary:
      "Converte plantas antigas em PDF para DWG editável, agilizando o desenho.",
    icon: MapIcon,
    status: "preview",
  },
];

export function findModule(pathname: string): AppModule | undefined {
  return MODULES.find((module) => pathname.startsWith(module.href));
}
