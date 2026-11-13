# Grupo G rules

How the rule set for Grupo G (serviços automotivos e assemelhados: G-1 a G-5) is built and how it differs from the other covered groups. For developers adding other groups and for whoever reviews the readings with Moura. It describes the code as it is now; read `group-c-rules.md` first, because Grupo G reuses its engine, facts, regime, guards and risk rules.

## What this is

`GROUP_G_RULES` (`lib/rulesets/group-g.ts`) compiles three tables of IN 1 parte 2 like the other groups: Tabela 2, column "A-2, A-3, D, E e G" (area ≤ 750 m² and height ≤ 12 m), and, for area ≥ 750 m² or height ≥ 12 m, **two** tables by height, one per set of divisions: Tabela 13 for G-1, G-2 and G-5 and Tabela 14 for G-3 and G-4. It adds the rows of Quadro 2 for G to the risk III rules. `ALL_RULES` includes them, and `classify` names the table from the division: "Tabela 13, coluna …" or "Tabela 14, coluna …".

Invariants (as for the other groups): every rule is `provisional`; a cell with an uncoded note throws at compile time; outside the scope (several blocks, mixed use, exactly 750 m² or 12 m, a division without rules) the result is a specific analysis.

`docs/group-g-review-sheet.md` is generated from the code and kept equal to it by a test.

## Surface

| Export                                                | File               | Contract                                                          |
| ----------------------------------------------------- | ------------------ | ----------------------------------------------------------------- |
| `GROUP_G_RULES`                                       | `group-g.ts`       | Tabela 2 (column G), Tabelas 13 and 14 and the Quadro 2 rows of G |
| `TABLE_2_G_SPEC`, `TABLE_13_SPEC`, `TABLE_14_SPEC`    | `group-g.ts`       | The columns, base condition and note readings of each table       |
| `TABLE_2_G_NOTES`, `TABLE_13_NOTES`, `TABLE_14_NOTES` | `group-g-notes.ts` | The reading of each note and its questions                        |
| `renderGroupGReviewSheet()`                           | `review-sheet.ts`  | The Portuguese review sheet for Grupo G                           |

## Rules and behavior

- **Facts.** The same as Grupo D. `storage_over_3_5m` is not read.
- **Tabela 2, column G.** The same readings as Grupos D and E; note 1 exempts only A-1, A-2 and J-1, so the brigade is required.
- **Tabela 13 (G-1, G-2, G-5).** Sprinklers from 23 m; smoke control from 90 m for G-1 and G-2 only (note 3); emergency elevator from 60 m (note 5); vertical compartmentation limited to facades, shafts and ducts (note 2); detection from 5.000 m², limited to car parks (except laterally open ones) and storage above 1.200 MJ/m² (note 4).
- **Tabela 14 (G-3, G-4).** Horizontal compartmentation only for G-4, replaceable by sprinklers (`x²⁻³`, notes 2 and 3); vertical compartmentation limited to facades, shafts and ducts (note 4); detection in storage and any room above 1.200 MJ/m² in every column (note 5); elevator from 60 m (note 6).
- **Multi-reference cell.** `x²⁻³` is read as two notes, because that makes all six notes of Tabela 14 cited; the sheet asks Moura to confirm it is not a range.
- **Risk.** Quadro 2: G-1, G-2 and G-5 up to 21 m and 5.000 m²; G-3 single-storey up to 750 m²; G-4 up to 6 m and 5.000 m², or 6 to 12 m and 3.000 m². The G-3 row decides only when risk II fails (for example LPG above 190 kg), because II comes first and already covers a single-storey building up to 750 m².

## What this does NOT do

- **It covers only G-1 to G-5.** Another division gets `GUARD-not-covered`.
- **It does not evaluate "lateralmente abertas".** Note 4 of Tabela 13 excepts car parks that are open on the sides (IN 14); the exception stays in the printed text only.
- **It treats a garage that is part of another building as mixed use.** A subsidiary occupation goes to a specific analysis.
- **It does nothing for existing buildings (IN 5).**
- **It does not approve a reading.** The questions in the review sheet are open until a person answers them.

## Gotchas

- A G-3 shows "Tabela 14" and a G-1 "Tabela 13" → the two tables split the divisions; the name comes from the division in `classify` (`LARGE_TABLE`) → add a new group's divisions there.
- The Quadro 2 row of G-3 never decides → risk II comes first and covers it; it applies only when II fails.
- The review sheet test fails after a change to a rule or a question → run `UPDATE_REVIEW_SHEET=1 pnpm exec vitest run features/classification/lib/rulesets/review-sheet` and review the diff.
