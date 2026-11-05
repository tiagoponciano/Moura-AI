// Downloads the official CBMSC forms listed below and writes, under
// public/templates/cbmsc/, a copy with {{tags}} in the blanks, its schema and
// its entry in index.json. Review the output before committing it: see
// client/features/documents/docs/cbmsc-form-templates.md.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";
import { docxTextHash } from "../lib/cbmsc-forms/doc-text.ts";

const TEMPLATES = join(
  dirname(fileURLToPath(import.meta.url)),
  "../public/templates",
);

const BLANK = /^\s*_{3,}\s*$/;
/** Several lines of blanks in one run, as in a free-text block. */
const BLANK_BLOCK = /^[_\s]{3,}$/;
const MARK = /\(\s*\)/;

const text = (name, label, description, required = false) => ({
  field: { name, type: "string", label, description, required },
  match: BLANK,
  to: ` {{${name}}}   `,
});

/** A `( )` option: prints an X when true, stays empty when false. */
const mark = (name, label, description) => ({
  field: { name, type: "boolean", label, description, mark: true },
  match: MARK,
  to: `( {{${name}}} )`,
});

const FORMS = [
  {
    id: "in-1-anexo-d",
    docId: "1K6DrXe04P4pBnT3zcNB736g_H2_PyUZSXe-_FkTH8qs",
    normative: 1,
    annex: "D",
    name: "IN 1 – Anexo D – Consulta técnica",
    projectKeys: {
      requester_name: "owner_name",
      requester_email: "owner_email",
      requester_phone: "owner_phone",
      re_number: "property_re",
      building_cnpj: "property_cnpj",
      street: "property_street",
      street_number: "property_number",
      address_complement: "property_complement",
      district: "property_district",
      city: "property_city",
      postal_code: "property_postal_code",
      address_details: "property_details",
    },
    steps: [
      mark(
        "external_query",
        "Consulta externa",
        "A consulta é externa ao CBMSC",
      ),
      mark(
        "internal_query",
        "Consulta interna",
        "A consulta é interna ao CBMSC",
      ),
      text(
        "requester_name",
        "Nome do solicitante",
        "Nome do solicitante",
        true,
      ),
      text("requester_email", "E-mail do solicitante", "E-mail do solicitante"),
      text(
        "requester_phone",
        "Telefone do solicitante",
        "Telefone(s) do solicitante",
      ),
      mark(
        "about_rules",
        "Sobre NSCI",
        "A consulta é sobre as normas de segurança contra incêndio (NSCI)",
      ),
      mark(
        "about_normative",
        "Sobre uma IN",
        "A consulta é sobre uma Instrução Normativa específica",
      ),
      text(
        "normative_number",
        "Nº da IN",
        "Número da Instrução Normativa consultada",
      ),
      mark(
        "about_building",
        "Sobre edificação específica",
        "A consulta é sobre uma edificação específica",
      ),
      mark("has_re", "Tem RE", "A edificação tem registro de edificação (RE)"),
      text("re_number", "RE", "Número do RE da edificação, se houver"),
      mark(
        "has_process",
        "Tem processo",
        "A consulta se refere a um processo existente",
      ),
      text("process_number", "Nº do processo", "Número do processo, se houver"),
      text("building_cpf", "CPF", "CPF ligado à edificação"),
      text("building_cnpj", "CNPJ", "CNPJ ligado à edificação"),
      text("street", "Logradouro", "Logradouro da edificação"),
      text("street_number", "Número", "Número da edificação no logradouro"),
      text(
        "address_complement",
        "Complemento",
        "Complemento do endereço da edificação",
      ),
      text("district", "Bairro", "Bairro da edificação"),
      text("city", "Cidade", "Cidade da edificação"),
      text("postal_code", "CEP", "CEP da edificação"),
      text(
        "address_details",
        "Detalhes do endereço",
        "Detalhes do endereço, se houver",
      ),
      {
        ...text(
          "question",
          "Descrição da consulta",
          "Descrição completa da consulta técnica",
          true,
        ),
        match: BLANK_BLOCK,
        clearNextBlocks: 1,
      },
    ],
  },
  {
    id: "in-1-anexo-h",
    docId: "19CQsglI1GEIxHypHLLWySm1tVcjBpbpqWjpm5AvxYu4",
    normative: 1,
    annex: "H",
    name: "IN 1 – Anexo H – Declaração do responsável",
    projectKeys: {
      responsible_name: "technical_name",
      responsible_phone: "technical_phone",
      responsible_tax_id: "technical_tax_id",
      responsible_id_card: "technical_id_card",
      responsible_email: "technical_email",
      responsible_registry: "technical_registry",
      responsible_street: "technical_street",
      responsible_street_number: "technical_number",
      responsible_complement: "technical_complement",
      responsible_district: "technical_district",
      responsible_city: "technical_city",
      responsible_postal_code: "technical_postal_code",
      re_number: "property_re",
      building_cnpj: "property_cnpj",
      protocol: "property_protocol",
      occupancy: "property_occupancy",
      street: "property_street",
      street_number: "property_number",
      district: "property_district",
      city: "property_city",
      postal_code: "property_postal_code",
      address_complement: "property_complement",
      building_name: "property_building_name",
      company_name: "property_company_name",
      address_details: "property_details",
    },
    steps: [
      text(
        "responsible_name",
        "Nome do responsável",
        "Nome do responsável técnico",
        true,
      ),
      text(
        "responsible_phone",
        "Telefone do responsável",
        "Telefone(s) do responsável técnico",
      ),
      text(
        "responsible_tax_id",
        "CPF/CNPJ do responsável",
        "CPF ou CNPJ do responsável técnico",
        true,
      ),
      text(
        "responsible_id_card",
        "RG do responsável",
        "RG do responsável técnico",
      ),
      text(
        "responsible_email",
        "E-mail do responsável",
        "E-mail do responsável técnico",
      ),
      {
        field: {
          name: "responsible_registry",
          type: "string",
          label: "Registro no conselho",
          description:
            "Número de registro do responsável no conselho de classe profissional",
          required: true,
        },
        match: /profissional:\s*$/,
        to: "profissional: {{responsible_registry}}",
      },
      text(
        "responsible_street",
        "Logradouro do responsável",
        "Logradouro do responsável técnico",
      ),
      text(
        "responsible_street_number",
        "Número do responsável",
        "Número no logradouro do responsável técnico",
      ),
      text(
        "responsible_complement",
        "Complemento do responsável",
        "Complemento do endereço do responsável técnico",
      ),
      text(
        "responsible_district",
        "Bairro do responsável",
        "Bairro do responsável técnico",
      ),
      text(
        "responsible_city",
        "Cidade do responsável",
        "Cidade do responsável técnico",
      ),
      text(
        "responsible_postal_code",
        "CEP do responsável",
        "CEP do responsável técnico",
      ),
      text("re_number", "RE", "Registro de edificação (RE) do imóvel"),
      text("building_cnpj", "CNPJ do imóvel", "CNPJ ligado ao imóvel"),
      text("protocol", "Protocolo", "Número de protocolo do imóvel"),
      text("occupancy", "Ocupação", "Ocupação do imóvel", true),
      text("street", "Logradouro do imóvel", "Logradouro do imóvel", true),
      text(
        "street_number",
        "Número do imóvel",
        "Número do imóvel no logradouro",
      ),
      text("district", "Bairro do imóvel", "Bairro do imóvel"),
      text("city", "Cidade do imóvel", "Cidade do imóvel", true),
      text("postal_code", "CEP do imóvel", "CEP do imóvel"),
      text(
        "address_complement",
        "Complemento do imóvel",
        "Complemento do endereço do imóvel",
      ),
      text("building_name", "Nome da edificação", "Nome da edificação"),
      text("company_name", "Nome da empresa", "Nome da empresa no imóvel"),
      text(
        "address_details",
        "Detalhes do imóvel",
        "Detalhes do imóvel, se houver",
      ),
    ],
  },
];

const TEXT_RUN =
  /(<w:rPr>(?:(?!<\/w:rPr>).)*<\/w:rPr>)?(<w:t(?: [^>]*)?>)([^<]*)(<\/w:t>)/g;

/** Applies the steps in document order; throws when a step finds no match. */
function tagDocument(xml, form) {
  const runs = [...xml.matchAll(TEXT_RUN)].map((match) => ({
    match,
    value: match[3],
  }));
  let cursor = 0;
  for (const step of form.steps) {
    while (cursor < runs.length && !step.match.test(runs[cursor].value)) {
      cursor += 1;
    }
    if (cursor === runs.length) {
      throw new Error(`${form.id}: no match for ${step.field.name}`);
    }
    const run = runs[cursor];
    run.value = run.value.replace(step.match, step.to);
    run.tagged = true;
    for (let i = 1; i <= (step.clearNextBlocks ?? 0); i += 1) {
      if (!BLANK_BLOCK.test(runs[cursor + i].value)) {
        throw new Error(
          `${form.id}: expected a block after ${step.field.name}`,
        );
      }
      runs[cursor + i].value = "";
    }
  }
  let index = 0;
  return xml.replace(TEXT_RUN, (_, rPr = "", open, __, close) => {
    const { value, tagged } = runs[index];
    index += 1;
    if (!tagged) return `${rPr}${open}${value}${close}`;
    // The blanks are drawn in light gray, too faint for filled text.
    const dark = rPr.replace(/<w:color [^>]*\/>/, "");
    return `${dark}<w:t xml:space="preserve">${value}${close}`;
  });
}

const NOTICE = /uso exclusivo do CBMSC|Para utilizar este modelo/;

/** Empties the note on how to copy the Google Doc, which means nothing on a finished form. */
function removeCopyNotice(zip) {
  for (const path of Object.keys(zip.files)) {
    if (!/^word\/header\d*\.xml$/.test(path)) continue;
    const xml = zip.file(path).asText();
    zip.file(
      path,
      xml.replace(/<w:p[ >](?:(?!<\/w:p>).)*<\/w:p>/gs, (paragraph) =>
        NOTICE.test(paragraph.replace(/<[^>]+>/g, ""))
          ? paragraph.replace(/(<w:t(?: [^>]*)?>)[^<]*(<\/w:t>)/g, "$1$2")
          : paragraph,
      ),
    );
  }
}

const index = JSON.parse(await readFile(join(TEMPLATES, "index.json"), "utf8"));

for (const form of FORMS) {
  const response = await fetch(
    `https://docs.google.com/document/d/${form.docId}/export?format=docx`,
  );
  if (!response.ok) throw new Error(`${form.id}: HTTP ${response.status}`);
  const source = new Uint8Array(await response.arrayBuffer());

  const zip = new PizZip(source);
  const xml = zip.file("word/document.xml").asText();
  zip.file("word/document.xml", tagDocument(xml, form));
  removeCopyNotice(zip);
  await writeFile(
    join(TEMPLATES, `cbmsc/${form.id}.docx`),
    zip.generate({ type: "nodebuffer" }),
  );
  await writeFile(
    join(TEMPLATES, `cbmsc/${form.id}.schema.json`),
    `${JSON.stringify(
      {
        fields: form.steps.map((step) => ({
          ...step.field,
          ...(form.projectKeys[step.field.name] && {
            projectKey: form.projectKeys[step.field.name],
          }),
        })),
      },
      null,
      2,
    )}\n`,
  );

  const entry = {
    id: form.id,
    name: form.name,
    type: "docx",
    file: `/templates/cbmsc/${form.id}.docx`,
    schema: `/templates/cbmsc/${form.id}.schema.json`,
    cbmsc: {
      normative: form.normative,
      annex: form.annex,
      sourceTextHash: docxTextHash(source),
    },
  };
  const position = index.findIndex((other) => other.id === form.id);
  if (position === -1) index.push(entry);
  else index[position] = entry;
}

await writeFile(
  join(TEMPLATES, "index.json"),
  `${JSON.stringify(index, null, 2)}\n`,
);
