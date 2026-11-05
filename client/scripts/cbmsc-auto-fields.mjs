// Finds the blanks of an official CBMSC form from its structure: underscores,
// `( )` options, labels with nothing after them and empty table cells. Each
// generated form still needs a look; see
// client/features/documents/docs/cbmsc-form-templates.md.

const NODE = /<w:(tbl|tr|tc|p|t)(?=[ >/])([^>]*?)(\/?)>|<\/w:(tbl|tr|tc|p|t)>/g;
const OPTION_LABEL = /^(sim|n[aã]o|n\.?\/?a\.?\d?)$/i;
const BLANK = /_{3,}/;
const ONLY_BLANK = /^[_\s]{3,}$/;
const INLINE_BLANK =
  /_+\s*\/\s*_+\s*\/\s*_+|_+\s*:\s*_+|_+\s*h\s*_+\s*min|_{3,}/g;
const MARK = /\(\s*\)/g;
const SIGNATURE = /assinatura|nome completo|^\(?local e data/i;
const NOT_THE_APPLICANTS = /^\d*\.?\s*(resposta|bombeiro militar)/i;
const NUMBER_LABEL = /(^|\s)n\.?\s?[º°]\.?( do registro profissional)?$/i;
const NOT_A_LABEL = /preencha|seguintes|conforme|abaixo|^\d+\.\s*[A-ZÀ-Ú /]+:$/;
const NEXT_LABEL = /^[^\s:]+(\s[^\s:]+){0,3}:/;
const MAX_LABEL = 70;
/** Twips. A narrower empty cell is a layout gap: text there breaks letter by letter. */
const MIN_VALUE_CELL_WIDTH = 1400;

const clean = (text) =>
  text
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&apos;/g, "'")
    .replace(/_{2,}/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** The words naming a blank: what follows the last option, and no stray separators. */
const labelText = (text) => {
  const afterOptions = text.split(/\(\s*\)/);
  const last = afterOptions.at(-1);
  const tail = afterOptions.length > 1 && last.trim() ? last : text;
  return clean(
    tail
      .replace(/\(?\s*\{\{\w+\}\}\s*\)?/g, " ")
      .replace(/\(\s*\)/g, " ")
      .replace(/^\s*[IVX]+\s+(?=\S)/, ""),
  ).replace(/^[\s/:]+/, "");
};

const shortLabel = (text) => {
  const label = labelText(text).replace(/[\s:.;,(-]+$/, "");
  return label.length > 78 ? `${label.slice(0, 77)}…` : label;
};

/** A cell's real width from the table grid; `tcW` in these files is often stale. */
function cellWidth(cell) {
  let column = 0;
  for (const other of cell.row.cells) {
    if (other === cell) break;
    column += other.span;
  }
  return cell.row.table.grid
    .slice(column, column + cell.span)
    .reduce((total, width) => total + width, 0);
}

/** The document's paragraphs, in order, with their runs and table position. */
function parseDocument(xml) {
  const paragraphs = [];
  const tables = [];
  let table, row, cell, paragraph, run;
  for (const match of xml.matchAll(NODE)) {
    const [whole, open, attributes, selfClosed, close] = match;
    const end = match.index + whole.length;
    if (open === "tbl") tables.push({ table, row, cell });
    if (open === "tbl") {
      const grid = xml.slice(end, xml.indexOf("</w:tblGrid>", end));
      table = {
        rows: [],
        grid: [...grid.matchAll(/<w:gridCol w:w="(\d+)"/g)].map(([, width]) =>
          Number(width),
        ),
      };
      row = undefined;
      cell = undefined;
    }
    if (close === "tbl") ({ table, row, cell } = tables.pop());
    if (open === "tr") {
      row = { cells: [], table };
      table.rows.push(row);
    }
    if (open === "tc" && !selfClosed) {
      const body = xml.slice(end, xml.indexOf("</w:tc>", end));
      cell = {
        paragraphs: [],
        row,
        merged: /<w:vMerge\s*\/>|<w:vMerge w:val="continue"/.test(body),
        span: Number(/<w:gridSpan w:val="(\d+)"/.exec(body)?.[1] ?? 1),
      };
      row.cells.push(cell);
    }
    if (close === "tc") cell = undefined;
    if (open === "p") {
      const next = xml.indexOf("</w:p>", end);
      const props = selfClosed ? "" : xml.slice(end, next);
      paragraph = {
        runs: [],
        cell,
        insertAt: selfClosed ? undefined : end,
        // A paragraph with no text keeps its formatting in the paragraph mark.
        format:
          /<w:pPr>(?:(?!<\/w:pPr>).)*<w:rPr>((?:(?!<\/w:rPr>).)*)<\/w:rPr>/.exec(
            props,
          )?.[1],
      };
      if (selfClosed) paragraph = undefined;
      else {
        paragraphs.push(paragraph);
        cell?.paragraphs.push(paragraph);
      }
    }
    if (close === "p" && paragraph) {
      paragraph.insertAt = match.index;
      paragraph = undefined;
    }
    if (open === "t" && !selfClosed && paragraph) {
      const lookBehind = xml.slice(Math.max(0, match.index - 800), match.index);
      run = {
        start: end,
        attributes,
        value: "",
        format: /<w:rPr>((?:(?!<\/w:rPr>).)*)<\/w:rPr>\s*$/.exec(
          lookBehind,
        )?.[1],
      };
      paragraph.runs.push(run);
    }
    if (close === "t" && run) {
      run.end = match.index;
      run.value = xml.slice(run.start, run.end);
      run.original = run.value;
      run = undefined;
    }
  }
  return paragraphs;
}

const paragraphText = (paragraph) =>
  paragraph.runs.map((run) => run.value).join("");
const cellText = (cell) => clean(cell.paragraphs.map(paragraphText).join(" "));

/** `___/___/___` spread over several runs becomes one blank in the first run. */
function collapseSplitBlanks(paragraph) {
  const text = paragraphText(paragraph);
  for (const match of text.matchAll(/_+\s*[/:]\s*_+(?:\s*\/\s*_+)?/g)) {
    let offset = 0;
    let first = true;
    for (const run of paragraph.runs) {
      const start = offset;
      offset += run.value.length;
      const from = Math.max(match.index - start, 0);
      const to = Math.min(
        match.index + match[0].length - start,
        run.value.length,
      );
      if (to <= from || to <= 0 || from >= run.value.length) continue;
      if (to - from === match[0].length) break;
      const replacement = first ? "___" : "";
      run.pendingCut = run.pendingCut ?? [];
      run.pendingCut.push({ from, to, replacement });
      first = false;
    }
  }
  for (const run of paragraph.runs) {
    for (const { from, to, replacement } of (run.pendingCut ?? []).reverse()) {
      run.value = run.value.slice(0, from) + replacement + run.value.slice(to);
    }
    run.pendingCut = undefined;
  }
}

const OWNER =
  /respons[aá]vel pelo im[oó]vel|solicitante|propriet[aá]rio|autuado/i;
const TECHNICAL = /respons[aá]vel t[eé]cnico|\bRT\b/i;
const PROPERTY = /im[oó]vel|edifica|endere[cç]o|logradouro/i;

const PROPERTY_KEYS = [
  [/^(logradouro|endere[cç]o|end)\b/, "street"],
  [/^n\.?\s?[º°]/, "number"],
  [/^complemento/, "complement"],
  [/^bairro/, "district"],
  [/^(cidade|munic[ií]pio)/, "city"],
  [/^cep/, "postal_code"],
];

/** The project key of a label, from the role the form is talking about. */
function projectKeyFor(label, role) {
  const text = label.toLowerCase().replace(/^[\d.]+\s*/, "");
  const address = PROPERTY_KEYS.find(([pattern]) => pattern.test(text))?.[1];
  if (role === "property") {
    if (address) return `property_${address}`;
    if (/^re\b/.test(text)) return "property_re";
    if (/^cnpj/.test(text)) return "property_cnpj";
    if (/^protocolo/.test(text)) return "property_protocol";
    if (/^ocupa/.test(text)) return "property_occupancy";
    if (/^nome da edifica/.test(text)) return "property_building_name";
    if (/^nome da empresa/.test(text)) return "property_company_name";
    if (/^detalhes/.test(text)) return "property_details";
  }
  if (role === "owner") {
    if (/^(nome|respons[aá]vel pelo im|propriet)/.test(text))
      return "owner_name";
    if (/^e-?mail/.test(text)) return "owner_email";
    if (/^(telefone|fone)/.test(text)) return "owner_phone";
  }
  if (role === "technical") {
    if (address) return `technical_${address}`;
    if (/^(nome|respons[aá]vel t)/.test(text)) return "technical_name";
    if (/^e-?mail/.test(text)) return "technical_email";
    if (/^(telefone|fone)/.test(text)) return "technical_phone";
    if (/^(cpf)/.test(text)) return "technical_tax_id";
    if (/^rg\b/.test(text)) return "technical_id_card";
    if (/(registro|n[º°] de registro)/.test(text)) return "technical_registry";
  }
  return undefined;
}

/** Tags a form's blanks; returns the tagged XML and one field per blank. */
export function autoTagDocument(xml, { shareWithProject }) {
  const paragraphs = parseDocument(xml);
  const fields = [];
  const usedKeys = new Set();
  const inserts = [];
  let section = "";
  let role = "property";
  let stopped = false;

  const addField = (field, label) => {
    const key = shareWithProject && projectKeyFor(label, role);
    fields.push({
      ...field,
      ...(key && !usedKeys.has(key) ? { projectKey: key } : {}),
    });
    if (key) usedKeys.add(key);
  };

  const describe = (label) =>
    (section ? `${section}: ${label}` : label).slice(0, 500);

  const addText = (rawLabel) => {
    const name = `field_${String(fields.length + 1).padStart(3, "0")}`;
    const label = shortLabel(rawLabel) || section || "Campo";
    addField(
      {
        name,
        type: "string",
        label,
        description: describe(clean(rawLabel) || label),
        required: false,
      },
      label,
    );
    return name;
  };

  /** One field per row of Sim/Não options; the form prints an X on the chosen one. */
  const choices = new Map();
  const addChoiceOption = (groupKey, rawLabel, value) => {
    let field = choices.get(groupKey);
    if (!field) {
      const name = `field_${String(fields.length + 1).padStart(3, "0")}`;
      const label = shortLabel(rawLabel) || section || "Campo";
      field = {
        name,
        type: "choice",
        label,
        description: describe(clean(rawLabel) || label),
        required: false,
        options: [],
      };
      fields.push(field);
      choices.set(groupKey, field);
    }
    const tag = `${field.name}_${field.options.length + 1}`;
    field.options.push({ value: value.replace(/\d$/, ""), tag });
    return tag;
  };

  const rowLabel = (row, untilCell) => {
    const parts = [];
    for (const cell of row.cells) {
      if (cell === untilCell) break;
      const text = cellText(cell);
      if (text && !OPTION_LABEL.test(text) && !/^\(?\s*\)?$/.test(text)) {
        parts.push(text);
      }
    }
    return parts.join(" ");
  };

  const columnOf = (row, target) => {
    let column = 0;
    for (const cell of row.cells) {
      if (cell === target) return column;
      column += cell.span;
    }
    return column;
  };

  /** The Sim/Não/NA columns of the nearest row above that names them. */
  const optionsAbove = (row) => {
    const rows = row.table.rows;
    for (let i = rows.indexOf(row); i >= 0; i -= 1) {
      const options = rows[i].cells
        .map(cellText)
        .filter((text) => OPTION_LABEL.test(text));
      if (options.length > 1) return options;
    }
    return [];
  };

  /** The empty cells at the end of a row, when they are exactly its options. */
  const optionOf = (row, target) => {
    const options = optionsAbove(row);
    const trailing = [];
    for (const cell of [...row.cells].reverse()) {
      if (cellText(cell) || cell.merged) break;
      trailing.unshift(cell);
    }
    const at = trailing.indexOf(target);
    return at !== -1 && trailing.length === options.length
      ? options[at]
      : undefined;
  };

  const headerFor = (row, target) => {
    const rows = row.table.rows;
    const column = columnOf(row, target);
    for (let i = rows.indexOf(row) - 1; i >= 0; i -= 1) {
      let at = 0;
      for (const cell of rows[i].cells) {
        if (at <= column && column < at + cell.span) {
          const text = cellText(cell);
          if (text) return { text, row: rows[i] };
          break;
        }
        at += cell.span;
      }
    }
    return { text: "" };
  };

  let lastWasBlank = false;
  let lastText = "";

  paragraphs.forEach((paragraph, index) => {
    collapseSplitBlanks(paragraph);
    const whole = clean(paragraphText(paragraph));
    if (NOT_THE_APPLICANTS.test(whole)) stopped = true;
    if (/^\d+\.?\s+\S/.test(whole) && whole.length < 90) {
      section = whole.replace(/:$/, "");
      stopped = NOT_THE_APPLICANTS.test(whole);
    }
    if (OWNER.test(whole) && whole.length < 90) role = "owner";
    else if (TECHNICAL.test(whole) && whole.length < 90) role = "technical";
    else if (/descri[cç][aã]o do im[oó]vel|dados do im[oó]vel/i.test(whole)) {
      role = "property";
    }
    if (stopped) return;

    // An empty table cell is a blank of its row.
    const { cell } = paragraph;
    if (
      cell &&
      !whole &&
      !cell.merged &&
      cell.paragraphs[0] === paragraph &&
      !cellText(cell)
    ) {
      const format =
        paragraph.format ??
        cell.row.cells
          .flatMap((other) => other.paragraphs)
          .flatMap((other) => other.runs)
          .find((run) => run.format)?.format;
      const previous = cell.row.cells[cell.row.cells.indexOf(cell) - 1];
      const previousText = previous ? cellText(previous) : "";
      const roomy = cellWidth(cell) >= MIN_VALUE_CELL_WIDTH;
      if (/:$/.test(previousText) && roomy && !/\{\{/.test(previousText)) {
        inserts.push({
          at: paragraph.insertAt,
          tag: addText(previousText),
          format,
        });
        return;
      }
      const label = rowLabel(cell.row, cell);
      if (/ESTADO DE SANTA CATARINA/.test(label) || /\{\{/.test(label)) return;
      const option = label && optionOf(cell.row, cell);
      if (option) {
        const tag = addChoiceOption(cell.row, label, option);
        inserts.push({ at: paragraph.insertAt, tag, format });
        return;
      }
      const rawHeader = headerFor(cell.row, cell).text;
      const header = /[:{]/.test(rawHeader) ? "" : rawHeader;
      if (!roomy || (!header && !previousText)) return;
      if (!label && !header) return;
      if (OPTION_LABEL.test(header)) return;
      const line = label
        ? ""
        : ` (linha ${cell.row.table.rows.indexOf(cell.row)})`;
      const name = addText(
        label && header ? `${label} – ${header}` : `${label || header}${line}`,
      );
      inserts.push({ at: paragraph.insertAt, tag: name, format });
      return;
    }
    if (!whole) return;
    if (/data:.*hora:/i.test(whole)) return;

    const nextText = (() => {
      for (let i = index + 1; i < paragraphs.length; i += 1) {
        const text = clean(paragraphText(paragraphs[i]));
        if (text) return text;
      }
      return "";
    })();

    let before = "";
    let phoneOnly = false;
    paragraph.runs.forEach((run, runIndex) => {
      const later = paragraph.runs
        .slice(runIndex + 1)
        .map((r) => r.value)
        .join("");

      // A whole run of underscores: blocks of them are one field.
      if (ONLY_BLANK.test(run.value)) {
        const isLast = !clean(later);
        if (isLast && SIGNATURE.test(nextText)) return;
        if (lastWasBlank && !clean(before)) {
          run.value = "";
          run.tagged = true;
          return;
        }
        const name = addText(clean(before) || lastText);
        run.value = ` {{${name}}}   `;
        run.tagged = true;
        lastWasBlank = true;
        before = "";
        return;
      }

      // Separators between blanks split across runs.
      if (lastWasBlank && /^[\s/:]+$/.test(run.value) && BLANK.test(later)) {
        run.value = "";
        return;
      }

      if (clean(run.value)) lastWasBlank = false;

      // Underscores and options inside a run with text.
      let text = run.value;
      if (BLANK.test(text)) {
        let tail = "";
        let cursor = 0;
        for (const match of text.matchAll(INLINE_BLANK)) {
          const segment = text.slice(cursor, match.index);
          const name = addText(clean(before + segment));
          tail += `${segment} {{${name}}} `;
          before = "";
          cursor = match.index + match[0].length;
        }
        text = tail + text.slice(cursor);
        run.value = text;
        run.tagged = true;
      }
      if (MARK.test(text)) {
        MARK.lastIndex = 0;
        const fullBefore = before;
        run.value = text.replace(MARK, (mark, offset) => {
          const prior = fullBefore + text.slice(0, offset);
          const after = text.slice(offset + mark.length) + later;
          if (/fone:?\s*$/i.test(prior)) {
            phoneOnly = true;
            return `( {{${addText("Telefone")}}} )`;
          }
          const rawFollowing = clean(after.split(/\(\s*\)/)[0]);
          // `( ) V Nº de pavimentos:`: the option ends where the next label starts.
          const following = rawFollowing.includes(":")
            ? (rawFollowing.split(" ")[0] ?? "")
            : rawFollowing;
          if (/^(in)?deferido/i.test(following)) return mark;
          const preceding = clean(prior).split(" ").pop() ?? "";
          if (OPTION_LABEL.test(following) || OPTION_LABEL.test(preceding)) {
            const value = OPTION_LABEL.test(following) ? following : preceding;
            const group = cell ? cell.row : paragraph;
            const label = cell ? rowLabel(cell.row, undefined) : lastText;
            return `( {{${addChoiceOption(group, label, value)}}} )`;
          }
          const name = `field_${String(fields.length + 1).padStart(3, "0")}`;
          const label = shortLabel(following || prior) || section;
          fields.push({
            name,
            type: "boolean",
            label,
            description: describe(clean(following || prior)),
            mark: true,
          });
          return `( {{${name}}} )`;
        });
        if (!phoneOnly) run.tagged = true;
        text = run.value;
      }

      // `Fone: (` with its `)` in the next run or cell.
      if (/fone:?\s*\(\s*$/i.test(clean(before + text))) {
        phoneOnly = true;
        run.value = `${text} {{${addText("Telefone")}}} `;
        text = run.value;
      }

      // `Sim (` and `)` in separate runs or paragraphs.
      if (/\(\s*$/.test(text) && /^\s*\)/.test(clean(later) || nextText)) {
        const preceding =
          clean(before + text)
            .replace(/\($/, "")
            .trim()
            .split(" ")
            .pop() ?? "";
        if (OPTION_LABEL.test(preceding)) {
          const group = cell ? cell.row : paragraph;
          const label = cell ? rowLabel(cell.row, undefined) : lastText;
          run.value = `${text} {{${addChoiceOption(group, label, preceding)}}} `;
          run.tagged = true;
        }
      }
      before = BLANK.test(run.original)
        ? run.original.split(/_{2,}/).pop()
        : before + run.original;
    });

    // Labels with nothing after them: `Bairro:`, `e-mail: Fone:`, `Nº`.
    const nextCell = cell?.row.cells[cell.row.cells.indexOf(cell) + 1];
    const valueCellFollows =
      nextCell &&
      !cellText(nextCell) &&
      cellWidth(nextCell) >= MIN_VALUE_CELL_WIDTH;
    const isLastParagraphOfCell = !cell || cell.paragraphs.at(-1) === paragraph;
    const finalText = clean(paragraphText(paragraph));
    if (
      !valueCellFollows &&
      isLastParagraphOfCell &&
      !paragraph.runs.some((run) => run.tagged)
    ) {
      paragraph.runs.forEach((run, runIndex) => {
        const trailing = paragraph.runs
          .slice(runIndex + 1)
          .map((r) => r.value)
          .join("");
        const startOfLine = clean(
          paragraph.runs
            .slice(0, runIndex)
            .map((r) => r.value)
            .join(""),
        );
        if (
          NUMBER_LABEL.test(clean(run.value)) &&
          clean(run.value).length < 30
        ) {
          run.value = `${run.value} {{${addText("Nº")}}}  `;
          run.tagged = true;
          return;
        }
        run.value = run.value.replace(
          /([^:]*):(\s*)(?=$|[^\s:]{1,30}:)/g,
          (match, label, space, offset, full) => {
            const atEnd = offset + match.length === full.length;
            if (atEnd && clean(trailing) && !NEXT_LABEL.test(clean(trailing))) {
              return match;
            }
            const text = clean(`${startOfLine} ${label}`);
            if (text.length > MAX_LABEL || NOT_A_LABEL.test(`${text}:`)) {
              return match;
            }
            run.tagged = true;
            return `${label}: {{${addText(label || startOfLine)}}}  ${space}`;
          },
        );
      });
      if (
        NUMBER_LABEL.test(finalText) &&
        !paragraph.runs.some((run) => run.tagged)
      ) {
        const run = paragraph.runs.at(-1);
        run.value = `${run.value} {{${addText("Nº")}}}`;
        run.tagged = true;
      }
    }
    lastText = whole;
  });

  // Rebuild the XML from the changed runs and inserted cells.
  const edits = [
    ...paragraphs.flatMap((paragraph) =>
      paragraph.runs
        .filter((run) => run.value !== run.original)
        .map((run) => ({ start: run.start, end: run.end, text: run.value })),
    ),
    ...inserts.map(({ at, tag, format }) => ({
      start: at,
      end: at,
      text: `<w:r>${format ? `<w:rPr>${format}</w:rPr>` : ""}<w:t xml:space="preserve">{{${tag}}}</w:t></w:r>`,
    })),
  ].sort((a, b) => a.start - b.start);

  let output = "";
  let position = 0;
  for (const edit of edits) {
    output += xml.slice(position, edit.start) + edit.text;
    position = edit.end;
  }
  output += xml.slice(position);
  // Tagged text keeps its spaces, and blanks' light gray would be too faint for it.
  output = output.replace(
    /(<w:rPr>(?:(?!<\/w:rPr>).)*<\/w:rPr>)?<w:t(?: [^>]*)?>([^<]*\{\{[^<]*)<\/w:t>/g,
    (_, rPr = "", text) =>
      `${rPr.replace(/<w:color [^>]*\/>/, "")}<w:t xml:space="preserve">${text}</w:t>`,
  );
  return { xml: output, fields };
}
