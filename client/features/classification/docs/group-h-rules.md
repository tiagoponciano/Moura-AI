# Grupo H rules

How the rule set for Grupo H (serviços de saúde e institucional: H-1 a H-6) is built and how it differs from the other covered groups. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, because Grupo H reuses its engine, facts, regime, guards and risk rules.

## What this is

`GROUP_H_RULES` (`lib/rulesets/group-h.ts`) compiles **two columns of Tabela 2** (H-1, H-4 and H-6; H-2, H-3 and H-5) for area ≤ 750 m² and height ≤ 12 m, and **three tables by height** for area ≥ 750 m² or height ≥ 12 m: Tabela 15 for H-1, H-2 and H-6, Tabela 16 for H-3 and Tabela 17 for H-4 and H-5. It adds the five rows of Quadro 2 for H to the risk III rules. `classify` names the table from the division ("Tabela 15", "16" or "17, coluna …").

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope (several blocks, mixed or secondary use, exactly 750 m² or 12 m, a division without rules) the result is a specific analysis.

`docs/group-h-review-sheet.md` is generated from the code and kept equal to it by a test; it prints the two columns of Tabela 2 side by side.

## Surface

| Export                                                                                      | File               | Contract                                                                  |
| ------------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------------------------------------- |
| `GROUP_H_RULES`                                                                             | `group-h.ts`       | Tabela 2 (both columns), Tabelas 15, 16 and 17 and the Quadro 2 rows of H |
| `TABLE_2_H146_SPEC`, `TABLE_2_H235_SPEC`, `TABLE_15_SPEC`, `TABLE_16_SPEC`, `TABLE_17_SPEC` | `group-h.ts`       | The columns, base condition and note readings of each table               |
| `TABLE_2_H_NOTES`, `TABLE_15_NOTES`, `TABLE_16_NOTES`, `TABLE_17_NOTES`                     | `group-h-notes.ts` | The reading of each note and its questions                                |
| `renderGroupHReviewSheet()`                                                                 | `review-sheet.ts`  | The Portuguese review sheet for Grupo H                                   |

## Rules and behavior

- **Facts.** The same as Grupo D. `storage_over_3_5m` is not read.
- **Tabela 2.** Both columns read notes 2 (area ≥ 200 m²) and 6 (hydraulic system from 4 storeys) as for Grupo C. They differ in what is vital: in the H-1, H-4 and H-6 column the low voltage installations are vital and the emergency lighting is not; in the H-2, H-3 and H-5 column it is the other way round, and the emergency plan is required.
- **Tabela 15 (H-1, H-2, H-6).** H-1 is exempt from detection, smoke control, the emergency plan and horizontal compartmentation. H-2: horizontal compartmentation only between the autonomous units (note 3), smoke control above 30 m (7), detection in storage and rooms above 1.200 MJ/m² and in the bedrooms (8 and 9). H-6: horizontal compartmentation replaceable by detection up to 12 m (2) and by detection and sprinklers up to 30 m (3), smoke control from 90 m (7). The elevator from 60 m (10) and the plan for H-2 and H-6 (11).
- **Tabela 16 (H-3).** The plan in every column; the elevator from 21 m in the 12 to 23 m column (8); vertical compartmentation between 6 and 12 m only for shafts and ducts (4); detection by scope (6 and 7).
- **Tabela 17 (H-4, H-5).** Sprinklers only for H-4 from 100 m (2); smoke control for H-5 above 30 m and H-4 from 90 m (4); detection by division (5); the plan only for H-5 (7); the elevator from 60 m (6).
- **Multi-reference cell.** `x⁴⁻⁵` (vertical compartmentation, Tabela 15) is read as two notes, because that makes all eleven notes cited; the sheet asks Moura to confirm it is not a range.
- **Risk.** Quadro 2: H-1 and H-4 up to 21 m and 5.000 m²; H-2 up to 12 m and 5.000 m²; H-3 and H-5 up to 6 m and 750 m²; H-6 up to 6 m and 5.000 m², or 6 to 12 m and 2.500 m². Risk V, I, II and IV are the shared rules.

## What this does NOT do

- **It covers only H-1 to H-6.** Another division gets `GUARD-not-covered`.
- **It does not tell a psychiatric hospital apart.** Note 5 of Tabela 17 widens the rooms of detection for them; the text is kept in the scope and shown as a note.
- **It does not evaluate the occupancy of patients** (mobility, beds); the tables here do not use it.
- **It does not size anything.** Which systems, not how many.
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.

## Gotchas

- A division shows the wrong table → `LARGE_TABLE` in `classify.ts` maps each division to its table → add a group's divisions there.
- The review sheet shows Tabela 2 once with two columns → it uses a sheet-only spec that joins both; the rules compile each column separately (`TABLE_2_H146_SPEC` and `TABLE_2_H235_SPEC`).
- The review sheet test fails after a change to a rule or a question → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
