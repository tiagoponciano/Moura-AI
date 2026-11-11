import { z } from "zod";
import type { ProjectData } from "./project-fields";

export type ProposalPlan = {
  id: string;
  title: string;
  description: string;
  items: string[];
};

/** The plans Moura offers, as in its proposal deck. */
export const PROPOSAL_PLANS: ProposalPlan[] = [
  {
    id: "complete-management",
    title: "GESTÃO COMPLETA DE PREVENÇÃO",
    description:
      "Indicado para empresas que desejam terceirizar a condução técnica do processo, com maior previsibilidade, menor desgaste operacional interno e acompanhamento mais amplo.",
    items: [
      "Inclui cadastro e análise da situação junto ao Bombeiro",
      "Inclui projeto preventivo contra incêndio novo",
      "Inclui taxa de ART junto ao CREA",
      "Inclui vistoria e solicitação de vistoria de Habite-se e anexos necessários para o processo",
      "Inclui solicitação de vistoria de funcionamento",
      "Inclui apoio complementar junto a prestadores",
      "Inclui tratativas com a fiscalização e acompanhamento da obra até a próxima renovação anual",
    ],
  },
];

export const DEFAULT_VALIDITY_DAYS = 10;

/** Body of `POST /api/documents/projects/:id/proposal`. */
export const proposalBody = z.strictObject({
  planId: z.enum(PROPOSAL_PLANS.map((plan) => plan.id)),
  /** Price in reais. */
  price: z.number().positive().max(10_000_000),
  validityDays: z.number().int().min(1).max(90).default(DEFAULT_VALIDITY_DAYS),
  format: z.enum(["pptx", "pdf"]),
});

export type ProposalRequest = z.infer<typeof proposalBody>;

/** "R$ 4.500,00": a price in reais as written on the proposal. */
export function formatPrice(reais: number): string {
  return reais
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/ /g, " ");
}

export function formatDate(date: Date, timeZone = "America/Sao_Paulo"): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeZone,
  }).format(date);
}

/** The values the PPTX service takes, from the project's shared data and the choices made for the proposal. */
export function proposalValues(
  project: { name: string; data: ProjectData },
  request: ProposalRequest,
  today: Date,
) {
  const plan = PROPOSAL_PLANS.find(
    (candidate) => candidate.id === request.planId,
  );
  if (!plan) throw new Error(`Unknown plan: ${request.planId}`);
  const { data } = project;
  return {
    client: data.owner_name ?? "",
    project_name:
      data.property_building_name ?? data.property_company_name ?? project.name,
    city_state: data.property_city ?? "",
    date: formatDate(today),
    plan_title: plan.title,
    plan_description: plan.description,
    plan_items: plan.items,
    price: formatPrice(request.price),
    notes: [
      "Devem ser encaminhados todos os documentos existentes da obra, preferencialmente em DWG.",
      "Para os projetos serem validados junto ao CBMSC é necessária compatibilidade de área em todos os arquivos: ART, memorial e projetos.",
      "Plano gestão completa inclui 3 visitas na obra.",
      `Validade da proposta: ${request.validityDays} dias.`,
      "Condições de pagamento: é possível realizar parcelamento, a depender da opção escolhida.",
    ],
  };
}
