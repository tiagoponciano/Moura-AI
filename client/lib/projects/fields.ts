import type { ProjectData } from "./project";

/**
 * What a project remembers across forms, as its panel shows it (labels are UI
 * copy). "Bloco e edificação", "Responsável contábil" and "Solicitante" follow
 * the request form of IN 1 parte 1, Annex B.
 */
export const PROJECT_FIELD_GROUPS = [
  {
    id: "property",
    title: "Imóvel",
    fields: [
      { key: "property_street", label: "Logradouro" },
      { key: "property_number", label: "Número" },
      { key: "property_complement", label: "Complemento" },
      { key: "property_district", label: "Bairro" },
      { key: "property_city", label: "Cidade" },
      { key: "property_postal_code", label: "CEP" },
      { key: "property_re", label: "RE" },
      { key: "property_cnpj", label: "CNPJ" },
      { key: "property_protocol", label: "Protocolo" },
      { key: "property_occupancy", label: "Ocupação" },
      { key: "property_building_name", label: "Nome da edificação" },
      { key: "property_company_name", label: "Nome da empresa" },
      { key: "property_total_area", label: "Área total (m²)" },
      { key: "property_floors", label: "Nº de pavimentos" },
      { key: "property_blocks", label: "Nº de blocos" },
      { key: "property_details", label: "Detalhes" },
    ],
  },
  {
    id: "owner",
    title: "Responsável pelo imóvel",
    fields: [
      { key: "owner_name", label: "Nome ou razão social" },
      { key: "owner_tax_id", label: "CPF/CNPJ" },
      { key: "owner_id_card", label: "RG" },
      { key: "owner_email", label: "E-mail" },
      { key: "owner_phone", label: "Telefone" },
      { key: "owner_street", label: "Logradouro" },
      { key: "owner_number", label: "Número" },
      { key: "owner_complement", label: "Complemento" },
      { key: "owner_district", label: "Bairro" },
      { key: "owner_city", label: "Cidade" },
      { key: "owner_postal_code", label: "CEP" },
    ],
  },
  {
    id: "technical",
    title: "Responsável técnico",
    fields: [
      { key: "technical_name", label: "Nome" },
      { key: "technical_tax_id", label: "CPF/CNPJ" },
      { key: "technical_id_card", label: "RG" },
      { key: "technical_registry", label: "Nº de registro" },
      { key: "technical_email", label: "E-mail" },
      { key: "technical_phone", label: "Telefone" },
      { key: "technical_street", label: "Logradouro" },
      { key: "technical_number", label: "Número" },
      { key: "technical_complement", label: "Complemento" },
      { key: "technical_district", label: "Bairro" },
      { key: "technical_city", label: "Cidade" },
      { key: "technical_postal_code", label: "CEP" },
    ],
  },
  {
    id: "building",
    title: "Bloco e edificação",
    fields: [
      { key: "building_trade_name", label: "Nome fantasia" },
      { key: "building_reference", label: "Referência" },
      { key: "building_state", label: "Estado" },
      { key: "building_land_area", label: "Área do terreno (m²)" },
      { key: "building_built_area", label: "Área construída no terreno (m²)" },
      {
        key: "building_land_registry",
        label: "Matrícula do terreno (registro)",
      },
      {
        key: "building_municipal_registry",
        label: "Matrícula do terreno (prefeitura)",
      },
      { key: "building_coordinates", label: "Latitude e longitude" },
      { key: "building_age", label: "Novo, recente ou existente" },
      { key: "building_fire_load", label: "Carga de incêndio" },
      { key: "building_destination", label: "Destinação" },
      { key: "building_construction_type", label: "Tipo construtivo" },
      { key: "building_isolation", label: "Isolamento de outros blocos" },
      { key: "block_area", label: "Área total do bloco (m²)" },
      { key: "block_height", label: "Altura do bloco (m)" },
      { key: "block_floors", label: "Nº de pavimentos do bloco" },
      { key: "block_typical_floor_area", label: "Área do pavimento tipo (m²)" },
      { key: "block_stair_type", label: "Tipo de escada" },
      { key: "block_capacity", label: "Lotação de pessoas" },
    ],
  },
  {
    id: "accountant",
    title: "Responsável contábil",
    fields: [
      { key: "accountant_name", label: "Nome" },
      { key: "accountant_tax_id", label: "CPF" },
      { key: "accountant_registry", label: "Registro no CRC" },
      { key: "accountant_email", label: "E-mail" },
      { key: "accountant_phone", label: "Telefone" },
    ],
  },
  {
    id: "applicant",
    title: "Solicitante",
    fields: [
      { key: "applicant_name", label: "Nome" },
      { key: "applicant_tax_id", label: "CPF" },
      { key: "applicant_email", label: "E-mail" },
      { key: "applicant_phone", label: "Telefone" },
    ],
  },
] as const;

export type ProjectFieldGroup = (typeof PROJECT_FIELD_GROUPS)[number];

export const PROJECT_FIELD_KEYS: readonly string[] =
  PROJECT_FIELD_GROUPS.flatMap((group) =>
    group.fields.map((field) => field.key),
  );

export const isProjectFieldKey = (key: string) =>
  PROJECT_FIELD_KEYS.includes(key);

/** How many of a group's fields the project has, for its toggle. */
export function groupProgress(group: ProjectFieldGroup, data: ProjectData) {
  return {
    filled: group.fields.filter((field) => data[field.key]).length,
    total: group.fields.length,
  };
}
