# Grupo C rules

How the rule set for Grupo C (comercial: C-1, C-2, C-3) is built from the extracted CBMSC tables and what it decides. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now.

## What this is

`GROUP_C_RULES` (`lib/rulesets/group-c.ts`) is a list of engine rules (see `rule-engine.md`) for the systems required in a Grupo C building. Most of them are compiled from the cells of two tables of IN 1 parte 2, extracted as JSON (see `norm-extraction.md`): Tabela 2, column C (area ≤ 750 m² and height ≤ 12 m) and Tabela 5 (area ≥ 750 m² or height ≥ 12 m, one column per height class). The rest derive the fire load class (IN 3, art. 11), say which table and column apply, and stop the answer in cases the tables do not settle.

Invariants:

- **Every rule is `provisional`.** No person has approved a reading. `evaluateRules` reports `provisional: true`.
- **A cell becomes a rule only if every note it cites is encoded.** `compileTable` throws `UncodedNoteError` otherwise, so a footnoted `x` is never read as an unconditional requirement.
- **Outside its scope the rule set lists nothing.** A guard returns a specific analysis; it never falls back to a partial list.

`lib/rulesets/review-sheet.ts` renders `docs/group-c-review-sheet.md`: each note as printed, how the code reads it, its limits and the open questions for Moura. A test keeps that file equal to the code's output.

## Surface

| Export                                                                                   | File                    | Contract                                                                                    |
| ---------------------------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------- |
| `GROUP_C_RULES`                                                                          | `group-c.ts`            | The full rule set, valid from 2024-04-24                                                    |
| `TABLE_2_SPEC`, `TABLE_5_SPEC`                                                           | `group-c.ts`            | Which columns of a table to compile, under which base condition, with which note readings   |
| `compileTable(table, spec)`                                                              | `compile-table.ts`      | Rules for the `x` cells of the chosen columns; throws `UncodedNoteError` on an uncoded note |
| `systemIdFromLabel(label)`, `SYSTEMS`, `systemLabel(id)`                                 | `systems.ts`            | Canonical system ids and Portuguese names; throws on a label nobody reviewed                |
| `REGIME_SMALL`, `REGIME_LARGE`, `REGIME_BOUNDARY`, `HEIGHT_CLASSES`, `FIRE_LOAD_CLASSES` | `group-c-conditions.ts` | The conditions the rules and the displayed facts share                                      |
| `TABLE_2_NOTES`, `TABLE_5_NOTES`                                                         | `group-c-notes.ts`      | The reading of each note and the questions it raises                                        |
| `renderGroupCReviewSheet()`, `describeCondition(c)`                                      | `review-sheet.ts`       | The Portuguese review sheet and the Portuguese reading of a condition                       |

## Data shapes

Facts the rules read. Areas are in m², heights in m, loads in MJ/m².

| Fact                | Type    | Meaning                                                                                                      |
| ------------------- | ------- | ------------------------------------------------------------------------------------------------------------ |
| `division`          | string  | `C-1`, `C-2` or `C-3`; any other value is outside the rule set                                               |
| `area_m2`           | number  | Total built area (IN 1 parte 2, art. 7)                                                                      |
| `height_m`          | number  | Lowest occupied floor to the floor of the last storey (art. 8)                                               |
| `storeys`           | number  | Number of storeys; `1` is a single-storey building, whose height counts as 0 (art. 8, inciso V)              |
| `fire_load_class`   | string  | `negligible`, `low`, `medium`, `high` or `very_high`                                                         |
| `fire_load_mj_m2`   | number  | Optional. When `fire_load_class` is absent, the class is derived from it (≤100, ≤300, ≤1.200, ≤2.280, above) |
| `single_block`      | boolean | `false` means more than one block or area                                                                    |
| `single_use`        | boolean | `false` means mixed, subsidiary or secondary occupancy                                                       |
| `storage_over_3_5m` | boolean | Storage of materials higher than 3,5 m                                                                       |

Derived for the screen: `regime` (`small` or `large`) and `height_class` (`ground`, `h0_6`, `h6_12`, `h12_23`, `h23_30`, `h30p`).

Rule ids: `IN1P2-T<table>-<system>-<column>-req[N]` and `-sub[N]` for compiled rules; `IN3-FIRE-LOAD-<class>`, `IN1P2-REGIME-<regime>`, `IN1P2-HEIGHT-<class>` for derived facts; `GUARD-<case>` for guards.

## Rules and behavior

**Regime.** Three mutually exclusive conditions: `small` (area < 750 and height below 12), `large` (area > 750 or height above 12) and a boundary (exactly 750 m² with height at most 12 m, or exactly 12 m with area at most 750 m²). Tabela 2 is for `small`, Tabela 5 for `large`, and the boundary is claimed by both tables, so it gets a guard.

**Height.** A single-storey building has height 0, so it is below and at most any limit and above none, whatever `height_m` says. This is written once in `heightBelow`, `heightAtMost`, `heightAbove` and `heightAtLeast`. A 14 m single-storey building with 700 m² is `small` and in column "Térreo".

**Columns of Tabela 5.** `ground` is a single-storey building. The others need more than one storey and split `height_m` at 6, 12, 23 and 30 (upper bounds inclusive). A height of exactly 12 m is in "6 < H ≤ 12".

**Guards** (`systems` stage, specific analysis):

| Id                        | When                                    | Source                    |
| ------------------------- | --------------------------------------- | ------------------------- |
| `GUARD-not-group-c`       | `division` is not `C-1`, `C-2` or `C-3` | IN 1 parte 2, Anexo B     |
| `GUARD-boundary`          | the regime boundary, for Grupo C        | Anexo B, Tabelas 2 e 3–29 |
| `GUARD-multiple-blocks`   | `single_block` is `false`               | IN 1 parte 2, art. 7      |
| `GUARD-mixed-use`         | `single_use` is `false`                 | IN 1 parte 2, arts. 10–12 |
| `GUARD-storage-over-3-5m` | `storage_over_3_5m` is `true`           | IN 3, art. 8              |

Every table rule also requires `single_block`, `single_use` and `storage_over_3_5m` to be `true`/`true`/`false`, so while one of them is unanswered the systems are `needs_info`, and when one is the wrong way round no system is required.

**Compilation.** A cell marked `-` produces nothing. A cell marked `x` produces one rule, or one per `require_when` effect of its notes, whose condition is the table's base, the column and that effect's condition. `substitutable` effects produce `substitute` rules. `info` effects become the rule's `note`. A row is vital when its label carries "(V)" or the cell does. Each rule's `source.quote` holds the cell and the printed text of the notes it cites.

**Note effects.** Each note is read as one or more of: `require_when` (the cell applies only under a condition, optionally limited to part of the building by `scope`), `substitutable` (the norm lets other systems, all together, replace it) and `info`. "Dispensado para C-1. Exigido para …" is written positively, as the condition under which it is required.

Outcomes for a Grupo C building (one block, one use, storage up to 3,5 m), all provisional:

| Case                                                  | Result                                                                                                    |
| ----------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| 700 m², 2 storeys, 8 m                                | Tabela 2: brigade, extinguishers (vital), gas, lighting, low voltage, exits, signage; no hydraulic system |
| the same with 4 storeys and 11 m                      | adds the hydraulic preventive system (note 6)                                                             |
| 3.200 m², C-2, 2 storeys, 8 m, high fire load         | Tabela 5, column "6 < H ≤ 12": sprinklers required (note 2)                                               |
| the same, fire load unanswered                        | sprinklers `needs_info`, missing `fire_load_class`                                                        |
| C-1 of any area                                       | sprinklers not required                                                                                   |
| exactly 750 m² or exactly 12 m (more than one storey) | `GUARD-boundary`; no system listed                                                                        |
| division `D-1`                                        | `GUARD-not-group-c`; no system listed                                                                     |

## What this does NOT do

- **It is not wired to the page.** `/classification` still uses the placeholder rules; nothing imports `GROUP_C_RULES` yet.
- **It does not compute the risk level I–V or anything for existing buildings.** Those are in IN 1 parte 1 and IN 5.
- **It covers only Grupo C.** Other divisions get `GUARD-not-group-c`.
- **It does not handle several blocks, mixed occupancy or high storage.** Each returns a specific analysis.
- **It does not exclude basements, mezzanines or technical floors from the storey count or the height** (art. 8, parágrafo único); it uses the numbers it is given.
- **It does not apply a substitution.** `substitutions` is information; the system stays required.
- **At the 750 m² / 12 m boundary the systems show `not_required`, which is not a decision.** Every table rule is false there; a consumer must read `specificAnalyses` first and show the reason instead of the list.
- **It does not size anything.** Brigade size, extinguisher count and the like belong to the IN of each system.
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.

## Gotchas

- `UncodedNoteError: Tabela N: note M is cited by a cell but has no reading` → a spec lists a column whose cells cite a note that has no `NoteSpec` → add the reading, with its questions.
- `Unknown system label` → a table row uses a label that is not in `ALIASES` → add the alias after checking it is the same system, never by editing the table JSON.
- The review sheet test fails after a change to a rule or a question → `docs/group-c-review-sheet.md` is generated → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
- `unanswered` never lists `regime` or `height_class` → they are derived for display and the table rules use the underlying facts → ask for `area_m2`, `height_m` and `storeys`.
- A single-storey building is put in column "H ≤ 6" by hand → the condition for "H ≤ 6" requires more than one storey → set `storeys` to 1 and the column is "Térreo".
- Two derive rules claim one value → `findDeriveOverlaps` over `boundarySamples` fails in the Grupo C test → make the conditions disjoint instead of relying on priority.
