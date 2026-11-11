// Downloads every official CBMSC form in the catalog's seed and writes, under
// public/templates/cbmsc/, a copy with {{tags}} in the blanks, its schema and
// its entry in index.json. Forms in FORMS have hand-written steps; the others
// get their fields from the document's structure. Review the output before
// committing it: see client/features/documents/docs/cbmsc-form-templates.md.
import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import PizZip from "pizzip";
import { docxTextHash } from "../lib/cbmsc-forms/doc-text.ts";
import { autoTagDocument } from "./cbmsc-auto-fields.mjs";

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

/** Text the CBMSC left as an example, replaced by a field. */
const placeholder = (name, label, description, match, required = false) => ({
  field: { name, type: "string", label, description, required },
  match,
  to: `{{${name}}}`,
});

/** Text removed from the copy, with no field of its own. */
const erase = (match) => ({ match, to: "" });

const FINE_REQUEST_END = [
  placeholder(
    "fine_number",
    "Nº da multa",
    "Número da multa (MUL…)",
    /MULX+\/XX/,
    true,
  ),
  placeholder(
    "fine_amount",
    "Valor da multa",
    "Valor da multa em reais, com o valor por extenso",
    /X\.XXX,XX \(valor por extenso\)/,
    true,
  ),
  placeholder(
    "street",
    "Logradouro",
    "Logradouro da edificação",
    /nome da rua/,
  ),
  placeholder("street_number", "Número", "Número da edificação", /^\s*XXX\s*$/),
  placeholder("district", "Bairro", "Bairro da edificação", /nome do bairro/),
  placeholder(
    "city",
    "Município",
    "Município da edificação",
    /nome do município/,
  ),
  placeholder(
    "re_number",
    "RE",
    "RE da edificação ou outros dados de identificação junto ao SSCI",
    /XXXX \(ou outros dados[^<]*\)/,
  ),
  placeholder(
    "reasons",
    "Motivos",
    "Argumentação do requerimento",
    /^- Motivo 1;$/,
    true,
  ),
  erase(/^- Motivo 2;$/),
  erase(/^- Motivo 3\.$/),
  placeholder(
    "signed_city",
    "Município da assinatura",
    "Município onde o requerimento é assinado",
    /^Município,\s*$/,
  ),
  placeholder("signed_day", "Dia", "Dia da assinatura", /^XX$/),
  placeholder(
    "signed_month",
    "Mês",
    "Mês da assinatura, por extenso",
    /^X{8}\s*$/,
  ),
  placeholder(
    "signed_year",
    "Ano",
    "Dois últimos dígitos do ano da assinatura",
    /^XX$/,
  ),
];

const FINE_REQUEST_KEYS = {
  street: "property_street",
  street_number: "property_number",
  district: "property_district",
  city: "property_city",
  re_number: "property_re",
};

const FORMS = [
  {
    id: "in-27-anexo-c",
    docId: "1JvsXb9q5vRd-k7hf634M7eF7inQpbtilKd247bA4nzA",
    normative: 27,
    annex: "C",
    name: "IN 27 – Anexo C – Sugestão de modelo de Croqui",
    projectKeys: {},
    steps: [
      {
        field: {
          name: "notes",
          type: "string",
          label: "Observações relevantes",
          description: "Observações relevantes acerca do evento pirotécnico",
          required: false,
        },
        match: /Observações relevantes acerca do evento pirotécnico/,
        to: "Observações relevantes acerca do evento pirotécnico: {{notes}}",
      },
    ],
  },
  {
    id: "in-2-anexo-k",
    docId: "1fhyQzBFl2QVCF4-_7KTk6A1uT-UOQgqZdrY0hAyK3l0",
    normative: 2,
    annex: "K",
    name: "IN 2 – Anexo K – Ressarcimento de multa (pessoa física)",
    projectKeys: FINE_REQUEST_KEYS,
    steps: [
      placeholder(
        "office_city",
        "Município do SSCI",
        "Município do Serviço de Segurança Contra Incêndio",
        /\(digite o município\)/,
        true,
      ),
      placeholder(
        "requester_name",
        "Nome",
        "Nome do requerente por extenso",
        /\(seu nome por extenso\)/,
        true,
      ),
      placeholder(
        "requester_cpf",
        "CPF",
        "CPF do requerente",
        /XXX\.XXX\.XXX-XX/,
        true,
      ),
      ...FINE_REQUEST_END,
    ],
  },
  {
    id: "in-2-anexo-l",
    docId: "1IfIcY3-tQFsPNHm59A9trMBbR4a1GZJLLaRXszCfXXA",
    normative: 2,
    annex: "L",
    name: "IN 2 – Anexo L – Ressarcimento de multa (pessoa jurídica)",
    projectKeys: { ...FINE_REQUEST_KEYS, company_cnpj: "property_cnpj" },
    steps: [
      placeholder(
        "office_city",
        "Município do SSCI",
        "Município do Serviço de Segurança Contra Incêndio",
        /\(digite o município\)/,
        true,
      ),
      placeholder(
        "requester_name",
        "Nome",
        "Nome do representante legal por extenso",
        /\(seu nome por extenso\)/,
        true,
      ),
      placeholder(
        "requester_cpf",
        "CPF",
        "CPF do representante legal",
        /XXX\.XXX\.XXX-XX/,
        true,
      ),
      placeholder(
        "company_name",
        "Razão social",
        "Razão social da empresa",
        /\(descreva a Razão Social\)/,
        true,
      ),
      placeholder(
        "company_cnpj",
        "CNPJ",
        "CNPJ da empresa",
        /XX\.XXX\.XXX\/XXXX-XX/,
        true,
      ),
      ...FINE_REQUEST_END,
    ],
  },
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
      throw new Error(`${form.id}: no match for ${step.match}`);
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

/** The forms of the catalog's seed; the form list has one source. */
async function readCatalog() {
  const sql = await readFile(
    join(
      TEMPLATES,
      "../../../supabase/migrations/20261105000000_cbmsc_forms.sql",
    ),
    "utf8",
  );
  return [
    ...sql.matchAll(/\('([\w-]{20,})', (\d+), '([A-Z]+)', '(.*)'\)/g),
  ].map(([, docId, normative, annex, name]) => ({
    docId,
    normative: Number(normative),
    annex,
    name,
  }));
}

/** INs about a building; events and companies have no property to share. */
const BUILDING_NORMATIVES = new Set([1, 2, 7, 9, 10, 15]);

const entries = [];

for (const form of await readCatalog()) {
  const handWritten = FORMS.find((other) => other.docId === form.docId);
  const id = `in-${form.normative}-anexo-${form.annex.toLowerCase()}`;
  const response = await fetch(
    `https://docs.google.com/document/d/${form.docId}/export?format=docx`,
  );
  if (!response.ok) throw new Error(`${id}: HTTP ${response.status}`);
  const source = new Uint8Array(await response.arrayBuffer());

  const zip = new PizZip(source);
  const xml = zip.file("word/document.xml").asText();
  let fields;
  if (handWritten) {
    zip.file("word/document.xml", tagDocument(xml, handWritten));
    fields = handWritten.steps.flatMap((step) =>
      step.field
        ? {
            ...step.field,
            ...(handWritten.projectKeys[step.field.name] && {
              projectKey: handWritten.projectKeys[step.field.name],
            }),
          }
        : [],
    );
  } else {
    const tagged = autoTagDocument(xml, {
      shareWithProject: BUILDING_NORMATIVES.has(form.normative),
    });
    if (!tagged.fields.length) throw new Error(`${id}: no blanks found`);
    zip.file("word/document.xml", tagged.xml);
    fields = tagged.fields;
  }
  removeCopyNotice(zip);
  await writeFile(
    join(TEMPLATES, `cbmsc/${id}.docx`),
    zip.generate({ type: "nodebuffer" }),
  );
  await writeFile(
    join(TEMPLATES, `cbmsc/${id}.schema.json`),
    `${JSON.stringify({ fields }, null, 2)}\n`,
  );
  entries.push({
    id,
    name:
      handWritten?.name ??
      `IN ${form.normative} – Anexo ${form.annex} – ${form.name}`,
    type: "docx",
    file: `/templates/cbmsc/${id}.docx`,
    schema: `/templates/cbmsc/${id}.schema.json`,
    cbmsc: {
      normative: form.normative,
      annex: form.annex,
      sourceTextHash: docxTextHash(source),
      reviewed: Boolean(handWritten),
    },
  });
}

await writeFile(
  join(TEMPLATES, "index.json"),
  `${JSON.stringify(entries, null, 2)}\n`,
);
