import type { Condition } from "../engine/types";

/** The parts of an extracted table (`norms/in-1-p2/tables/table-NN.json`) the compiler reads. */
export type ExtractedTable = {
  table: number;
  title: string;
  rows: {
    system: string;
    norm: string;
    vital_on_label: boolean;
    cells: {
      raw: string;
      mark: "x" | "-" | null;
      refs: number[];
      vital: boolean;
    }[];
  }[];
  notes: { number: number; text: string }[];
};

/** What a footnote means for the cells that cite it. */
export type NoteEffect =
  /** The cell applies only under this condition, and only in `scope` when given. */
  | { kind: "require_when"; when: Condition; scope?: string }
  /** The norm lets `by` (all together) replace the system, under `when` if given. */
  | { kind: "substitutable"; by: string[]; when?: Condition; note: string }
  /** Sizing or cross-reference: no effect on whether the system is required. */
  | { kind: "info"; text: string };

export type NoteSpec = {
  number: number;
  effects: NoteEffect[];
  /** What a reviewer must settle before this reading is approved (Portuguese). */
  questions: string[];
};

export type ColumnSpec = {
  /** Index in each row's `cells`. */
  index: number;
  /** Printed column heading, e.g. "12 < H ≤ 23". */
  label: string;
  /** Short id used in rule ids. */
  slug: string;
  /** When a building falls in this column. */
  when: Condition;
};

export type TableSpec = {
  table: number;
  /** When this table applies at all: regime, divisions, single block, single use. */
  base: Condition;
  columns: ColumnSpec[];
  notes: NoteSpec[];
};
