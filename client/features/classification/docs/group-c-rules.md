# Grupo C rules

How the rule set for Grupo C (comercial: C-1, C-2, C-3) is built from the extracted CBMSC tables and what it decides. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now.

## What this is

`GROUP_C_RULES` (`lib/rulesets/group-c.ts`) is a list of engine rules (see `rule-engine.md`) for the systems required in a Grupo C building. Most of them are compiled from the cells of two tables of IN 1 parte 2, extracted as JSON (see `norm-extraction.md`): Tabela 2, column C (area ≤ 750 m² and height ≤ 12 m) and Tabela 5 (area ≥ 750 m² or height ≥ 12 m, one column per height class). `GROUP_C_RISK_RULES` (`group-c-risk.ts`) decide the risk level I–V from IN 1 parte 1. The rest derive the fire load class (IN 3, art. 11), say which table and column apply, and stop the answer in cases the tables do not settle.

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

| Fact                    | Type    | Meaning                                                                                                                              |
| ----------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `division`              | string  | `C-1`, `C-2` or `C-3`; any other value is outside the rule set                                                                       |
| `area_m2`               | number  | Total built area (IN 1 parte 2, art. 7)                                                                                              |
| `height_m`              | number  | Lowest occupied floor to the floor of the last storey (art. 8)                                                                       |
| `storeys`               | number  | Number of storeys; `1` is a single-storey building, whose height counts as 0 (art. 8, inciso V)                                      |
| `fire_load_class`       | string  | `negligible`, `low`, `medium`, `high` or `very_high`                                                                                 |
| `fire_load_mj_m2`       | number  | Optional. When `fire_load_class` is absent, the class is derived from it (≤100, ≤300, ≤1.200, ≤2.280, above)                         |
| `single_block`          | boolean | `false` means more than one block or area                                                                                            |
| `single_use`            | boolean | `false` means mixed, subsidiary or secondary occupancy                                                                               |
| `storage_over_3_5m`     | boolean | Storage of materials higher than 3,5 m                                                                                               |
| `special_risks`         | boolean | `true` when there is any LPG, flammable or combustible liquid, or radioactive, toxic, explosive, pyrotechnic or ammunition substance |
| `hazardous_substances`  | boolean | The radioactive, toxic, explosive, pyrotechnic or ammunition substances; asked only when `special_risks` is `true`                   |
| `glp_kg`                | number  | LPG used or stored, kg; 0 is valid; asked only when `special_risks` is `true`                                                        |
| `flammable_internal_l`  | number  | Flammable or combustible liquids inside the building, L; 0 is valid; asked only when `special_risks` is `true`                       |
| `flammable_external_m3` | number  | The same outside, m³; 0 is valid; asked only when `special_risks` is `true`                                                          |
| `risk_exempt`           | boolean | `true` when the activity is one of the risk I exemptions (IN 1 parte 1, art. 5º, § 2º, I)                                            |

Derived for the screen and for the rules: `risk_level` (`I` to `V`), `regime` (`small` or `large`) and `height_class` (`ground`, `h0_6`, `h6_12`, `h12_23`, `h23_30`, `h30p`).

Rule ids: `IN1P2-T<table>-<system>-<column>-req[N]` and `-sub[N]` for compiled rules; `IN3-FIRE-LOAD-<class>`, `IN1P2-REGIME-<regime>`, `IN1P2-HEIGHT-<class>` for derived facts; `GUARD-<case>` for guards.

## Rules and behavior

**Regime.** Three mutually exclusive conditions: `small` (area < 750 and height below 12), `large` (area > 750 or height above 12) and a boundary (exactly 750 m² with height at most 12 m, or exactly 12 m with area at most 750 m²). Tabela 2 is for `small`, Tabela 5 for `large`, and the boundary is claimed by both tables, so it gets a guard.

**Height.** A single-storey building has height 0, so it is below and at most any limit and above none, whatever `height_m` says. This is written once in `heightBelow`, `heightAtMost`, `heightAbove` and `heightAtLeast`. A 14 m single-storey building with 700 m² is `small` and in column "Térreo".

**Columns of Tabela 5.** `ground` is a single-storey building. The others need more than one storey and split `height_m` at 6, 12, 23 and 30 (upper bounds inclusive). A height of exactly 12 m is in "6 < H ≤ 12".

**Risk level** (`risk` stage, IN 1 parte 1, in force since 2024-04-24). Checked in the order of the specification; the first rule that holds decides, and one that cannot be evaluated stops the cascade and its missing answers are asked:

| Level | Rule (`IN1P1-RISK-…`)                                                                                                                                            | Source                   |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------ |
| V     | fire load class `very_high` (above 2.280 MJ/m²); or special risks and dangerous substances, flammable liquids above 1.000 L inside or 40 m³ outside              | Art. 5º, § 2º, V; Nota 3 |
| I     | `risk_exempt` is `true`                                                                                                                                          | Art. 5º, § 2º, I         |
| II    | area ≤ 750 m², storeys ≤ 3, and (no special risks, or LPG ≤ 190 kg, liquids ≤ 250 L inside and ≤ 20 m³ outside)                                                  | Anexo A, Quadro 1        |
| III   | one row of Quadro 2 for C-1 (≤ 21 m, ≤ 5.000 m²), C-2 medium (≤ 12 m, ≤ 5.000 m²), C-2 high (≤ 12 m, ≤ 3.000 m²), C-3 (≤ 6 m, ≤ 5.000 m²; 6 to 12 m, ≤ 3.000 m²) | Anexo A, Quadro 2        |
| IV    | none of the above, for Grupo C                                                                                                                                   | Art. 5º, § 2º, IV        |

Height in Quadro 2 is the same height as for the systems (single-storey is 0). The fire load class is needed for every building, even a small one, because risk V depends on it; it is asked only when no activity supplied it. A division outside Grupo C gets no level. `RISK_PROCESS` holds, per level, what the norm says about the process (art. 5º, § 2º), shown with the result. Risk II and III rows are encoded by hand from the quadros; the rules carry the printed text.

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
- **It does nothing for existing buildings.** That is IN 5.
- **Risk I is a yes/no.** The exemptions of art. 5º have details (a tent of up to 50 m², a home of up to 200 m² with one employee…); the user's answer stands for them.
- **A C-2 with a low or negligible fire load has no Quadro 2 row,** so it falls to risk IV; the review sheet asks Moura about it.
- **It covers only Grupo C.** Other divisions get `GUARD-not-group-c`.
- **It does not handle several blocks, mixed occupancy or high storage.** Each returns a specific analysis.
- **It does not exclude basements, mezzanines or technical floors from the storey count or the height** (art. 8, parágrafo único); it uses the numbers it is given.
- **It does not apply a substitution.** `substitutions` is information; the system stays required.
- **At the 750 m² / 12 m boundary the systems show `not_required`, which is not a decision.** Every table rule is false there; a consumer must read `specificAnalyses` first and show the reason instead of the list.
- **It does not size anything.** Brigade size, extinguisher count and the like belong to the IN of each system.
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.

## Gotchas

- A small shop asks for the fire load → risk V depends on it (above 2.280 MJ/m²) → give it, or choose an activity from IN 3, Annex A that carries it.

- `UncodedNoteError: Tabela N: note M is cited by a cell but has no reading` → a spec lists a column whose cells cite a note that has no `NoteSpec` → add the reading, with its questions.
- `Unknown system label` → a table row uses a label that is not in `ALIASES` → add the alias after checking it is the same system, never by editing the table JSON.
- The review sheet test fails after a change to a rule or a question → `docs/group-c-review-sheet.md` is generated → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
- `unanswered` never lists `regime` or `height_class` → they are derived for display and the table rules use the underlying facts → ask for `area_m2`, `height_m` and `storeys`.
- A single-storey building is put in column "H ≤ 6" by hand → the condition for "H ≤ 6" requires more than one storey → set `storeys` to 1 and the column is "Térreo".
- Two derive rules claim one value → `findDeriveOverlaps` over `boundarySamples` fails in the Grupo C test → make the conditions disjoint instead of relying on priority.
