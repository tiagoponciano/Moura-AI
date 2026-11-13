import type { Condition, Rule } from "../engine/types";
import { systemIdFromLabel } from "./systems";
import type { ExtractedTable, NoteEffect, TableSpec } from "./types";

export const NORM_DOC = "IN-1-P2";
/** Art. 31 of IN 1 parte 2: "entra em vigor em 24 de abril de 2024". */
export const NORM_VALID_FROM = "2024-04-24";

const always: Condition = { all: [] };

/** A footnote a cell cites has no reading yet, so the cell cannot become a rule. */
export class UncodedNoteError extends Error {
  constructor(
    readonly table: number,
    readonly note: number,
  ) {
    super(
      `Tabela ${table}: note ${note} is cited by a cell but has no reading`,
    );
  }
}

/**
 * Turns the cells of the chosen columns into rules. A cell marked `x` becomes
 * one rule, or one per `require_when` of its notes; `-` becomes nothing. Every
 * rule is provisional and carries the cell and the note text it came from.
 * Throws when a cell cites a note without a reading: a table is used only when
 * every note its cells cite is encoded.
 */
export function compileTable(table: ExtractedTable, spec: TableSpec): Rule[] {
  const rules: Rule[] = [];
  for (const row of table.rows) {
    if (spec.part !== undefined && row.part !== spec.part) continue;
    const system = systemIdFromLabel(row.system);
    for (const column of spec.columns) {
      const cell = row.cells[column.index];
      if (!cell || cell.mark !== "x") continue;

      const readings = cell.refs.map((n) => {
        const note = spec.notes.find((s) => s.number === n);
        if (!note) throw new UncodedNoteError(table.table, n);
        return note;
      });
      const effects = readings.flatMap((r) => r.effects);
      const quote = [
        `${row.system} (${column.label}): ${cell.raw}`,
        ...cell.refs.map(
          (n) =>
            `Nota ${n}: ${table.notes.find((x) => x.number === n)?.text ?? ""}`,
        ),
      ].join(" | ");
      const base: Condition = { all: [spec.base, column.when] };
      const idPrefix = `IN1P2-T${String(table.table).padStart(2, "0")}-${system}-${column.slug}`;
      const make = (
        suffix: string,
        when: Condition,
        then: Rule["then"],
        note?: string,
      ): Rule => ({
        id: `${idPrefix}-${suffix}`,
        name: `${row.system} — Tabela ${table.table}, ${column.label}`,
        version: "1",
        validFrom: NORM_VALID_FROM,
        stage: "systems",
        priority: 10,
        when,
        then,
        note,
        source: {
          doc: NORM_DOC,
          locator: `Tabela ${table.table}, ${row.system}, ${column.label}`,
          quote,
        },
        status: "provisional",
      });

      const vital = row.vital_on_label || cell.vital;
      const infos = effects
        .filter(
          (e): e is Extract<NoteEffect, { kind: "info" }> => e.kind === "info",
        )
        .map((e) => e.text);
      const note = infos.length ? infos.join(" ") : undefined;
      const requirements = effects.filter(
        (e): e is Extract<NoteEffect, { kind: "require_when" }> =>
          e.kind === "require_when",
      );

      // An exemption in any note of the cell removes the requirement where it holds.
      const notExempt: Condition[] = effects
        .filter(
          (e): e is Extract<NoteEffect, { kind: "exempt_when" }> =>
            e.kind === "exempt_when",
        )
        .map((e) => ({ not: e.when }));

      if (requirements.length === 0) {
        rules.push(
          make(
            "req",
            notExempt.length ? { all: [base, ...notExempt] } : base,
            { require: system, vital },
            note,
          ),
        );
      } else {
        requirements.forEach((e, i) =>
          rules.push(
            make(
              `req${i + 1}`,
              { all: [base, e.when, ...notExempt] },
              { require: system, vital, ...(e.scope && { scope: e.scope }) },
              note,
            ),
          ),
        );
      }

      effects
        .filter(
          (e): e is Extract<NoteEffect, { kind: "substitutable" }> =>
            e.kind === "substitutable",
        )
        .forEach((e, i) =>
          rules.push(
            make(
              `sub${i + 1}`,
              { all: [base, e.when ?? always] },
              { substitute: system, by: e.by, note: e.note },
            ),
          ),
        );
    }
  }
  return rules;
}
